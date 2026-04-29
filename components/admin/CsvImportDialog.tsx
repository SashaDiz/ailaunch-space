"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Download,
  Loader2,
  ArrowLeft,
  Upload,
  Plus,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

type Step = "upload" | "preview" | "importing" | "results";
type Filter = "all" | "valid" | "errors";

interface ValidationRow {
  rowIndex: number;
  valid: boolean;
  errors: string[];
  warnings: string[];
  data: Record<string, any> | null;
}

interface ImportResults {
  inserted: number;
  failed: number;
  categoriesCreated: number;
  errors: { row: number; error: string }[];
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const LLM_PROMPT = `I have a list of products/tools/apps. Convert them into a CSV file with these exact columns:

name,website_url,short_description,categories,pricing,tags

Rules:
- First row must be the header: name,website_url,short_description,categories,pricing,tags
- "name" — product name (required)
- "website_url" — full URL with https:// (required)
- "short_description" — one sentence, max 160 characters
- "categories" — one or more categories separated by | (e.g. "AI|Developer Tools")
- "pricing" — exactly one of: Free, Freemium, Paid
- "tags" — lowercase keywords separated by | (e.g. "saas|ai|productivity")
- Wrap fields containing commas or quotes in double quotes
- Output raw CSV text only, no markdown code blocks

Here is my data:
[PASTE YOUR DATA HERE]`;

const TEMPLATE_CSV = `name,website_url,short_description,categories,pricing,tags,logo_url,plan,status
"Example App","https://example.com","A great example application","SaaS|Productivity","Free","saas|tools","","standard","live"
"Another Tool","https://another.com","Another useful tool","AI|Developer Tools","Freemium","ai|dev","","standard","live"`;

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      row.push(current.trim());
      current = "";
    } else if (
      (char === "\n" || (char === "\r" && text[i + 1] === "\n")) &&
      !inQuotes
    ) {
      if (char === "\r") i++;
      row.push(current.trim());
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.some((cell) => cell !== "")) rows.push(row);
  }
  return rows;
}

function csvToObjects(parsed: string[][]): {
  headers: string[];
  rows: Record<string, string>[];
} {
  if (parsed.length < 2) return { headers: [], rows: [] };
  const headers = parsed[0].map((h) => h.toLowerCase().trim());
  const rows = parsed.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] || "";
    });
    return obj;
  });
  return { headers, rows };
}

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

