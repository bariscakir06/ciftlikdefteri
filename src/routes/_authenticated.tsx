import { createFileRoute, Outlet, Navigate, Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { LayoutGrid, Boxes, Receipt, LogOut, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

const NAV = [
  { to: "/", label: "Genel Bakış", icon: LayoutGrid, exact: true },
  { to: "/inventory", label: "Mevcut Mallar", icon: Boxes },
  { to: "/sales", label: "Satış & Cari", icon: Receipt },
] as const;

function AuthLayout() {
  const { isAuthenticated, logout } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card">
            <Sprout className="h-4 w-4" strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Çiftlik Defteri</p>
            <p className="text-[11px] text-muted-foreground">Stok & Satış</p>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV.map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={() => { logout(); navigate({ to: "/login" }); }}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile topbar */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border bg-card/50 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4" strokeWidth={1.75} />
            <span className="text-sm font-semibold">Çiftlik Defteri</span>
          </div>
          <button onClick={() => { logout(); navigate({ to: "/login" }); }} className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </header>

        {/* Mobile bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-10 flex border-t border-border bg-card md:hidden">
          {NAV.map((n) => {
            const active = n.exact ? location.pathname === n.to : location.pathname.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} />
                {n.label}
              </Link>
            );
          })}
        </nav>

        <main className="flex-1 overflow-auto pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
