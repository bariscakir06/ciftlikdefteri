import { useState, type FormEvent } from "react";
import { useStore, type Animal, formatTRY } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function SellDialog({
  animal,
  open,
  onOpenChange,
}: {
  animal: Animal | null;
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  const { sellAnimal } = useStore();
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));

  const reset = () => {
    setBuyerName(""); setBuyerPhone(""); setSalePrice(""); setPaidAmount("");
    setSaleDate(new Date().toISOString().slice(0, 10));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!animal) return;
    const price = Number(salePrice);
    const paid = paidAmount === "" ? price : Number(paidAmount);
    if (!buyerName || !price) {
      toast.error("Alıcı adı ve satış fiyatı zorunlu");
      return;
    }
    sellAnimal({
      animalId: animal.id,
      buyerName,
      buyerPhone,
      salePrice: price,
      paidAmount: paid,
      saleDate,
    });
    toast.success("Satış kaydedildi");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(b) => { onOpenChange(b); if (!b) reset(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Satış Yap</DialogTitle>
          <DialogDescription>
            {animal ? (
              <>
                <span className="font-medium text-foreground">{animal.tagNo}</span> · {animal.type} · {animal.breed}
                <span className="ml-2 text-muted-foreground">(Alış {formatTRY(animal.purchasePrice)})</span>
              </>
            ) : "—"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Alıcı Adı</Label>
              <Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Telefon</Label>
              <Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} placeholder="0500 000 0000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Satış Tarihi</Label>
              <Input type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Satış Fiyatı (₺)</Label>
              <Input type="number" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Ödenen (₺)</Label>
              <Input type="number" min="0" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} placeholder="Tamamı" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit">Satışı Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
