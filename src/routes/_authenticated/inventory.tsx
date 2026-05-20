import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useStore, formatTRY, formatDateTR, TYPE_GROUPS, BREEDS_BY_TYPE, type Animal, type AnimalType } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, HandCoins, Trash2, Search, Layers } from "lucide-react";
import { SellDialog } from "@/components/sell-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory")({
  head: () => ({ meta: [{ title: "Mevcut Mallar — Çiftlik Defteri" }] }),
  component: Inventory,
});

const OTHER_BREED = "__other__";

function Inventory() {
  const { animals, addAnimal, addAnimalsBulk, deleteAnimal } = useStore();
  const [addOpen, setAddOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [sellTarget, setSellTarget] = useState<Animal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Animal | null>(null);
  const [query, setQuery] = useState("");

  const filtered = animals.filter((a) => {
    const q = query.toLowerCase();
    return !q || a.tagNo.toLowerCase().includes(q) || a.breed.toLowerCase().includes(q) || a.type.toLowerCase().includes(q);
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mevcut Mallar</h1>
          <p className="mt-1 text-sm text-muted-foreground">{animals.length} aktif hayvan stokta.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Küpe, tür, ırk ara…"
              className="h-9 w-56 pl-8 text-sm"
            />
          </div>
          <Button variant="outline" onClick={() => setBulkOpen(true)} className="h-9">
            <Layers className="mr-1.5 h-4 w-4" strokeWidth={2} />
            Toplu Ekle
          </Button>
          <Button onClick={() => setAddOpen(true)} className="h-9">
            <Plus className="mr-1.5 h-4 w-4" strokeWidth={2} />
            Yeni Mal Ekle
          </Button>
        </div>
      </header>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs font-medium text-muted-foreground">
                <th className="px-5 py-3">Küpe No</th>
                <th className="px-5 py-3">Tür</th>
                <th className="px-5 py-3">Irk / Cins</th>
                <th className="px-5 py-3">Alış Tarihi</th>
                <th className="px-5 py-3 text-right">Alış Fiyatı</th>
                <th className="px-5 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    {animals.length === 0 ? "Henüz hayvan eklenmemiş." : "Sonuç bulunamadı."}
                  </td>
                </tr>
              )}
              {filtered.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
                  <td className="px-5 py-3 font-medium tabular-nums">{a.tagNo}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium">
                      {a.type}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{a.breed}</td>
                  <td className="px-5 py-3 text-muted-foreground">{formatDateTR(a.purchaseDate)}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{formatTRY(a.purchasePrice)}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <TooltipProvider delayDuration={150}>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSellTarget(a)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                            >
                              <HandCoins className="h-4 w-4" strokeWidth={1.75} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Satış Yap</TooltipContent>
                        </UITooltip>
                        <UITooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setDeleteTarget(a)}
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
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AddAnimalDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addAnimal} />
      <BulkAddDialog open={bulkOpen} onOpenChange={setBulkOpen} onAdd={addAnimalsBulk} />
      <SellDialog animal={sellTarget} open={!!sellTarget} onOpenChange={(b) => !b && setSellTarget(null)} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(b) => !b && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bu hayvanı silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  <span className="font-medium text-foreground">{deleteTarget.tagNo}</span> · {deleteTarget.type} · {deleteTarget.breed} stoktan kalıcı olarak kaldırılacak.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget) {
                  deleteAnimal(deleteTarget.id);
                  toast.success("Hayvan silindi");
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

function AddAnimalDialog({
  open, onOpenChange, onAdd,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onAdd: (a: Omit<Animal, "id">) => void;
}) {
  const [tagNo, setTagNo] = useState("");
  const [type, setType] = useState<AnimalType>("İnek");
  const [breedChoice, setBreedChoice] = useState<string>(BREEDS_BY_TYPE["İnek"][0]);
  const [customBreed, setCustomBreed] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [purchasePrice, setPurchasePrice] = useState("");

  const breedOptions = BREEDS_BY_TYPE[type];

  const reset = () => {
    setTagNo(""); setType("İnek");
    setBreedChoice(BREEDS_BY_TYPE["İnek"][0]); setCustomBreed("");
    setPurchaseDate(new Date().toISOString().slice(0, 10));
    setPurchasePrice("");
  };

  const handleTypeChange = (v: AnimalType) => {
    setType(v);
    setBreedChoice(BREEDS_BY_TYPE[v][0]);
    setCustomBreed("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalBreed = breedChoice === OTHER_BREED ? customBreed.trim() : breedChoice;
    if (!tagNo || !finalBreed || !purchasePrice) {
      toast.error("Lütfen tüm alanları doldurun");
      return;
    }
    onAdd({ tagNo, type, breed: finalBreed, purchaseDate, purchasePrice: Number(purchasePrice) });
    toast.success("Yeni hayvan eklendi");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(b) => { onOpenChange(b); if (!b) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Yeni Mal Ekle</DialogTitle>
          <DialogDescription>Stoğa yeni bir hayvan kaydedin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Küpe No</Label>
              <Input value={tagNo} onChange={(e) => setTagNo(e.target.value)} placeholder="TR-34-000" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tür</Label>
              <Select value={type} onValueChange={(v: AnimalType) => handleTypeChange(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_GROUPS) as Array<keyof typeof TYPE_GROUPS>).map((g, i) => (
                    <SelectGroup key={g}>
                      {i > 0 && <SelectSeparator />}
                      <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">{g}</SelectLabel>
                      {TYPE_GROUPS[g].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Irk / Cins</Label>
              <Select value={breedChoice} onValueChange={setBreedChoice}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {breedOptions.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  <SelectSeparator />
                  <SelectItem value={OTHER_BREED}>Diğer (elle gir)</SelectItem>
                </SelectContent>
              </Select>
              {breedChoice === OTHER_BREED && (
                <Input
                  value={customBreed}
                  onChange={(e) => setCustomBreed(e.target.value)}
                  placeholder="Irk / cins adı"
                  className="mt-2"
                  required
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Alış Tarihi</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Alış Fiyatı (₺)</Label>
              <Input type="number" min="0" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} required />
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

function BulkAddDialog({
  open, onOpenChange, onAdd,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onAdd: (list: Array<Omit<Animal, "id">>) => void;
}) {
  const [count, setCount] = useState("5");
  const [tagPrefix, setTagPrefix] = useState("TR-34-");
  const [tagStart, setTagStart] = useState("100");
  const [type, setType] = useState<AnimalType>("İnek");
  const [breedChoice, setBreedChoice] = useState<string>(BREEDS_BY_TYPE["İnek"][0]);
  const [customBreed, setCustomBreed] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [unitPrice, setUnitPrice] = useState("");

  const handleTypeChange = (v: AnimalType) => {
    setType(v);
    setBreedChoice(BREEDS_BY_TYPE[v][0]);
    setCustomBreed("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(count);
    const start = Number(tagStart);
    const breed = breedChoice === OTHER_BREED ? customBreed.trim() : breedChoice;
    if (!n || n < 1 || n > 500) { toast.error("Adet 1-500 arasında olmalı"); return; }
    if (!breed || !unitPrice) { toast.error("Cins ve birim fiyat zorunlu"); return; }
    const pad = String(start + n - 1).length;
    const list: Array<Omit<Animal, "id">> = Array.from({ length: n }, (_, i) => ({
      tagNo: `${tagPrefix}${String(start + i).padStart(pad, "0")}`,
      type, breed,
      purchaseDate,
      purchasePrice: Number(unitPrice),
    }));
    onAdd(list);
    toast.success(`${n} hayvan eklendi`);
    onOpenChange(false);
  };

  const previewLast = (() => {
    const n = Number(count) || 0;
    const start = Number(tagStart) || 0;
    if (n < 1) return "";
    const pad = String(start + n - 1).length;
    return `${tagPrefix}${String(start + n - 1).padStart(pad, "0")}`;
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Toplu Mal Ekle</DialogTitle>
          <DialogDescription>
            Aynı tür ve cinsten birden fazla hayvanı tek seferde ekleyin. Küpe numaraları otomatik artırılır.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Adet</Label>
              <Input type="number" min="1" max="500" value={count} onChange={(e) => setCount(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Tür</Label>
              <Select value={type} onValueChange={(v: AnimalType) => handleTypeChange(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(TYPE_GROUPS) as Array<keyof typeof TYPE_GROUPS>).map((g, i) => (
                    <SelectGroup key={g}>
                      {i > 0 && <SelectSeparator />}
                      <SelectLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">{g}</SelectLabel>
                      {TYPE_GROUPS[g].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Irk / Cins</Label>
              <Select value={breedChoice} onValueChange={setBreedChoice}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BREEDS_BY_TYPE[type].map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  <SelectSeparator />
                  <SelectItem value={OTHER_BREED}>Diğer (elle gir)</SelectItem>
                </SelectContent>
              </Select>
              {breedChoice === OTHER_BREED && (
                <Input value={customBreed} onChange={(e) => setCustomBreed(e.target.value)} placeholder="Irk / cins adı" className="mt-2" required />
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Küpe Ön Eki</Label>
              <Input value={tagPrefix} onChange={(e) => setTagPrefix(e.target.value)} placeholder="TR-34-" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Başlangıç No</Label>
              <Input type="number" min="0" value={tagStart} onChange={(e) => setTagStart(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Alış Tarihi</Label>
              <Input type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Birim Fiyat (₺)</Label>
              <Input type="number" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
            </div>
          </div>
          {previewLast && (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Önizleme: <span className="font-medium text-foreground">{tagPrefix}{String(Number(tagStart)).padStart(String(Number(tagStart) + Number(count) - 1).length, "0")}</span> → <span className="font-medium text-foreground">{previewLast}</span>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit">{count} Adet Ekle</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
