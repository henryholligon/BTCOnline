import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet, Image, Check, AlertCircle, ArrowLeft, Trash2, Plus, Zap, Store, Pencil, Search, X, Tag, RefreshCw, Link2 } from "lucide-react";
import BitcoinLogo from "@/components/bitcoin-logo";
import Papa from "papaparse";
import { Link } from "wouter";
import { CATEGORIES, COUNTRIES, PAYMENT_PROVIDERS, BADGE_STYLES, type Merchant, type BadgePreset, type DirectoryOption } from "@shared/schema";
import { useCategoryEmojis } from "@/hooks/use-category-emojis";

interface ParsedMerchant {
  name: string; description: string; logo: string; categories: string;
  shippingCountries: string; website: string; lightningSupported: string;
  onchainSupported: string; paymentProvider: string; countryMadeIn: string;
  countryShippedFrom: string; lastSurveyed: string; bitcoinDiscount: string;
  [key: string]: string;
}
interface ImportResult { success: number; errors: Array<{ row: number; message: string }>; }
interface UploadedLogo { originalName: string; savedAs: string; path: string; }
interface MerchantForm {
  name: string; website: string; description: string; logo: string;
  lightningSupported: boolean; onchainSupported: boolean; cashuSupported: boolean; liquidSupported: boolean; paymentProvider: string;
  categories: string[]; shippingCountries: string[];
  countryMadeIn: string; countryShippedFrom: string; lastSurveyed: string; bitcoinDiscount: string;
}

const emptyForm: MerchantForm = {
  name: "", website: "", description: "", logo: "",
  lightningSupported: false, onchainSupported: false, cashuSupported: false, liquidSupported: false, paymentProvider: "",
  categories: [], shippingCountries: [],
  countryMadeIn: "", countryShippedFrom: "", lastSurveyed: "", bitcoinDiscount: "",
};

// Map legacy/plain stored values to the current emoji-prefixed COUNTRIES format
const COUNTRY_ALIASES: Record<string, string> = {
  "worldwide": "🌍 Worldwide",
  "united states": "🇺🇸 USA",
  "usa": "🇺🇸 USA",
  "us": "🇺🇸 USA",
  "europe": "🇪🇺 Europe",
  "eu": "🇪🇺 Europe",
  "canada": "🇨🇦 Canada",
  "united kingdom": "🇬🇧 UK",
  "uk": "🇬🇧 UK",
  "gb": "🇬🇧 UK",
  "great britain": "🇬🇧 UK",
  "australia": "🇦🇺 Australia",
  "el salvador": "🇸🇻 El Salvador",
  "sweden": "🇸🇪 Sweden",
  "netherlands": "🇳🇱 Netherlands",
  "norway": "🇳🇴 Norway",
  "italy": "🇮🇹 Italy",
  "croatia": "🇭🇷 Croatia",
  "lithuania": "🇱🇹 Lithuania",
  "austria": "🇦🇹 Austria",
  "germany": "🇩🇪 Germany",
  "ireland": "🇮🇪 Ireland",
  "singapore": "🇸🇬 Singapore",
  "south africa": "🇿🇦 South Africa",
};

function normalizeCountry(value: string): string {
  if (!value) return value;
  return COUNTRY_ALIASES[value.toLowerCase()] ?? value;
}

function merchantToForm(m: Merchant): MerchantForm {
  return {
    name: m.name, website: m.website, description: m.description, logo: m.logo,
    lightningSupported: m.lightningSupported, onchainSupported: m.onchainSupported, cashuSupported: m.cashuSupported, liquidSupported: m.liquidSupported,
    paymentProvider: m.paymentProvider || "", categories: m.categories,
    shippingCountries: m.shippingCountries.map(normalizeCountry),
    countryMadeIn: normalizeCountry(m.countryMadeIn || ""),
    countryShippedFrom: normalizeCountry(m.countryShippedFrom || ""),
    lastSurveyed: m.lastSurveyed || "",
    bitcoinDiscount: m.bitcoinDiscount || "",
  };
}

