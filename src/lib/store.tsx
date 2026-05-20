import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AnimalType =
  // Büyükbaş
  | "İnek" | "Düve" | "Tosun" | "Buzağı" | "Boğa"
  // Küçükbaş
  | "Koyun" | "Kuzu" | "Koç" | "Keçi" | "Oğlak" | "Teke"
  // Kümes
  | "Tavuk" | "Horoz" | "Civciv" | "Hindi" | "Palaz";

export type AnimalGroup = "Büyükbaş" | "Küçükbaş" | "Kümes";

export const TYPE_GROUPS: Record<AnimalGroup, AnimalType[]> = {
  "Büyükbaş": ["İnek", "Düve", "Tosun", "Buzağı", "Boğa"],
  "Küçükbaş": ["Koyun", "Kuzu", "Koç", "Keçi", "Oğlak", "Teke"],
  "Kümes": ["Tavuk", "Horoz", "Civciv", "Hindi", "Palaz"],
};

const CATTLE_BREEDS = ["Holstein", "Simental", "Montofon", "Jersey", "Angus", "Şarole", "Yerli Kara", "Melez"];
const SHEEP_BREEDS = ["Merinos", "Akkaraman", "Kıvırcık", "Sakız", "İvesi", "Karayaka", "Romanov", "Morkaraman"];
const GOAT_BREEDS = ["Saanen", "Kıl Keçisi", "Ankara (Tiftik)", "Halep (Şami)", "Alpin", "Honamlı"];
const CHICKEN_BREEDS = ["Yumurtacı (Lohmann)", "Etlik (Ross)", "Köy Tavuğu", "Denizli", "Gerze", "Sebright"];
const TURKEY_BREEDS = ["Bronz", "Beyaz", "Bursa Hindisi", "Siyah Kanatlı"];

export const BREEDS_BY_TYPE: Record<AnimalType, string[]> = {
  "İnek": CATTLE_BREEDS, "Düve": CATTLE_BREEDS, "Tosun": CATTLE_BREEDS, "Buzağı": CATTLE_BREEDS, "Boğa": CATTLE_BREEDS,
  "Koyun": SHEEP_BREEDS, "Kuzu": SHEEP_BREEDS, "Koç": SHEEP_BREEDS,
  "Keçi": GOAT_BREEDS, "Oğlak": GOAT_BREEDS, "Teke": GOAT_BREEDS,
  "Tavuk": CHICKEN_BREEDS, "Horoz": CHICKEN_BREEDS, "Civciv": CHICKEN_BREEDS,
  "Hindi": TURKEY_BREEDS, "Palaz": TURKEY_BREEDS,
};

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

export type ExpenseCategory =
  | "Yem"
  | "Gübre"
  | "Veteriner / İlaç"
  | "Aşı"
  | "İşçilik"
  | "Yakıt"
  | "Elektrik / Su"
  | "Nakliye"
  | "Bakım / Onarım"
  | "Diğer";

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Yem", "Gübre", "Veteriner / İlaç", "Aşı", "İşçilik",
  "Yakıt", "Elektrik / Su", "Nakliye", "Bakım / Onarım", "Diğer",
];

export const EXPENSE_COLORS: Record<ExpenseCategory, string> = {
  "Yem": "var(--chart-4)",
  "Gübre": "var(--chart-3)",
  "Veteriner / İlaç": "var(--chart-5)",
  "Aşı": "var(--chart-1)",
  "İşçilik": "var(--chart-2)",
  "Yakıt": "var(--chart-5)",
  "Elektrik / Su": "var(--chart-3)",
  "Nakliye": "var(--chart-1)",
  "Bakım / Onarım": "var(--chart-2)",
  "Diğer": "var(--chart-4)",
};

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
}

interface StoreState {
  isAuthenticated: boolean;
  animals: Animal[];
  sales: Sale[];
  expenses: Expense[];
  login: (u: string, p: string) => boolean;
  logout: () => void;
  addAnimal: (a: Omit<Animal, "id">) => void;
  addAnimalsBulk: (list: Array<Omit<Animal, "id">>) => void;
  deleteAnimal: (id: string) => void;
  sellAnimal: (s: Omit<Sale, "id" | "tagNo" | "animalType" | "breed" | "purchasePrice">) => void;
  deleteSale: (id: string) => void;
  updateSalePayment: (id: string, paidAmount: number) => void;
  addExpense: (e: Omit<Expense, "id">) => void;
  deleteExpense: (id: string) => void;
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

const SEED_EXPENSES: Expense[] = [
  { id: "e1", date: "2026-04-08", category: "Yem", description: "TMR yem 2 ton", amount: 18500 },
  { id: "e2", date: "2026-04-22", category: "Veteriner / İlaç", description: "Antibiyotik & vitamin", amount: 3200 },
  { id: "e3", date: "2026-05-03", category: "Gübre", description: "Ahır temizliği & gübre çıkışı", amount: 1500 },
  { id: "e4", date: "2026-05-10", category: "İşçilik", description: "Aylık çoban ücreti", amount: 12000 },
];

const KEY = "ciftlik-defteri-v1";

interface Persisted {
  animals: Animal[];
  sales: Sale[];
  expenses: Expense[];
  isAuthenticated: boolean;
}

function loadPersisted(): Persisted {
  const fallback = { animals: SEED_ANIMALS, sales: SEED_SALES, expenses: SEED_EXPENSES, isAuthenticated: false };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return { ...fallback, ...parsed, expenses: parsed.expenses ?? SEED_EXPENSES };
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [animals, setAnimals] = useState<Animal[]>(SEED_ANIMALS);
  const [sales, setSales] = useState<Sale[]>(SEED_SALES);
  const [expenses, setExpenses] = useState<Expense[]>(SEED_EXPENSES);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = loadPersisted();
    setAnimals(p.animals);
    setSales(p.sales);
    setExpenses(p.expenses);
    setIsAuthenticated(p.isAuthenticated);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify({ animals, sales, expenses, isAuthenticated }));
  }, [animals, sales, expenses, isAuthenticated, hydrated]);

  const value: StoreState = {
    isAuthenticated,
    animals,
    sales,
    expenses,
    login: (u, p) => {
      if (u === "admin" && p === "admin") {
        setIsAuthenticated(true);
        return true;
      }
      return false;
    },
    logout: () => setIsAuthenticated(false),
    addAnimal: (a) => setAnimals((prev) => [{ ...a, id: crypto.randomUUID() }, ...prev]),
    addAnimalsBulk: (list) =>
      setAnimals((prev) => [
        ...list.map((a) => ({ ...a, id: crypto.randomUUID() })),
        ...prev,
      ]),
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
    addExpense: (e) => setExpenses((prev) => [{ ...e, id: crypto.randomUUID() }, ...prev]),
    deleteExpense: (id) => setExpenses((prev) => prev.filter((x) => x.id !== id)),
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
