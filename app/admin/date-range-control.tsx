"use client";

import { useState } from "react";
import { DATE_PRESET_ORDER, DATE_PRESET_LABELS, resolveDateRange, type DatePresetKey } from "@/lib/ga4/dateRanges";

export function useDateRangeControl(initial: DatePresetKey = "last7") {
  const [preset, setPreset] = useState<DatePresetKey>(initial);
  const [custom, setCustom] = useState({ startDate: "", endDate: "" });
  const range = resolveDateRange(preset, custom);
  return { preset, setPreset, custom, setCustom, range };
}

export function DateRangeControl({
  preset,
  setPreset,
  custom,
  setCustom,
}: {
  preset: DatePresetKey;
  setPreset: (value: DatePresetKey) => void;
  custom: { startDate: string; endDate: string };
  setCustom: (value: { startDate: string; endDate: string }) => void;
}) {
  return (
    <>
      <select className="admin-select" aria-label="Date range" value={preset} onChange={(event) => setPreset(event.target.value as DatePresetKey)}>
        {DATE_PRESET_ORDER.map((key) => (
          <option key={key} value={key}>
            {DATE_PRESET_LABELS[key]}
          </option>
        ))}
      </select>
      {preset === "custom" && (
        <>
          <input
            type="date"
            className="admin-date-input"
            aria-label="Start date"
            value={custom.startDate}
            onChange={(event) => setCustom({ ...custom, startDate: event.target.value })}
          />
          <input
            type="date"
            className="admin-date-input"
            aria-label="End date"
            value={custom.endDate}
            onChange={(event) => setCustom({ ...custom, endDate: event.target.value })}
          />
        </>
      )}
    </>
  );
}
