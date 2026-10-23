export interface ParsedCoordinate {
  lat: number;
  lng: number;
  label: string | null;
}

export function parseCoordinate(value: string): ParsedCoordinate | null {
  const match = value.match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const [, lat, lng] = match;
  const labelMatch = value.match(/\(([^)]+)\)/);
  return {
    lat: Number(lat),
    lng: Number(lng),
    label: labelMatch ? labelMatch[1].trim() : null,
  };
}

const METERS_PER_DEGREE_LAT = 111320;

export function jitterCoordinate(
  lat: number,
  lng: number,
  minRadiusM = 1,
  maxRadiusM = 2.5,
): { lat: number; lng: number; radiusM: number } {
  const radiusM = minRadiusM + Math.random() * (maxRadiusM - minRadiusM);
  const angle = Math.random() * 2 * Math.PI;
  const dxMeters = radiusM * Math.cos(angle);
  const dyMeters = radiusM * Math.sin(angle);

  const deltaLat = dyMeters / METERS_PER_DEGREE_LAT;
  const deltaLng =
    dxMeters / (METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180));

  return {
    lat: lat + deltaLat,
    lng: lng + deltaLng,
    radiusM,
  };
}
