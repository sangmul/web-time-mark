import { CheckCircle2 } from "lucide-react";

export default function Toast({ message }: { message: string }) {
  return (
    <div className="fixed right-6 top-6 z-50 flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg">
      <CheckCircle2 size={16} className="text-emerald-400" />
      {message}
    </div>
  );
}
