import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;

  return (
    <PlaceholderScreen
      title={`Trip ${tripId}`}
      description="3 chế độ xem: Plan View (Timeline), Map View, Money View — xem docs/PRODUCT_SPEC.md mục 11."
      module="itinerary"
    />
  );
}
