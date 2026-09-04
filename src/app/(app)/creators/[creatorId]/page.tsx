import { PlaceholderScreen } from "@/components/shared/placeholder-screen";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ creatorId: string }>;
}) {
  const { creatorId } = await params;

  return (
    <PlaceholderScreen
      title={`Creator ${creatorId}`}
      description="Tổng lượt CopyPlan nhận được, danh sách plan, biểu đồ uy tín theo thời gian."
      module="reputation"
    />
  );
}
