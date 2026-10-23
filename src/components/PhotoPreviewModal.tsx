import { X } from "lucide-react";
import type { PhotoUpload } from "../types";

interface PhotoPreviewModalProps {
  photo: PhotoUpload | null;
  title: string;
  onClose: () => void;
}

export default function PhotoPreviewModal({
  photo,
  title,
  onClose,
}: PhotoPreviewModalProps) {
  if (!photo) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-4 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <img
          src={photo.url}
          alt={photo.fileName}
          className="max-h-[60vh] w-full rounded-lg object-contain"
        />
        <p className="mt-2 truncate text-xs text-gray-500">
          {photo.fileName}
        </p>
      </div>
    </div>
  );
}
