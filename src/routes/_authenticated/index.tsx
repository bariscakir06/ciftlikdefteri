import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, formatTRY } from "@/lib/store";
import { Boxes, Receipt, TrendingUp, Wallet, ArrowUpRight } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Genel Bakış — Çiftlik Defteri" }] }),
  component: Dashboard,
});

const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

function Dashboard() {
  const { animals, sales } = useStore();
  const [range, setRange] = useState<"monthly" | "yearly">("monthly");

  const stats = useMemo(() => {
    const now = new Date();
    const totalRevenue = sales.reduce((s, x) => s + x.salePrice, 0);
    const monthRevenue = sales
      .filter((s) => {
        const d = new Date(s.saleDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, x) => s + x.salePrice, 0);
    return {
      stock: animals.length,
      sold: sales.length,
      totalRevenue,
      monthRevenue,
    };
  }, [animals, sales]);

  const chartData = useMemo(() => {
    if (range === "monthly") {
      // last 12 months
      const now = new Date();
      const buckets: { label: string; ciro: number; adet: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({ label: MONTHS_TR[d.getMonth()], ciro: 0, adet: 0 });
      }
      sales.forEach((s) => {
        const d = new Date(s.saleDate);
        const diff = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
        if (diff >= 0 && diff < 12) {
          const idx = 11 - diff;
          buckets[idx].ciro += s.salePrice;
          buckets[idx].adet += 1;
        }
      });
      return buckets;
    }
    // yearly: last 5 years
    const now = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => now - 4 + i);
    return years.map((y) => {
      const yearly = sales.filter((s) => new Date(s.saleDate).getFullYear() === y);
      return {
        label: String(y),
        ciro: yearly.reduce((a, b) => a + b.salePrice, 0),
        adet: yearly.length,
      };
    });
  }, [sales, range]);

  const totalReceivable = sales.reduce((s, x) => s + (x.salePrice - x.paidAmount), 0);

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Genel Bakış</h1>
          <p className="mt-1 text-sm text-muted-foreground">İşletmenizin anlık özeti ve satış trendleri.</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Boxes} label="Güncel Hayvan Stoğu" value={String(stats.stock)} hint="aktif hayvan" />
        <Kpi icon={Receipt} label="Toplam Satılan" value={String(stats.sold)} hint="hayvan" />
        <Kpi icon={TrendingUp} label="Toplam Ciro" value={formatTRY(stats.totalRevenue)} hint="tüm zamanlar" />
        <Kpi icon={Wallet} label="Bu Ay" value={formatTRY(stats.monthRevenue)} hint="aylık satış" />
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="text-sm font-semibold">Satış Trendi</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {range === "monthly" ? "Son 12 ay" : "Son 5 yıl"} · ciro ve adet
            </p>
          </div>
          <Select value={range} onValueChange={(v: "monthly" | "yearly") => setRange(v)}>
            <SelectTrigger className="h-9 w-[150px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Aylık Rapor</SelectItem>
              <SelectItem value="yearly">Yıllık Rapor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <div className="h-64">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Ciro (₺)</p>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatTRY(v)}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="ciro" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Satış Adedi</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="adet" stroke="var(--chart-2)" strokeWidth={2} dot={{ r: 3, fill: "var(--chart-2)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {totalReceivable > 0 && (
        <section className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div>
              <p className="text-sm font-medium">Açık Cari Bakiye</p>
              <p className="text-xs text-muted-foreground">Müşterilerden tahsil edilecek toplam</p>
            </div>
          </div>
          <p className="text-lg font-semibold tabular-nums">{formatTRY(totalReceivable)}</p>
        </section>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon, label, value, hint,
}: { icon: typeof Boxes; label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
