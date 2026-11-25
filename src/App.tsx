import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import JSZip from "jszip";
import Header from "./components/Header";
import Breadcrumb from "./components/Breadcrumb";
import ConfigPanel from "./components/ConfigPanel";
import ScheduleTable from "./components/ScheduleTable";
import EmptyState from "./components/EmptyState";
import FooterBar from "./components/FooterBar";
import PhotoPreviewModal from "./components/PhotoPreviewModal";
import Toast from "./components/Toast";
import type { PhotoUpload, ScheduleConfig, ScheduleRow } from "./types";
import { generateSchedule } from "./utils/schedule";
import {
  formatMinutesToTime12h,
  formatTableDate,
  parseTime12h,
} from "./utils/date";

const MIN_WORK_SECONDS = 9 * 3600;
import { jitterCoordinate, parseCoordinate } from "./utils/coordinate";
import { createEventWorkbook } from "./utils/excel";
import { generateTimeMarkPhoto } from "./utils/watermark";
import { normalizeImageFile } from "./utils/image";
import { createAttendancePdf } from "./utils/pdf";

const ADDRESS_LINES = ["Bambu Apus", "Kecamatan Cipayung", "Kota Jakarta Timur"];

const DEFAULT_CONFIG: ScheduleConfig = {
  fromDate: "26-09-2026",
  toDate: "25-10-2026",
  holidayWeekday: 0,
  otherHolidayDates: "25-10-2026, 20-10-2026",
  jamMasuk: "09:00 AM",
  selisihMasuk: 10,
  autoJamPulang: "06:00 PM",
  selisihPulang: 10,
  coordinate: "-6.308327, 106.896310 (Daerah Khusus Ibukota Jakarta)",
};

