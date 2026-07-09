import { RecouvrementForm } from "@/components/livreur/RecouvrementForm";

export default function RecouvrementPage({ params }: { params: { id: string } }) {
  return <RecouvrementForm id={params.id} />;
}
