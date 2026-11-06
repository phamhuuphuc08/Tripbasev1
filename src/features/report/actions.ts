"use server";

import {
  ReportReason,
  ReportTargetType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";

import { getSession } from "@/server/auth/session";
import { createReport } from "@/server/services/report.service";

export interface ReportFormState {
  success?: boolean;
  error?: string;
}

const VALID_TARGET_TYPES: ReportTargetType[] = [
  "USER",
  "TRIP",
  "TAG",
];

const VALID_REASONS: ReportReason[] = [
  "SPAM",
  "INAPPROPRIATE_CONTENT",
  "FALSE_INFORMATION",
  "HARASSMENT",
  "FRAUD",
  "OTHER",
];

export async function submitReportAction(
  _prevState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const session = await getSession();

  if (!session) {
    return {
      error: "Bạn cần đăng nhập để gửi báo cáo.",
    };
  }

  const targetType = String(
    formData.get("targetType") ?? "",
  ) as ReportTargetType;

  const targetId = String(
    formData.get("targetId") ?? "",
  );

  const reason = String(
    formData.get("reason") ?? "",
  ) as ReportReason;

  const description = String(
    formData.get("description") ?? "",
  );

  if (!VALID_TARGET_TYPES.includes(targetType)) {
    return {
      error: "Đối tượng báo cáo không hợp lệ.",
    };
  }

  if (!targetId) {
    return {
      error: "Không tìm thấy đối tượng cần báo cáo.",
    };
  }

  if (!VALID_REASONS.includes(reason)) {
    return {
      error: "Vui lòng chọn lý do báo cáo.",
    };
  }

  try {
    await createReport({
      reporterId: session.userId,
      targetType,
      targetId,
      reason,
      description,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "CANNOT_REPORT_SELF") {
        return {
          error: "Bạn không thể báo cáo chính mình.",
        };
      }

      if (error.message === "REPORT_ALREADY_EXISTS") {
        return {
          error: "Bạn đã gửi báo cáo cho nội dung này và báo cáo đang được xử lý.",
        };
      }
    }

    throw error;
  }

  revalidatePath("/[locale]/admin/reports", "page");

  return {
    success: true,
  };
}