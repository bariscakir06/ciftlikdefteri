import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import {
  useStore, formatTRY, formatDateTR,
  EXPENSE_CATEGORIES, EXPENSE_COLORS, type ExpenseCategory,
} from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({ meta: [{ title: "Giderler — Çiftlik Defteri" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { expenses, addExpense, deleteExpense } = useStore();
  const [open, setOpen] = useState(false);

  const total = useMemo(() => expenses.reduce((s, x) => s + x.amount, 0), [expenses]);
  const byCat = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    expenses.forEach((e) => map.set(e.category, (map.get(e.category) || 0) + e.amount));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Giderler</h1>
          <p className="mt-1 text-sm text-muted-foreground">Yem, gübre, ilaç ve diğer işletme harcamaları.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="h-9">
          <Plus className="mr-1.5 h-4 w-4" /> Yeni Gider Ekle
        </Button>
      </header>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-gradient-to-br from-[color:var(--chart-5)]/10 to-transparent p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Toplam Gider</p>
            <Wallet className="h-4 w-4 text-[color:var(--chart-5)]" strokeWidth={1.75} />
          </div>
          <p className="mt-3 text-2xl font-semibold tabular-nums">{formatTRY(total)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{expenses.length} kayıt</p>
        </div>
        <div className="md:col-span-2 rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium text-muted-foreground">Kategori Dağılımı</p>
          <div className="mt-3 space-y-2">
            {byCat.length === 0 && <p className="text-sm text-muted-foreground">Henüz gider yok.</p>}
            {byCat.map(([cat, amt]) => {
              const pct = total ? (amt / total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{cat}</span>
                    <span className="tabular-nums text-muted-foreground">{formatTRY(amt)} · %{pct.toFixed(0)}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: EXPENSE_COLORS[cat] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3">Tarih</th>
                <th className="px-5 py-3">Kategori</th>
                <th className="px-5 py-3">Açıklama</th>
                <th className="px-5 py-3 text-right">Tutar</th>
                <th className="px-5 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-16 text-center text-sm text-muted-foreground">Henüz gider girilmemiş.</td></tr>
              )}
              {expenses.map((e) => (
                <tr key={e.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                  <td className="px-5 py-3 text-muted-foreground">{formatDateTR(e.date)}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-xs font-medium"
                      style={{ background: `color-mix(in oklab, ${EXPENSE_COLORS[e.category]} 12%, transparent)` }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: EXPENSE_COLORS[e.category] }} />
                      {e.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{e.description || "—"}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatTRY(e.amount)}</td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => { deleteExpense(e.id); toast.success("Gider silindi"); }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddExpenseDialog open={open} onOpenChange={setOpen} onAdd={addExpense} />
    </div>
  );
}

function AddExpenseDialog({
  open, onOpenChange, onAdd,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onAdd: (e: { date: string; category: ExpenseCategory; description: string; amount: number }) => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>("Yem");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");

  const reset = () => {
    setDate(new Date().toISOString().slice(0, 10));
    setCategory("Yem"); setDescription(""); setAmount("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!amount) { toast.error("Tutar girin"); return; }
    onAdd({ date, category, description: description.trim(), amount: Number(amount) });
    toast.success("Gider eklendi");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(b) => { onOpenChange(b); if (!b) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Gider Ekle</DialogTitle>
          <DialogDescription>İşletme harcamasını kaydedin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tarih</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Kategori</Label>
              <Select value={category} onValueChange={(v: ExpenseCategory) => setCategory(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Açıklama</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Opsiyonel" />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tutar (₺)</Label>
              <Input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
