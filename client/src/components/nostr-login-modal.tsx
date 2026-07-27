import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNostr } from "@/context/NostrContext";
import { generateSecretKey, getPublicKey } from "nostr-tools";
import { npubEncode, nsecEncode } from "nostr-tools/nip19";
import { encrypt as ncryptsecEncrypt } from "nostr-tools/nip49";
import { Copy, Check, Eye, EyeOff, Zap, Wifi, Key, AlertTriangle, ExternalLink, ShieldCheck, Mail, ChevronDown, Lock } from "lucide-react";
import { generateEmailKeypair, decryptEmailNsec } from "@/lib/emailAuth";
import { hexToBytes } from "@/lib/nostr";

type NostrSubTab = "extension" | "bunker";

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

function ForgotPasswordView({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/request-reset", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Request failed");
      setSent(true);
      if (data.devResetUrl) setDevLink(data.devResetUrl);
    } catch (e: any) {
      setError(e.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3 space-y-1">
          <p className="text-sm font-medium text-green-700 dark:text-green-400">Check your inbox</p>
          <p className="text-xs text-muted-foreground">If that email is registered, a reset link has been sent. Your Nostr key will not be affected.</p>
        </div>
        {devLink && (
          <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 px-3 py-2">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">Dev mode — click to reset:</p>
            <a href={devLink} className="text-xs text-blue-600 dark:text-blue-400 underline break-all">{devLink}</a>
          </div>
        )}
        <Button variant="outline" className="w-full" onClick={onBack}>Back to sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium">Reset your password</p>
        <p className="text-xs text-muted-foreground mt-1">
          Enter your email and we'll send a reset link. Your Nostr key will not be affected.
        </p>
      </div>
      <div className="space-y-1">
        <Label htmlFor="reset-email">Email</Label>
        <Input id="reset-email" type="email" placeholder="you@example.com" value={email}
          onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
          autoComplete="email" />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={handleSubmit} disabled={loading || !email.trim()}>
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      <Button variant="ghost" className="w-full text-xs" onClick={onBack}>← Back to sign in</Button>
    </div>
  );
}

