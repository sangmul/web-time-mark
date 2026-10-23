import { Download, Loader2, Send, Sparkles } from "lucide-react";

interface FooterBarProps {
  onTimeMark: () => void;
  onDownloadAll: () => void;
  disabled?: boolean;
  isProcessing?: boolean;
  isDownloading?: boolean;
}

export default function FooterBar({
  onTimeMark,
  onDownloadAll,
  disabled,
  isProcessing,
  isDownloading,
}: FooterBarProps) {
  return (
    <div className="sticky bottom-4 z-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-2xl bg-gray-900 px-6 py-4 text-left shadow-lg sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">
              Batch Time Mark Processor Siap Dijalankan
            </p>
            <p className="text-xs text-gray-400">
              Pastikan titik GPS &amp; batas toleransi 10 menit telah
              diverifikasi
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onTimeMark}
            disabled={disabled || isProcessing || isDownloading}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-indigo-600/40 disabled:hover:bg-indigo-600/40"
          >
            {isProcessing ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {isProcessing ? "Memproses..." : "Time Mark"}
          </button>
          <button
            type="button"
            onClick={onDownloadAll}
            disabled={disabled || isProcessing || isDownloading}
            className="flex items-center gap-2 rounded-lg border border-gray-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            {isDownloading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Download size={15} />
            )}
            {isDownloading ? "Menyiapkan ZIP..." : "Download All Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}
