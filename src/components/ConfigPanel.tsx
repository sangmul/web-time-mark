import type { ReactNode } from "react";
import {
  Calendar,
  Clock,
  LayoutGrid,
  MapPin,
  RotateCcw,
  Sparkles,
  SlidersHorizontal,
  Tag,
  Zap,
} from "lucide-react";
import type { ScheduleConfig } from "../types";

interface ConfigPanelProps {
  config: ScheduleConfig;
  onChange: <K extends keyof ScheduleConfig>(
    key: K,
    value: ScheduleConfig[K],
  ) => void;
  onReset: () => void;
  onGenerate: () => void;
  onCekPeta: () => void;
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*Wajib</span>}
      </label>
      {children}
    </div>
  );
}

function InputShell({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
      <span className="text-indigo-500">{icon}</span>
      {children}
    </div>
  );
}

const baseInputClass =
  "w-full border-none bg-transparent p-0 text-sm text-gray-700 outline-none placeholder:text-gray-400";

export default function ConfigPanel({
  config,
  onChange,
  onReset,
  onGenerate,
  onCekPeta,
}: ConfigPanelProps) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 text-left">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <SlidersHorizontal size={18} />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              Konfigurasi Parameter Jadwal &amp; Toleransi
            </h2>
            <p className="text-sm text-gray-500">
              Tentukan rentang tanggal, toleransi selisih waktu, dan titik
              acuan GPS koordinat
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <RotateCcw size={15} />
          Reset Parameter
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="From (Periode Dari)" required>
          <InputShell icon={<Calendar size={16} />}>
            <input
              type="text"
              className={baseInputClass}
              value={config.fromDate}
              placeholder="dd-mm-yyyy"
              onChange={(event) => onChange("fromDate", event.target.value)}
            />
          </InputShell>
        </Field>

        <Field label="To (Periode Hingga)" required>
          <InputShell icon={<Calendar size={16} />}>
            <input
              type="text"
              className={baseInputClass}
              value={config.toDate}
              placeholder="dd-mm-yyyy"
              onChange={(event) => onChange("toDate", event.target.value)}
            />
          </InputShell>
        </Field>

        <Field label="Holiday (Libur Rutin)">
          <InputShell icon={<Sparkles size={16} />}>
            <select
              className={`${baseInputClass} cursor-pointer`}
              value={config.holidayWeekday}
              onChange={(event) =>
                onChange("holidayWeekday", Number(event.target.value))
              }
            >
              <option value={0}>Sunday (Minggu)</option>
              <option value={6}>Saturday (Sabtu)</option>
              <option value={-1}>None (Tidak Ada)</option>
            </select>
          </InputShell>
        </Field>

        <Field label="Other Holiday Date">
          <InputShell icon={<Tag size={16} />}>
            <input
              type="text"
              className={baseInputClass}
              value={config.otherHolidayDates}
              placeholder="dd-mm-yyyy, dd-mm-yyyy"
              onChange={(event) =>
                onChange("otherHolidayDates", event.target.value)
              }
            />
          </InputShell>
        </Field>

        <Field label="Jam Masuk">
          <InputShell icon={<Clock size={16} />}>
            <input
              type="text"
              className={baseInputClass}
              value={config.jamMasuk}
              onChange={(event) => onChange("jamMasuk", event.target.value)}
            />
          </InputShell>
        </Field>

        <Field label="Selisih Jam Masuk">
          <InputShell icon={<Zap size={16} className="text-amber-500" />}>
            <input
              type="text"
              className={baseInputClass}
              value={`${config.selisihMasuk} Menit`}
              onChange={(event) =>
                onChange(
                  "selisihMasuk",
                  Number(event.target.value.replace(/\D/g, "")) || 0,
                )
              }
            />
          </InputShell>
        </Field>

        <Field label="Auto Jam Pulang">
          <InputShell icon={<Clock size={16} />}>
            <input
              type="text"
              className={baseInputClass}
              value={config.autoJamPulang}
              onChange={(event) =>
                onChange("autoJamPulang", event.target.value)
              }
            />
          </InputShell>
        </Field>

        <Field label="Selisih Jam Pulang">
          <InputShell icon={<Zap size={16} className="text-amber-500" />}>
            <input
              type="text"
              className={baseInputClass}
              value={`${config.selisihPulang} Menit`}
              onChange={(event) =>
                onChange(
                  "selisihPulang",
                  Number(event.target.value.replace(/\D/g, "")) || 0,
                )
              }
            />
          </InputShell>
        </Field>
      </div>

      <div className="flex flex-col gap-4 border-t border-gray-100 px-6 py-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="w-full lg:max-w-2xl">
          <Field label="Koordinat (Head Office Geo-Fence)">
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white pl-3 pr-1.5 py-1.5 text-sm text-gray-700 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100">
              <span className="text-indigo-500">
                <MapPin size={16} />
              </span>
              <input
                type="text"
                className={`${baseInputClass} py-1`}
                value={config.coordinate}
                onChange={(event) =>
                  onChange("coordinate", event.target.value)
                }
              />
              <button
                type="button"
                onClick={onCekPeta}
                className="flex shrink-0 items-center gap-1.5 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:bg-gray-100"
              >
                <MapPin size={13} />
                Cek Peta
              </button>
            </div>
          </Field>
        </div>

        <button
          type="button"
          onClick={onGenerate}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 lg:w-auto"
        >
          <LayoutGrid size={16} />
          Generate Format
        </button>
      </div>
    </section>
  );
}
