import { Home, Wifi } from "lucide-react";

export default function Breadcrumb() {
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
      <div className="flex items-center gap-2 text-sm">
        <Home size={16} className="text-gray-400" />
        <span className="font-medium text-indigo-600">
          Formulir Time Mark Batch
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-emerald-600 shadow-sm">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <Wifi size={14} />
        Geofence Engine Connected
      </div>
    </div>
  );
}
