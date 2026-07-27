import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useNostr } from "@/context/NostrContext";
import type { SavedPublicList } from "@/context/NostrContext";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Merchant } from "@shared/schema";
import {
  Plus, Trash2, ExternalLink, List, ArrowLeft, Loader2, Pencil,
  Check, X, Lock, Globe, Bookmark, BookmarkCheck, Compass,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import btcBgImage from "@assets/image_1771226498805.png";

function MerchantChip({ url, merchants }: { url: string; merchants: Merchant[] }) {
  const merchant = merchants.find(m => {
    try { return new URL(m.website).hostname === new URL(url).hostname; }
    catch { return m.website === url; }
  });
  if (!merchant) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
        <span className="text-muted-foreground truncate max-w-[200px]">{url}</span>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
        </a>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
      <div className="h-7 w-7 shrink-0 rounded flex items-center justify-center overflow-hidden border border-border bg-white dark:bg-muted">
        {(merchant.logo.startsWith("/") || merchant.logo.startsWith("http")) ? (
          <img src={merchant.logo} alt={merchant.name} className="w-full h-full object-contain" />
        ) : (
          <span className="text-sm">{merchant.logo}</span>
        )}
      </div>
      <span className="text-sm font-medium flex-1 truncate">{merchant.name}</span>
      <a href={merchant.website} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
      </a>
    </div>
  );
}

type Tab = "my" | "saved";

