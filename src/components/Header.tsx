import { Briefcase, Calendar } from "lucide-react";

interface HeaderProps {
  periodLabel: string;
}

export default function Header({ periodLabel }: HeaderProps) {
  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-sm">
            <Briefcase size={20} strokeWidth={2.25} />
          </div>
          <div className="text-left">
            <h1 className="text-lg font-bold leading-tight text-gray-900">
              Sistem Manajemen Kehadiran &amp; Time Mark
            </h1>
            <p className="text-sm text-gray-500">
              Attendance &amp; Automated GPS Time Tracking Engine
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-700 sm:flex">
          <Calendar size={16} />
          <span className="text-gray-500">Periode Aktif:</span>
          <span className="font-semibold text-indigo-700">{periodLabel}</span>
        </div>
      </div>
    </header>
  );
}
