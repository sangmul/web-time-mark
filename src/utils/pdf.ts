import { jsPDF } from "jspdf";
import type { ScheduleRow } from "../types";
import { formatTableDate, isSameCalendarDate } from "./date";

const MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

function periodLabel(from: Date, to: Date): string {
  const fm = MONTHS[from.getMonth()];
  const tm = MONTHS[to.getMonth()];
  if (from.getFullYear() !== to.getFullYear()) {
    return `${from.getDate()}_${fm}_${from.getFullYear()}-${to.getDate()}_${tm}_${to.getFullYear()}`;
  }
  if (from.getMonth() !== to.getMonth()) {
    return `${from.getDate()}_${fm}-${to.getDate()}_${tm}_${to.getFullYear()}`;
  }
  if (from.getDate() === to.getDate()) {
    return `${from.getDate()}_${tm}_${to.getFullYear()}`;
  }
  return `${from.getDate()}-${to.getDate()}_${tm}_${to.getFullYear()}`;
}

function loadSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

type Entry =
  | { kind: "photo"; date: Date; masuk: string | null; pulang: string | null }
  | { kind: "wfh"; date: Date };

export interface AttendancePdf {
  blob: Blob;
  fileName: string;
}

// Attendance PDF: No / Tanggal / Foto Masuk / Foto Pulang. WFH dates are
// shown as a single "WFH" row. Returns null when nothing has a result photo.
export async function createAttendancePdf(
  rows: ScheduleRow[],
  wfhDates: Date[],
  rangeFrom: Date,
  rangeTo: Date,
): Promise<AttendancePdf | null> {
  const photoEntries: Entry[] = rows
    .filter((row) => row.resultPhotoMasuk || row.resultPhotoPulang)
    .map((row) => ({
      kind: "photo",
      date: row.date,
      masuk: row.resultPhotoMasuk,
      pulang: row.resultPhotoPulang,
    }));
  if (photoEntries.length === 0) return null;

  const wfhEntries: Entry[] = wfhDates
    .filter((d) => d >= rangeFrom && d <= rangeTo)
    .map((date) => ({ kind: "wfh", date }));

  const entries = [...photoEntries, ...wfhEntries]
    .filter(
      (entry, i, all) =>
        entry.kind === "photo" ||
        all.findIndex(
          (o) => o.kind === "wfh" && isSameCalendarDate(o.date, entry.date),
        ) === i,
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const colW = [36, 80, 134, 134];
  const tableW = colW.reduce((a, b) => a + b, 0);
  const x0 = (pageW - tableW) / 2;
  const colX = colW.reduce<number[]>(
    (acc, w, i) => [...acc, acc[i] + w],
    [x0],
  );
  const headerH = 22;
  const photoRowH = 170;
  const wfhRowH = 30;
  const imgPad = 4;
  const topMargin = 72;
  const bottomMargin = 40;
  const border: [number, number, number] = [200, 200, 200];

  let y = topMargin;
  const drawHeader = () => {
    y = topMargin;
    doc.setFillColor(47, 84, 150);
    doc.rect(x0, y, tableW, headerH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255);
    ["No", "Tanggal", "Foto Masuk", "Foto Pulang"].forEach((text, i) => {
      doc.text(text, colX[i] + colW[i] / 2, y + 14.5, { align: "center" });
    });
    doc.setTextColor(0);
    y += headerH;
  };
  drawHeader();

  doc.setLineWidth(0.5);
  const cell = (x: number, cy: number, w: number, h: number) => {
    doc.setDrawColor(...border);
    doc.rect(x, cy, w, h);
  };

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const h = entry.kind === "wfh" ? wfhRowH : photoRowH;
    if (y + h > pageH - bottomMargin) {
      doc.addPage();
      drawHeader();
    }

    cell(colX[0], y, colW[0], h);
    cell(colX[1], y, colW[1], h);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(String(index + 1), colX[0] + colW[0] / 2, y + h / 2 + 3, {
      align: "center",
    });
    doc.text(formatTableDate(entry.date), colX[1] + colW[1] / 2, y + h / 2 + 3, {
      align: "center",
    });

    if (entry.kind === "wfh") {
      cell(colX[2], y, colW[2] + colW[3], h);
      doc.setFont("helvetica", "bold");
      doc.text("WFH", colX[2] + (colW[2] + colW[3]) / 2, y + h / 2 + 3, {
        align: "center",
      });
    } else {
      const photos = [entry.masuk, entry.pulang];
      for (let c = 0; c < 2; c += 1) {
        const colIndex = 2 + c;
        cell(colX[colIndex], y, colW[colIndex], h);
        const photo = photos[c];
        if (!photo) continue;
        const size = await loadSize(photo);
        const ratio = Math.min(
          (colW[colIndex] - imgPad * 2) / size.w,
          (h - imgPad * 2) / size.h,
        );
        const w = size.w * ratio;
        const ph = size.h * ratio;
        doc.addImage(
          photo,
          "JPEG",
          colX[colIndex] + (colW[colIndex] - w) / 2,
          y + (h - ph) / 2,
          w,
          ph,
        );
      }
    }
    y += h;
  }

  return {
    blob: doc.output("blob"),
    fileName: `Absensi_${periodLabel(
      entries[0].date,
      entries[entries.length - 1].date,
    )}.pdf`,
  };
}