export default function ListsPage() {
  const {
    user, lists, isLoading, createList, deleteList, renameList,
    toggleListMember, toggleListPrivacy, openLoginModal, canUsePrivate,
    savedLists, unsavePublicList,
  } = useNostr();
  const { toast } = useToast();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [tab, setTab] = useState<Tab>("my");

  // Create form state
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");
  const [newListPrivate, setNewListPrivate] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [editingList, setEditingList] = useState<{ dTag: string; title: string } | null>(null);

  useEffect(() => {
    fetch("/api/merchants", { cache: "no-store" })
      .then(r => r.json()).then(setMerchants).catch(() => {});
  }, []);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    if (newListPrivate && !canUsePrivate) {
      toast({
        title: "Private lists not available",
        description: "Private lists require a Nostr extension with NIP-44 support (e.g. Alby) or a direct key login.",
        variant: "destructive",
      });
      return;
    }
    setCreatingList(true);
    try {
      await createList(newListName.trim(), newListDescription.trim(), newListPrivate);
      setNewListName("");
      setNewListDescription("");
      setNewListPrivate(false);
      setShowCreateForm(false);
      toast({ title: "List created", description: `"${newListName.trim()}" is ready.` });
    } catch (e: any) {
      toast({ title: "Failed to create list", description: e.message, variant: "destructive" });
    } finally {
      setCreatingList(false);
    }
  };

  const handleDeleteList = async (dTag: string, title: string) => {
    try {
      await deleteList(dTag);
      toast({ title: "List deleted", description: `"${title}" has been removed.` });
    } catch (e: any) {
      toast({ title: "Failed to delete list", description: e.message, variant: "destructive" });
    }
  };

  const handleRenameList = async (dTag: string, newTitle: string) => {
    if (!newTitle.trim()) return;
    try {
      await renameList(dTag, newTitle.trim());
      setEditingList(null);
      toast({ title: "List renamed" });
    } catch (e: any) {
      toast({ title: "Failed to rename list", description: e.message, variant: "destructive" });
    }
  };

  const handleTogglePrivacy = async (dTag: string, currentlyPrivate: boolean) => {
    if (!currentlyPrivate && !canUsePrivate) {
      toast({
        title: "Private lists not available",
        description: "Private lists require NIP-44 support.",
        variant: "destructive",
      });
      return;
    }
    try {
      await toggleListPrivacy(dTag);
      toast({
        title: currentlyPrivate ? "List made public" : "List made private",
        description: currentlyPrivate
          ? "This list is now discoverable by others."
          : "This list is now encrypted — only you can see it.",
      });
    } catch (e: any) {
      toast({ title: "Failed to change privacy", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar onSearch={() => {}} />

      <main className="flex-1 relative" style={{ backgroundImage: `url(${btcBgImage})`, backgroundSize: '600px', backgroundRepeat: 'repeat', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-background/85 dark:bg-background/80" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-home">
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <List className="h-5 w-5 text-primary" /> Merchant Lists
            </h1>
            <Link href="/discover" className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Compass className="h-3.5 w-3.5" /> Discover
            </Link>
          </div>

          {!user ? (
            <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/40">
              <List className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">Sign in with Nostr to create and manage merchant lists.</p>
              <Button onClick={openLoginModal} data-testid="button-login-for-lists">Sign in with Nostr</Button>
            </div>
          ) : isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex items-center gap-1 border-b border-border">
                <button
                  onClick={() => setTab("my")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    tab === "my" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  My Lists
                  {lists.length > 0 && (
                    <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">{lists.length}</span>
                  )}
                </button>
                <button
                  onClick={() => setTab("saved")}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    tab === "saved" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Saved
                  {savedLists.length > 0 && (
                    <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">{savedLists.length}</span>
                  )}
                </button>
              </div>

              {tab === "my" && (
                <div className="space-y-4">
                  {/* Create list */}
                  {!showCreateForm ? (
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      onClick={() => setShowCreateForm(true)}
                      data-testid="button-show-create-list"
                    >
                      <Plus className="h-4 w-4" /> New list
                    </Button>
                  ) : (
                    <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                      <p className="text-sm font-medium">Create a new list</p>
                      <Input
                        placeholder="List name (e.g. Best Privacy Tools)"
                        value={newListName}
                        onChange={e => setNewListName(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && handleCreateList()}
                        data-testid="input-new-list-name"
                        autoFocus
                      />
                      <Input
                        placeholder="Description (optional — shown on discover page)"
                        value={newListDescription}
                        onChange={e => setNewListDescription(e.target.value)}
                        data-testid="input-new-list-description"
                      />

                      {/* Privacy toggle */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setNewListPrivate(false)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border text-xs font-medium transition-colors ${
                            !newListPrivate
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Globe className="h-3.5 w-3.5" /> Public
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewListPrivate(true)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-md border text-xs font-medium transition-colors ${
                            newListPrivate
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Lock className="h-3.5 w-3.5" /> Private
                        </button>
                      </div>
                      {newListPrivate && (
                        <p className="text-xs text-muted-foreground">
                          Private lists are encrypted with NIP-44 — only you can read the contents.
                        </p>
                      )}
                      {!newListPrivate && (
                        <p className="text-xs text-muted-foreground">
                          Public lists appear on the discover page and can be saved by others.
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreateList}
                          disabled={creatingList || !newListName.trim()}
                          className="flex-1"
                          data-testid="button-create-list"
                        >
                          {creatingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4 mr-1" />Create</>}
                        </Button>
                        <Button variant="outline" onClick={() => { setShowCreateForm(false); setNewListName(""); setNewListDescription(""); setNewListPrivate(false); }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {lists.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg bg-card/20">
                      <p className="text-muted-foreground text-sm">No lists yet. Create one above, or add merchants to a list from the directory.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lists.map(list => (
                        <div
                          key={list.dTag}
                          className="bg-card border border-border rounded-lg overflow-hidden"
                          data-testid={`list-card-${list.dTag}`}
                        >
                          <div
                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/40 transition-colors"
                            onClick={() => {
                              if (editingList?.dTag === list.dTag) return;
                              setExpandedList(expandedList === list.dTag ? null : list.dTag);
                            }}
                          >
                            <div className="flex-1 min-w-0 mr-2">
                              {editingList?.dTag === list.dTag ? (
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <Input
                                    value={editingList.title}
                                    onChange={e => setEditingList({ ...editingList, title: e.target.value })}
                                    onKeyDown={e => {
                                      if (e.key === "Enter") handleRenameList(list.dTag, editingList.title);
                                      if (e.key === "Escape") setEditingList(null);
                                    }}
                                    className="h-7 text-sm"
                                    autoFocus
                                    data-testid={`input-rename-list-${list.dTag}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRenameList(list.dTag, editingList.title)}
                                    className="h-7 w-7 flex items-center justify-center rounded-md text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors shrink-0"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingList(null)}
                                    className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors shrink-0"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    {list.isPrivate
                                      ? <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                                      : <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                                    }
                                    <p className="font-medium text-sm truncate">{list.title}</p>
                                  </div>
                                  {list.description && (
                                    <p className="text-xs text-muted-foreground truncate mt-0.5 ml-4.5">{list.description}</p>
                                  )}
                                  <p className="text-xs text-muted-foreground ml-4.5 mt-0.5">
                                    {list.urls.length} merchant{list.urls.length !== 1 ? "s" : ""}
                                    {" · "}
                                    <span className={list.isPrivate ? "text-muted-foreground" : "text-primary/70"}>
                                      {list.isPrivate ? "Private" : "Public"}
                                    </span>
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {/* Privacy toggle */}
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); handleTogglePrivacy(list.dTag, list.isPrivate); }}
                                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title={list.isPrivate ? "Make public" : "Make private"}
                              >
                                {list.isPrivate ? <Lock className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
                              </button>
                              <button
                                type="button"
                                onClick={e => {
                                  e.stopPropagation();
                                  setEditingList(editingList?.dTag === list.dTag ? null : { dTag: list.dTag, title: list.title });
                                }}
                                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                title="Rename list"
                                data-testid={`button-rename-list-${list.dTag}`}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={e => { e.stopPropagation(); handleDeleteList(list.dTag, list.title); }}
                                className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                data-testid={`button-delete-list-${list.dTag}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {expandedList === list.dTag && (
                            <div className="border-t border-border px-4 py-3 space-y-2">
                              {list.urls.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">
                                  No merchants yet. Open a merchant card and click <strong>Add to list</strong>.
                                </p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {list.urls.map(url => (
                                    <div key={url} className="flex items-center gap-1">
                                      <div className="flex-1 min-w-0">
                                        <MerchantChip url={url} merchants={merchants} />
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => toggleListMember(list.dTag, url, true)}
                                        className="shrink-0 h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {tab === "saved" && (
                <div className="space-y-4">
                  {savedLists.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg bg-card/20">
                      <Bookmark className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-muted-foreground text-sm mb-2">No saved lists yet.</p>
                      <Link href="/discover" className="text-xs text-primary hover:underline">
                        Browse the discover page to find curated collections →
                      </Link>
                    </div>
                  ) : (
                    savedLists.map(saved => (
                      <div key={`${saved.authorPubkey}:${saved.dTag}`} className="bg-card border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{saved.title}</p>
                            {saved.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{saved.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {saved.merchantCount} {saved.merchantCount === 1 ? "merchant" : "merchants"}
                            </p>
                          </div>
                          <button
                            onClick={() => unsavePublicList(saved.authorPubkey, saved.dTag)}
                            title="Remove from saved"
                            className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary hover:bg-destructive/10 hover:border-destructive/40 hover:text-destructive transition-colors"
                          >
                            <BookmarkCheck className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