export function CsvImportDialog({
  open,
  onOpenChange,
  onSuccess,
}: CsvImportDialogProps) {
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [validationResults, setValidationResults] = useState<ValidationRow[]>(
    []
  );
  const [summary, setSummary] = useState({
    total: 0,
    valid: 0,
    errors: 0,
    duplicates: 0,
    warnings: 0,
    newCategories: [] as string[],
  });
  const [importResults, setImportResults] = useState<ImportResults | null>(
    null
  );
  const [validating, setValidating] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [dragOver, setDragOver] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetAll = useCallback(() => {
    setStep("upload");
    setFileName("");
    setParsedRows([]);
    setValidationResults([]);
    setSummary({ total: 0, valid: 0, errors: 0, duplicates: 0, warnings: 0, newCategories: [] });
    setImportResults(null);
    setFilter("all");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) resetAll();
      onOpenChange(open);
    },
    [onOpenChange, resetAll]
  );

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("File too large. Maximum 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast.error("Could not read file");
        return;
      }

      const parsed = parseCSV(text);
      const { headers, rows } = csvToObjects(parsed);

      if (rows.length === 0) {
        toast.error("CSV file has no data rows");
        return;
      }
      if (rows.length > 500) {
        toast.error("Maximum 500 rows allowed. Your file has " + rows.length);
        return;
      }
      if (!headers.includes("name") || !headers.includes("website_url")) {
        toast.error('CSV must have "name" and "website_url" columns');
        return;
      }

      setFileName(file.name);
      setParsedRows(rows);
      setStep("preview");
      toast.success(`Parsed ${rows.length} rows from ${file.name}`);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleValidate = async () => {
    setValidating(true);
    try {
      const res = await fetch("/api/admin/import?action=validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: parsedRows }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Validation failed");
        return;
      }

      const json = await res.json();
      setValidationResults(json.rows);
      setSummary(json.summary);
      toast.success(
        `${json.summary.valid} valid, ${json.summary.errors} errors`
      );
    } catch (error) {
      toast.error("Failed to validate CSV");
      console.error(error);
    } finally {
      setValidating(false);
    }
  };

  const handleImport = async () => {
    const validRows = validationResults
      .filter((r) => r.valid && r.data)
      .map((r) => ({ ...r.data, _rowIndex: r.rowIndex }));

    if (validRows.length === 0) {
      toast.error("No valid rows to import");
      return;
    }

    setStep("importing");

    try {
      const res = await fetch("/api/admin/import?action=execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: validRows,
          newCategories: summary.newCategories,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Import failed");
        setStep("preview");
        return;
      }

      const json = await res.json();
      setImportResults(json.results);
      setStep("results");

      if (json.results.failed === 0) {
        toast.success(
          `Successfully imported ${json.results.inserted} projects`
        );
      } else {
        toast.error(
          `Imported ${json.results.inserted}, failed ${json.results.failed}`
        );
      }
    } catch (error) {
      toast.error("Import request failed");
      console.error(error);
      setStep("preview");
    }
  };

  const filteredResults =
    filter === "all"
      ? validationResults
      : filter === "valid"
        ? validationResults.filter((r) => r.valid)
        : validationResults.filter((r) => !r.valid);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "upload" && "Import CSV"}
            {step === "preview" && "Preview & Validate"}
            {step === "importing" && "Importing..."}
            {step === "results" && "Import Complete"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Step: Upload */}
          {step === "upload" && (
            <>
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? "border-primary bg-primary/5"
                    : "border-muted-foreground/25 hover:border-primary/50"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                  }}
                />
                <FileSpreadsheet className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">
                  Drag and drop your CSV file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse. Max 500 rows, 2MB.
                </p>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <strong>Required columns:</strong> name, website_url
                </p>
                <p>
                  <strong>Optional:</strong> slug, short_description,
                  full_description, categories, pricing, tags, logo_url, plan,
                  status, link_type, contact_email, meta_title, meta_description
                </p>
                <p>
                  Use{" "}
                  <code className="px-1 py-0.5 bg-muted rounded text-xs">
                    |
                  </code>{" "}
                  to separate multiple categories or tags (e.g.{" "}
                  <code className="px-1 py-0.5 bg-muted rounded text-xs">
                    AI|SaaS|Tools
                  </code>
                  )
                </p>
                <p>
                  Fields like pricing, plan, status, and link_type will be
                  auto-mapped to valid values. New categories will be created
                  automatically.
                </p>
              </div>

              {/* LLM Prompt Helper */}
              <div className="border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setPromptOpen(!promptOpen)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors text-left"
                >
                  <Sparkles className="h-4 w-4 text-purple-500 flex-shrink-0" />
                  <span>LLM prompt to prepare CSV</span>
                  {promptOpen ? (
                    <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" />
                  )}
                </button>
                {promptOpen && (
                  <div className="border-t px-3 py-3 space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Copy this prompt and paste it into ChatGPT, Claude, or any LLM along with your raw data. It will output a CSV ready to import.
                    </p>
                    <div className="relative">
                      <pre className="text-xs bg-muted rounded-md p-3 pr-10 overflow-x-auto whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                        {LLM_PROMPT}
                      </pre>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-7 w-7 p-0"
                        onClick={() => {
                          navigator.clipboard.writeText(LLM_PROMPT);
                          setPromptCopied(true);
                          setTimeout(() => setPromptCopied(false), 2000);
                          toast.success("Prompt copied!");
                        }}
                      >
                        {promptCopied ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={downloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </>
          )}

          {/* Step: Preview */}
          {step === "preview" && (
            <>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={resetAll}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {fileName} — {parsedRows.length} rows
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {validationResults.length === 0 ? (
                    <Button
                      size="sm"
                      onClick={handleValidate}
                      disabled={validating}
                    >
                      {validating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      {validating ? "Validating..." : "Validate"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={handleImport}
                      disabled={summary.valid === 0}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import {summary.valid} Rows
                    </Button>
                  )}
                </div>
              </div>

              {/* Summary badges */}
              {validationResults.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    className={`cursor-pointer ${filter === "all" ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
                    onClick={() => setFilter("all")}
                  >
                    All: {summary.total}
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${filter === "valid" ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"}`}
                    onClick={() => setFilter("valid")}
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Valid: {summary.valid}
                  </Badge>
                  <Badge
                    className={`cursor-pointer ${filter === "errors" ? "bg-red-500/20 text-red-600" : "bg-muted text-muted-foreground"}`}
                    onClick={() => setFilter("errors")}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Errors: {summary.errors}
                  </Badge>
                  {summary.duplicates > 0 && (
                    <Badge className="bg-yellow-500/20 text-yellow-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Duplicates: {summary.duplicates}
                    </Badge>
                  )}
                  {summary.warnings > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-600">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Auto-mapped: {summary.warnings}
                    </Badge>
                  )}
                  {summary.newCategories.length > 0 && (
                    <Badge className="bg-blue-500/20 text-blue-600">
                      <Plus className="h-3 w-3 mr-1" />
                      New categories: {summary.newCategories.length}
                    </Badge>
                  )}
                </div>
              )}

              {/* New categories info */}
              {summary.newCategories.length > 0 && (
                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-400 mb-1">
                    {summary.newCategories.length} new categories will be created:
                  </p>
                  <p className="text-blue-600 dark:text-blue-300">
                    {summary.newCategories.join(", ")}
                  </p>
                </div>
              )}

              {/* Preview table */}
              <ScrollArea className="flex-1 max-h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Website URL</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Pricing</TableHead>
                      {validationResults.length > 0 && (
                        <TableHead className="w-28">Status</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResults.length > 0
                      ? filteredResults.map((vr) => (
                          <TableRow
                            key={vr.rowIndex}
                            className={!vr.valid ? "bg-red-500/5" : ""}
                          >
                            <TableCell className="text-muted-foreground text-xs">
                              {vr.rowIndex + 1}
                            </TableCell>
                            <TableCell className="font-medium max-w-[160px] truncate">
                              {parsedRows[vr.rowIndex]?.name || "—"}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-sm">
                              {parsedRows[vr.rowIndex]?.website_url || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {parsedRows[vr.rowIndex]?.categories || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {parsedRows[vr.rowIndex]?.pricing || "Free"}
                            </TableCell>
                            <TableCell>
                              {vr.valid ? (
                                <div>
                                  <Badge className="bg-green-500/20 text-green-600">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Valid
                                  </Badge>
                                  {vr.warnings && vr.warnings.length > 0 && (
                                    <p className="mt-1 text-xs text-amber-600">
                                      {vr.warnings.join("; ")}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <Badge className="bg-red-500/20 text-red-600">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Error
                                  </Badge>
                                  <p className="mt-1 text-xs text-red-600">
                                    {vr.errors.join("; ")}
                                  </p>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      : parsedRows.map((row, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-muted-foreground text-xs">
                              {i + 1}
                            </TableCell>
                            <TableCell className="font-medium max-w-[160px] truncate">
                              {row.name || "—"}
                            </TableCell>
                            <TableCell className="max-w-[160px] truncate text-sm">
                              {row.website_url || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.categories || "—"}
                            </TableCell>
                            <TableCell className="text-sm">
                              {row.pricing || "Free"}
                            </TableCell>
                          </TableRow>
                        ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}

          {/* Step: Importing */}
          {step === "importing" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-lg font-medium">Importing projects...</p>
              <p className="text-sm text-muted-foreground">
                Please wait, this may take a moment.
              </p>
            </div>
          )}

          {/* Step: Results */}
          {step === "results" && importResults && (
            <>
              <div className="flex flex-col items-center py-6 gap-4">
                {importResults.failed === 0 ? (
                  <CheckCircle2 className="h-14 w-14 text-green-500" />
                ) : (
                  <AlertTriangle className="h-14 w-14 text-yellow-500" />
                )}
                <div className="flex gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-600">
                      {importResults.inserted}
                    </p>
                    <p className="text-sm text-muted-foreground">Imported</p>
                  </div>
                  {importResults.categoriesCreated > 0 && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-blue-600">
                        {importResults.categoriesCreated}
                      </p>
                      <p className="text-sm text-muted-foreground">Categories Created</p>
                    </div>
                  )}
                  {importResults.failed > 0 && (
                    <div className="text-center">
                      <p className="text-3xl font-bold text-red-600">
                        {importResults.failed}
                      </p>
                      <p className="text-sm text-muted-foreground">Failed</p>
                    </div>
                  )}
                </div>
              </div>

              {importResults.errors.length > 0 && (
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {importResults.errors.map((err, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-sm p-2 bg-red-500/5 rounded"
                      >
                        <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <span>
                          <strong>Row {err.row + 1}:</strong> {err.error}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    resetAll();
                  }}
                >
                  Import More
                </Button>
                <Button
                  onClick={() => {
                    onSuccess();
                    handleOpenChange(false);
                  }}
                >
                  Done
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
