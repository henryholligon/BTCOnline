import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNostr } from "@/context/NostrContext";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { npubEncode, nsecEncode } from "nostr-tools/nip19";
import { encrypt as ncryptsecEncrypt } from "nostr-tools/nip49";
import { Copy, Check, Eye, EyeOff, Zap, Wifi, Key, AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";

type Tab = "extension" | "bunker" | "new";

function CopyButton({ text, "data-testid": testId }: { text: string; "data-testid"?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ml-1 inline-flex items-center justify-center h-6 w-6 rounded hover:bg-muted transition-colors shrink-0"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      data-testid={testId}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

function ExtensionTab() {
  const { loginNip07 } = useNostr();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const hasExtension = typeof window !== "undefined" && !!window.nostr;

  const handleConnect = async () => {
    setError("");
    setLoading(true);
    try {
      await loginNip07();
    } catch (e: any) {
      setError(e.message || "Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Use a browser extension to sign in with your existing Nostr identity. Your private key never leaves the extension.
      </p>

      {hasExtension ? (
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-2">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Extension detected — ready to connect
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>No extension detected. Install one to continue.</span>
          </div>
          <div className="flex flex-col gap-2">
            <a
              href="https://getalby.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted transition-colors"
              data-testid="link-install-alby"
            >
              <span className="font-medium">⚡ Alby</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">Desktop <ExternalLink className="h-3 w-3" /></span>
            </a>
            <a
              href="https://chrome.google.com/webstore/detail/nos2x/kpgefcfmnafjgpblomihpgmejjdanjjp"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm hover:bg-muted transition-colors"
              data-testid="link-install-nos2x"
            >
              <span className="font-medium">🔑 nos2x</span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">Chrome <ExternalLink className="h-3 w-3" /></span>
            </a>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        onClick={handleConnect}
        disabled={loading || !hasExtension}
        data-testid="button-connect-extension"
      >
        {loading ? "Connecting…" : "Connect Extension"}
      </Button>
    </div>
  );
}

type BunkerMode = "bunker" | "ncryptsec";

function BunkerTab() {
  const { loginWithBunker, restoreGeneratedSession } = useNostr();
  const [mode, setMode] = useState<BunkerMode>("bunker");
  const [uri, setUri] = useState("");
  const [ncryptsec, setNcryptsec] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setError("");
    setLoading(true);
    try {
      if (mode === "bunker") {
        if (!uri.trim()) { setError("Please enter a bunker URI"); setLoading(false); return; }
        await loginWithBunker(uri.trim());
      } else {
        if (!ncryptsec.trim()) { setError("Please enter an ncryptsec string"); setLoading(false); return; }
        await restoreGeneratedSession(ncryptsec.trim(), password);
      }
    } catch (e: any) {
      setError(mode === "bunker" ? (e.message || "Failed to connect to bunker") : "Incorrect password or invalid ncryptsec");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => { setMode("bunker"); setError(""); }}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${mode === "bunker" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          data-testid="tab-bunker-uri"
        >
          bunker:// URI
        </button>
        <button
          type="button"
          onClick={() => { setMode("ncryptsec"); setError(""); }}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${mode === "ncryptsec" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          data-testid="tab-ncryptsec-import"
        >
          ncryptsec
        </button>
      </div>

      {mode === "bunker" ? (
        <>
          <p className="text-sm text-muted-foreground">
            Connect via a remote signer (NIP-46). Works with Amber on Android, or any NIP-46 compatible bunker.
          </p>
          <div className="space-y-2">
            <Label htmlFor="bunker-uri">Bunker URI</Label>
            <Input
              id="bunker-uri"
              placeholder="bunker://pubkey?relay=wss://..."
              value={uri}
              onChange={e => setUri(e.target.value)}
              className="font-mono text-xs"
              data-testid="input-bunker-uri"
            />
            <p className="text-xs text-muted-foreground">
              Paste the <code>bunker://</code> URI from your signer app.
            </p>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Import an encrypted private key (NIP-49) and the password used to encrypt it.
          </p>
          <div className="space-y-2">
            <Label htmlFor="ncryptsec-input">Encrypted Key (ncryptsec)</Label>
            <Input
              id="ncryptsec-input"
              placeholder="ncryptsec1..."
              value={ncryptsec}
              onChange={e => setNcryptsec(e.target.value)}
              className="font-mono text-xs"
              data-testid="input-ncryptsec"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ncryptsec-password">Password</Label>
            <Input
              id="ncryptsec-password"
              type="password"
              placeholder="Password used to encrypt this key"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleConnect()}
              data-testid="input-ncryptsec-password"
            />
          </div>
        </>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        onClick={handleConnect}
        disabled={loading || (mode === "bunker" ? !uri.trim() : !ncryptsec.trim())}
        data-testid="button-connect-bunker"
      >
        {loading
          ? (mode === "bunker" ? "Connecting to bunker…" : "Decrypting…")
          : (mode === "bunker" ? "Connect" : "Import Key")}
      </Button>
    </div>
  );
}

function NewAccountTab() {
  const { loginWithGeneratedKey } = useNostr();
  const [step, setStep] = useState<"generate" | "backup">("generate");
  const [generatedSk, setGeneratedSk] = useState<Uint8Array | null>(null);
  const [npub, setNpub] = useState("");
  const [nsec, setNsec] = useState("");
  const [showNsec, setShowNsec] = useState(false);
  const [password, setPassword] = useState("");
  const [ncryptsec, setNcryptsec] = useState("");
  const [confirmedBackup, setConfirmedBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = () => {
    const sk = generateSecretKey();
    const pk = getPublicKey(sk);
    const encodedNpub = npubEncode(pk);
    const encodedNsec = nsecEncode(sk);
    setGeneratedSk(sk);
    setNpub(encodedNpub);
    setNsec(encodedNsec);
    if (password.trim()) {
      try {
        setNcryptsec(ncryptsecEncrypt(sk, password));
      } catch {
        setNcryptsec("");
      }
    }
    setStep("backup");
  };

  const handlePasswordChange = (pw: string) => {
    setPassword(pw);
    if (generatedSk && pw.trim()) {
      try {
        setNcryptsec(ncryptsecEncrypt(generatedSk, pw));
      } catch {
        setNcryptsec("");
      }
    } else {
      setNcryptsec("");
    }
  };

  const handleLogin = async () => {
    if (!generatedSk || !confirmedBackup) return;
    setLoading(true);
    setError("");
    try {
      await loginWithGeneratedKey(generatedSk, ncryptsec || undefined);
    } catch (e: any) {
      setError(e.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  if (step === "generate") {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate a new Nostr identity right here in the browser. Your private key is created locally and never sent to any server.
        </p>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5 space-y-1">
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">How this works</p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            A cryptographic key pair is generated in your browser using <code>crypto.getRandomValues()</code>. The private key is never transmitted to btconline's servers. Anyone can verify this by inspecting the network tab or reading the open-source code.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">Password (optional)</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="Encrypt your private key"
            value={password}
            onChange={e => setPassword(e.target.value)}
            data-testid="input-new-password"
          />
          <p className="text-xs text-muted-foreground">
            If set, your key will be stored as an encrypted ncryptsec (NIP-49). You'll need this password to restore your session.
          </p>
        </div>

        <Button className="w-full" onClick={handleGenerate} data-testid="button-generate-key">
          <Key className="h-4 w-4 mr-2" />
          Generate Key Pair
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg px-3 py-2.5">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-orange-700 dark:text-orange-300 uppercase tracking-wide">Back this up now</p>
          <p className="text-xs text-orange-700 dark:text-orange-400">
            This IS your account. There is no password reset. If you lose your private key (nsec), you lose your account permanently.
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Your Public Key (npub) — safe to share</Label>
        <div className="flex items-center gap-1 bg-muted rounded px-2.5 py-1.5">
          <code className="text-xs break-all flex-1 select-all">{npub}</code>
          <CopyButton text={npub} data-testid="button-copy-npub" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs">Your Private Key (nsec) — keep secret</Label>
        <div className="flex items-center gap-1 bg-muted rounded px-2.5 py-1.5">
          <code className="text-xs break-all flex-1 select-all">
            {showNsec ? nsec : "•".repeat(Math.min(nsec.length, 40))}
          </code>
          <button
            type="button"
            onClick={() => setShowNsec(v => !v)}
            className="shrink-0 h-6 w-6 flex items-center justify-center rounded hover:bg-background transition-colors"
            data-testid="button-reveal-nsec"
          >
            {showNsec ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          <CopyButton text={nsec} data-testid="button-copy-nsec" />
        </div>
      </div>

      {ncryptsec && (
        <div className="space-y-1">
          <Label className="text-xs">Encrypted Key (ncryptsec) — password-protected backup</Label>
          <div className="flex items-center gap-1 bg-muted rounded px-2.5 py-1.5">
            <code className="text-xs break-all flex-1 select-all">{ncryptsec}</code>
            <CopyButton text={ncryptsec} data-testid="button-copy-ncryptsec" />
          </div>
        </div>
      )}

      <div className="flex items-start gap-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2.5">
        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
        <p className="text-xs text-purple-700 dark:text-purple-400">
          For better security, import this key into{" "}
          <a href="https://getalby.com" target="_blank" rel="noopener noreferrer" className="underline">Alby</a>{" "}
          or another key manager. Then use the Extension login next time.
        </p>
      </div>

      <label className="flex items-start gap-2 cursor-pointer" data-testid="label-confirm-backup">
        <input
          type="checkbox"
          checked={confirmedBackup}
          onChange={e => setConfirmedBackup(e.target.checked)}
          className="mt-0.5 shrink-0"
          data-testid="checkbox-confirm-backup"
        />
        <span className="text-xs text-muted-foreground">
          I have saved my private key in a safe place and understand that losing it means losing access to my account.
        </span>
      </label>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setStep("generate")} className="flex-1">
          Back
        </Button>
        <Button
          className="flex-1"
          onClick={handleLogin}
          disabled={!confirmedBackup || loading}
          data-testid="button-confirm-new-account"
        >
          {loading ? "Setting up…" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function RestoreSessionView() {
  const { restoringNcryptsec, restoreGeneratedSession, closeLoginModal } = useNostr();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    if (!restoringNcryptsec) return;
    setError("");
    setLoading(true);
    try {
      await restoreGeneratedSession(restoringNcryptsec, password);
    } catch {
      setError("Incorrect password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-3 py-2.5">
        <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">Welcome back</p>
          <p className="text-xs text-blue-700 dark:text-blue-400">
            Enter your password to decrypt and restore your Nostr identity.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="restore-password">Password</Label>
        <Input
          id="restore-password"
          type="password"
          placeholder="Your encryption password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleRestore()}
          autoFocus
          data-testid="input-restore-password"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        className="w-full"
        onClick={handleRestore}
        disabled={loading || !password}
        data-testid="button-restore-session"
      >
        {loading ? "Decrypting…" : "Restore Session"}
      </Button>

      <button
        type="button"
        onClick={closeLoginModal}
        className="w-full text-xs text-muted-foreground hover:text-foreground text-center transition-colors"
        data-testid="button-use-different-account"
      >
        Use a different account
      </button>
    </div>
  );
}

export default function NostrLoginModal() {
  const { isLoginModalOpen, closeLoginModal, restoringNcryptsec } = useNostr();
  const [tab, setTab] = useState<Tab>("extension");

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: "extension", label: "Extension", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { id: "bunker", label: "Bunker / Key", icon: <Wifi className="h-3.5 w-3.5" /> },
    { id: "new", label: "New Account", icon: <Key className="h-3.5 w-3.5" /> },
  ];

  return (
    <Dialog open={isLoginModalOpen} onOpenChange={v => !v && closeLoginModal()}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="modal-nostr-login">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {restoringNcryptsec ? "Restore Your Session" : "Sign in with Nostr"}
          </DialogTitle>
        </DialogHeader>

        {restoringNcryptsec ? (
          <RestoreSessionView />
        ) : (
          <>
            <div className="flex rounded-lg border border-border overflow-hidden mb-2">
              {tabs.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium transition-colors ${
                    tab === t.id
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                  data-testid={`tab-${t.id}`}
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>

            <div className="py-1">
              {tab === "extension" && <ExtensionTab />}
              {tab === "bunker" && <BunkerTab />}
              {tab === "new" && <NewAccountTab />}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
