import mapSnapshotUrl from "../assets/map-snapshot.jpg";
import compassBaseUrl from "../assets/compass-base.svg";
import compassNeedleUrl from "../assets/compass-needle.svg";

interface WatermarkParams {
  sourceUrl: string;
  timestamp: Date;
  lat: number;
  lng: number;
  addressLines: string[];
  index: number;
}

function toDMS(value: number, axis: "lat" | "lng"): string {
  const direction =
    axis === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "E" : "W";
  const abs = Math.abs(value);
  const deg = Math.floor(abs);
  const minFull = (abs - deg) * 60;
  const min = Math.floor(minFull);
  const sec = ((minFull - min) * 60).toFixed(3).replace(".", ",");
  return `${deg}°${min}'${sec}"${direction}`;
}

function formatStamp(date: Date): string {
  const datePart = date
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(/ /g, " ");
  const timePart = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${datePart} ${timePart} WIB`;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

let mapSnapshotPromise: Promise<HTMLImageElement> | null = null;
function loadMapSnapshot(): Promise<HTMLImageElement> {
  if (!mapSnapshotPromise) mapSnapshotPromise = loadImage(mapSnapshotUrl);
  return mapSnapshotPromise;
}

let compassBasePromise: Promise<HTMLImageElement> | null = null;
function loadCompassBase(): Promise<HTMLImageElement> {
  if (!compassBasePromise) compassBasePromise = loadImage(compassBaseUrl);
  return compassBasePromise;
}

let compassNeedlePromise: Promise<HTMLImageElement> | null = null;
function loadCompassNeedle(): Promise<HTMLImageElement> {
  if (!compassNeedlePromise) compassNeedlePromise = loadImage(compassNeedleUrl);
  return compassNeedlePromise;
}

function bearingFromCoordinate(lat: number, lng: number): number {
  const raw = Math.abs(lat * 10000) + Math.abs(lng * 10000);
  return Math.round(raw % 360);
}

function bearingToCardinal(degrees: number): string {
  const points = ["N", "E", "S", "W"];
  return points[Math.round(degrees / 90) % 4];
}

function drawCompass(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  bearing: number,
  compassBase: HTMLImageElement,
  compassNeedle: HTMLImageElement,
) {
  // Both SVGs share the same 500x500 viewBox, so a common size keeps the
  // needle perfectly aligned with the base ring once rotated.
  const size = r * 2.4;

  ctx.save();
  ctx.drawImage(compassBase, cx - size / 2, cy - size / 2, size, size);

  ctx.translate(cx, cy);
  ctx.rotate((bearing * Math.PI) / 180);
  ctx.drawImage(compassNeedle, -size / 2, -size / 2, size, size);
  ctx.restore();
}

function drawMiniMap(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  mapSnapshot: HTMLImageElement,
) {
  const MAP_OPACITY = 0.8;

  ctx.save();
  ctx.beginPath();
  const radius = w * 0.03;
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.clip();

  // Crop tightly around the pin in the source screenshot (rather than
  // covering the whole frame) so the marker reads at the same prominent
  // size as in the reference result photo, instead of shrinking into a
  // wide, cluttered street view.
  const crop = { x: 299, y: 312, w: 327, h: 288 };
  const scale = Math.max(w / crop.w, h / crop.h);
  const drawW = crop.w * scale;
  const drawH = crop.h * scale;
  const drawX = x + (w - drawW) / 2;
  const drawY = y + (h - drawH) / 2;

  ctx.globalAlpha = MAP_OPACITY;
  ctx.drawImage(
    mapSnapshot,
    crop.x,
    crop.y,
    crop.w,
    crop.h,
    drawX,
    drawY,
    drawW,
    drawH,
  );
  ctx.globalAlpha = 1;

  const fadeHeight = h * 0.24;
  const fadeGradient = ctx.createLinearGradient(
    x,
    y + h - fadeHeight,
    x,
    y + h,
  );
  fadeGradient.addColorStop(0, "rgba(255,255,255,0)");
  fadeGradient.addColorStop(1, "rgba(255,255,255,0.6)");
  ctx.fillStyle = fadeGradient;
  ctx.fillRect(x, y + h - fadeHeight, w, fadeHeight);

  const googleLetters = [
    { char: "G", color: "#4285F4" },
    { char: "o", color: "#EA4335" },
    { char: "o", color: "#FBBC05" },
    { char: "g", color: "#4285F4" },
    { char: "l", color: "#34A853" },
    { char: "e", color: "#EA4335" },
  ];
  ctx.font = `600 ${Math.round(h * 0.1)}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 0.75;
  let letterX = x + w * 0.03;
  const letterY = y + h - h * 0.08;
  for (const { char, color } of googleLetters) {
    ctx.fillStyle = color;
    ctx.fillText(char, letterX, letterY);
    letterX += ctx.measureText(char).width;
  }
  ctx.globalAlpha = 1;

  ctx.restore();
  ctx.strokeStyle = "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, w, h);
}

export async function generateTimeMarkPhoto({
  sourceUrl,
  timestamp,
  lat,
  lng,
  addressLines,
  index,
}: WatermarkParams): Promise<string> {
  const [image, mapSnapshot, compassBase, compassNeedle] = await Promise.all([
    loadImage(sourceUrl),
    loadMapSnapshot(),
    loadCompassBase(),
    loadCompassNeedle(),
  ]);

  const maxWidth = 960;
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.round(image.naturalWidth * scale);
  const height = Math.round(image.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return sourceUrl;

  ctx.drawImage(image, 0, 0, width, height);

  const bearing = bearingFromCoordinate(lat, lng);
  const unit = width / 100;
  drawCompass(
    ctx,
    unit * 12,
    unit * 13,
    unit * 9,
    bearing,
    compassBase,
    compassNeedle,
  );

  const localTimestamp = new Date(
    timestamp.getTime() - (5000 + Math.round(Math.random() * 8000)),
  );

  const lines = [
    `Network: ${formatStamp(timestamp)}`,
    `Local: ${formatStamp(localTimestamp)}`,
    `${toDMS(lat, "lat")} ${toDMS(lng, "lng")}`,
    `${bearing}° ${bearingToCardinal(bearing)}`,
    ...addressLines,
    `Altitude:${(35 + Math.random() * 40).toFixed(1)}msnm`,
    `Speed:0.0km/h`,
    `Index number: ${index}`,
  ];

  const mapW = width * 0.32;
  const mapH = mapW * 0.88;
  const mapX = width - mapW - unit * 2;
  const mapY = height - mapH - unit * 2;
  drawMiniMap(ctx, mapX, mapY, mapW, mapH, mapSnapshot);

  const fontSize = Math.max(11, Math.round(unit * 2.9));
  const lineHeight = fontSize * 1.32;
  ctx.font = `500 ${fontSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.85)";
  ctx.shadowBlur = fontSize * 0.35;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  const textX = unit * 3;
  let textY = height - unit * 3 - (lines.length - 1) * lineHeight;
  for (const line of lines) {
    ctx.fillText(line, textX, textY);
    textY += lineHeight;
  }
  ctx.shadowBlur = 0;

  return canvas.toDataURL("image/jpeg", 0.88);
}
