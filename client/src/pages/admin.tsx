import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, Image, Check, AlertCircle, ArrowLeft, Trash2 } from "lucide-react";
import Papa from "papaparse";
import { Link } from "wouter";

interface ParsedMerchant {
  name: string;
  description: string;
  logo: string;
  categories: string;
  shippingCountries: string;
  website: string;
  lightningSupported: string;
  onchainSupported: string;
  paymentProvider: string;
  countryMadeIn: string;
  countryShippedFrom: string;
  lastSurveyed: string;
  [key: string]: string;
}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; message: string }>;
}

interface UploadedLogo {
  originalName: string;
  savedAs: string;
  path: string;
}

export default function Admin() {
  const [csvData, setCsvData] = useState<ParsedMerchant[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [uploadedLogos, setUploadedLogos] = useState<UploadedLogo[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadingLogos, setUploadingLogos] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverCsv, setDragOverCsv] = useState(false);

  const handleCsvUpload = useCallback((file: File) => {
    setCsvFileName(file.name);
    setImportResult(null);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setCsvData(results.data as ParsedMerchant[]);
      },
      error: () => {
        setCsvData([]);
      },
    });
  }, []);

  const handleLogoUpload = useCallback(async (files: FileList | File[]) => {
    setUploadingLogos(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("logos", f));

    try {
      const res = await fetch("/api/upload-logos", { method: "POST", body: formData });
      const data = await res.json();
      if (data.uploaded) {
        setUploadedLogos(prev => [...prev, ...data.uploaded]);
      }
    } catch (err) {
      console.error("Logo upload failed", err);
    } finally {
      setUploadingLogos(false);
    }
  }, []);

  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    try {
      const res = await fetch("/api/merchants/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchants: csvData }),
      });
      const result = await res.json();
      setImportResult(result);
      if (result.success > 0) {
        setCsvData([]);
        setCsvFileName("");
      }
    } catch (err) {
      setImportResult({ success: 0, errors: [{ row: 0, message: "Import request failed" }] });
    } finally {
      setImporting(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent, type: "logo" | "csv") => {
    e.preventDefault();
    setDragOver(false);
    setDragOverCsv(false);
    const files = e.dataTransfer.files;
    if (type === "csv" && files.length === 1) {
      handleCsvUpload(files[0]);
    } else if (type === "logo") {
      handleLogoUpload(files);
    }
  }, [handleCsvUpload, handleLogoUpload]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" data-testid="link-back-home">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Admin - Bulk Import</h1>
            <p className="text-muted-foreground">Upload logos and import merchants from CSV</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Step 1: Upload Logos</CardTitle>
            </div>
            <CardDescription>
              Upload merchant logo images first. They'll be saved as <code className="text-xs bg-muted px-1 rounded">/assets/filename.png</code> — use that path in your CSV.
            </CardDescription>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => handleDrop(e, "logo")}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.multiple = true;
                input.accept = ".png,.jpg,.jpeg,.webp,.svg";
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files) handleLogoUpload(files);
                };
                input.click();
              }}
              data-testid="dropzone-logos"
            >
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {uploadingLogos ? "Uploading..." : "Drag & drop logo images here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, SVG — up to 5MB each</p>
            </div>

            {uploadedLogos.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">{uploadedLogos.length} logo(s) uploaded:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {uploadedLogos.map((logo, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2">
                      <img src={logo.path} alt={logo.savedAs} className="h-6 w-6 object-contain rounded" />
                      <code className="flex-1 truncate">{logo.path}</code>
                      <Check className="h-3 w-3 text-green-500 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Step 2: Upload CSV</CardTitle>
            </div>
            <CardDescription>
              Upload a CSV file with merchant data. Required columns: <code className="text-xs bg-muted px-1 rounded">name</code>, <code className="text-xs bg-muted px-1 rounded">description</code>, <code className="text-xs bg-muted px-1 rounded">website</code>
            </CardDescription>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                dragOverCsv ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOverCsv(true); }}
              onDragLeave={() => setDragOverCsv(false)}
              onDrop={(e) => handleDrop(e, "csv")}
              onClick={() => {
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".csv";
                input.onchange = (e) => {
                  const files = (e.target as HTMLInputElement).files;
                  if (files?.[0]) handleCsvUpload(files[0]);
                };
                input.click();
              }}
              data-testid="dropzone-csv"
            >
              <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {csvFileName ? csvFileName : "Drag & drop CSV file here, or click to browse"}
              </p>
            </div>

            <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
              <p className="font-medium text-sm">CSV Column Reference:</p>
              <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                <span><strong>name</strong> — Business name</span>
                <span><strong>description</strong> — Short description</span>
                <span><strong>logo</strong> — Path e.g. /assets/logo.png</span>
                <span><strong>website</strong> — Full URL</span>
                <span><strong>categories</strong> — Separated by ; or |</span>
                <span><strong>shippingCountries</strong> — Separated by ; or |</span>
                <span><strong>lightning</strong> — true/false</span>
                <span><strong>onchain</strong> — true/false</span>
                <span><strong>paymentProvider</strong> — e.g. BTCPay Server</span>
                <span><strong>countryMadeIn</strong> — e.g. USA</span>
                <span><strong>lastSurveyed</strong> — e.g. 2026-02-11</span>
              </div>
            </div>
          </Card>
        </div>

        {csvData.length > 0 && (
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Preview — {csvData.length} merchant(s) to import</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setCsvData([]); setCsvFileName(""); }}
                  data-testid="button-clear-csv"
                >
                  <Trash2 className="h-4 w-4 mr-1" /> Clear
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={importing}
                  data-testid="button-import"
                >
                  {importing ? "Importing..." : `Import ${csvData.length} Merchant(s)`}
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-2 font-medium">#</th>
                    <th className="text-left p-2 font-medium">Name</th>
                    <th className="text-left p-2 font-medium">Description</th>
                    <th className="text-left p-2 font-medium">Logo</th>
                    <th className="text-left p-2 font-medium">Categories</th>
                    <th className="text-left p-2 font-medium">Website</th>
                    <th className="text-left p-2 font-medium">Lightning</th>
                    <th className="text-left p-2 font-medium">On-chain</th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                      <td className="p-2 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 font-medium max-w-[150px] truncate">{row.name}</td>
                      <td className="p-2 max-w-[200px] truncate text-muted-foreground">{row.description}</td>
                      <td className="p-2">
                        {row.logo && (
                          <div className="flex items-center gap-1">
                            <img src={row.logo} alt="" className="h-5 w-5 object-contain rounded" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <code className="truncate max-w-[100px]">{row.logo}</code>
                          </div>
                        )}
                      </td>
                      <td className="p-2 max-w-[150px] truncate">{row.categories}</td>
                      <td className="p-2">
                        <a href={row.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[150px]">
                          {row.website}
                        </a>
                      </td>
                      <td className="p-2">
                        {parseBoolDisplay(row.lightningSupported || row.lightning_supported || row.lightning) ? (
                          <Badge variant="secondary" className="text-[9px]">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="p-2">
                        {parseBoolDisplay(row.onchainSupported || row.onchain_supported || row.onchain) ? (
                          <Badge variant="secondary" className="text-[9px]">Yes</Badge>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 50 && (
                <p className="text-xs text-muted-foreground p-2">Showing first 50 of {csvData.length} rows</p>
              )}
            </div>
          </Card>
        )}

        {importResult && (
          <Card className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              {importResult.success > 0 ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              <CardTitle className="text-lg">
                Import Results
              </CardTitle>
            </div>
            {importResult.success > 0 && (
              <p className="text-green-500 text-sm">{importResult.success} merchant(s) imported successfully!</p>
            )}
            {importResult.errors.length > 0 && (
              <div className="space-y-1">
                <p className="text-red-400 text-sm">{importResult.errors.length} error(s):</p>
                {importResult.errors.map((err, i) => (
                  <p key={i} className="text-xs text-red-400 bg-red-500/10 rounded p-2">
                    Row {err.row}: {err.message}
                  </p>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}

function parseBoolDisplay(value: string | undefined): boolean {
  if (!value) return false;
  return ["true", "yes", "1", "y"].includes(value.toLowerCase().trim());
}
