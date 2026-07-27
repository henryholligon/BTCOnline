import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  // Parse token + email from query string.
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  useEffect(() => {
    if (!token || !email) setError("Invalid reset link. Please request a new one.");
  }, [token, email]);

  const hashPassword = async (pw: string) => {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pw));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  const handleSubmit = async () => {
    setError("");
    if (!password) { setError("Password is required"); return; }
    if (password.length < 8) { setError("Password must be at least 8 characters"); return; }
    if (password !== confirm) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const newPasswordHash = await hashPassword(password);
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, newPasswordHash }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Reset failed");
      setDone(true);
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Reset your password</CardTitle>
          {!done && (
            <CardDescription>
              Choose a new password for <strong>{email}</strong>.
              Your Nostr key will not be affected.
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {done ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-lg px-3 py-3">
                <Check className="h-4 w-4 shrink-0" />
                Password updated successfully.
              </div>
              <Button className="w-full" onClick={() => navigate("/")}>
                Back to directory
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  {error}
                </div>
              )}
              <div className="space-y-1">
                <Label htmlFor="new-password">New password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repeat new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  autoComplete="new-password"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={loading || !token || !email}
              >
                {loading ? "Updating…" : "Set new password"}
              </Button>
              <Button variant="ghost" className="w-full text-xs" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
