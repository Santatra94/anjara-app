import { CommandeForm } from "@/components/commandes/CommandeForm";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NouvelleCommandePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/commandes">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nouvelle Commande</h1>
          <p className="text-muted-foreground text-sm">Saisie des intentions de commande (matin).</p>
        </div>
      </div>

      <CommandeForm />
    </div>
  );
}
