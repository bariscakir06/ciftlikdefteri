import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useStore, formatTRY, formatDateTR } from "@/lib/store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Phone, Trash2, Wallet, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/sales")({
  head: () => ({ meta: [{ title: "Satış & Cari — Çiftlik Defteri" }] }),
  component: SalesPage,
});

function SalesPage() {
  const { sales, deleteSale, updateSalePayment } = useStore();
  const [query, setQuery] = useState("");
  const [payTarget, setPayTarget] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = sales.filter((s) => {
    const q = query.toLowerCase();
    return !q || s.tagNo.toLowerCase().includes(q) || s.buyerName.toLowerCase().includes(q);
  });

  const totalRevenue = sales.reduce((a, b) => a + b.salePrice, 0);
  const totalReceivable = sales.reduce((a, b) => a + (b.salePrice - b.paidAmount), 0);
  const target = sales.find((s) => s.id === payTarget) ?? null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Satış & Cari</h1>
          <p className="mt-1 text-sm text-muted-foreground">{sales.length} satış kaydı.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Küpe veya alıcı ara…"
              className="h-9 w-56 pl-8 text-sm"
            />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Toplam Ciro" value={formatTRY(totalRevenue)} />
        <Stat label="Toplam Satış" value={`${sales.length}`} />
        <Stat
          label="Açık Bakiye"
          value={formatTRY(totalReceivable)}
          accent={totalReceivable > 0}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <th className="px-5 py-3">Satış Tarihi</th>
                <th className="px-5 py-3">Küpe No</th>
                <th className="px-5 py-3">Alıcı</th>
                <th className="px-5 py-3">Telefon</th>
                <th className="px-5 py-3 text-right">Satış Fiyatı</th>
                <th className="px-5 py-3 text-right">Kalan</th>
                <th className="px-5 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    {sales.length === 0 ? "Henüz satış yapılmadı." : "Sonuç bulunamadı."}
                  </td>
                </tr>
              )}
              {filtered.map((s, i) => {
                const balance = s.salePrice - s.paidAmount;
                return (
                  <tr key={s.id} className="border-b border-border/70 transition-colors last:border-0 even:bg-muted/20 hover:bg-[color:var(--accent)]/40">
                    <td className="px-5 py-3 text-muted-foreground">{formatDateTR(s.saleDate)}</td>
                    <td className="px-5 py-3 font-semibold tabular-nums text-foreground">{s.tagNo}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">{s.buyerName}</span>
                        <span className="text-xs text-muted-foreground">{s.animalType} · {s.breed}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {s.buyerPhone ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3 w-3" strokeWidth={1.75} />
                          {s.buyerPhone}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-foreground">{formatTRY(s.salePrice)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {balance > 0 ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                          style={{ background: "color-mix(in oklab, var(--chart-5) 16%, transparent)", color: "var(--chart-5)" }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--chart-5)" }} />
                          {formatTRY(balance)}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold"
                          style={{ background: "color-mix(in oklab, var(--chart-1) 16%, transparent)", color: "var(--chart-1)" }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--chart-1)" }} />
                          Kapalı
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <TooltipProvider delayDuration={150}>
                          {balance > 0 && (
                            <UITooltip>
                              <TooltipTrigger asChild>
                                <button
                                  onClick={() => { setPayTarget(s.id); setPayAmount(String(balance)); }}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                                >
                                  <Wallet className="h-4 w-4" strokeWidth={1.75} />
                                </button>
                              </TooltipTrigger>
                              <TooltipContent>Tahsilat</TooltipContent>
                            </UITooltip>
                          )}
                          <UITooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setDeleteTarget(s.id)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>Sil</TooltipContent>
                          </UITooltip>
                        </TooltipProvider>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!payTarget} onOpenChange={(b) => !b && setPayTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Tahsilat Ekle</DialogTitle>
            <DialogDescription>
              {target && <>{target.buyerName} · kalan {formatTRY(target.salePrice - target.paidAmount)}</>}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tahsil Edilen Tutar (₺)</Label>
            <Input type="number" min="0" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPayTarget(null)}>İptal</Button>
            <Button
              onClick={async () => {
                if (!target) return;
                const add = Number(payAmount);
                const newPaid = Math.min(target.salePrice, target.paidAmount + add);
                try {
                  await updateSalePayment(target.id, newPaid);
                  toast.success("Tahsilat kaydedildi");
                  setPayTarget(null);
                } catch (error) {
                  console.error(error);
                  toast.error("Tahsilat kaydedilemedi");
                }
              }}
            >
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(b) => !b && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Satış kaydını silmek istiyor musunuz?</AlertDialogTitle>
            <AlertDialogDescription>Bu işlem geri alınamaz.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteSale(deleteTarget)
                    .then(() => toast.success("Satış silindi"))
                    .catch((error) => {
                      console.error(error);
                      toast.error("Satış silinemedi");
                    });
                  setDeleteTarget(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1.5 text-lg font-semibold tabular-nums ${accent ? "text-destructive" : ""}`}>{value}</p>
    </div>
  );
}
