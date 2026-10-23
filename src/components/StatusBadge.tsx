import type { RowStatus } from "../types";

const STYLES: Record<RowStatus, string> = {
  siap: "bg-emerald-50 text-emerald-700 border-emerald-100",
  "shift-we": "bg-amber-50 text-amber-700 border-amber-100",
  libur: "bg-rose-50 text-rose-700 border-rose-100",
};

const LABELS: Record<RowStatus, string> = {
  siap: "Siap",
  "shift-we": "Shift W/E",
  libur: "Libur",
};

export default function StatusBadge({ status }: { status: RowStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
