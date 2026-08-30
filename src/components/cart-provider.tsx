"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { CartLine, MarketEvent, Product, Size } from "@/lib/types";

const STORAGE_KEY = "bone-koboyi.cart.v1";

interface AddLineInput {
  product: Product;
  size: Size;
  color: string;
  quantity?: number;
}

interface CartContextValue {
  lines: CartLine[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addLine: (input: AddLineInput) => void;
  /** Add if missing; remove if that size/color is already in the bag. */
  toggleLine: (input: AddLineInput) => "added" | "removed";
  hasLine: (productId: string, size: Size, color: string) => boolean;
  findLine: (productId: string, size: Size, color: string) => CartLine | undefined;
  addTicket: (event: MarketEvent, quantity?: number) => void;
  toggleTicket: (event: MarketEvent) => "added" | "removed";
  updateQuantity: (lineId: string, quantity: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  makeLineId: typeof makeLineId;
}

const CartContext = createContext<CartContextValue | null>(null);

export function makeLineId(productId: string, size: Size, color: string) {
  return `${productId}:${size}:${color}`;
}

function parseStoredLines(raw: string | null): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter((line): line is CartLine => {
      if (typeof line !== "object" || line === null) return false;
      const candidate = line as Partial<CartLine>;
      return (
        typeof candidate.id === "string" &&
        typeof candidate.productId === "string" &&
        typeof candidate.slug === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.price === "number" &&
        typeof candidate.quantity === "number" &&
        candidate.quantity > 0
      );
    });
  } catch {
    return [];
  }
}

const listeners = new Set<() => void>();
let cachedRaw: string | null | undefined;
let cachedLines: CartLine[] = [];

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getLinesSnapshot(): CartLine[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedLines = parseStoredLines(raw);
  }
  return cachedLines;
}

function writeLines(lines: CartLine[]) {
  cachedRaw = JSON.stringify(lines);
  cachedLines = lines;
  try {
    window.localStorage.setItem(STORAGE_KEY, cachedRaw);
  } catch {
    // Private browsing or a full quota: keep the in-memory cart working.
  }
  emit();
}

const EMPTY_LINES: CartLine[] = [];
const getServerLines = () => EMPTY_LINES;

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const storeLines = useSyncExternalStore(
    subscribe,
    getLinesSnapshot,
    getServerLines,
  );
  const lines = hydrated ? storeLines : EMPTY_LINES;

  const addLine = useCallback(({ product, size, color, quantity = 1 }: AddLineInput) => {
    if (!product.inStock || product.stockQuantity <= 0) return;
    const id = makeLineId(product.id, size, color);
    const current = getLinesSnapshot();
    const existing = current.find((line) => line.id === id);
    const usedElsewhere = current
      .filter((line) => line.productId === product.id && line.id !== id)
      .reduce((sum, line) => sum + line.quantity, 0);
    const stockCap = Math.max(0, Math.min(99, product.stockQuantity - usedElsewhere));
    if (stockCap <= 0) return;

    writeLines(
      existing
        ? current.map((line) =>
            line.id === id
              ? {
                  ...line,
                  quantity: Math.min(line.quantity + quantity, stockCap),
                  stockCap,
                }
              : line,
          )
        : [
            ...current,
            {
              id,
              productId: product.id,
              slug: product.slug,
              name: product.name,
              price: product.price,
              size,
              color,
              image: product.images[0],
              quantity: Math.min(quantity, stockCap),
              kind: "product" as const,
              stockCap,
            },
          ],
    );
  }, []);

  const toggleLine = useCallback((input: AddLineInput): "added" | "removed" => {
    const id = makeLineId(input.product.id, input.size, input.color);
    const current = getLinesSnapshot();
    if (current.some((line) => line.id === id)) {
      writeLines(current.filter((line) => line.id !== id));
      return "removed";
    }
    addLine(input);
    return "added";
  }, [addLine]);

  const hasLine = useCallback((productId: string, size: Size, color: string) => {
    const id = makeLineId(productId, size, color);
    return getLinesSnapshot().some((line) => line.id === id);
  }, []);

  const findLine = useCallback((productId: string, size: Size, color: string) => {
    const id = makeLineId(productId, size, color);
    return getLinesSnapshot().find((line) => line.id === id);
  }, []);

  const addTicket = useCallback((event: MarketEvent, quantity = 1) => {
    if (event.ticketsLeft <= 0) return;
    const id = makeLineId(event.id, "OS", "Ticket");
    const current = getLinesSnapshot();
    const existing = current.find((line) => line.id === id);
    const maxQty = Math.min(event.ticketsLeft, 10);

    writeLines(
      existing
        ? current.map((line) =>
            line.id === id
              ? {
                  ...line,
                  quantity: Math.min(line.quantity + quantity, maxQty),
                }
              : line,
          )
        : [
            ...current,
            {
              id,
              productId: event.id,
              slug: event.slug,
              name: `${event.title} · ticket`,
              price: event.price,
              size: "OS",
              color: "Ticket",
              image: event.image,
              quantity: Math.min(quantity, maxQty),
              kind: "ticket",
            },
          ],
    );
  }, []);

  const toggleTicket = useCallback((event: MarketEvent): "added" | "removed" => {
    const id = makeLineId(event.id, "OS", "Ticket");
    const current = getLinesSnapshot();
    if (current.some((line) => line.id === id)) {
      writeLines(current.filter((line) => line.id !== id));
      return "removed";
    }
    addTicket(event, 1);
    return "added";
  }, [addTicket]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    const current = getLinesSnapshot();
    writeLines(
      quantity <= 0
        ? current.filter((line) => line.id !== id)
        : current.map((line) => {
            if (line.id !== id) return line;
            const cap = line.stockCap ?? 99;
            return { ...line, quantity: Math.min(quantity, cap) };
          }),
    );
  }, []);

  const removeLine = useCallback((id: string) => {
    writeLines(getLinesSnapshot().filter((line) => line.id !== id));
  }, []);

  const clear = useCallback(() => writeLines([]), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((total, line) => total + line.quantity, 0),
      subtotal: lines.reduce((total, line) => total + line.price * line.quantity, 0),
      hydrated,
      addLine,
      toggleLine,
      hasLine,
      findLine,
      addTicket,
      toggleTicket,
      updateQuantity,
      removeLine,
      clear,
      makeLineId,
    }),
    [
      lines,
      hydrated,
      addLine,
      toggleLine,
      hasLine,
      findLine,
      addTicket,
      toggleTicket,
      updateQuantity,
      removeLine,
      clear,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside a CartProvider");
  }
  return context;
}
