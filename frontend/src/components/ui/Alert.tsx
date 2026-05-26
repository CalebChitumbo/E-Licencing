import { AlertCircle } from "lucide-react";
import { ReactNode } from "react";

import { cn } from "../../lib/utils";

export function Alert({
  tone = "error", title, children, className,
}: {
  tone?: "error" | "warning" | "info" | "success";
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  const toneClass = {
    error:   "border-red-200 bg-red-50 text-red-800",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    info:    "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-green-200 bg-green-50 text-green-800",
  }[tone];
  return (
    <div className={cn("flex gap-3 rounded-lg border p-3 text-sm", toneClass, className)} role="alert">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {title && <div className="font-medium">{title}</div>}
        <div className={title ? "mt-0.5" : ""}>{children}</div>
      </div>
    </div>
  );
}
