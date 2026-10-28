import type { ReactNode } from "react";

export interface AdminTableColumn<Row> {
  key: string;
  label: string;
  render?: (row: Row) => ReactNode;
}

export function AdminTable<Row extends { id: string }>({
  columns,
  rows,
  emptyMessage = "Chưa có dữ liệu.",
}: {
  columns: AdminTableColumn<Row>[];
  rows: Row[];
  emptyMessage?: string;
}) {
  return (
    <div className="overflow-x-auto border-y">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-muted/40 text-xs text-muted-foreground"><tr>{columns.map((column) => <th key={column.key} className="px-4 py-3 font-medium">{column.label}</th>)}</tr></thead>
        <tbody className="divide-y">
          {rows.length ? rows.map((row) => <tr key={row.id} className="hover:bg-muted/20">{columns.map((column) => <td key={column.key} className="max-w-sm px-4 py-3">{column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? "—")}</td>)}</tr>) : <tr><td className="px-4 py-10 text-center text-muted-foreground" colSpan={columns.length}>{emptyMessage}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}