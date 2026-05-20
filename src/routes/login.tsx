import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sprout } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Giriş — Çiftlik Defteri" }] }),
  component: LoginPage,
});

function LoginPage() {
  const { authReady, isAuthenticated, login, register } = useStore();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && isAuthenticated) navigate({ to: "/" });
  }, [authReady, isAuthenticated, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const ok = mode === "login"
        ? await login(email.trim(), password)
        : await register(email.trim(), password);
      setLoading(false);
      if (ok) navigate({ to: "/" });
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(mode === "login" ? "Geçersiz e-posta veya şifre" : "Kayıt oluşturulamadı");
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-sm">
            <Sprout className="h-5 w-5 text-foreground" strokeWidth={1.75} />
          </div>
          <h1 className="mt-4 text-xl font-semibold tracking-tight">Çiftlik Defteri</h1>
          <p className="mt-1 text-sm text-muted-foreground">{mode === "login" ? "Hesabınıza giriş yapın" : "Yeni hesap oluşturun"}</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
              E-posta
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
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
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading || !authReady}>
            {loading
              ? (mode === "login" ? "Giriş yapılıyor…" : "Kayıt oluşturuluyor…")
              : (mode === "login" ? "Giriş Yap" : "Kayıt Ol")}
          </Button>
          <button
            type="button"
            onClick={() => setMode((value) => value === "login" ? "register" : "login")}
            className="w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {mode === "login" ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}
          </button>
        </form>
      </div>
    </main>
  );
}
