import { PreparationInterface } from "@/components/commandes/PreparationInterface";

export default function PreparationPage({ params }: { params: { id: string } }) {
  return <PreparationInterface id={params.id} />;
}
