import { LivraisonForm } from "@/components/livreur/LivraisonForm";

export default function LivraisonPage({ params }: { params: { id: string } }) {
  return <LivraisonForm id={params.id} />;
}