function EmailTab({ mode, setMode }: { mode: "login" | "register"; setMode: (m: "login" | "register") => void }) {
  const { loginWithGeneratedKey } = useNostr();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selfCustody, setSelfCustody] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);

  const hashPassword = async (pw: string) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  if (forgotPassword) {
    return <ForgotPasswordView onBack={() => setForgotPassword(false)} />;
  }

  const handleSubmit = async () => {
    setError("");
    if (!email.trim() || !password) { setError("Email and password are required"); return; }
    if (mode === "register" && password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setLoading(true);
    try {
      const pwHash = await hashPassword(password);
      if (mode === "register") {
        if (selfCustody) {
          // Self-custody: generate keypair client-side, encrypt with password.
          const { sk, pubkey, salt, iv, encryptedNsec } = await generateEmailKeypair(password);
          const res = await fetch("/api/auth/register", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, passwordHash: pwHash, pubkey, encryptedNsec, salt, iv, custody: "self-custody" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Registration failed");
          await loginWithGeneratedKey(sk, undefined, { encryptedNsec, salt, iv });
        } else {
          // Custodial (default): server generates and holds the key.
          const res = await fetch("/api/auth/register", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, passwordHash: pwHash, custody: "custodial" }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Registration failed");
          await loginWithGeneratedKey(hexToBytes(data.nsecHex));
        }
      } else {
        const res = await fetch("/api/auth/login", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, passwordHash: pwHash }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");
        if (data.custody === "custodial") {
          await loginWithGeneratedKey(hexToBytes(data.nsecHex));
        } else {
          const sk = await decryptEmailNsec(data.encryptedNsec, data.salt, data.iv, password);
          await loginWithGeneratedKey(sk, undefined, { encryptedNsec: data.encryptedNsec, salt: data.salt, iv: data.iv });
        }
      }
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button type="button" onClick={() => { setMode("login"); setError(""); setSelfCustody(false); setShowAdvanced(false); }}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${mode === "login" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          data-testid="tab-email-login">Sign in</button>
        <button type="button" onClick={() => { setMode("register"); setError(""); }}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${mode === "register" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"}`}
          data-testid="tab-email-register">Create account</button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="email-input">Email</Label>
          <Input id="email-input" type="email" placeholder="you@example.com" value={email}
            onChange={e => setEmail(e.target.value)} data-testid="input-email" autoComplete="email" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="email-password">Password</Label>
          <Input id="email-password" type="password" placeholder="At least 8 characters" value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && !confirm && handleSubmit()}
            data-testid="input-email-password" autoComplete={mode === "register" ? "new-password" : "current-password"} />
        </div>
        {mode === "register" && (
          <div className="space-y-1">
            <Label htmlFor="email-confirm">Confirm password</Label>
            <Input id="email-confirm" type="password" placeholder="Repeat password" value={confirm}
              onChange={e => setConfirm(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSubmit()}
              data-testid="input-email-confirm" autoComplete="new-password" />
          </div>
        )}
      </div>

      {/* Custodial reassurance for the default register flow */}
      {mode === "register" && !selfCustody && (
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0 mt-0.5 text-green-600 dark:text-green-400" />
          <span>A Nostr identity is created for you automatically. You can always reset your password without losing it.</span>
        </div>
      )}

      {/* Advanced: self-custody toggle (register only) */}
      {mode === "register" && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            data-testid="button-toggle-advanced"
          >
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
            Advanced: manage your own key
          </button>
          {showAdvanced && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer" data-testid="label-self-custody">
                <input
                  type="checkbox"
                  checked={selfCustody}
                  onChange={e => setSelfCustody(e.target.checked)}
                  className="mt-0.5 shrink-0"
                  data-testid="checkbox-self-custody"
                />
                <div className="space-y-1">
                  <p className="text-xs font-medium">Self-custody mode</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Your key is generated in your browser and encrypted with your password before it is stored.
                    We can never read it.{" "}
                    <strong className="text-foreground">If you forget your password, your Nostr identity cannot be recovered.</strong>
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Forgot password (login only) */}
      {mode === "login" && (
        <button
          type="button"
          onClick={() => setForgotPassword(true)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          data-testid="button-forgot-password"
        >
          Forgot password?
        </button>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={handleSubmit} disabled={loading} data-testid="button-email-submit">
        {loading
          ? (mode === "register" ? "Creating account…" : "Signing in…")
          : (mode === "register" ? "Create account" : "Sign in")}
      </Button>
    </div>
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
  const [mode, setMode] = useState<"login" | "register">("login");
  const [nostrOpen, setNostrOpen] = useState(false);
  const [nostrTab, setNostrTab] = useState<NostrSubTab>("extension");
  const [createOpen, setCreateOpen] = useState(false);

  const nostrTabs: { id: NostrSubTab; label: string; icon: ReactNode }[] = [
    { id: "extension", label: "Extension", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
    { id: "bunker", label: "Bunker / Key", icon: <Wifi className="h-3.5 w-3.5" /> },
  ];

  const handleClose = () => {
    closeLoginModal();
    setMode("login");
    setNostrOpen(false);
    setNostrTab("extension");
    setCreateOpen(false);
  };

  const handleModeChange = (m: "login" | "register") => {
    setMode(m);
    setNostrOpen(false);
    setCreateOpen(false);
  };

  return (
    <Dialog open={isLoginModalOpen} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto" data-testid="modal-nostr-login">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {restoringNcryptsec ? "Restore Your Session" : "Sign in"}
          </DialogTitle>
        </DialogHeader>

        {restoringNcryptsec ? (
          <RestoreSessionView />
        ) : (
          <div className="space-y-3">
            <EmailTab mode={mode} setMode={handleModeChange} />

            {mode === "login" && (
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setNostrOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  data-testid="button-nostr-disclosure"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Sign in with Nostr
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${nostrOpen ? "rotate-180" : ""}`} />
                </button>
                {nostrOpen && (
                  <div className="border-t border-border p-3 space-y-3">
                    <div className="flex rounded-md border border-border overflow-hidden">
                      {nostrTabs.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setNostrTab(t.id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-medium transition-colors ${
                            nostrTab === t.id
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
                    <div>
                      {nostrTab === "extension" && <ExtensionTab />}
                      {nostrTab === "bunker" && <BunkerTab />}
                    </div>
                  </div>
                )}
              </div>
            )}

            {mode === "register" && (
              <div className="border border-border rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setCreateOpen(v => !v)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                  data-testid="button-create-nostr-disclosure"
                >
                  <span className="flex items-center gap-2">
                    <Key className="h-4 w-4 text-violet-500" />
                    Create a Nostr account
                  </span>
                  <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${createOpen ? "rotate-180" : ""}`} />
                </button>
                {createOpen && (
                  <div className="border-t border-border p-3">
                    <NewAccountTab />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
