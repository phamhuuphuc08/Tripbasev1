"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { z } from "zod";

import { redirect } from "@/i18n/navigation";
import { getSession } from "@/server/auth/session";

import {
  CiteTrustError,
  setLocationTagNegativeSignal,
  setLocationTagVerifiedVisit,
  updateLocationTagCiteTrustScore,
} from "@/server/services/cite-trust.service";

import {
  addItineraryComment,
  addItineraryItem,
  editItineraryItem,
  ItineraryError,
  removeItineraryComment,
  removeItineraryItem,
  reorderItineraryItems,
  voteItineraryItem,
} from "@/server/services/itinerary.service";

export interface ItineraryFormState {
  error?: string;
}

export interface ReorderItineraryState {
  success?: boolean;
  error?:
    | "INVALID_ORDER"
    | "REORDER_FAILED";
}

export interface ItineraryVoteActionState {
  success?: boolean;
  error?:
    | "LOGIN_REQUIRED"
    | "INVALID_VOTE"
    | "VOTE_FAILED";
}

export interface ItineraryCommentActionState {
  success?: boolean;

  error?:
    | "LOGIN_REQUIRED"
    | "COMMENT_REQUIRED"
    | "COMMENT_TOO_LONG"
    | "COMMENT_FAILED"
    | "DELETE_FAILED";
}

/**
 * M09.9.7 - Verified Visit
 */
export interface VerifiedVisitActionState {
  success?: boolean;

  error?:
    | "LOGIN_REQUIRED"
    | "INVALID_INPUT"
    | "TRIP_NOT_FOUND"
    | "FORBIDDEN"
    | "TRIP_NOT_COMPLETED"
    | "LOCATION_TAG_NOT_FOUND"
    | "TAG_NOT_IN_PLAN"
    | "VERIFY_FAILED";

  verifiedVisit?: boolean;

  canonicalLocationTagId?: string;

  citeTrustScore?: number;

  verifiedVisitCount?: number;

  verifiedVisitRate?: number;
}

const reorderSchema = z.array(
  z.object({
    id: z.string().min(1),
    day: z.number().int().min(1),
    sortOrder: z.number().int().min(0),
  }),
);

const itemSchema = z.object({
  day: z.coerce.number().int().min(1),

  title: z
    .string()
    .trim()
    .optional(),

  startTime: z
    .string()
    .optional(),

  endTime: z
    .string()
    .optional(),

  notes: z
    .string()
    .trim()
    .optional(),

  locationTagId: z
    .string()
    .optional(),
});

/**
 * M09.9.7 - Verified Visit input.
 */
const verifiedVisitSchema = z.object({
  tripId: z
    .string()
    .min(1),

  locationTagId: z
    .string()
    .min(1),

  verifiedVisit: z.boolean(),
});

function normalizeShareToken(
  shareToken: string | null,
) {
  const token =
    shareToken?.trim();

  return token || null;
}

function itineraryHref(
  tripId: string,
  shareToken: string | null,
) {
  const token =
    normalizeShareToken(
      shareToken,
    );

  return token
    ? `/trips/${tripId}?shareToken=${encodeURIComponent(
        token,
      )}#itinerary`
    : `/trips/${tripId}#itinerary`;
}

export interface NegativeSignalActionState {
  success?: boolean;
  error?:
    | "LOGIN_REQUIRED"
    | "INVALID_INPUT"
    | "TRIP_NOT_FOUND"
    | "FORBIDDEN"
    | "TRIP_NOT_COMPLETED"
    | "LOCATION_TAG_NOT_FOUND"
    | "TAG_NOT_IN_PLAN"
    | "CITATION_NOT_FOUND"
    | "VISIT_NOT_VERIFIED"
    | "NEGATIVE_SIGNAL_FAILED";
  negativeSignalType?: "CLOSED" | "PRICE_MISMATCH" | "OTHER" | null;
  negativeSignalNote?: string | null;
  citeTrustScore?: number;
}
const negativeSignalSchema = z.object({
  tripId: z.string().min(1),
  locationTagId: z.string().min(1),
  negativeSignalType: z.enum(["CLOSED", "PRICE_MISMATCH", "OTHER"]).nullable(),
  note: z.string().trim().max(500).nullable().optional(),
});
/**
 * Date 1970 ở đây chỉ là carrier tạm cho HH:mm.
 *
 * itinerary.service.ts sẽ chuyển nó thành timestamp thật:
 * Trip.startDate + (day - 1) + HH:mm.
 */
