import { describe, expect, it } from "vitest";

import { cn, fmtDate, fmtMoney, statusBadgeClass } from "./utils";

describe("utils", () => {
  it("cn merges tailwind classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", false, "font-bold")).toBe("text-red-500 font-bold");
  });

  it("fmtDate returns em-dash for nullish input", () => {
    expect(fmtDate(undefined)).toBe("—");
    expect(fmtDate(null)).toBe("—");
  });

  it("fmtMoney formats ZMW", () => {
    expect(fmtMoney(5000)).toContain("5,000");
  });

  it("statusBadgeClass picks the right colour bucket", () => {
    expect(statusBadgeClass("draft")).toBe("badge-gray");
    expect(statusBadgeClass("under_review")).toBe("badge-blue");
    expect(statusBadgeClass("rejected")).toBe("badge-red");
    expect(statusBadgeClass("licence_generated")).toBe("badge-green");
  });
});
