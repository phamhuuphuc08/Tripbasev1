"use client";

import { Button } from "@/components/ui/button";
import { deleteTripAction } from "@/features/trip/actions";

export function DeleteTripButton({
  tripId,
  tripName,
}: {
  tripId: string;
  tripName: string;
}) {
  const action = deleteTripAction.bind(null, tripId);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `Bạn có chắc muốn xóa chuyến đi "${tripName}"?\n\nHành động này không thể hoàn tác.`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <Button type="submit" variant="destructive" className="w-full">
        Xóa trip
      </Button>
    </form>
  );
}