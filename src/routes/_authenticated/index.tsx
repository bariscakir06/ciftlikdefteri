import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore, formatTRY } from "@/lib/store";
import { Boxes, Receipt, TrendingUp, Wallet, ArrowUpRight, PiggyBank, Percent } from "lucide-react";
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

type Range = "weekly" | "monthly" | "quarterly" | "halfyear" | "yearly";

const RANGE_LABELS: Record<Range, string> = {
  weekly: "Haftalık (Son 12 Hafta)",
  monthly: "Aylık (Son 12 Ay)",
  quarterly: "3 Aylık (Haftalık)",
  halfyear: "6 Aylık (Aylık)",
  yearly: "Yıllık (Son 5 Yıl)",
};

const RANGE_HINTS: Record<Range, string> = {
  weekly: "Son 12 hafta",
  monthly: "Son 12 ay",
  quarterly: "Son 3 ay · haftalık dağılım",
  halfyear: "Son 6 ay · aylık dağılım",
  yearly: "Son 5 yıl",
};

function startOfWeek(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  const day = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - day);
  return x;
}

function Dashboard() {
  const { animals, sales, expenses } = useStore();
  const [range, setRange] = useState<Range>("monthly");

  const stats = useMemo(() => {
    const now = new Date();
    const totalRevenue = sales.reduce((s, x) => s + x.salePrice, 0);
    const totalCost = sales.reduce((s, x) => s + x.purchasePrice, 0);
    const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0);
    const netProfit = totalRevenue - totalCost - totalExpenses;
    const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const monthRevenue = sales
      .filter((s) => {
        const d = new Date(s.saleDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, x) => s + x.salePrice, 0);
    const monthCost = sales
      .filter((s) => {
        const d = new Date(s.saleDate);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, x) => s + x.purchasePrice, 0);
    const monthExpenses = expenses
      .filter((e) => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, x) => s + x.amount, 0);
    return {
      stock: animals.length,
      sold: sales.length,
      totalRevenue,
      monthRevenue,
      monthNet: monthRevenue - monthCost - monthExpenses,
      totalExpenses,
      netProfit,
      margin,
    };
  }, [animals, sales, expenses]);

  const chartData = useMemo(() => {
    const MONTHS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const now = new Date();

    type Bucket = { label: string; ciro: number; gider: number; kar: number; adet: number };

    const monthBuckets = (count: number): Bucket[] => {
      const buckets: (Bucket & { key: string })[] = [];
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
          label: count > 6 ? MONTHS_TR[d.getMonth()] : `${MONTHS_TR[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
          ciro: 0, gider: 0, kar: 0, adet: 0,
          key: `${d.getFullYear()}-${d.getMonth()}`,
        });
      }
      sales.forEach((s) => {
        const d = new Date(s.saleDate);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        const b = buckets.find((x) => x.key === k);
        if (b) { b.ciro += s.salePrice; b.kar += s.salePrice - s.purchasePrice; b.adet += 1; }
      });
      expenses.forEach((e) => {
        const d = new Date(e.date);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        const b = buckets.find((x) => x.key === k);
        if (b) { b.gider += e.amount; b.kar -= e.amount; }
      });
      return buckets;
    };

    const weekBuckets = (count: number): Bucket[] => {
      const buckets: (Bucket & { start: number; end: number })[] = [];
      const thisWeek = startOfWeek(now);
      for (let i = count - 1; i >= 0; i--) {
        const ws = new Date(thisWeek);
        ws.setDate(ws.getDate() - i * 7);
        const we = new Date(ws);
        we.setDate(we.getDate() + 7);
        buckets.push({
          label: `${ws.getDate()} ${MONTHS_TR[ws.getMonth()]}`,
          ciro: 0, gider: 0, kar: 0, adet: 0,
          start: ws.getTime(), end: we.getTime(),
        });
      }
      sales.forEach((s) => {
        const t = new Date(s.saleDate).getTime();
        const b = buckets.find((x) => t >= x.start && t < x.end);
        if (b) { b.ciro += s.salePrice; b.kar += s.salePrice - s.purchasePrice; b.adet += 1; }
      });
      expenses.forEach((e) => {
        const t = new Date(e.date).getTime();
        const b = buckets.find((x) => t >= x.start && t < x.end);
        if (b) { b.gider += e.amount; b.kar -= e.amount; }
      });
      return buckets;
    };

    if (range === "weekly") return weekBuckets(12);
    if (range === "quarterly") return weekBuckets(13);
    if (range === "halfyear") return monthBuckets(6);
    if (range === "monthly") return monthBuckets(12);
    const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 4 + i);
    return years.map((y) => {
      const ys = sales.filter((s) => new Date(s.saleDate).getFullYear() === y);
      const ye = expenses.filter((e) => new Date(e.date).getFullYear() === y);
      const ciro = ys.reduce((a, b) => a + b.salePrice, 0);
      const cost = ys.reduce((a, b) => a + b.purchasePrice, 0);
      const gider = ye.reduce((a, b) => a + b.amount, 0);
      return { label: String(y), ciro, gider, kar: ciro - cost - gider, adet: ys.length };
    });
  }, [sales, expenses, range]);

  const totalReceivable = sales.reduce((s, x) => s + (x.salePrice - x.paidAmount), 0);
  const profitPositive = stats.netProfit >= 0;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Genel Bakış</h1>
          <p className="mt-1 text-sm text-muted-foreground">İşletmenizin anlık özeti, kâr ve satış trendleri.</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={Boxes} label="Stok" value={String(stats.stock)} hint="aktif hayvan" tone="blue" />
        <Kpi icon={Receipt} label="Toplam Satılan" value={String(stats.sold)} hint="hayvan" tone="amber" />
        <Kpi icon={TrendingUp} label="Toplam Ciro" value={formatTRY(stats.totalRevenue)} hint="tüm zamanlar" tone="green" />
        <Kpi icon={Wallet} label="Toplam Gider" value={formatTRY(stats.totalExpenses)} hint="yem, ilaç, gübre…" tone="red" />
      </section>

      {/* Profit summary */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div
          className="rounded-xl border border-border p-5 md:col-span-2"
          style={{
            background: profitPositive
              ? "linear-gradient(135deg, color-mix(in oklab, var(--chart-1) 14%, transparent), transparent)"
              : "linear-gradient(135deg, color-mix(in oklab, var(--chart-5) 14%, transparent), transparent)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Net Kâr (Ciro − Alış − Gider)</p>
              <p
                className="mt-2 text-3xl font-semibold tabular-nums"
                style={{ color: profitPositive ? "var(--chart-1)" : "var(--chart-5)" }}
              >
                {formatTRY(stats.netProfit)}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Ciro {formatTRY(stats.totalRevenue)} · Alış {formatTRY(stats.totalRevenue - stats.netProfit - stats.totalExpenses)} · Gider {formatTRY(stats.totalExpenses)}
              </p>
            </div>
            <div
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{
                background: profitPositive
                  ? "color-mix(in oklab, var(--chart-1) 18%, transparent)"
                  : "color-mix(in oklab, var(--chart-5) 18%, transparent)",
                color: profitPositive ? "var(--chart-1)" : "var(--chart-5)",
              }}
            >
              <PiggyBank className="h-5 w-5" strokeWidth={1.75} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Kâr Oranı</p>
            <Percent className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <p
            className="mt-3 text-2xl font-semibold tabular-nums"
            style={{ color: profitPositive ? "var(--chart-1)" : "var(--chart-5)" }}
          >
            %{stats.margin.toFixed(1)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">Ciroya göre net kâr marjı</p>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div>
            <h2 className="text-sm font-semibold">Ciro · Gider · Kâr Trendi</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{RANGE_HINTS[range]}</p>
          </div>
          <Select value={range} onValueChange={(v: Range) => setRange(v)}>
            <SelectTrigger className="h-9 w-[200px] text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(RANGE_LABELS) as Range[]).map((r) => (
                <SelectItem key={r} value={r}>{RANGE_LABELS[r]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 p-5 lg:grid-cols-2">
          <div className="h-64">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Ciro (yeşil) vs Gider (kırmızı)</p>
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
                <Bar dataKey="gider" fill="var(--chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="h-64">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Net Kâr</p>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: number) => formatTRY(v)}
                />
                <Line type="monotone" dataKey="kar" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--chart-2)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {totalReceivable > 0 && (
        <section className="flex items-center justify-between rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg"
              style={{ background: "color-mix(in oklab, var(--chart-3) 18%, transparent)", color: "var(--chart-3)" }}
            >
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

      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-xs font-medium text-muted-foreground">Bu Ay Net</p>
        <p className="mt-2 text-xl font-semibold tabular-nums">{formatTRY(stats.monthNet)}</p>
      </div>
    </div>
  );
}

const TONES: Record<string, { bg: string; fg: string }> = {
  blue:  { bg: "color-mix(in oklab, var(--chart-2) 14%, transparent)", fg: "var(--chart-2)" },
  green: { bg: "color-mix(in oklab, var(--chart-1) 14%, transparent)", fg: "var(--chart-1)" },
  amber: { bg: "color-mix(in oklab, var(--chart-3) 14%, transparent)", fg: "var(--chart-3)" },
  red:   { bg: "color-mix(in oklab, var(--chart-5) 14%, transparent)", fg: "var(--chart-5)" },
};

function Kpi({
  icon: Icon, label, value, hint, tone = "blue",
}: { icon: typeof Boxes; label: string; value: string; hint: string; tone?: keyof typeof TONES }) {
  const t = TONES[tone];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <div
          className="flex h-7 w-7 items-center justify-center rounded-md"
          style={{ background: t.bg, color: t.fg }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
