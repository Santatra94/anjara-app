'use client';

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ProduitMinimal {
  id: string;
  nom_produit: string;
}

interface ParfumsCheckboxesProps {
  produits: ProduitMinimal[];
  selectedParfums: string[];
  onChange: (parfums: string[]) => void;
  disabled?: boolean;
}

export function ParfumsCheckboxes({ produits, selectedParfums, onChange, disabled }: ParfumsCheckboxesProps) {
  const toggleParfum = (nom: string) => {
    if (selectedParfums.includes(nom)) {
      onChange(selectedParfums.filter(p => p !== nom));
    } else {
      onChange([...selectedParfums, nom]);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
      {produits.map((produit) => (
        <div key={produit.id} className="flex items-center space-x-2 bg-gray-50 p-2 rounded-md border border-gray-100 hover:border-gray-200 transition-colors">
          <Checkbox
            id={produit.id}
            checked={selectedParfums.includes(produit.nom_produit)}
            onCheckedChange={() => toggleParfum(produit.nom_produit)}
            disabled={disabled}
          />
          <Label
            htmlFor={produit.id}
            className="text-xs font-medium cursor-pointer flex-1 py-1"
          >
            {produit.nom_produit}
          </Label>
        </div>
      ))}
    </div>
  );
}
