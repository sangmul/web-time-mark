import { jsPDF } from "jspdf";
import type { ScheduleRow } from "../types";

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
const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const pad = (n: number) => String(n).padStart(2, "0");

function dateId(d: Date): string {
  return `${DAYS_ID[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function timeWib(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} WIB`;
}

function periodTitle(from: Date, to: Date): string {
  const fm = MONTHS[from.getMonth()];
  const tm = MONTHS[to.getMonth()];
  if (from.getFullYear() !== to.getFullYear()) {
    return `${from.getDate()} ${fm} ${from.getFullYear()} – ${to.getDate()} ${tm} ${to.getFullYear()}`;
  }
  if (from.getMonth() !== to.getMonth()) {
    return `${from.getDate()} ${fm} – ${to.getDate()} ${tm} ${to.getFullYear()}`;
  }
  if (from.getDate() === to.getDate()) {
    return `${from.getDate()} ${tm} ${to.getFullYear()}`;
  }
  return `${from.getDate()} – ${to.getDate()} ${tm} ${to.getFullYear()}`;
}

function loadSize(url: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
    img.onerror = reject;
    img.src = url;
  });
}

interface Event {
  label: "Masuk" | "Pulang";
  at: Date | null;
  photo: string;
}

export interface AttendancePdf {
  blob: Blob;
  fileName: string;
}

// Builds the attendance PDF (No / Tanggal / Foto / Masuk-Pulang). Returns null
// when no row has a time-marked photo yet.
export async function createAttendancePdf(
  rows: ScheduleRow[],
): Promise<AttendancePdf | null> {
  const days = rows
    .map((row) => ({
      row,
      events: [
        { label: "Masuk", at: row.resultMasukAt, photo: row.resultPhotoMasuk },
        { label: "Pulang", at: row.resultPulangAt, photo: row.resultPhotoPulang },
      ].filter((e): e is Event => e.photo !== null),
    }))
    .filter((d) => d.events.length > 0);
  if (days.length === 0) return null;

  const first = days[0].row.date;
  const last = days[days.length - 1].row.date;
  const title = `Absensi ${periodTitle(first, last)}`;

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const colW = [34, 126, 140, 140];
  const tableW = colW.reduce((a, b) => a + b, 0);
  const x0 = (pageW - tableW) / 2;
  const colX = colW.reduce<number[]>(
    (acc, w, i) => [...acc, acc[i] + w],
    [x0],
  );
  const headerH = 22;
  const cellH = 165;
  const pad4 = 4;
  const bottomMargin = 40;

  let y = 0;
  const drawHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text(title, pageW / 2, 56, { align: "center" });
    y = 76;
    doc.setFillColor(47, 84, 150);
    doc.rect(x0, y, tableW, headerH, "F");
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.rect(x0, y, tableW, headerH);
    doc.setFontSize(10);
    doc.setTextColor(255);
    ["No", "Tanggal", "Foto", "Masuk/Pulang"].forEach((text, i) => {
      doc.text(text, colX[i] + colW[i] / 2, y + 14.5, { align: "center" });
    });
    doc.setTextColor(0);
    y += headerH;
  };
  drawHeader();

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);

  for (let index = 0; index < days.length; index += 1) {
    const { row, events } = days[index];
    const blockH = cellH * events.length;
    if (y + blockH > pageH - bottomMargin && y > 100) {
      doc.addPage();
      drawHeader();
    }

    // Outer cells spanning all events of the day: No + Tanggal.
    doc.rect(colX[0], y, colW[0], blockH);
    doc.rect(colX[1], y, colW[1], blockH);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(String(index + 1), colX[0] + colW[0] / 2, y + blockH / 2 + 3, {
      align: "center",
    });
    const dateLines = doc.splitTextToSize(dateId(row.date), colW[1] - 12);
    doc.text(dateLines, colX[1] + colW[1] / 2, y + blockH / 2 + 3, {
      align: "center",
    });

    for (let e = 0; e < events.length; e += 1) {
      const ev = events[e];
      const cy = y + cellH * e;
      doc.rect(colX[2], cy, colW[2], cellH);
      doc.rect(colX[3], cy, colW[3], cellH);

      const size = await loadSize(ev.photo);
      const maxW = colW[2] - pad4 * 2;
      const maxH = cellH - pad4 * 2;
      const ratio = Math.min(maxW / size.w, maxH / size.h);
      const w = size.w * ratio;
      const h = size.h * ratio;
      doc.addImage(
        ev.photo,
        "JPEG",
        colX[2] + (colW[2] - w) / 2,
        cy + (cellH - h) / 2,
        w,
        h,
      );

      const cx = colX[3] + colW[3] / 2;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(ev.label, cx, cy + cellH / 2 - 2, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.text(ev.at ? timeWib(ev.at) : "-", cx, cy + cellH / 2 + 11, {
        align: "center",
      });
    }
    y += blockH;
  }

  const range = periodTitle(first, last).replace(/ – /g, "-").replace(/ /g, "_");
  return {
    blob: doc.output("blob"),
    fileName: `Absensi_${range}.pdf`,
  };
}