function parseTimeInput(
  value: string | undefined,
): Date | null | undefined {
  if (!value) {
    return null;
  }

  const match =
    /^(\d{2}):(\d{2})$/.exec(
      value,
    );

  if (!match) {
    return undefined;
  }

  const hour =
    Number(match[1]);

  const minute =
    Number(match[2]);

  if (
    !Number.isInteger(hour) ||
    !Number.isInteger(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return undefined;
  }

  const date =
    new Date(
      Date.UTC(
        1970,
        0,
        1,
        hour,
        minute,
      ),
    );

  return Number.isNaN(
    date.getTime(),
  )
    ? undefined
    : date;
}

function normalizeLocationTagId(
  value: string | undefined,
): string | null {
  return !value ||
    value === "none"
    ? null
    : value;
}

function validateTimeRange(
  startTime: Date | null,
  endTime: Date | null,
): boolean {
  if (
    !startTime ||
    !endTime
  ) {
    return true;
  }

  return (
    endTime.getTime() >
    startTime.getTime()
  );
}

function readItemForm(
  formData: FormData,
) {
  return itemSchema.safeParse({
    day:
      formData.get("day"),

    title:
      formData
        .get("title")
        ?.toString() ||
      undefined,

    startTime:
      formData
        .get("startTime")
        ?.toString() ||
      undefined,

    endTime:
      formData
        .get("endTime")
        ?.toString() ||
      undefined,

    notes:
      formData
        .get("notes")
        ?.toString() ||
      undefined,

    locationTagId:
      formData
        .get("locationTagId")
        ?.toString() ||
      undefined,
  });
}

async function itineraryServiceError(
  error: unknown,
  fallback:
    | "addFailed"
    | "updateFailed",
) {
  const t =
    await getTranslations(
      "itinerary.errors",
    );

  if (
    !(
      error instanceof
      ItineraryError
    )
  ) {
    return t(fallback);
  }

  switch (error.message) {
    case "TRIP_START_DATE_REQUIRED":
      return t(
        "tripStartDateRequired",
      );

    case "DAY_OUT_OF_RANGE":
      return t(
        "dayInvalid",
      );

    case "END_BEFORE_START":
      return t(
        "endBeforeStart",
      );

    case "DATETIME_INVALID":
      return t(
        "timeInvalid",
      );

    case "FORBIDDEN":
      return t(
        "forbidden",
      );

    default:
      return t(fallback);
  }
}

export async function addItineraryItemAction(
  tripId: string,
  shareToken: string | null,
  _prevState: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const session =
    await getSession();

  const t =
    await getTranslations(
      "itinerary.errors",
    );

  if (!session) {
    return {
      error:
        t("loginRequired"),
    };
  }

  const parsed =
    readItemForm(
      formData,
    );

  if (!parsed.success) {
    return {
      error:
        t("dayInvalid"),
    };
  }

  const startTime =
    parseTimeInput(
      parsed.data.startTime,
    );

  const endTime =
    parseTimeInput(
      parsed.data.endTime,
    );

  if (
    startTime ===
      undefined ||
    endTime ===
      undefined
  ) {
    return {
      error:
        t("timeInvalid"),
    };
  }

  if (
    !validateTimeRange(
      startTime,
      endTime,
    )
  ) {
    return {
      error:
        t("endBeforeStart"),
    };
  }

  try {
    await addItineraryItem(
      tripId,
      session.userId,
      {
        day:
          parsed.data.day,

        title:
          parsed.data.title
            ?.trim() ??
          "",

        startTime,

        endTime,

        notes:
          parsed.data.notes
            ?.trim() ||
          null,

        locationTagId:
          normalizeLocationTagId(
            parsed.data
              .locationTagId,
          ),
      },

      normalizeShareToken(
        shareToken,
      ),
    );
  } catch (error) {
    return {
      error:
        await itineraryServiceError(
          error,
          "addFailed",
        ),
    };
  }

  const locale =
    await getLocale();

  return redirect({
    href:
      itineraryHref(
        tripId,
        shareToken,
      ),

    locale,
  });
}

export async function updateItineraryItemAction(
  tripId: string,
  itemId: string,
  shareToken: string | null,
  _prevState: ItineraryFormState,
  formData: FormData,
): Promise<ItineraryFormState> {
  const session =
    await getSession();

  const t =
    await getTranslations(
      "itinerary.errors",
    );

  if (!session) {
    return {
      error:
        t("loginRequired"),
    };
  }

  const parsed =
    readItemForm(
      formData,
    );

  if (!parsed.success) {
    return {
      error:
        t("dayInvalid"),
    };
  }

  const startTime =
    parseTimeInput(
      parsed.data.startTime,
    );

  const endTime =
    parseTimeInput(
      parsed.data.endTime,
    );

  if (
    startTime ===
      undefined ||
    endTime ===
      undefined
  ) {
    return {
      error:
        t("timeInvalid"),
    };
  }

  if (
    !validateTimeRange(
      startTime,
      endTime,
    )
  ) {
    return {
      error:
        t("endBeforeStart"),
    };
  }

  try {
    await editItineraryItem(
      itemId,
      session.userId,
      {
        day:
          parsed.data.day,

        title:
          parsed.data.title
            ?.trim() ??
          "",

        startTime,

        endTime,

        notes:
          parsed.data.notes
            ?.trim() ||
          null,

        locationTagId:
          normalizeLocationTagId(
            parsed.data
              .locationTagId,
          ),
      },

      normalizeShareToken(
        shareToken,
      ),
    );
  } catch (error) {
    return {
      error:
        await itineraryServiceError(
          error,
          "updateFailed",
        ),
    };
  }

  const locale =
    await getLocale();

  return redirect({
    href:
      itineraryHref(
        tripId,
        shareToken,
      ),

    locale,
  });
}

export async function removeItineraryItemAction(
  tripId: string,
  itemId: string,
  shareToken: string | null,
  _formData: FormData,
) {
  void _formData;

  const [
    session,
    locale,
  ] =
    await Promise.all([
      getSession(),
      getLocale(),
    ]);

  if (session) {
    try {
      await removeItineraryItem(
        itemId,
        session.userId,
        normalizeShareToken(
          shareToken,
        ),
      );
    } catch {
      /*
       * Giữ best-effort để nút xoá
       * không làm vỡ trang.
       */
    }
  }

  return redirect({
    href:
      itineraryHref(
        tripId,
        shareToken,
      ),

    locale,
  });
}

export async function reorderItineraryAction(
  tripId: string,
  shareToken: string | null,
  items: {
    id: string;
    day: number;
    sortOrder: number;
  }[],
): Promise<ReorderItineraryState> {
  const session =
    await getSession();

  if (!session) {
    return {
      error:
        "REORDER_FAILED",
    };
  }

  const parsed =
    reorderSchema.safeParse(
      items,
    );

  if (!parsed.success) {
    return {
      error:
        "INVALID_ORDER",
    };
  }

  try {
    await reorderItineraryItems(
      tripId,
      session.userId,
      parsed.data,
      normalizeShareToken(
        shareToken,
      ),
    );

    return {
      success: true,
    };
  } catch (error) {
    if (
      error instanceof
        ItineraryError &&
      (
        error.message ===
          "INVALID_ORDER" ||
        error.message ===
          "DAY_OUT_OF_RANGE"
      )
    ) {
      return {
        error:
          "INVALID_ORDER",
      };
    }

    return {
      error:
        "REORDER_FAILED",
    };
  }
}

export async function voteItineraryItemAction(
  itemId: string,
  voteType:
    | "UP"
    | "DOWN",
  shareToken: string | null,
): Promise<ItineraryVoteActionState> {
  const session =
    await getSession();

  if (!session) {
    return {
      error:
        "LOGIN_REQUIRED",
    };
  }

  const parsed =
    z
      .enum([
        "UP",
        "DOWN",
      ])
      .safeParse(
        voteType,
      );

  if (
    !parsed.success ||
    !itemId
  ) {
    return {
      error:
        "INVALID_VOTE",
    };
  }

  try {
    await voteItineraryItem(
      itemId,
      session.userId,
      parsed.data,
      normalizeShareToken(
        shareToken,
      ),
    );

    return {
      success: true,
    };
  } catch {
    return {
      error:
        "VOTE_FAILED",
    };
  }
}

export async function addItineraryCommentAction(
  itemId: string,
  content: string,
  shareToken: string | null,
): Promise<ItineraryCommentActionState> {
  const session =
    await getSession();

  if (!session) {
    return {
      error:
        "LOGIN_REQUIRED",
    };
  }

  const parsed =
    z
      .string()
      .trim()
      .min(1)
      .max(1000)
      .safeParse(
        content,
      );

  if (!parsed.success) {
    const tooLong =
      typeof content ===
        "string" &&
      content.trim().length >
        1000;

    return {
      error:
        tooLong
          ? "COMMENT_TOO_LONG"
          : "COMMENT_REQUIRED",
    };
  }

  try {
    await addItineraryComment(
      itemId,
      session.userId,
      parsed.data,
      normalizeShareToken(
        shareToken,
      ),
    );

    return {
      success: true,
    };
  } catch (error) {
    if (
      error instanceof
      ItineraryError
    ) {
      if (
        error.message ===
        "COMMENT_REQUIRED"
      ) {
        return {
          error:
            "COMMENT_REQUIRED",
        };
      }

      if (
        error.message ===
        "COMMENT_TOO_LONG"
      ) {
        return {
          error:
            "COMMENT_TOO_LONG",
        };
      }
    }

    return {
      error:
        "COMMENT_FAILED",
    };
  }
}

export async function removeItineraryCommentAction(
  commentId: string,
  shareToken: string | null,
): Promise<ItineraryCommentActionState> {
  const session =
    await getSession();

  if (!session) {
    return {
      error:
        "LOGIN_REQUIRED",
    };
  }

  if (!commentId) {
    return {
      error:
        "DELETE_FAILED",
    };
  }

  try {
    await removeItineraryComment(
      commentId,
      session.userId,
      normalizeShareToken(
        shareToken,
      ),
    );

    return {
      success: true,
    };
  } catch {
    return {
      error:
        "DELETE_FAILED",
    };
  }
}

/**
 * M09.9.7 - Verified Visit
 *
 * Owner của Trip có thể xác nhận
 * một LocationTag trong itinerary
 * là đã ghé thực tế hoặc hủy xác nhận.
 *
 * Guardrails nằm tại cite-trust.service.ts:
 *
 * - Chỉ owner Trip được xác nhận.
 * - Trip phải COMPLETED.
 * - LocationTag phải nằm trong itinerary.
 * - Duplicate tag được quy về canonical tag.
 * - Self-cite vẫn được lưu nhưng không tính score.
 * - Chỉ giữ 1 Citation / Trip / canonical tag.
 */
export async function setItineraryVerifiedVisitAction(
  tripId: string,
  locationTagId: string,
  verifiedVisit: boolean,
): Promise<VerifiedVisitActionState> {
  /*
   * Không nhận userId từ client.
   *
   * User luôn phải lấy từ session
   * để tránh giả mạo người xác nhận.
   */
  const session =
    await getSession();

  if (!session) {
    return {
      error:
        "LOGIN_REQUIRED",
    };
  }

  /*
   * Validate input.
   */
  const parsed =
    verifiedVisitSchema.safeParse({
      tripId,
      locationTagId,
      verifiedVisit,
    });

  if (!parsed.success) {
    return {
      error:
        "INVALID_INPUT",
    };
  }

  try {
    /*
     * Mặc dù service dùng tên planId,
     * trong mô hình hiện tại Citation.planId
     * tham chiếu Trip.
     */
    const citation =
      await setLocationTagVerifiedVisit(
        parsed.data.tripId,
        parsed.data
          .locationTagId,
        session.userId,
        parsed.data
          .verifiedVisit,
      );

    /*
     * Verified Visit ảnh hưởng trực tiếp
     * đến Cite Trust Score.
     *
     * Tính lại canonical LocationTag ngay
     * để UI nhận được score mới mà không
     * cần đợi background job.
     */
    const trust =
      await updateLocationTagCiteTrustScore(
        citation
          .canonicalLocationTagId,
      );

    return {
      success: true,

      verifiedVisit:
        citation
          .verifiedVisit,

      canonicalLocationTagId:
        citation
          .canonicalLocationTagId,

      citeTrustScore:
        trust
          .citeTrustScore,

      verifiedVisitCount:
        trust
          .verifiedVisitCount,

      verifiedVisitRate:
        trust
          .verifiedVisitRate,
    };
  } catch (error) {
    if (
      error instanceof
      CiteTrustError
    ) {
      switch (
        error.message
      ) {
        case "TRIP_NOT_FOUND":
          return {
            error:
              "TRIP_NOT_FOUND",
          };

        case "FORBIDDEN":
          return {
            error:
              "FORBIDDEN",
          };

        case "TRIP_NOT_COMPLETED":
          return {
            error:
              "TRIP_NOT_COMPLETED",
          };

        case "LOCATION_TAG_NOT_FOUND":
          return {
            error:
              "LOCATION_TAG_NOT_FOUND",
          };

        case "TAG_NOT_IN_PLAN":
          return {
            error:
              "TAG_NOT_IN_PLAN",
          };
      }
    }

    console.error(
      "[setItineraryVerifiedVisitAction]",
      error,
    );

    return {
      error:
        "VERIFY_FAILED",
    };
  }
}
export async function setItineraryNegativeSignalAction(
  tripId: string,
  locationTagId: string,
  negativeSignalType: "CLOSED" | "PRICE_MISMATCH" | "OTHER" | null,
  note?: string | null,
): Promise<NegativeSignalActionState> {
  const session = await getSession();
  if (!session) return { error: "LOGIN_REQUIRED" };

  const parsed = negativeSignalSchema.safeParse({
    tripId,
    locationTagId,
    negativeSignalType,
    note: note ?? null,
  });

  if (!parsed.success) return { error: "INVALID_INPUT" };

  try {
    const result = await setLocationTagNegativeSignal(
      parsed.data.tripId,
      parsed.data.locationTagId,
      session.userId,
      parsed.data.negativeSignalType,
      parsed.data.note,
    );

    return {
      success: true,
      negativeSignalType: result.negativeSignalType,
      negativeSignalNote: result.negativeSignalNote,
      citeTrustScore: result.citeTrustScore,
    };
  } catch (error) {
    if (error instanceof CiteTrustError) {
      switch (error.message) {
        case "TRIP_NOT_FOUND": return { error: "TRIP_NOT_FOUND" };
        case "FORBIDDEN": return { error: "FORBIDDEN" };
        case "TRIP_NOT_COMPLETED": return { error: "TRIP_NOT_COMPLETED" };
        case "LOCATION_TAG_NOT_FOUND": return { error: "LOCATION_TAG_NOT_FOUND" };
        case "TAG_NOT_IN_PLAN": return { error: "TAG_NOT_IN_PLAN" };
        case "CITATION_NOT_FOUND": return { error: "CITATION_NOT_FOUND" };
        case "VISIT_NOT_VERIFIED": return { error: "VISIT_NOT_VERIFIED" };
      }
    }

    console.error("[setItineraryNegativeSignalAction]", error);
    return { error: "NEGATIVE_SIGNAL_FAILED" };
  }
}