function App() {
  const [config, setConfig] = useState<ScheduleConfig>(DEFAULT_CONFIG);
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [isGenerated, setIsGenerated] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [preview, setPreview] = useState<{
    photo: PhotoUpload;
    title: string;
  } | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indexCounterRef = useRef(1);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  const periodLabel = useMemo(() => {
    return `${config.fromDate} s/d ${config.toDate}`;
  }, [config.fromDate, config.toDate]);

  const handleConfigChange = useCallback(
    <K extends keyof ScheduleConfig>(key: K, value: ScheduleConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleReset = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    setRows([]);
    setIsGenerated(false);
    indexCounterRef.current = 1;
    showToast("Parameter dikembalikan ke pengaturan awal");
  }, [showToast]);

  const handleGenerate = useCallback(() => {
    const next = generateSchedule(config);
    if (next.length === 0) {
      showToast("Rentang tanggal tidak valid, periksa format dd-mm-yyyy");
      return;
    }
    setRows(next);
    setIsGenerated(true);
    showToast(`${next.length} baris jadwal berhasil digenerate`);
  }, [config, showToast]);

  const handleCekPeta = useCallback(() => {
    const coordinate = parseCoordinate(config.coordinate);
    if (!coordinate) {
      showToast("Format koordinat tidak dikenali");
      return;
    }
    window.open(
      `https://www.google.com/maps/search/?api=1&query=${coordinate.lat},${coordinate.lng}`,
      "_blank",
      "noopener,noreferrer",
    );
  }, [config.coordinate, showToast]);

  const handleUploadPhoto = useCallback(
    async (rowId: string, type: "masuk" | "pulang", rawFile: File) => {
      let file: File;
      try {
        file = await normalizeImageFile(rawFile);
      } catch {
        showToast(`Format foto tidak didukung: ${rawFile.name}`);
        return;
      }
      const url = URL.createObjectURL(file);
      setRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                [type === "masuk" ? "photoMasuk" : "photoPulang"]: {
                  fileName: file.name,
                  url,
                } satisfies PhotoUpload,
              }
            : row,
        ),
      );
    },
    [showToast],
  );

  const handleBulkUpload = useCallback(
    async (files: FileList) => {
      const settled = await Promise.allSettled(
        Array.from(files).map((file) => normalizeImageFile(file)),
      );
      const fileArray = settled
        .filter((r): r is PromiseFulfilledResult<File> => r.status === "fulfilled")
        .map((r) => r.value);
      const failed = settled.length - fileArray.length;
      if (fileArray.length === 0) {
        showToast("Tidak ada foto yang bisa dibaca, format tidak didukung");
        return;
      }
      setRows((prev) => {
        const next = [...prev];
        let fileIndex = 0;
        for (
          let i = 0;
          i < next.length && fileIndex < fileArray.length;
          i += 1
        ) {
          if (!next[i].photoMasuk) {
            const file = fileArray[fileIndex];
            next[i] = {
              ...next[i],
              photoMasuk: { fileName: file.name, url: URL.createObjectURL(file) },
            };
            fileIndex += 1;
          }
        }
        for (
          let i = 0;
          i < next.length && fileIndex < fileArray.length;
          i += 1
        ) {
          if (!next[i].photoPulang) {
            const file = fileArray[fileIndex];
            next[i] = {
              ...next[i],
              photoPulang: { fileName: file.name, url: URL.createObjectURL(file) },
            };
            fileIndex += 1;
          }
        }
        return next;
      });
      showToast(
        failed > 0
          ? `${fileArray.length} foto diunggah, ${failed} dilewati (format tidak didukung)`
          : `${fileArray.length} foto berhasil diunggah secara bulk`,
      );
    },
    [showToast],
  );

  const handlePreview = useCallback(
    (rowId: string, type: "masuk" | "pulang") => {
      const row = rows.find((item) => item.id === rowId);
      if (!row) return;
      const resultPhoto =
        type === "masuk" ? row.resultPhotoMasuk : row.resultPhotoPulang;
      const rawPhoto = type === "masuk" ? row.photoMasuk : row.photoPulang;
      if (!resultPhoto) return;
      setPreview({
        photo: {
          url: resultPhoto,
          fileName: rawPhoto?.fileName ?? `time-mark-${type}.jpg`,
        },
        title: `${formatTableDate(row.date)} · Result Time Mark ${
          type === "masuk" ? "Masuk" : "Pulang"
        }`,
      });
    },
    [rows],
  );

  const handleTimeMark = useCallback(async () => {
    if (!isGenerated || rows.length === 0) {
      showToast("Generate format terlebih dahulu sebelum menjalankan Time Mark");
      return;
    }
    if (isProcessing) return;

    const coordinate = parseCoordinate(config.coordinate);
    if (!coordinate) {
      showToast("Format koordinat tidak dikenali, periksa parameter geo-fence");
      return;
    }
    const baseMasuk = parseTime12h(config.jamMasuk);
    const basePulang = parseTime12h(config.autoJamPulang);
    if (baseMasuk === null || basePulang === null) {
      showToast("Format jam masuk / jam pulang tidak dikenali");
      return;
    }

    const rowsWithPhoto = rows.filter((row) => row.photoMasuk || row.photoPulang);
    if (rowsWithPhoto.length === 0) {
      showToast("Belum ada bukti foto yang diunggah untuk diproses");
      return;
    }

    setIsProcessing(true);
    const addressLines = [
      ...ADDRESS_LINES,
      ...(coordinate.label ? [coordinate.label] : []),
    ];
    let processed = 0;

    try {
      const updates = await Promise.all(
        rows.map(async (row) => {
          let resultMasuk = row.resultMasuk;
          let resultPulang = row.resultPulang;
          let resultMasukAt = row.resultMasukAt;
          let resultPulangAt = row.resultPulangAt;
          let resultPhotoMasuk = row.resultPhotoMasuk;
          let resultPhotoPulang = row.resultPhotoPulang;

          // Pick times (in seconds) so masuk -> pulang is always >= 9 hours.
          const masukSec =
            (baseMasuk + Math.round((Math.random() * 2 - 1) * config.selisihMasuk)) *
              60 +
            Math.floor(Math.random() * 60);
          const pulangLo =
            (basePulang - config.selisihPulang) * 60;
          const pulangHi = (basePulang + config.selisihPulang) * 60 + 59;
          const pulangFloor = Math.max(pulangLo, masukSec + MIN_WORK_SECONDS);
          const pulangSec =
            pulangFloor >= pulangHi
              ? pulangFloor
              : pulangFloor +
                Math.floor(Math.random() * (pulangHi - pulangFloor + 1));

          const toDate = (seconds: number) => {
            const d = new Date(row.date);
            d.setHours(0, 0, seconds, 0);
            return d;
          };

          if (row.photoMasuk) {
            const timestamp = toDate(masukSec);
            resultMasukAt = timestamp;
            resultMasuk = formatMinutesToTime12h(Math.floor(masukSec / 60));
            const index = indexCounterRef.current;
            indexCounterRef.current += 1;
            const jittered = jitterCoordinate(coordinate.lat, coordinate.lng);
            resultPhotoMasuk = await generateTimeMarkPhoto({
              sourceUrl: row.photoMasuk.url,
              timestamp,
              lat: jittered.lat,
              lng: jittered.lng,
              addressLines,
              index,
            });
            processed += 1;
          }

          if (row.photoPulang) {
            const timestamp = toDate(pulangSec);
            resultPulangAt = timestamp;
            resultPulang = formatMinutesToTime12h(Math.floor(pulangSec / 60));
            const index = indexCounterRef.current;
            indexCounterRef.current += 1;
            const jittered = jitterCoordinate(coordinate.lat, coordinate.lng);
            resultPhotoPulang = await generateTimeMarkPhoto({
              sourceUrl: row.photoPulang.url,
              timestamp,
              lat: jittered.lat,
              lng: jittered.lng,
              addressLines,
              index,
            });
            processed += 1;
          }

          return {
            id: row.id,
            resultMasuk,
            resultPulang,
            resultMasukAt,
            resultPulangAt,
            resultPhotoMasuk,
            resultPhotoPulang,
          };
        }),
      );

      setRows((prev) =>
        prev.map((row) => {
          const update = updates.find((item) => item.id === row.id);
          return update ? { ...row, ...update } : row;
        }),
      );

      const skipped = rows.length - rowsWithPhoto.length;
      showToast(
        skipped > 0
          ? `Time mark diproses untuk ${processed} bukti foto, ${skipped} baris tanpa foto dilewati`
          : `Time mark berhasil diproses untuk ${processed} bukti foto`,
      );
    } catch {
      showToast("Gagal memproses time mark, coba lagi");
    } finally {
      setIsProcessing(false);
    }
  }, [
    config.coordinate,
    config.jamMasuk,
    config.autoJamPulang,
    config.selisihMasuk,
    config.selisihPulang,
    isGenerated,
    isProcessing,
    rows,
    showToast,
  ]);

  const handleDownloadAll = useCallback(async () => {
    if (!isGenerated || rows.length === 0) {
      showToast("Generate format terlebih dahulu sebelum download");
      return;
    }
    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const header = [
        "No",
        "Tanggal",
        "Hari",
        "Status",
        "Photo Masuk",
        "Photo Pulang",
        "Result Masuk",
        "Result Pulang",
      ];
      const records = rows.map((row) => [
        row.no,
        formatTableDate(row.date),
        row.dayName,
        row.status,
        row.photoMasuk?.fileName ?? "-",
        row.photoPulang?.fileName ?? "-",
        row.resultMasuk ?? "-",
        row.resultPulang ?? "-",
      ]);
      const lines = records.map((record) =>
        record
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      );
      const eventDate = (date: Date) =>
        date
          .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
          .replace(/ /g, "-");
      const eventRecords: (string | number)[][] = [];
      for (const row of rows) {
        const prefix = `${String(row.no).padStart(2, "0")}_${formatTableDate(row.date)}`;
        const events = [
          { time: row.resultMasuk, photo: row.resultPhotoMasuk, tag: "masuk" },
          { time: row.resultPulang, photo: row.resultPhotoPulang, tag: "pulang" },
        ];
        for (const event of events) {
          if (!event.time) continue;
          eventRecords.push([
            eventRecords.length + 1,
            event.photo ? `${prefix}_${event.tag}.jpg` : "-",
            eventDate(row.date),
            event.time,
            ADDRESS_LINES.join(", "),
          ]);
        }
      }
      const csv = [header.join(","), ...lines].join("\n");

      const zip = new JSZip();
      zip.file(
        `time-mark-batch-${config.fromDate}-${config.toDate}.csv`,
        csv,
      );

      zip.file(
        `time-mark-batch-${config.fromDate}-${config.toDate}.xlsx`,
        await createEventWorkbook(eventRecords),
      );

      const photosFolder = zip.folder("photo-time-mark");
      let photoCount = 0;
      for (const row of rows) {
        const namePrefix = `${String(row.no).padStart(2, "0")}_${formatTableDate(row.date)}`;
        if (row.resultPhotoMasuk) {
          const blob = await (await fetch(row.resultPhotoMasuk)).blob();
          photosFolder?.file(`${namePrefix}_masuk.jpg`, blob);
          photoCount += 1;
        }
        if (row.resultPhotoPulang) {
          const blob = await (await fetch(row.resultPhotoPulang)).blob();
          photosFolder?.file(`${namePrefix}_pulang.jpg`, blob);
          photoCount += 1;
        }
      }

      const pdf = await createAttendancePdf(rows);
      if (pdf) photosFolder?.file(pdf.fileName, pdf.blob);

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `time-mark-batch-${config.fromDate}-${config.toDate}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);

      showToast(
        photoCount > 0
          ? `ZIP berhasil diunduh (CSV + Excel + ${photoCount} foto time mark + PDF)`
          : "ZIP berhasil diunduh (CSV + Excel, belum ada foto time mark)",
      );
    } catch {
      showToast("Gagal membuat file ZIP, coba lagi");
    } finally {
      setIsDownloading(false);
    }
  }, [
    config.fromDate,
    config.toDate,
    isDownloading,
    isGenerated,
    rows,
    showToast,
  ]);

  return (
    <div className="min-h-screen bg-gray-100 pb-6">
      <Header periodLabel={periodLabel} />
      <Breadcrumb />

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-6 pb-28">
        <ConfigPanel
          config={config}
          onChange={handleConfigChange}
          onReset={handleReset}
          onGenerate={handleGenerate}
          onCekPeta={handleCekPeta}
        />
        {isGenerated && rows.length > 0 ? (
          <ScheduleTable
            rows={rows}
            onUploadPhoto={handleUploadPhoto}
            onPreview={handlePreview}
            onBulkUpload={handleBulkUpload}
          />
        ) : (
          <EmptyState />
        )}
      </main>

      <FooterBar
        onTimeMark={handleTimeMark}
        onDownloadAll={handleDownloadAll}
        disabled={!isGenerated || rows.length === 0}
        isProcessing={isProcessing}
        isDownloading={isDownloading}
      />

      {preview && (
        <PhotoPreviewModal
          photo={preview.photo}
          title={preview.title}
          onClose={() => setPreview(null)}
        />
      )}

      {toast && <Toast message={toast} />}
    </div>
  );
}

export default App;
