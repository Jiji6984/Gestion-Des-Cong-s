import { clsx } from "clsx";

type BadgeVariant = "en_attente" | "approuve" | "refuse" | "annule";

const variantStyles: Record<BadgeVariant, string> = {
  en_attente: "bg-yellow-50 text-yellow-700 ring-yellow-200",
  approuve: "bg-green-50 text-green-700 ring-green-200",
  refuse: "bg-red-50 text-red-700 ring-red-200",
  annule: "bg-gray-50 text-gray-600 ring-gray-200",
};

const variantLabels: Record<BadgeVariant, string> = {
  en_attente: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
  annule: "Annulé",
};

interface BadgeProps {
  statut: BadgeVariant;
  className?: string;
}

export function Badge({ statut, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        variantStyles[statut],
        className
      )}
    >
      {variantLabels[statut]}
    </span>
  );
}
