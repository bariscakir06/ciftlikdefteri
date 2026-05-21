import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase";
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
  const { authReady, isAuthenticated, login } = useStore();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (authReady && isAuthenticated) navigate({ to: "/" });
  }, [authReady, isAuthenticated, navigate]);

  const getAuthErrorMessage = (error: unknown) => {
    if (!(error instanceof FirebaseError)) {
      return isSignUp ? "Kayıt oluşturulamadı" : "Geçersiz e-posta veya şifre";
    }

    if (error.code === "auth/email-already-in-use") return "Bu e-posta adresi zaten kullanılıyor";
    if (error.code === "auth/weak-password") return "Şifre en az 6 karakter olmalı";
    if (error.code === "auth/invalid-email") return "Geçerli bir e-posta adresi girin";
    if (error.code === "auth/invalid-credential") return "Geçersiz e-posta veya şifre";
    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") return "Geçersiz e-posta veya şifre";

    return isSignUp ? "Kayıt oluşturulamadı" : "Giriş yapılamadı";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSignUp && password !== confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    setLoading(true);
    try {
      const ok = isSignUp
        ? !!(await createUserWithEmailAndPassword(auth, email.trim(), password)).user
        : await login(email.trim(), password);
      setLoading(false);
      if (ok) navigate({ to: "/" });
    } catch (error) {
      setLoading(false);
      console.error(error);
      toast.error(getAuthErrorMessage(error));
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
          <p className="mt-1 text-sm text-muted-foreground">{isSignUp ? "Yeni hesap oluşturun" : "Hesabınıza giriş yapın"}</p>
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
              autoComplete={isSignUp ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </div>
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-xs font-medium text-muted-foreground">
                Şifre Tekrar
              </Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
              />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={loading || !authReady}>
            {loading
              ? (isSignUp ? "Kayıt oluşturuluyor…" : "Giriş yapılıyor…")
              : (isSignUp ? "Kayıt Ol" : "Giriş Yap")}
          </Button>
          <button
            type="button"
            onClick={() => {
              setIsSignUp((value) => !value);
              setConfirmPassword("");
            }}
            className="w-full text-center text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {isSignUp ? "Zaten hesabınız var mı? Giriş Yap" : "Hesabınız yok mu? Kayıt Ol"}
          </button>
        </form>
      </div>
    </main>
  );
}