export default function Admin() {
  const [activeTab, setActiveTab] = useState("add");

  // ── Add form ──
  const [form, setForm] = useState<MerchantForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");

  // ── Edit ──
  const [allMerchants, setAllMerchants] = useState<Merchant[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [editSearch, setEditSearch] = useState("");
  const [editingMerchant, setEditingMerchant] = useState<Merchant | null>(null);
  const [editForm, setEditForm] = useState<MerchantForm>(emptyForm);
  const [editLogoPreview, setEditLogoPreview] = useState("");
  const [editLogoUploading, setEditLogoUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editResult, setEditResult] = useState<{ success: boolean; message: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Badge presets ──
  const [badgePresets, setBadgePresets] = useState<BadgePreset[]>([]);
  const [newBadgeLabel, setNewBadgeLabel] = useState("");
  const [newBadgeStyle, setNewBadgeStyle] = useState<string>("green");
  const [badgeSaving, setBadgeSaving] = useState(false);

  // ── Directory options (custom countries/categories/providers) ──
  const [directoryOpts, setDirectoryOpts] = useState<DirectoryOption[]>([]);
  const [newCountryEmoji, setNewCountryEmoji] = useState("");
  const [newCountryName, setNewCountryName] = useState("");
  const [newCategoryEmoji, setNewCategoryEmoji] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newProviderName, setNewProviderName] = useState("");
  const [optsSaving, setOptsSaving] = useState<string | null>(null);

  // ── Sheet sync ──
  const [syncUrl, setSyncUrl] = useState("");
  const [emojiUrl, setEmojiUrl] = useState("");
  const [countryEmojiUrl, setCountryEmojiUrl] = useState("");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ lastSyncAt: string | null; lastSyncStatus: string | null; lastSyncCount: number | null } | null>(null);
  const [syncSaving, setSyncSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchSyncConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/sheet-sync");
      const data = await res.json();
      setSyncUrl(data.csvUrl || "");
      setEmojiUrl(data.emojiCsvUrl || "");
      setCountryEmojiUrl(data.countryEmojiCsvUrl || "");
      setSyncEnabled(data.enabled || false);
      setSyncStatus({ lastSyncAt: data.lastSyncAt, lastSyncStatus: data.lastSyncStatus, lastSyncCount: data.lastSyncCount });
    } catch {}
  }, []);

  useEffect(() => { if (activeTab === "sync") fetchSyncConfig(); }, [activeTab, fetchSyncConfig]);

  const handleSaveSync = async () => {
    setSyncSaving(true); setSyncResult(null);
    try {
      await fetch("/api/sheet-sync", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csvUrl: syncUrl, emojiCsvUrl: emojiUrl, countryEmojiCsvUrl: countryEmojiUrl, enabled: syncEnabled }) });
      setSyncResult({ success: true, message: "Settings saved." });
    } catch { setSyncResult({ success: false, message: "Failed to save." }); }
    finally { setSyncSaving(false); }
  };

  const handleManualSync = async () => {
    setSyncing(true); setSyncResult(null);
    try {
      const res = await fetch("/api/sheet-sync/trigger", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setSyncResult({ success: true, message: `Sync complete — ${data.count} merchants updated${data.errors > 0 ? `, ${data.errors} errors` : ""}.` });
        await fetchSyncConfig();
      } else {
        setSyncResult({ success: false, message: data.message || "Sync failed." });
      }
    } catch { setSyncResult({ success: false, message: "Sync request failed." }); }
    finally { setSyncing(false); }
  };

  // ── Bulk import ──
  const [csvData, setCsvData] = useState<ParsedMerchant[]>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [uploadedLogos, setUploadedLogos] = useState<UploadedLogo[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [uploadingLogos, setUploadingLogos] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverCsv, setDragOverCsv] = useState(false);
  const [replaceAll, setReplaceAll] = useState(true);

  const fetchMerchants = useCallback(async () => {
    setMerchantsLoading(true);
    try {
      const res = await fetch(`/api/merchants?_=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setAllMerchants(data);
    } catch { console.error("Failed to fetch merchants"); }
    finally { setMerchantsLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "edit") fetchMerchants();
  }, [activeTab, fetchMerchants]);

  const fetchBadgePresets = useCallback(async () => {
    try {
      const res = await fetch("/api/badge-presets");
      const data = await res.json();
      setBadgePresets(data);
    } catch { console.error("Failed to fetch badge presets"); }
  }, []);

  useEffect(() => { fetchBadgePresets(); }, [fetchBadgePresets]);

  const handleCreateBadge = async () => {
    if (!newBadgeLabel.trim()) return;
    setBadgeSaving(true);
    try {
      await fetch("/api/badge-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newBadgeLabel.trim(), style: newBadgeStyle }),
      });
      setNewBadgeLabel("");
      setNewBadgeStyle("green");
      await fetchBadgePresets();
    } catch { console.error("Failed to create badge"); }
    finally { setBadgeSaving(false); }
  };

  const handleDeleteBadge = async (id: number) => {
    try {
      await fetch(`/api/badge-presets/${id}`, { method: "DELETE" });
      await fetchBadgePresets();
    } catch { console.error("Failed to delete badge"); }
  };

  const fetchDirectoryOpts = useCallback(async () => {
    try {
      const res = await fetch("/api/directory-options");
      setDirectoryOpts(await res.json());
    } catch { console.error("Failed to fetch directory options"); }
  }, []);

  useEffect(() => { fetchDirectoryOpts(); }, [fetchDirectoryOpts]);

  const addDirectoryOption = async (type: string, label: string, emoji?: string) => {
    if (!label.trim()) return;
    setOptsSaving(type);
    try {
      await fetch("/api/directory-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label: label.trim(), emoji: emoji?.trim() || null }),
      });
      await fetchDirectoryOpts();
    } catch { console.error("Failed to add option"); }
    finally { setOptsSaving(null); }
  };

  const deleteDirectoryOption = async (id: number) => {
    try {
      await fetch(`/api/directory-options/${id}`, { method: "DELETE" });
      await fetchDirectoryOpts();
    } catch { console.error("Failed to delete option"); }
  };

  const customCountries = directoryOpts.filter(o => o.type === "country").map(o => o.emoji ? `${o.emoji} ${o.label}` : o.label);
  const customCategories = directoryOpts.filter(o => o.type === "category").map(o => o.emoji ? `${o.emoji} ${o.label}` : o.label);
  const customProviders = directoryOpts.filter(o => o.type === "provider").map(o => o.label);

  // ── Add form helpers ──
  const setField = <K extends keyof MerchantForm>(key: K, value: MerchantForm[K]) => {
    setForm(f => ({ ...f, [key]: value })); setSubmitResult(null);
  };
  const toggleItem = (key: "categories" | "shippingCountries", item: string) => {
    setForm(f => ({ ...f, [key]: f[key].includes(item) ? f[key].filter(x => x !== item) : [...f[key], item] }));
    setSubmitResult(null);
  };

  // ── Edit form helpers ──
  const setEditField = <K extends keyof MerchantForm>(key: K, value: MerchantForm[K]) => {
    setEditForm(f => ({ ...f, [key]: value })); setEditResult(null); setConfirmDelete(false);
  };
  const toggleEditItem = (key: "categories" | "shippingCountries", item: string) => {
    setEditForm(f => ({ ...f, [key]: f[key].includes(item) ? f[key].filter(x => x !== item) : [...f[key], item] }));
    setEditResult(null);
  };

  const selectMerchantForEdit = (m: Merchant) => {
    setEditingMerchant(m);
    setEditForm(merchantToForm(m));
    setEditLogoPreview(m.logo.startsWith("http") || m.logo.startsWith("/") ? m.logo : "");
    setEditResult(null);
    setConfirmDelete(false);
  };

  const handleLogoFileUpload = useCallback(async (file: File, mode: "add" | "edit") => {
    if (mode === "add") setLogoUploading(true); else setEditLogoUploading(true);
    const formData = new FormData();
    formData.append("logos", file);
    try {
      const res = await fetch("/api/upload-logos", { method: "POST", body: formData });
      const data = await res.json();
      if (data.uploaded?.[0]) {
        const url = data.uploaded[0].path;
        if (mode === "add") { setField("logo", url); setLogoPreview(url); }
        else { setEditField("logo", url); setEditLogoPreview(url); }
      }
    } catch { console.error("Logo upload failed"); }
    finally { if (mode === "add") setLogoUploading(false); else setEditLogoUploading(false); }
  }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.website.trim() || !form.description.trim()) {
      setSubmitResult({ success: false, message: "Name, website, and description are required." }); return;
    }
    setSubmitting(true); setSubmitResult(null);
    try {
      const payload = { ...form, logo: form.logo || "🏪", lastSurveyed: form.lastSurveyed || null, paymentProvider: form.paymentProvider || null, countryMadeIn: form.countryMadeIn || null, countryShippedFrom: form.countryShippedFrom || null, bitcoinDiscount: form.bitcoinDiscount || null };
      const res = await fetch("/api/merchants", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        setSubmitResult({ success: true, message: `"${form.name}" has been added to the directory!` });
        setForm(emptyForm); setLogoPreview("");
      } else {
        const err = await res.json();
        setSubmitResult({ success: false, message: err.message || "Failed to add merchant." });
      }
    } catch { setSubmitResult({ success: false, message: "Request failed. Please try again." }); }
    finally { setSubmitting(false); }
  };

  const handleUpdate = async () => {
    if (!editingMerchant) return;
    if (!editForm.name.trim() || !editForm.website.trim() || !editForm.description.trim()) {
      setEditResult({ success: false, message: "Name, website, and description are required." }); return;
    }
    setSaving(true); setEditResult(null);
    try {
      const payload = { ...editForm, logo: editForm.logo || "🏪", lastSurveyed: editForm.lastSurveyed || null, paymentProvider: editForm.paymentProvider || null, countryMadeIn: editForm.countryMadeIn || null, countryShippedFrom: editForm.countryShippedFrom || null, bitcoinDiscount: editForm.bitcoinDiscount || null };
      const res = await fetch(`/api/merchants/${editingMerchant.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        const updated = await res.json();
        setEditingMerchant(updated);
        setEditResult({ success: true, message: `"${editForm.name}" updated successfully!` });
        await fetchMerchants();
      } else {
        const err = await res.json();
        setEditResult({ success: false, message: err.message || "Failed to update merchant." });
      }
    } catch { setEditResult({ success: false, message: "Request failed. Please try again." }); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!editingMerchant) return;
    setDeleting(true); setEditResult(null);
    try {
      await fetch(`/api/merchants/${editingMerchant.id}`, { method: "DELETE" });
      setEditResult({ success: true, message: `"${editingMerchant.name}" deleted.` });
      setEditingMerchant(null);
      setEditForm(emptyForm);
      setEditLogoPreview("");
      setConfirmDelete(false);
      await fetchMerchants();
    } catch { setEditResult({ success: false, message: "Delete failed. Please try again." }); }
    finally { setDeleting(false); }
  };

  const handleCsvUpload = useCallback((file: File) => {
    setCsvFileName(file.name); setImportResult(null);
    Papa.parse(file, { header: true, skipEmptyLines: "greedy", transformHeader: (h: string) => h.trim(), complete: (results) => { setCsvData((results.data as ParsedMerchant[]).filter(r => r.name?.trim())); }, error: () => setCsvData([]) });
  }, []);

  const handleLogoUpload = useCallback(async (files: FileList | File[]) => {
    setUploadingLogos(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append("logos", f));
    try { const res = await fetch("/api/upload-logos", { method: "POST", body: formData }); const data = await res.json(); if (data.uploaded) setUploadedLogos(prev => [...prev, ...data.uploaded]); }
    catch { console.error("Logo upload failed"); }
    finally { setUploadingLogos(false); }
  }, []);

  const handleImport = async () => {
    setImporting(true); setImportResult(null);
    try {
      const res = await fetch("/api/merchants/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ merchants: csvData, replaceAll }) });
      const result = await res.json();
      setImportResult(result);
      if (result.success > 0) { setCsvData([]); setCsvFileName(""); }
    } catch { setImportResult({ success: 0, errors: [{ row: 0, message: "Import request failed" }] }); }
    finally { setImporting(false); }
  };

  const handleDrop = useCallback((e: React.DragEvent, type: "logo" | "csv") => {
    e.preventDefault(); setDragOver(false); setDragOverCsv(false);
    const files = e.dataTransfer.files;
    if (type === "csv" && files.length === 1) handleCsvUpload(files[0]);
    else if (type === "logo") handleLogoUpload(files);
  }, [handleCsvUpload, handleLogoUpload]);

  const filteredMerchants = allMerchants.filter(m => m.name.toLowerCase().includes(editSearch.toLowerCase()));

  const shippingText = (f: MerchantForm) => f.shippingCountries.length > 0
    ? f.shippingCountries.some(c => c.toLowerCase().includes("worldwide")) ? "🌍 Worldwide" : f.shippingCountries.slice(0, 2).join(", ")
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/"><Button variant="ghost" size="sm" data-testid="link-back-home"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Directory</Button></Link>
          <div><h1 className="text-2xl font-bold">Admin</h1><p className="text-muted-foreground text-sm">Manage merchant listings</p></div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-2xl grid-cols-6">
            <TabsTrigger value="add" data-testid="tab-add-merchant"><Plus className="h-3.5 w-3.5 mr-1" />Add</TabsTrigger>
            <TabsTrigger value="edit" data-testid="tab-edit-merchant"><Pencil className="h-3.5 w-3.5 mr-1" />Edit</TabsTrigger>
            <TabsTrigger value="import" data-testid="tab-bulk-import"><FileSpreadsheet className="h-3.5 w-3.5 mr-1" />Import</TabsTrigger>
            <TabsTrigger value="badges" data-testid="tab-badges"><Tag className="h-3.5 w-3.5 mr-1" />Badges</TabsTrigger>
            <TabsTrigger value="lists" data-testid="tab-lists"><Plus className="h-3.5 w-3.5 mr-1" />Lists</TabsTrigger>
            <TabsTrigger value="sync" data-testid="tab-sync"><RefreshCw className="h-3.5 w-3.5 mr-1" />Sync</TabsTrigger>
          </TabsList>

          {/* ───── ADD TAB ───── */}
          <TabsContent value="add" className="mt-6">
            <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
              <div className="space-y-4">
                <MerchantFormFields
                  form={form} setField={setField} toggleItem={toggleItem}
                  logoPreview={logoPreview} setLogoPreview={setLogoPreview}
                  logoUploading={logoUploading}
                  onLogoFileUpload={f => handleLogoFileUpload(f, "add")}
                  badgePresets={badgePresets}
                  customCategories={customCategories}
                  customCountries={customCountries}
                  customProviders={customProviders}
                />
                {submitResult && <ResultBanner result={submitResult} />}
                <Button className="w-full" size="lg" onClick={handleSubmit} disabled={submitting} data-testid="button-add-merchant">
                  {submitting ? "Adding merchant..." : <><Plus className="h-4 w-4 mr-2" />Add Merchant to Directory</>}
                </Button>
              </div>
              <LivePreview form={form} logoPreview={logoPreview} shippingText={shippingText(form)} />
            </div>
          </TabsContent>

          {/* ───── EDIT TAB ───── */}
          <TabsContent value="edit" className="mt-6">
            <div className="grid lg:grid-cols-[280px_1fr] gap-6 items-start">
              {/* Merchant list */}
              <div className="space-y-3 lg:sticky lg:top-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search merchants…" value={editSearch} onChange={e => setEditSearch(e.target.value)} className="pl-9" data-testid="input-edit-search" />
                  {editSearch && <button onClick={() => setEditSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>}
                </div>
                <div className="rounded-xl border border-border overflow-hidden">
                  {merchantsLoading ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
                  ) : filteredMerchants.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">No merchants found</div>
                  ) : (
                    <div className="max-h-[600px] overflow-y-auto divide-y divide-border">
                      {filteredMerchants.map(m => (
                        <button
                          key={m.id}
                          onClick={() => selectMerchantForEdit(m)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors ${editingMerchant?.id === m.id ? "bg-primary/10 border-l-2 border-primary" : ""}`}
                          data-testid={`edit-merchant-${m.id}`}
                        >
                          <div className="h-8 w-8 shrink-0 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden">
                            {(m.logo.startsWith("/") || m.logo.startsWith("http"))
                              ? <img src={m.logo} alt={m.name} className="w-full h-full object-contain" />
                              : <span className="text-sm">{m.logo}</span>}
                          </div>
                          <span className="text-sm truncate font-medium">{m.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">{filteredMerchants.length} of {allMerchants.length} merchants</p>
              </div>

              {/* Edit form */}
              {editingMerchant ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-lg">Editing: <span className="text-primary">{editingMerchant.name}</span></h2>
                    <button onClick={() => { setEditingMerchant(null); setEditForm(emptyForm); setEditResult(null); }} className="text-muted-foreground hover:text-foreground">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <MerchantFormFields
                    form={editForm} setField={setEditField} toggleItem={toggleEditItem}
                    logoPreview={editLogoPreview} setLogoPreview={setEditLogoPreview}
                    logoUploading={editLogoUploading}
                    onLogoFileUpload={f => handleLogoFileUpload(f, "edit")}
                    badgePresets={badgePresets}
                    customCategories={customCategories}
                    customCountries={customCountries}
                    customProviders={customProviders}
                  />

                  {editResult && <ResultBanner result={editResult} />}

                  <div className="flex gap-3">
                    <Button className="flex-1" size="lg" onClick={handleUpdate} disabled={saving} data-testid="button-save-merchant">
                      {saving ? "Saving…" : <><Check className="h-4 w-4 mr-2" />Save Changes</>}
                    </Button>
                    {!confirmDelete ? (
                      <Button variant="outline" size="lg" className="text-red-500 border-red-500/30 hover:bg-red-500/10" onClick={() => setConfirmDelete(true)} data-testid="button-delete-merchant-confirm">
                        <Trash2 className="h-4 w-4 mr-2" />Delete
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="destructive" size="lg" onClick={handleDelete} disabled={deleting} data-testid="button-delete-merchant">
                          {deleting ? "Deleting…" : "Confirm Delete"}
                        </Button>
                        <Button variant="ghost" size="lg" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground space-y-2 rounded-xl border border-dashed border-border">
                  <Pencil className="h-8 w-8 opacity-30" />
                  <p className="text-sm">Select a merchant from the list to edit it</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ───── BULK IMPORT TAB ───── */}
          <TabsContent value="import" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2"><Image className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Step 1: Upload Logos</CardTitle></div>
                <CardDescription>Upload logos first — use the returned URLs in your CSV.</CardDescription>
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={e => handleDrop(e, "logo")}
                  onClick={() => { const i = document.createElement("input"); i.type = "file"; i.multiple = true; i.accept = ".png,.jpg,.jpeg,.webp,.svg"; i.onchange = e => { const f = (e.target as HTMLInputElement).files; if (f) handleLogoUpload(f); }; i.click(); }}
                  data-testid="dropzone-logos">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{uploadingLogos ? "Uploading…" : "Drag & drop logo images here, or click to browse"}</p>
                  <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP, SVG — up to 5MB each</p>
                </div>
                {uploadedLogos.length > 0 && (
                  <div className="space-y-2"><p className="text-sm font-medium">{uploadedLogos.length} logo(s) uploaded:</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {uploadedLogos.map((logo, i) => (<div key={i} className="flex items-center gap-2 text-xs bg-muted/50 rounded p-2"><img src={logo.path} alt={logo.savedAs} className="h-6 w-6 object-contain rounded" /><code className="flex-1 truncate">{logo.path}</code><Check className="h-3 w-3 text-green-500 shrink-0" /></div>))}
                    </div>
                  </div>
                )}
              </Card>
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Step 2: Upload CSV</CardTitle></div>
                <CardDescription>Required: <code className="text-xs bg-muted px-1 rounded">name</code>, <code className="text-xs bg-muted px-1 rounded">description</code>, <code className="text-xs bg-muted px-1 rounded">website</code></CardDescription>
                <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOverCsv ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}`}
                  onDragOver={e => { e.preventDefault(); setDragOverCsv(true); }} onDragLeave={() => setDragOverCsv(false)} onDrop={e => handleDrop(e, "csv")}
                  onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = ".csv"; i.onchange = e => { const f = (e.target as HTMLInputElement).files; if (f?.[0]) handleCsvUpload(f[0]); }; i.click(); }}
                  data-testid="dropzone-csv">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{csvFileName || "Drag & drop CSV here, or click to browse"}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-2">
                  <p className="font-medium">CSV Column Reference:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
                    <span><strong className="text-foreground">name</strong> — Business name</span>
                    <span><strong className="text-foreground">description</strong> — Short blurb</span>
                    <span><strong className="text-foreground">logo</strong> — URL or /assets/…</span>
                    <span><strong className="text-foreground">website</strong> — Full URL</span>
                    <span><strong className="text-foreground">categories</strong> — Separated by ;</span>
                    <span><strong className="text-foreground">shippingCountries</strong> — By ;</span>
                    <span><strong className="text-foreground">lightning</strong> — true/false</span>
                    <span><strong className="text-foreground">onchain</strong> — true/false</span>
                    <span><strong className="text-foreground">paymentProvider</strong> — e.g. BTCPay</span>
                    <span><strong className="text-foreground">countryMadeIn</strong> — e.g. USA</span>
                    <span><strong className="text-foreground">lastSurveyed</strong> — YYYY-MM-DD</span>
                    <span><strong className="text-foreground">bitcoinDiscount</strong> — e.g. 10% off</span>
                  </div>
                </div>
              </Card>
            </div>
            {csvData.length > 0 && (
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <CardTitle className="text-lg">Preview — {csvData.length} merchant(s)</CardTitle>
                  <div className="flex items-center gap-4 flex-wrap">
                    <label className="flex items-center gap-2 text-sm cursor-pointer" data-testid="checkbox-replace-all">
                      <input type="checkbox" checked={replaceAll} onChange={e => setReplaceAll(e.target.checked)} className="rounded border-border" />Replace all existing merchants
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => { setCsvData([]); setCsvFileName(""); }} data-testid="button-clear-csv"><Trash2 className="h-4 w-4 mr-1" />Clear</Button>
                    <Button onClick={handleImport} disabled={importing} data-testid="button-import">{importing ? "Importing…" : `Import ${csvData.length} Merchant(s)`}</Button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead><tr className="border-b border-border">{["#","Name","Description","Logo","Categories","Website","Lightning","On-chain","Provider","Shipping","Discount"].map(h => <th key={h} className="text-left p-2 font-medium">{h}</th>)}</tr></thead>
                    <tbody>
                      {csvData.slice(0, 50).map((row, i) => (
                        <tr key={i} className="border-b border-border/30 hover:bg-muted/30">
                          <td className="p-2 text-muted-foreground">{i+1}</td>
                          <td className="p-2 font-medium max-w-[150px] truncate">{row.name}</td>
                          <td className="p-2 max-w-[200px] truncate text-muted-foreground">{row.description}</td>
                          <td className="p-2">{row.logo && <img src={row.logo} alt="" className="h-5 w-5 object-contain rounded" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />}</td>
                          <td className="p-2 max-w-[150px] truncate">{row.categories}</td>
                          <td className="p-2"><a href={row.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate block max-w-[150px]">{row.website}</a></td>
                          <td className="p-2">{parseBoolDisplay(row.lightningSupported||row.lightning_supported||row.lightning) ? <Badge variant="secondary" className="text-[9px]">Yes</Badge> : <span className="text-muted-foreground">No</span>}</td>
                          <td className="p-2">{parseBoolDisplay(row.onchainSupported||row.onchain_supported||row.onchain) ? <Badge variant="secondary" className="text-[9px]">Yes</Badge> : <span className="text-muted-foreground">No</span>}</td>
                          <td className="p-2 max-w-[120px] truncate text-muted-foreground">{row.paymentProvider||row.payment_provider||"—"}</td>
                          <td className="p-2 max-w-[120px] truncate text-muted-foreground">{row.shippingCountries||row.shipping_countries||"—"}</td>
                          <td className="p-2 max-w-[120px] truncate text-muted-foreground">{row.bitcoinDiscount||row.bitcoin_discount||"—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {csvData.length > 50 && <p className="text-xs text-muted-foreground p-2">Showing first 50 of {csvData.length} rows</p>}
                </div>
              </Card>
            )}
            {importResult && (
              <Card className="p-6 space-y-3">
                <div className="flex items-center gap-2">{importResult.success > 0 ? <Check className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-red-500" />}<CardTitle className="text-lg">Import Results</CardTitle></div>
                {importResult.success > 0 && <p className="text-green-500 text-sm">{importResult.success} merchant(s) imported successfully!</p>}
                {importResult.errors.length > 0 && <div className="space-y-1"><p className="text-red-400 text-sm">{importResult.errors.length} error(s):</p>{importResult.errors.map((err, i) => <p key={i} className="text-xs text-red-400 bg-red-500/10 rounded p-2">Row {err.row}: {err.message}</p>)}</div>}
              </Card>
            )}
          </TabsContent>

          {/* ───── LISTS TAB ───── */}
          <TabsContent value="lists" className="mt-6 space-y-6">
            <p className="text-sm text-muted-foreground">Add new countries, categories, and payment providers that will appear in the merchant form dropdowns.</p>
            <div className="grid md:grid-cols-3 gap-6">

              {/* ── Countries ── */}
              <Card className="p-5 space-y-4">
                <CardTitle className="text-base flex items-center gap-2">🌍 Countries</CardTitle>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="🇫🇷" value={newCountryEmoji} onChange={e => setNewCountryEmoji(e.target.value)} className="w-16 shrink-0 text-center" data-testid="input-country-emoji" />
                    <Input placeholder="e.g. France" value={newCountryName} onChange={e => setNewCountryName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCountryName.trim()) { addDirectoryOption("country", newCountryName, newCountryEmoji); setNewCountryEmoji(""); setNewCountryName(""); }}} data-testid="input-country-name" />
                  </div>
                  <Button size="sm" className="w-full" disabled={!newCountryName.trim() || optsSaving === "country"} onClick={() => { addDirectoryOption("country", newCountryName, newCountryEmoji); setNewCountryEmoji(""); setNewCountryName(""); }} data-testid="button-add-country">
                    {optsSaving === "country" ? "Adding…" : <><Plus className="h-3.5 w-3.5 mr-1" />Add Country</>}
                  </Button>
                </div>
                <div className="space-y-1">
                  {directoryOpts.filter(o => o.type === "country").length === 0
                    ? <p className="text-xs text-muted-foreground text-center py-4">No custom countries yet</p>
                    : directoryOpts.filter(o => o.type === "country").map(o => (
                      <div key={o.id} className="flex items-center justify-between gap-2 text-sm py-1 px-2 rounded hover:bg-muted/40">
                        <span>{o.emoji} {o.label}</span>
                        <button onClick={() => deleteDirectoryOption(o.id)} className="text-muted-foreground hover:text-red-500 shrink-0" data-testid={`delete-country-${o.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))
                  }
                </div>
              </Card>

              {/* ── Categories ── */}
              <Card className="p-5 space-y-4">
                <CardTitle className="text-base flex items-center gap-2">🏷️ Categories</CardTitle>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input placeholder="🎭" value={newCategoryEmoji} onChange={e => setNewCategoryEmoji(e.target.value)} className="w-16 shrink-0 text-center" data-testid="input-category-emoji" />
                    <Input placeholder="e.g. Theater" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newCategoryName.trim()) { addDirectoryOption("category", newCategoryName, newCategoryEmoji); setNewCategoryEmoji(""); setNewCategoryName(""); }}} data-testid="input-category-name" />
                  </div>
                  <Button size="sm" className="w-full" disabled={!newCategoryName.trim() || optsSaving === "category"} onClick={() => { addDirectoryOption("category", newCategoryName, newCategoryEmoji); setNewCategoryEmoji(""); setNewCategoryName(""); }} data-testid="button-add-category">
                    {optsSaving === "category" ? "Adding…" : <><Plus className="h-3.5 w-3.5 mr-1" />Add Category</>}
                  </Button>
                </div>
                <div className="space-y-1">
                  {directoryOpts.filter(o => o.type === "category").length === 0
                    ? <p className="text-xs text-muted-foreground text-center py-4">No custom categories yet</p>
                    : directoryOpts.filter(o => o.type === "category").map(o => (
                      <div key={o.id} className="flex items-center justify-between gap-2 text-sm py-1 px-2 rounded hover:bg-muted/40">
                        <span>{o.emoji} {o.label}</span>
                        <button onClick={() => deleteDirectoryOption(o.id)} className="text-muted-foreground hover:text-red-500 shrink-0" data-testid={`delete-category-${o.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))
                  }
                </div>
              </Card>

              {/* ── Providers ── */}
              <Card className="p-5 space-y-4">
                <CardTitle className="text-base flex items-center gap-2">⚡ Providers</CardTitle>
                <div className="space-y-2">
                  <Input placeholder="e.g. LNbits" value={newProviderName} onChange={e => setNewProviderName(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && newProviderName.trim()) { addDirectoryOption("provider", newProviderName); setNewProviderName(""); }}} data-testid="input-provider-name" />
                  <Button size="sm" className="w-full" disabled={!newProviderName.trim() || optsSaving === "provider"} onClick={() => { addDirectoryOption("provider", newProviderName); setNewProviderName(""); }} data-testid="button-add-provider">
                    {optsSaving === "provider" ? "Adding…" : <><Plus className="h-3.5 w-3.5 mr-1" />Add Provider</>}
                  </Button>
                </div>
                <div className="space-y-1">
                  {directoryOpts.filter(o => o.type === "provider").length === 0
                    ? <p className="text-xs text-muted-foreground text-center py-4">No custom providers yet</p>
                    : directoryOpts.filter(o => o.type === "provider").map(o => (
                      <div key={o.id} className="flex items-center justify-between gap-2 text-sm py-1 px-2 rounded hover:bg-muted/40">
                        <span>{o.label}</span>
                        <button onClick={() => deleteDirectoryOption(o.id)} className="text-muted-foreground hover:text-red-500 shrink-0" data-testid={`delete-provider-${o.id}`}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    ))
                  }
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* ───── BADGES TAB ───── */}
          <TabsContent value="badges" className="mt-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6 items-start">
              {/* Create badge */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Create Badge</CardTitle></div>
                <CardDescription>Define a badge preset that appears as a quick-select when adding or editing a merchant.</CardDescription>
                <Field label="Badge Label" required>
                  <Input
                    placeholder='e.g. 10% off, SALE, HOT'
                    value={newBadgeLabel}
                    onChange={e => setNewBadgeLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleCreateBadge(); }}
                    data-testid="input-badge-label"
                  />
                </Field>
                <Field label="Style">
                  <div className="flex flex-wrap gap-2">
                    {BADGE_STYLES.map(s => {
                      const isRainbow = s === "rainbow";
                      const styleClasses: Record<string, string> = {
                        green: "bg-green-500 text-white", gold: "bg-yellow-500 text-black",
                        red: "bg-red-500 text-white", orange: "bg-orange-500 text-white",
                        blue: "bg-blue-500 text-white", purple: "bg-purple-500 text-white",
                      };
                      return (
                        <button
                          key={s} type="button"
                          onClick={() => setNewBadgeStyle(s)}
                          className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wide border-2 transition-all ${newBadgeStyle === s ? "border-foreground scale-110" : "border-transparent"} ${isRainbow ? "" : styleClasses[s]}`}
                          style={isRainbow ? { background: "linear-gradient(90deg,#ff0000,#ff8800,#00ff00,#0088ff,#8800ff,#ff0088)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } : {}}
                          data-testid={`badge-style-${s}`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                {newBadgeLabel.trim() && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Preview:</p>
                    <div className="flex items-center gap-2">
                      {newBadgeStyle === "rainbow"
                        ? <span className="text-[11px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide" style={{ background: "linear-gradient(90deg,#ff0000,#ff8800,#00ff00,#0088ff,#8800ff,#ff0088,#ff0000)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>{newBadgeLabel}</span>
                        : <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${{ green: "bg-green-500 text-white", gold: "bg-yellow-500 text-black", red: "bg-red-500 text-white", orange: "bg-orange-500 text-white", blue: "bg-blue-500 text-white", purple: "bg-purple-500 text-white" }[newBadgeStyle] || "bg-green-500 text-white"}`}>{newBadgeLabel}</span>
                      }
                    </div>
                  </div>
                )}
                <Button onClick={handleCreateBadge} disabled={badgeSaving || !newBadgeLabel.trim()} className="w-full" data-testid="button-create-badge">
                  {badgeSaving ? "Saving…" : <><Plus className="h-4 w-4 mr-2" />Create Badge</>}
                </Button>
              </Card>

              {/* Badge list */}
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /><CardTitle className="text-lg">Badge Presets</CardTitle></div>
                  <span className="text-xs text-muted-foreground">{badgePresets.length} badge{badgePresets.length !== 1 ? "s" : ""}</span>
                </div>
                {badgePresets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2 rounded-xl border border-dashed border-border">
                    <Tag className="h-8 w-8 opacity-30" />
                    <p className="text-sm">No badge presets yet</p>
                    <p className="text-xs">Create a badge to get started</p>
                  </div>
                ) : (
                  <div className="flex flex-col divide-y divide-border rounded-xl border border-border overflow-hidden">
                    {badgePresets.map(preset => {
                      const styleClasses: Record<string, string> = {
                        green: "bg-green-500 text-white", gold: "bg-yellow-500 text-black",
                        red: "bg-red-500 text-white", orange: "bg-orange-500 text-white",
                        blue: "bg-blue-500 text-white", purple: "bg-purple-500 text-white",
                      };
                      return (
                        <div key={preset.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                          {preset.style === "rainbow"
                            ? <span className="text-[11px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide" style={{ background: "linear-gradient(90deg,#ff0000,#ff8800,#00ff00,#0088ff,#8800ff,#ff0088,#ff0000)", backgroundSize:"200% 100%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>{preset.label}</span>
                            : <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide ${styleClasses[preset.style] || "bg-green-500 text-white"}`}>{preset.label}</span>
                          }
                          <button onClick={() => handleDeleteBadge(preset.id)} className="text-muted-foreground hover:text-red-500 transition-colors shrink-0" data-testid={`delete-badge-${preset.id}`}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          {/* ───── SYNC TAB ───── */}
          <TabsContent value="sync" className="mt-6 space-y-6">
            <Card className="p-6 space-y-5">
              <div className="flex items-center gap-2">
                <Link2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Google Sheet Auto-Sync</CardTitle>
              </div>
              <CardDescription>
                Paste your Google Sheet's public CSV link. The site will automatically sync every 5 minutes — any changes you make in the sheet appear on the site without lifting a finger.
              </CardDescription>

              <div className="rounded-lg bg-muted/40 border border-border p-4 space-y-2 text-sm">
                <p className="font-medium">How to get your CSV link:</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Open your Google Sheet</li>
                  <li>Go to <strong>File → Share → Publish to web</strong></li>
                  <li>Select your sheet, choose <strong>CSV</strong> format</li>
                  <li>Click <strong>Publish</strong> and copy the link</li>
                </ol>
              </div>

              <Field label="Google Sheet CSV URL">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
                  value={syncUrl}
                  onChange={e => { setSyncUrl(e.target.value); setSyncResult(null); }}
                  data-testid="input-sync-url"
                />
              </Field>

              <Field label="Category Emoji CSV URL" hint="Optional. A separate published tab with two columns — category name and emoji.">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?gid=...&output=csv"
                  value={emojiUrl}
                  onChange={e => { setEmojiUrl(e.target.value); setSyncResult(null); }}
                  data-testid="input-emoji-url"
                />
              </Field>

              <Field label="Country Emoji CSV URL" hint="Optional. A separate published tab with two columns — country name and flag emoji.">
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/.../pub?gid=...&output=csv"
                  value={countryEmojiUrl}
                  onChange={e => { setCountryEmojiUrl(e.target.value); setSyncResult(null); }}
                  data-testid="input-country-emoji-url"
                />
              </Field>

              <div className="flex items-center justify-between rounded-lg border border-border p-4">
                <div>
                  <p className="text-sm font-medium">Auto-sync every 5 minutes</p>
                  <p className="text-xs text-muted-foreground">Keeps the site in sync automatically while enabled</p>
                </div>
                <Switch
                  checked={syncEnabled}
                  onCheckedChange={v => { setSyncEnabled(v); setSyncResult(null); }}
                  data-testid="switch-sync-enabled"
                />
              </div>

              {syncStatus?.lastSyncAt && (
                <div className={`rounded-lg border p-3 text-xs space-y-1 ${syncStatus.lastSyncStatus?.startsWith("error") ? "border-red-300 bg-red-50 dark:bg-red-950/20" : "border-green-300 bg-green-50 dark:bg-green-950/20"}`}>
                  <p className="font-medium">{syncStatus.lastSyncStatus?.startsWith("error") ? "⚠️ Last sync failed" : `✅ Last sync: ${syncStatus.lastSyncCount ?? 0} merchants updated`}</p>
                  <p className="text-muted-foreground">{new Date(syncStatus.lastSyncAt).toLocaleString()} · Status: {syncStatus.lastSyncStatus}</p>
                </div>
              )}

              {syncResult && <ResultBanner result={syncResult} />}

              <div className="flex gap-3">
                <Button onClick={handleSaveSync} disabled={syncSaving} data-testid="button-save-sync">
                  {syncSaving ? "Saving…" : "Save Settings"}
                </Button>
                <Button variant="outline" onClick={handleManualSync} disabled={syncing || !syncUrl.trim()} data-testid="button-manual-sync">
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  {syncing ? "Syncing…" : "Sync Now"}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// ── Shared form fields component ──
function MerchantFormFields({ form, setField, toggleItem, logoPreview, setLogoPreview, logoUploading, onLogoFileUpload, badgePresets, customCategories, customCountries, customProviders }: {
  form: MerchantForm;
  setField: <K extends keyof MerchantForm>(key: K, value: MerchantForm[K]) => void;
  toggleItem: (key: "categories" | "shippingCountries", item: string) => void;
  logoPreview: string;
  setLogoPreview: (v: string) => void;
  logoUploading: boolean;
  onLogoFileUpload: (file: File) => void;
  badgePresets?: BadgePreset[];
  customCategories?: string[];
  customCountries?: string[];
  customProviders?: string[];
}) {
  const { getCategoryWithEmoji } = useCategoryEmojis();
  const allCategories = [...CATEGORIES, ...(customCategories || [])];
  const allCountries = [...COUNTRIES, ...(customCountries || [])];
  const allProviders = [...PAYMENT_PROVIDERS, ...(customProviders || [])];
  return (
    <div className="space-y-4">
      <Card className="p-5 space-y-4">
        <SectionLabel>Basic Info</SectionLabel>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Business Name" required>
            <Input placeholder="e.g. Obscura VPN" value={form.name} onChange={e => setField("name", e.target.value)} data-testid="input-merchant-name" />
          </Field>
          <Field label="Website URL" required>
            <Input placeholder="https://example.com" value={form.website} onChange={e => setField("website", e.target.value)} data-testid="input-merchant-website" />
          </Field>
        </div>
        <Field label="Description" required>
          <textarea className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none" placeholder="A short description of what this merchant sells or offers..." value={form.description} onChange={e => setField("description", e.target.value)} data-testid="input-merchant-description" />
        </Field>
        <Field label="Bitcoin Discount Badge" hint={badgePresets && badgePresets.length > 0 ? "Click a preset or type your own badge text." : 'Type any badge text, e.g. "10% off". Create presets in the Badges tab.'}>
          <Input placeholder='e.g. 10% off with BTC  or  NEW' value={form.bitcoinDiscount} onChange={e => setField("bitcoinDiscount", e.target.value)} data-testid="input-bitcoin-discount" />
          {badgePresets && badgePresets.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {badgePresets.map(preset => {
                const active = form.bitcoinDiscount?.toLowerCase() === preset.label.toLowerCase();
                const styleClasses: Record<string, string> = {
                  green: "bg-green-500 text-white", gold: "bg-yellow-500 text-black",
                  red: "bg-red-500 text-white", orange: "bg-orange-500 text-white",
                  blue: "bg-blue-500 text-white", purple: "bg-purple-500 text-white",
                };
                return (
                  <button
                    key={preset.id} type="button"
                    onClick={() => setField("bitcoinDiscount", active ? "" : preset.label)}
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wide transition-all border-2 ${active ? "border-foreground scale-105" : "border-transparent opacity-80 hover:opacity-100"} ${preset.style === "rainbow" ? "" : styleClasses[preset.style] || "bg-green-500 text-white"}`}
                    style={preset.style === "rainbow" ? { background: "linear-gradient(90deg,#ff0000,#ff8800,#00ff00,#0088ff,#8800ff,#ff0088,#ff0000)", backgroundSize: "200% 100%", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" } : {}}
                    data-testid={`badge-chip-${preset.id}`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              {form.bitcoinDiscount && (
                <button type="button" onClick={() => setField("bitcoinDiscount", "")} className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5">✕ clear</button>
              )}
            </div>
          )}
        </Field>
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>Logo</SectionLabel>
        <div className="flex gap-4 items-start">
          <div className="h-20 w-20 shrink-0 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-muted/30 cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
            onClick={() => { const i = document.createElement("input"); i.type="file"; i.accept=".png,.jpg,.jpeg,.webp,.svg"; i.onchange=e=>{const f=(e.target as HTMLInputElement).files?.[0];if(f)onLogoFileUpload(f);}; i.click(); }}
            data-testid="dropzone-logo-single">
            {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" onError={() => setLogoPreview("")} />
              : logoUploading ? <span className="text-[10px] text-muted-foreground text-center px-1">Uploading…</span>
              : <div className="text-center"><Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" /><span className="text-[10px] text-muted-foreground">Click to upload</span></div>}
          </div>
          <div className="flex-1 space-y-2">
            <Field label="Or paste an image URL">
              <Input placeholder="https://example.com/logo.png" value={form.logo} onChange={e => { setField("logo", e.target.value); setLogoPreview(e.target.value); }} data-testid="input-logo-url" />
            </Field>
            <p className="text-xs text-muted-foreground">Uploaded images are stored permanently in cloud storage.</p>
            {logoPreview && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setField("logo", ""); setLogoPreview(""); }}><Trash2 className="h-3 w-3 mr-1" />Remove</Button>}
          </div>
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>Payment Methods</SectionLabel>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex items-center justify-between gap-3 flex-1 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors" data-testid="toggle-lightning">
            <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500 fill-yellow-500" /><span className="text-sm font-medium">Lightning Network</span></div>
            <Switch checked={form.lightningSupported} onCheckedChange={v => setField("lightningSupported", v)} />
          </label>
          <label className="flex items-center justify-between gap-3 flex-1 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors" data-testid="toggle-onchain">
            <div className="flex items-center gap-2"><BitcoinLogo className="h-4 w-4" /><span className="text-sm font-medium">On-Chain Bitcoin</span></div>
            <Switch checked={form.onchainSupported} onCheckedChange={v => setField("onchainSupported", v)} />
          </label>
          <label className="flex items-center justify-between gap-3 flex-1 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors" data-testid="toggle-cashu">
            <div className="flex items-center gap-2"><span className="text-base leading-none">🥜</span><span className="text-sm font-medium">Cashu</span></div>
            <Switch checked={form.cashuSupported} onCheckedChange={v => setField("cashuSupported", v)} />
          </label>
          <label className="flex items-center justify-between gap-3 flex-1 rounded-lg border border-border p-3 cursor-pointer hover:bg-muted/30 transition-colors" data-testid="toggle-liquid">
            <div className="flex items-center gap-2"><span className="text-base leading-none">💧</span><span className="text-sm font-medium">Liquid</span></div>
            <Switch checked={form.liquidSupported} onCheckedChange={v => setField("liquidSupported", v)} />
          </label>
        </div>
        <Field label="Payment Provider">
          <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.paymentProvider} onChange={e => setField("paymentProvider", e.target.value)} data-testid="select-payment-provider">
            <option value="">— Select provider —</option>
            {allProviders.map(p => <option key={p} value={p}>{p}</option>)}
            {form.paymentProvider && !allProviders.includes(form.paymentProvider) && <option value={form.paymentProvider}>{form.paymentProvider}</option>}
          </select>
        </Field>
      </Card>

      <Card className="p-5 space-y-3">
        <SectionLabel>Categories {form.categories.length > 0 && <span className="ml-2 text-primary font-semibold">{form.categories.length} selected</span>}</SectionLabel>
        <div className="flex flex-wrap gap-2" data-testid="category-selector">
          {allCategories.map(cat => {
            const active = form.categories.includes(cat);
            const label = getCategoryWithEmoji(cat);
            return <button key={cat} type="button" onClick={() => toggleItem("categories", cat)} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${active ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`} data-testid={`category-${cat}`}>{label}</button>;
          })}
        </div>
      </Card>

      <Card className="p-5 space-y-3">
        <SectionLabel>Availability / Ships To {form.shippingCountries.length > 0 && <span className="ml-2 text-primary font-semibold">{form.shippingCountries.length} selected</span>}</SectionLabel>
        <div className="flex flex-wrap gap-2" data-testid="country-selector">
          {allCountries.map(country => {
            const active = form.shippingCountries.includes(country);
            return <button key={country} type="button" onClick={() => toggleItem("shippingCountries", country)} className={`text-xs px-2.5 py-1 rounded-full border transition-all ${active ? "bg-primary text-primary-foreground border-primary font-medium shadow-sm" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"}`} data-testid={`country-${country}`}>{country}</button>;
          })}
          {form.shippingCountries.filter(c => !allCountries.includes(c)).map(orphan => (
            <button key={orphan} type="button" onClick={() => toggleItem("shippingCountries", orphan)} className="text-xs px-2.5 py-1 rounded-full border bg-primary text-primary-foreground border-primary font-medium shadow-sm" data-testid={`country-orphan-${orphan}`}>{orphan}</button>
          ))}
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <SectionLabel>Additional Details</SectionLabel>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Made In">
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.countryMadeIn} onChange={e => setField("countryMadeIn", e.target.value)} data-testid="select-country-made-in">
              <option value="">— Select country —</option>
              {form.countryMadeIn && !allCountries.filter(c => !c.toLowerCase().includes("worldwide")).includes(form.countryMadeIn) && (
                <option value={form.countryMadeIn}>{form.countryMadeIn}</option>
              )}
              {allCountries.filter(c => !c.toLowerCase().includes("worldwide")).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Shipped From">
            <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={form.countryShippedFrom} onChange={e => setField("countryShippedFrom", e.target.value)} data-testid="select-country-shipped-from">
              <option value="">— Select country —</option>
              {form.countryShippedFrom && !allCountries.filter(c => !c.toLowerCase().includes("worldwide")).includes(form.countryShippedFrom) && (
                <option value={form.countryShippedFrom}>{form.countryShippedFrom}</option>
              )}
              {allCountries.filter(c => !c.toLowerCase().includes("worldwide")).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Last Surveyed">
            <Input type="date" value={form.lastSurveyed} onChange={e => setField("lastSurveyed", e.target.value)} data-testid="input-last-surveyed" />
          </Field>
        </div>
      </Card>
    </div>
  );
}

function LivePreview({ form, logoPreview, shippingText }: { form: MerchantForm; logoPreview: string; shippingText: string | null }) {
  const { getCategoryWithEmoji } = useCategoryEmojis();
  return (
    <div className="space-y-3 lg:sticky lg:top-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Preview</p>
      <div className="rounded-xl border border-border bg-white dark:bg-card p-4 space-y-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 rounded-lg border-2 border-border bg-muted flex items-center justify-center overflow-hidden">
            {logoPreview ? <img src={logoPreview} alt="preview" className="w-full h-full object-contain" /> : <Store className="h-6 w-6 text-muted-foreground" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-sm">{form.name || <span className="text-muted-foreground italic">Merchant Name</span>}</span>
              {form.lightningSupported && <Zap className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />}
              {form.onchainSupported && <BitcoinLogo className="h-3.5 w-3.5" spin />}
              {form.bitcoinDiscount?.toUpperCase() === "NEW"
                ? <span className="text-[11px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wide animate-rainbow" style={{ background:"linear-gradient(90deg,#ff0000,#ff8800,#00ff00,#0088ff,#8800ff,#ff0088,#ff0000)", backgroundSize:"200% 100%", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", backgroundClip:"text" }}>NEW</span>
                : form.bitcoinDiscount ? <span className="text-[10px] font-bold bg-green-500 text-white px-1.5 py-0.5 rounded-sm">{form.bitcoinDiscount}</span> : null}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{form.description || <span className="italic">Description appears here…</span>}</p>
          </div>
        </div>
        {(shippingText || form.categories.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {shippingText && <Badge variant="secondary" className="text-[10px] py-0 px-1.5">{shippingText}</Badge>}
            {form.categories.slice(0, 2).map(cat => <Badge key={cat} variant="secondary" className="text-[10px] py-0 px-1.5">{getCategoryWithEmoji(cat)}</Badge>)}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-border p-4 space-y-2 text-xs bg-muted/20">
        <Row label="Payment" value={[form.lightningSupported && "⚡ Lightning", form.onchainSupported && "₿ On-Chain", form.cashuSupported && "🥜 Cashu", form.liquidSupported && "💧 Liquid"].filter(Boolean).join("  ") || "—"} />
        <Row label="Provider" value={form.paymentProvider || "—"} />
        <Row label="Categories" value={form.categories.length > 0 ? `${form.categories.length} selected` : "—"} />
        <Row label="Availability" value={form.shippingCountries.length > 0 ? `${form.shippingCountries.length} region(s)` : "—"} />
        {form.countryMadeIn && <Row label="Made in" value={form.countryMadeIn} />}
        {form.countryShippedFrom && <Row label="Ships from" value={form.countryShippedFrom} />}
        {form.lastSurveyed && <Row label="Surveyed" value={form.lastSurveyed} />}
      </div>
    </div>
  );
}

function ResultBanner({ result }: { result: { success: boolean; message: string } }) {
  return (
    <div className={`flex items-start gap-3 p-4 rounded-lg border ${result.success ? "bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400" : "bg-red-500/10 border-red-500/30 text-red-500"}`} data-testid="submit-result">
      {result.success ? <Check className="h-5 w-5 shrink-0 mt-0.5" /> : <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />}
      <p className="text-sm">{result.message}</p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{children}</p>;
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">{label}</span><span className="text-right truncate">{value}</span></div>;
}

function parseBoolDisplay(value: string | undefined): boolean {
  if (!value) return false;
  return ["true","yes","1","y"].includes(value.toLowerCase().trim());
}
