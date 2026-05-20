import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { auth, db } from "@/firebase";

export type AnimalType =
  // Büyükbaş
  | "İnek" | "Düve" | "Tosun" | "Buzağı" | "Boğa"
  // Küçükbaş
  | "Koyun" | "Kuzu" | "Koç" | "Keçi" | "Oğlak" | "Teke"
  // Kümes
  | "Tavuk" | "Horoz" | "Civciv" | "Hindi" | "Palaz";

export type AnimalGroup = "Büyükbaş" | "Küçükbaş" | "Kümes";
export type AnimalStatus = "Aktif" | "Satıldı";

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

interface TenantDoc {
  userId: string;
}

export interface Animal extends TenantDoc {
  id: string;
  tagNo: string;
  type: AnimalType;
  breed: string;
  purchaseDate: string;
  purchasePrice: number;
  status: AnimalStatus;
}

export interface Sale extends TenantDoc {
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

export interface Expense extends TenantDoc {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
}

interface StoreState {
  authReady: boolean;
  currentUser: User | null;
  isAuthenticated: boolean;
  animals: Animal[];
  sales: Sale[];
  expenses: Expense[];
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  addAnimal: (a: Omit<Animal, "id" | "userId" | "status">) => Promise<void>;
  addAnimalsBulk: (list: Array<Omit<Animal, "id" | "userId" | "status">>) => Promise<void>;
  deleteAnimal: (id: string) => Promise<void>;
  sellAnimal: (s: Omit<Sale, "id" | "userId" | "tagNo" | "animalType" | "breed" | "purchasePrice">) => Promise<void>;
  deleteSale: (id: string) => Promise<void>;
  updateSalePayment: (id: string, paidAmount: number) => Promise<void>;
  addExpense: (e: Omit<Expense, "id" | "userId">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
}

const StoreCtx = createContext<StoreState | null>(null);

function requireUser(user: User | null) {
  if (!user) throw new Error("Oturum bulunamadı");
  return user;
}

function asAnimal(snap: QueryDocumentSnapshot<DocumentData>): Animal {
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    tagNo: data.tagNo ?? "",
    type: data.type ?? "İnek",
    breed: data.breed ?? "",
    purchaseDate: data.purchaseDate ?? "",
    purchasePrice: Number(data.purchasePrice ?? 0),
    status: data.status === "Satıldı" ? "Satıldı" : "Aktif",
  };
}

function asSale(snap: QueryDocumentSnapshot<DocumentData>): Sale {
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    animalId: data.animalId ?? "",
    tagNo: data.tagNo ?? "",
    animalType: data.animalType ?? "İnek",
    breed: data.breed ?? "",
    purchasePrice: Number(data.purchasePrice ?? 0),
    saleDate: data.saleDate ?? "",
    buyerName: data.buyerName ?? "",
    buyerPhone: data.buyerPhone ?? "",
    salePrice: Number(data.salePrice ?? 0),
    paidAmount: Number(data.paidAmount ?? 0),
  };
}

function asExpense(snap: QueryDocumentSnapshot<DocumentData>): Expense {
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    date: data.date ?? "",
    category: data.category ?? "Diğer",
    description: data.description ?? "",
    amount: Number(data.amount ?? 0),
  };
}

function sortDescByDate<T>(list: T[], getDate: (item: T) => string) {
  return [...list].sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allAnimals, setAllAnimals] = useState<Animal[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthReady(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setAllAnimals([]);
      setSales([]);
      setExpenses([]);
      return;
    }

    const uid = currentUser.uid;
    const animalsQuery = query(collection(db, "animals"), where("userId", "==", uid));
    const salesQuery = query(collection(db, "sales"), where("userId", "==", uid));
    const expensesQuery = query(collection(db, "expenses"), where("userId", "==", uid));

    const unsubAnimals = onSnapshot(animalsQuery, (snapshot) => {
      setAllAnimals(sortDescByDate(snapshot.docs.map(asAnimal), (animal) => animal.purchaseDate));
    });
    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      setSales(sortDescByDate(snapshot.docs.map(asSale), (sale) => sale.saleDate));
    });
    const unsubExpenses = onSnapshot(expensesQuery, (snapshot) => {
      setExpenses(sortDescByDate(snapshot.docs.map(asExpense), (expense) => expense.date));
    });

    return () => {
      unsubAnimals();
      unsubSales();
      unsubExpenses();
    };
  }, [currentUser]);

  const animals = useMemo(() => allAnimals.filter((animal) => animal.status !== "Satıldı"), [allAnimals]);

  const value: StoreState = {
    authReady,
    currentUser,
    isAuthenticated: !!currentUser,
    animals,
    sales,
    expenses,
    login: async (email, password) => {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    },
    register: async (email, password) => {
      await setPersistence(auth, browserLocalPersistence);
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    },
    logout: async () => {
      await signOut(auth);
    },
    addAnimal: async (animal) => {
      const user = requireUser(currentUser);
      await addDoc(collection(db, "animals"), {
        ...animal,
        userId: user.uid,
        status: "Aktif" satisfies AnimalStatus,
      });
    },
    addAnimalsBulk: async (list) => {
      const user = requireUser(currentUser);
      const batch = writeBatch(db);
      list.forEach((animal) => {
        const ref = doc(collection(db, "animals"));
        batch.set(ref, {
          ...animal,
          userId: user.uid,
          status: "Aktif" satisfies AnimalStatus,
        });
      });
      await batch.commit();
    },
    deleteAnimal: async (id) => {
      requireUser(currentUser);
      await deleteDoc(doc(db, "animals", id));
    },
    sellAnimal: async (saleDraft) => {
      const user = requireUser(currentUser);
      const animal = animals.find((a) => a.id === saleDraft.animalId);
      if (!animal || animal.userId !== user.uid) throw new Error("Hayvan bulunamadı");

      const batch = writeBatch(db);
      const animalRef = doc(db, "animals", animal.id);
      const saleRef = doc(collection(db, "sales"));

      batch.update(animalRef, { status: "Satıldı" satisfies AnimalStatus });
      batch.set(saleRef, {
        ...saleDraft,
        userId: user.uid,
        tagNo: animal.tagNo,
        animalType: animal.type,
        breed: animal.breed,
        purchasePrice: animal.purchasePrice,
      });

      await batch.commit();
    },
    deleteSale: async (id) => {
      requireUser(currentUser);
      await deleteDoc(doc(db, "sales", id));
    },
    updateSalePayment: async (id, paidAmount) => {
      requireUser(currentUser);
      await updateDoc(doc(db, "sales", id), { paidAmount });
    },
    addExpense: async (expense) => {
      const user = requireUser(currentUser);
      await addDoc(collection(db, "expenses"), { ...expense, userId: user.uid });
    },
    deleteExpense: async (id) => {
      requireUser(currentUser);
      await deleteDoc(doc(db, "expenses", id));
    },
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
