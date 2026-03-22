"use client";

type FilterChipProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export function FilterChip({ label, active = false, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      className={`filterChip ${active ? "filterChipActive" : ""}`}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
