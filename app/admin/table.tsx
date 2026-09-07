"use client";

import { useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => number | string;
}

export function SortableTable<T>({ rows, columns, defaultSortKey }: { rows: T[]; columns: Column<T>[]; defaultSortKey?: string }) {
  const [sortKey, setSortKey] = useState(defaultSortKey ?? columns[0]?.key);
  const [desc, setDesc] = useState(true);

  const sorted = [...rows].sort((a, b) => {
    const column = columns.find((candidate) => candidate.key === sortKey);
    if (!column?.sortValue) return 0;
    const left = column.sortValue(a);
    const right = column.sortValue(b);
    if (typeof left === "number" && typeof right === "number") return desc ? right - left : left - right;
    return desc ? String(right).localeCompare(String(left)) : String(left).localeCompare(String(right));
  });

  function toggleSort(key: string) {
    if (key === sortKey) {
      setDesc((value) => !value);
    } else {
      setSortKey(key);
      setDesc(true);
    }
  }

  if (rows.length === 0) return <div className="empty-state">No analytics data available for this period.</div>;

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} onClick={() => column.sortValue && toggleSort(column.key)} aria-sort={sortKey === column.key ? (desc ? "descending" : "ascending") : "none"}>
                {column.label}
                {column.sortValue ? (sortKey === column.key ? (desc ? " ↓" : " ↑") : "") : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column.key}>{column.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
