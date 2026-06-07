import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useNostr } from "@/context/NostrContext";
import Navbar from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type Merchant } from "@shared/schema";
import { Plus, Trash2, ExternalLink, List, ArrowLeft, Loader2, Pencil, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import btcBgImage from "@assets/image_1771226498805.png";

function MerchantChip({ url, merchants }: { url: string; merchants: Merchant[] }) {
  const merchant = merchants.find(m => {
    try {
      return new URL(m.website).hostname === new URL(url).hostname;
    } catch { return m.website === url; }
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

export default function ListsPage() {
  const { user, lists, isLoading, createList, deleteList, renameList, toggleListMember, openLoginModal } = useNostr();
  const { toast } = useToast();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [newListName, setNewListName] = useState("");
  const [creatingList, setCreatingList] = useState(false);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [editingList, setEditingList] = useState<{ dTag: string; title: string } | null>(null);

  useEffect(() => {
    fetch("/api/merchants", { cache: "no-store" })
      .then(r => r.json())
      .then(setMerchants)
      .catch(() => {});
  }, []);

  const handleCreateList = async () => {
    if (!newListName.trim()) return;
    setCreatingList(true);
    try {
      await createList(newListName.trim());
      setNewListName("");
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      <Navbar onSearch={() => {}} />

      <main className="flex-1 relative" style={{ backgroundImage: `url(${btcBgImage})`, backgroundSize: '600px', backgroundRepeat: 'repeat', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-background/85 dark:bg-background/80" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-3">
            <Link href="/">
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-back-home">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <List className="h-5 w-5 text-primary" />
              My Merchant Lists
            </h1>
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
              <div className="bg-card border border-border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Create a new list</p>
                <div className="flex gap-2">
                  <Input
                    placeholder="List name (e.g. Gift Ideas)"
                    value={newListName}
                    onChange={e => setNewListName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateList()}
                    data-testid="input-new-list-name"
                  />
                  <Button
                    onClick={handleCreateList}
                    disabled={creatingList || !newListName.trim()}
                    data-testid="button-create-list"
                  >
                    {creatingList ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

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
                            <div
                              className="flex items-center gap-2"
                              onClick={e => e.stopPropagation()}
                            >
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
                                data-testid={`button-save-rename-${list.dTag}`}
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingList(null)}
                                className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors shrink-0"
                                data-testid={`button-cancel-rename-${list.dTag}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <p className="font-medium text-sm truncate">{list.title}</p>
                              <p className="text-xs text-muted-foreground">{list.urls.length} merchant{list.urls.length !== 1 ? "s" : ""}</p>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              setEditingList(editingList?.dTag === list.dTag ? null : { dTag: list.dTag, title: list.title });
                            }}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            data-testid={`button-rename-list-${list.dTag}`}
                            title="Rename list"
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
                                    data-testid={`button-remove-from-list-${list.dTag}`}
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
        </div>
      </main>
    </div>
  );
}
