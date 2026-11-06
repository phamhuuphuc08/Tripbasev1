"use client";

import { useActionState, useEffect, useState } from "react";
import { Flag, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  submitReportAction,
  type ReportFormState,
} from "@/features/report/actions";

type ReportTargetType = "USER" | "TRIP" | "TAG";

const initialState: ReportFormState = {};

export function ReportButton({
  targetType,
  targetId,
}: {
  targetType: ReportTargetType;
  targetId: string;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    submitReportAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state.success]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Flag className="size-4" />
          Báo cáo
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Báo cáo nội dung</DialogTitle>

          <DialogDescription>
            Hãy chọn lý do phù hợp. Báo cáo sẽ được gửi đến Admin để xem xét.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="targetType" value={targetType} />
          <input type="hidden" name="targetId" value={targetId} />

          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Lý do
            </label>

            <select
              id="reason"
              name="reason"
              defaultValue=""
              required
              className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
            >
              <option value="" disabled>
                Chọn lý do báo cáo
              </option>
              <option value="SPAM">Spam</option>
              <option value="INAPPROPRIATE_CONTENT">
                Nội dung không phù hợp
              </option>
              <option value="FALSE_INFORMATION">
                Thông tin sai lệch
              </option>
              <option value="HARASSMENT">Quấy rối</option>
              <option value="FRAUD">Lừa đảo</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Mô tả thêm
            </label>

            <Textarea
              id="description"
              name="description"
              rows={4}
              maxLength={1000}
              placeholder="Mô tả lý do bạn muốn báo cáo..."
            />
          </div>

          {state.error && (
            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-700">
              Báo cáo đã được gửi.
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={pending}>
                Hủy
              </Button>
            </DialogClose>

            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang gửi...
                </>
              ) : (
                <>
                  <Flag className="size-4" />
                  Gửi báo cáo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}