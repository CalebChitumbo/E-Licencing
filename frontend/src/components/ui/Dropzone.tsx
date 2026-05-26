import { UploadCloud } from "lucide-react";
import { ChangeEvent, useState } from "react";

import { cn } from "../../lib/utils";

interface Props {
  onFile: (file: File) => void;
  accept?: string;
  hint?: string;
  disabled?: boolean;
}

export function Dropzone({ onFile, accept, hint, disabled }: Props) {
  const [dragging, setDragging] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) onFile(f);
  }

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition",
        dragging
          ? "border-brand-500 bg-brand-50"
          : "border-slate-300 bg-slate-50/60 hover:border-slate-400",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input type="file" className="hidden" accept={accept} onChange={handleChange} disabled={disabled} />
      <UploadCloud className="h-8 w-8 text-slate-400" />
      <div className="text-sm font-medium text-slate-700">
        Drop a file here, or <span className="text-brand-500 underline">browse</span>
      </div>
      {hint && <div className="text-xs text-slate-500">{hint}</div>}
    </label>
  );
}
