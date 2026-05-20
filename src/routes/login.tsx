import { createFileRoute, Navigate, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Giriş — Çiftlik Defteri" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { isAuthenticated, login } = useStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" />;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const ok = login(username.trim(), password);
      setLoading(false);
      if (ok) navigate({ to: "/" });
      else toast.error("Geçersiz kullanıcı adı veya şifre");
    }, 300);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <Sprout className="h-5 w-5 text-foreground" strokeWidth={1.75} />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Çiftlik Defteri</h1>
          <p className="mt-1 text-sm text-muted-foreground">Yönetici girişi</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">
              Kullanıcı Adı
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Şifre
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Giriş yapılıyor…" : "Giriş Yap"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Demo: <span className="font-medium text-foreground">admin</span> / <span className="font-medium text-foreground">admin</span>
          </p>
        </form>
      </div>
    </main>
  );
}
