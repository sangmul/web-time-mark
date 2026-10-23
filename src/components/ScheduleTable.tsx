import { useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  UploadCloud,
} from "lucide-react";
import type { ScheduleRow } from "../types";
import { formatTableDate } from "../utils/date";
import StatusBadge from "./StatusBadge";

interface ScheduleTableProps {
  rows: ScheduleRow[];
  onUploadPhoto: (
    rowId: string,
    type: "masuk" | "pulang",
    file: File,
  ) => void;
  onPreview: (rowId: string, type: "masuk" | "pulang") => void;
  onBulkUpload: (files: FileList) => void;
}

const PAGE_SIZE = 15;

function UploadButton({
  hasPhoto,
  fileName,
  onSelect,
}: {
  hasPhoto: boolean;
  fileName?: string;
  onSelect: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
          hasPhoto
            ? "border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            : "border-indigo-100 bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
        }`}
        title={fileName}
      >
        {hasPhoto ? <CheckCircle2 size={14} /> : <Camera size={14} />}
        <span className="max-w-[110px] truncate">
          {hasPhoto ? fileName : "Upload Photo"}
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
          event.target.value = "";
        }}
      />
    </>
  );
}

export default function ScheduleTable({
  rows,
  onUploadPhoto,
  onPreview,
  onBulkUpload,
}: ScheduleTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const filteredRows = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (row) =>
        formatTableDate(row.date).toLowerCase().includes(term) ||
        row.dayName.toLowerCase().includes(term),
    );
  }, [rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const rangeStart = filteredRows.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, filteredRows.length);

  const allValidated = rows.every(
    (row) => row.status !== "siap" || (row.photoMasuk && row.photoPulang),
  );

  return (
    <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-left">
          <h2 className="text-base font-bold text-gray-900">
            Daftar Hari Kerja &amp; Input Bukti Kehadiran
          </h2>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
            {rows.length} Baris Tergenerate
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
            <Search size={15} />
            <input
              type="text"
              placeholder="Cari tanggal / hari..."
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setPage(1);
              }}
              className="w-40 border-none bg-transparent p-0 text-sm text-gray-700 outline-none placeholder:text-gray-400 sm:w-52"
            />
          </div>
          <button
            type="button"
            onClick={() => bulkInputRef.current?.click()}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            <UploadCloud size={15} />
            Bulk Foto
          </button>
          <input
            ref={bulkInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              if (event.target.files && event.target.files.length > 0) {
                onBulkUpload(event.target.files);
              }
              event.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3">No</th>
              <th className="px-4 py-3">Tanggal</th>
              <th className="px-4 py-3">Hari</th>
              <th className="px-4 py-3">Upload Photo Masuk</th>
              <th className="px-4 py-3">Upload Photo Pulang</th>
              <th className="px-4 py-3">Result Time Mark Masuk</th>
              <th className="px-4 py-3">Result Time Mark Pulang</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-gray-400"
                >
                  Tidak ada data yang cocok.
                </td>
              </tr>
            )}
            {paginatedRows.map((row) => (
              <tr
                key={row.id}
                className={`border-b border-gray-50 last:border-b-0 ${
                  row.status !== "siap" ? "bg-amber-50/40" : ""
                }`}
              >
                <td className="px-4 py-3 text-gray-500">{row.no}</td>
                <td className="px-4 py-3 font-medium text-gray-800">
                  {formatTableDate(row.date)}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      row.isWeekendShift
                        ? "font-medium text-amber-600"
                        : "text-gray-600"
                    }
                  >
                    {row.dayName}
                  </span>
                  {row.isWeekendShift && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                      W/E
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <UploadButton
                    hasPhoto={Boolean(row.photoMasuk)}
                    fileName={row.photoMasuk?.fileName}
                    onSelect={(file) => onUploadPhoto(row.id, "masuk", file)}
                  />
                </td>
                <td className="px-4 py-3">
                  <UploadButton
                    hasPhoto={Boolean(row.photoPulang)}
                    fileName={row.photoPulang?.fileName}
                    onSelect={(file) => onUploadPhoto(row.id, "pulang", file)}
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={!row.resultPhotoMasuk}
                    onClick={() => onPreview(row.id, "masuk")}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Eye size={14} />
                    {row.resultMasuk ?? "Preview"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    disabled={!row.resultPhotoPulang}
                    onClick={() => onPreview(row.id, "pulang")}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Eye size={14} />
                    {row.resultPulang ?? "Preview"}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>
            Menampilkan <strong className="text-gray-700">{rangeStart}</strong>{" "}
            - <strong className="text-gray-700">{rangeEnd}</strong> dari{" "}
            <strong className="text-gray-700">{filteredRows.length}</strong>{" "}
            jadwal kerja
          </span>
          {allValidated && (
            <span className="flex items-center gap-1.5 font-medium text-emerald-600">
              <CheckCircle2 size={14} />
              Seluruh format tervalidasi
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={15} />
          </button>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-semibold text-white">
            {safePage}
          </span>
          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
