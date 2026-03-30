"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { UploadIcon, DownloadIcon, CheckCircleIcon, XCircleIcon } from "lucide-react";

type ParsedRow = Record<string, string>;

interface ImportResult {
  succeeded: number;
  failed: { row: number; errors: Record<string, string[]> }[];
  total: number;
}

export function CsvImport() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => setRows(res.data),
    });
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  async function submit() {
    if (rows.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const json: ImportResult = await res.json();
      setResult(json);
      if (json.succeeded > 0) {
        toast.success(`${json.succeeded} invoice${json.succeeded > 1 ? "s" : ""} imported`);
        router.refresh();
      }
    } catch {
      toast.error("Import failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Download template */}
      <div className="flex items-center justify-between rounded-xl border p-4">
        <div>
          <p className="text-sm font-medium">CSV template</p>
          <p className="text-muted-foreground text-xs">
            Download and fill in the required columns
          </p>
        </div>
        <a
          href="/api/invoices/import"
          download="invoicecop-template.csv"
          className="border-input hover:bg-accent flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors"
        >
          <DownloadIcon className="h-3.5 w-3.5" />
          Download
        </a>
      </div>

      {/* Drop zone */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors hover:border-foreground/30 hover:bg-muted/30"
      >
        <UploadIcon className="text-muted-foreground mx-auto mb-3 h-8 w-8" />
        {fileName ? (
          <p className="text-sm font-medium">{fileName}</p>
        ) : (
          <p className="text-sm font-medium">Drop CSV here or click to browse</p>
        )}
        {rows.length > 0 && (
          <p className="text-muted-foreground mt-1 text-xs">
            {rows.length} row{rows.length > 1 ? "s" : ""} detected
          </p>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {/* Preview table */}
      {rows.length > 0 && !result && (
        <div className="space-y-4">
          <div className="rounded-xl border overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/50">
                <tr>
                  {Object.keys(rows[0]).map((col) => (
                    <th
                      key={col}
                      className="text-muted-foreground px-3 py-2 text-left font-medium"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-3 py-2 max-w-[160px] truncate">
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length > 5 && (
              <p className="text-muted-foreground p-3 text-xs">
                +{rows.length - 5} more rows
              </p>
            )}
          </div>

          <button
            onClick={submit}
            disabled={submitting}
            className="bg-foreground text-background rounded-md px-5 py-2.5 text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {submitting ? "Importing…" : `Import ${rows.length} invoice${rows.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="space-y-3 rounded-xl border p-5">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">
              {result.succeeded} of {result.total} imported successfully
            </span>
          </div>
          {result.failed.length > 0 && (
            <div className="space-y-1">
              {result.failed.map((f) => (
                <div key={f.row} className="flex items-start gap-2 text-sm text-red-600">
                  <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Row {f.row}:{" "}
                    {Object.values(f.errors).flat().join(", ")}
                  </span>
                </div>
              ))}
            </div>
          )}
          {result.succeeded > 0 && (
            <button
              onClick={() => router.push("/invoices")}
              className="text-sm underline underline-offset-2"
            >
              View invoices →
            </button>
          )}
        </div>
      )}
    </div>
  );
}
