import { Check } from "lucide-react";

import { cn } from "../../lib/utils";

export interface Step {
  key: string;
  title: string;
  description?: string;
}

interface Props {
  steps: Step[];
  current: number;
  onJump?: (index: number) => void;
}

export function Stepper({ steps, current, onJump }: Props) {
  return (
    <ol className="flex w-full items-center gap-2">
      {steps.map((s, i) => {
        const state: "done" | "current" | "upcoming" =
          i < current ? "done" : i === current ? "current" : "upcoming";
        return (
          <li key={s.key} className="flex flex-1 items-center">
            <button
              type="button"
              onClick={() => onJump?.(i)}
              disabled={!onJump || state === "upcoming"}
              className="group flex flex-1 items-center text-left disabled:cursor-default"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition",
                  state === "done"     && "border-accent-500 bg-accent-500 text-white",
                  state === "current"  && "border-brand-500 bg-brand-500 text-white shadow-sm",
                  state === "upcoming" && "border-slate-300 bg-white text-slate-500",
                )}
              >
                {state === "done" ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="ml-3 hidden flex-col md:flex">
                <span className={cn(
                  "text-sm font-medium",
                  state === "upcoming" ? "text-slate-500" : "text-slate-900",
                )}>{s.title}</span>
                {s.description && (
                  <span className="text-xs text-slate-500">{s.description}</span>
                )}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span className={cn(
                "mx-2 hidden h-px flex-1 md:block",
                i < current ? "bg-accent-500/60" : "bg-slate-200",
              )} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
