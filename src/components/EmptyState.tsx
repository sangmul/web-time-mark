import { LayoutGrid } from "lucide-react";

export default function EmptyState() {
  return (
    <section className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-white/60 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
        <LayoutGrid size={22} />
      </div>
      <p className="text-sm font-semibold text-gray-700">
        Daftar hari kerja belum digenerate
      </p>
      <p className="max-w-sm text-sm text-gray-500">
        Lengkapi parameter jadwal &amp; toleransi di atas, lalu klik{" "}
        <span className="font-medium text-indigo-600">Generate Format</span>{" "}
        untuk menampilkan daftar hari kerja dan input bukti kehadiran.
      </p>
    </section>
  );
}
