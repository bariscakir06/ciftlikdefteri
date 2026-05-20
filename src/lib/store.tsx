import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AnimalType = "Düve" | "Tosun" | "İnek" | "Buzağı" | "Boğa";

export interface Animal {
  id: string;
  tagNo: string;
  type: AnimalType;
  breed: string;
  purchaseDate: string;
  purchasePrice: number;
}

export interface Sale {
  id: string;
  animalId: string;
  tagNo: string;
  animalType: AnimalType;
  breed: string;
  purchasePrice: number;
  saleDate: string;
  buyerName: string;
  buyerPhone: string;
  salePrice: number;
  paidAmount: number;
}

interface StoreState {
  isAuthenticated: boolean;
  animals: Animal[];
  sales: Sale[];
  login: (u: string, p: string) => boolean;
  logout: () => void;
  addAnimal: (a: Omit<Animal, "id">) => void;
  deleteAnimal: (id: string) => void;
  sellAnimal: (s: Omit<Sale, "id" | "tagNo" | "animalType" | "breed" | "purchasePrice">) => void;
  deleteSale: (id: string) => void;
  updateSalePayment: (id: string, paidAmount: number) => void;
}

const StoreCtx = createContext<StoreState | null>(null);

const SEED_ANIMALS: Animal[] = [
  { id: "a1", tagNo: "TR-34-001", type: "Düve", breed: "Holstein", purchaseDate: "2025-08-12", purchasePrice: 42000 },
  { id: "a2", tagNo: "TR-34-002", type: "Tosun", breed: "Simental", purchaseDate: "2025-09-03", purchasePrice: 38500 },
  { id: "a3", tagNo: "TR-34-003", type: "İnek", breed: "Holstein", purchaseDate: "2025-07-21", purchasePrice: 55000 },
  { id: "a4", tagNo: "TR-34-004", type: "Tosun", breed: "Angus", purchaseDate: "2025-10-15", purchasePrice: 47000 },
];

const SEED_SALES: Sale[] = [
  {
    id: "s1",
    animalId: "x1",
    tagNo: "TR-34-100",
    animalType: "Tosun",
    breed: "Simental",
    purchasePrice: 35000,
    saleDate: "2025-11-04",
    buyerName: "Mehmet Yılmaz",
    buyerPhone: "0532 555 1122",
    salePrice: 52000,
    paidAmount: 52000,
  },
  {
    id: "s2",
    animalId: "x2",
    tagNo: "TR-34-101",
    animalType: "Düve",
    breed: "Holstein",
    purchasePrice: 40000,
    saleDate: "2026-02-18",
    buyerName: "Ahmet Kaya",
    buyerPhone: "0533 444 2211",
    salePrice: 58000,
    paidAmount: 30000,
  },
  {
    id: "s3",
    animalId: "x3",
    tagNo: "TR-34-102",
    animalType: "İnek",
    breed: "Holstein",
    purchasePrice: 50000,
    saleDate: "2026-04-09",
    buyerName: "Hasan Demir",
    buyerPhone: "0535 222 9988",
    salePrice: 71000,
    paidAmount: 71000,
  },
  {
    id: "s4",
    animalId: "x4",
    tagNo: "TR-34-103",
    animalType: "Tosun",
    breed: "Angus",
    purchasePrice: 44000,
    saleDate: "2026-05-02",
    buyerName: "Ali Şahin",
    buyerPhone: "0534 111 7766",
    salePrice: 63000,
    paidAmount: 63000,
  },
];

const KEY = "ciftlik-defteri-v1";

interface Persisted {
  animals: Animal[];
  sales: Sale[];
  isAuthenticated: boolean;
}

function loadPersisted(): Persisted {
  if (typeof window === "undefined") {
    return { animals: SEED_ANIMALS, sales: SEED_SALES, isAuthenticated: false };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { animals: SEED_ANIMALS, sales: SEED_SALES, isAuthenticated: false };
    return JSON.parse(raw);
  } catch {
    return { animals: SEED_ANIMALS, sales: SEED_SALES, isAuthenticated: false };
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [animals, setAnimals] = useState<Animal[]>(SEED_ANIMALS);
  const [sales, setSales] = useState<Sale[]>(SEED_SALES);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = loadPersisted();
    setAnimals(p.animals);
    setSales(p.sales);
    setIsAuthenticated(p.isAuthenticated);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify({ animals, sales, isAuthenticated }));
  }, [animals, sales, isAuthenticated, hydrated]);

  const value: StoreState = {
    isAuthenticated,
    animals,
    sales,
    login: (u, p) => {
      if (u === "admin" && p === "admin") {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    },
    logout: () => setIsAuthenticated(false),
    addAnimal: (a) => setAnimals((prev) => [{ ...a, id: crypto.randomUUID() }, ...prev]),
    deleteAnimal: (id) => setAnimals((prev) => prev.filter((x) => x.id !== id)),
    sellAnimal: (s) => {
      const animal = animals.find((a) => a.id === s.animalId);
      if (!animal) return;
      const sale: Sale = {
        ...s,
        id: crypto.randomUUID(),
        tagNo: animal.tagNo,
        animalType: animal.type,
        breed: animal.breed,
        purchasePrice: animal.purchasePrice,
      };
      setSales((prev) => [sale, ...prev]);
      setAnimals((prev) => prev.filter((a) => a.id !== s.animalId));
    },
    deleteSale: (id) => setSales((prev) => prev.filter((s) => s.id !== id)),
    updateSalePayment: (id, paidAmount) =>
      setSales((prev) => prev.map((s) => (s.id === id ? { ...s, paidAmount } : s))),
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore outside provider");
  return ctx;
}

export const formatTRY = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);

export const formatDateTR = (s: string) => {
  try {
    return new Date(s).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return s;
  }
};
