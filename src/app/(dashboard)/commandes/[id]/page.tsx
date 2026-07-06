import { CommandeDetailView } from "@/components/commandes/CommandeDetailView";

export default function DetailCommandePage({ params }: { params: { id: string } }) {
  return <CommandeDetailView id={params.id} />;
}
