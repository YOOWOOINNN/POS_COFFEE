import { useEffect, useMemo, useState } from "react";

type ProductCategory = "coffee" | "nonCoffee" | "food" | "beans";
type CategoryKey = "all" | ProductCategory;
type OrderMode = "Dine in" | "Takeaway" | "Delivery";
type PaymentMethod = "Cash" | "QRIS" | "Debit" | "E-Wallet";
type DiscountMode = "none" | "member" | "staff";

type MenuItem = {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  description: string;
  price: number;
  stock: number;
  prepMinutes: number;
};

type CartItem = MenuItem & {
  qty: number;
};

type Sale = {
  id: string;
  customerName: string;
  orderMode: OrderMode;
  tableNumber: string;
  paymentMethod: PaymentMethod;
  items: CartItem[];
  subtotal: number;
  discount: number;
  service: number;
  tax: number;
  total: number;
  tendered: number;
  change: number;
  createdAt: string;
};

const categoryOptions: { key: CategoryKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "coffee", label: "Kopi" },
  { key: "nonCoffee", label: "Non-kopi" },
  { key: "food", label: "Makanan" },
  { key: "beans", label: "Beans" },
];

const orderModes: OrderMode[] = ["Dine in", "Takeaway", "Delivery"];
const paymentMethods: PaymentMethod[] = ["Cash", "QRIS", "Debit", "E-Wallet"];

const menuItems: MenuItem[] = [
  {
    id: "espresso",
    sku: "COF-ESP",
    name: "Espresso",
    category: "coffee",
    description: "Double shot arabica, body tebal",
    price: 22000,
    stock: 46,
    prepMinutes: 3,
  },
  {
    id: "americano",
    sku: "COF-AMR",
    name: "Americano",
    category: "coffee",
    description: "Espresso dengan air panas bersih",
    price: 26000,
    stock: 52,
    prepMinutes: 4,
  },
  {
    id: "cappuccino",
    sku: "COF-CAP",
    name: "Cappuccino",
    category: "coffee",
    description: "Foam susu halus dan espresso house blend",
    price: 33000,
    stock: 34,
    prepMinutes: 5,
  },
  {
    id: "caramel-latte",
    sku: "COF-CLT",
    name: "Caramel Latte",
    category: "coffee",
    description: "Latte creamy dengan karamel ringan",
    price: 38000,
    stock: 29,
    prepMinutes: 5,
  },
  {
    id: "cold-brew",
    sku: "COF-CBR",
    name: "Cold Brew",
    category: "coffee",
    description: "Seduhan 18 jam, rendah asam",
    price: 36000,
    stock: 18,
    prepMinutes: 2,
  },
  {
    id: "matcha-latte",
    sku: "NON-MCH",
    name: "Matcha Latte",
    category: "nonCoffee",
    description: "Matcha premium dengan susu segar",
    price: 37000,
    stock: 17,
    prepMinutes: 5,
  },
  {
    id: "chocolate",
    sku: "NON-CHO",
    name: "Signature Chocolate",
    category: "nonCoffee",
    description: "Cokelat pekat, cocok panas atau dingin",
    price: 34000,
    stock: 22,
    prepMinutes: 4,
  },
  {
    id: "lemon-tea",
    sku: "NON-LTE",
    name: "Lemon Tea",
    category: "nonCoffee",
    description: "Teh hitam, lemon, dan simple syrup",
    price: 24000,
    stock: 41,
    prepMinutes: 3,
  },
  {
    id: "croissant",
    sku: "FOD-CRS",
    name: "Butter Croissant",
    category: "food",
    description: "Pastry butter, dipanaskan sebelum saji",
    price: 28000,
    stock: 12,
    prepMinutes: 6,
  },
  {
    id: "banana-bread",
    sku: "FOD-BNB",
    name: "Banana Bread",
    category: "food",
    description: "Roti pisang lembut dengan walnut",
    price: 30000,
    stock: 9,
    prepMinutes: 4,
  },
  {
    id: "cheese-toast",
    sku: "FOD-CHT",
    name: "Cheese Toast",
    category: "food",
    description: "Roti sourdough dengan keju leleh",
    price: 42000,
    stock: 14,
    prepMinutes: 7,
  },
  {
    id: "house-blend",
    sku: "BEA-HBL",
    name: "House Blend 250g",
    category: "beans",
    description: "Beans medium roast untuk espresso",
    price: 98000,
    stock: 8,
    prepMinutes: 1,
  },
];

const discountRates: Record<DiscountMode, number> = {
  none: 0,
  member: 0.1,
  staff: 0.15,
};

const discountLabels: Record<DiscountMode, string> = {
  none: "Tanpa diskon",
  member: "Member 10%",
  staff: "Staff 15%",
};

const storageKey = "kopikasir-sales-v1";
const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

function formatMoney(value: number) {
  return rupiahFormatter.format(value).replace(/\s/g, " ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function loadSales() {
  if (typeof window === "undefined") {
    return [] as Sale[];
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as Sale[]) : [];
  } catch {
    return [] as Sale[];
  }
}

function App() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderMode, setOrderMode] = useState<OrderMode>("Dine in");
  const [customerName, setCustomerName] = useState("Guest");
  const [tableNumber, setTableNumber] = useState("A1");
  const [discountMode, setDiscountMode] = useState<DiscountMode>("none");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const [tendered, setTendered] = useState(0);
  const [sales, setSales] = useState<Sale[]>(loadSales);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);

  const cartQtyById = useMemo(() => {
    return cart.reduce<Record<string, number>>((acc, item) => {
      acc[item.id] = item.qty;
      return acc;
    }, {});
  }, [cart]);

  const filteredItems = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
      const matchesKeyword =
        !keyword ||
        item.name.toLowerCase().includes(keyword) ||
        item.sku.toLowerCase().includes(keyword) ||
        item.description.toLowerCase().includes(keyword);

      return matchesCategory && matchesKeyword;
    });
  }, [selectedCategory, searchTerm]);

  const subtotal = useMemo(() => cart.reduce((total, item) => total + item.price * item.qty, 0), [cart]);
  const discount = Math.round(subtotal * discountRates[discountMode]);
  const service = orderMode === "Dine in" ? Math.round(subtotal * 0.05) : 0;
  const taxable = Math.max(subtotal - discount + service, 0);
  const tax = Math.round(taxable * 0.11);
  const total = taxable + tax;
  const change = Math.max(tendered - total, 0);
  const canPay = cart.length > 0 && tendered >= total;
  const estimatedPrep = cart.reduce((minutes, item) => minutes + item.prepMinutes * item.qty, 0);

  const lowStockItems = useMemo(() => menuItems.filter((item) => item.stock <= 12), []);
  const dailyStats = useMemo(() => {
    const revenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const tickets = sales.length;
    const cups = sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.qty, 0), 0);
    const avgTicket = tickets ? Math.round(revenue / tickets) : 0;
    const itemCounter = new Map<string, number>();

    sales.forEach((sale) => {
      sale.items.forEach((item) => {
        itemCounter.set(item.name, (itemCounter.get(item.name) ?? 0) + item.qty);
      });
    });

    const topItem = [...itemCounter.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Belum ada";

    return { revenue, tickets, cups, avgTicket, topItem };
  }, [sales]);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    if (paymentMethod !== "Cash") {
      setTendered(total);
    }
  }, [paymentMethod, total]);

  function addToCart(item: MenuItem) {
    const currentQty = cartQtyById[item.id] ?? 0;

    if (currentQty >= item.stock) {
      return;
    }

    setCart((current) => {
      const exists = current.find((cartItem) => cartItem.id === item.id);

      if (exists) {
        return current.map((cartItem) =>
          cartItem.id === item.id ? { ...cartItem, qty: cartItem.qty + 1 } : cartItem,
        );
      }

      return [...current, { ...item, qty: 1 }];
    });
  }

  function updateQty(id: string, qty: number) {
    const source = menuItems.find((item) => item.id === id);
    if (!source) {
      return;
    }

    const nextQty = Math.min(Math.max(qty, 1), source.stock);
    setCart((current) => current.map((item) => (item.id === id ? { ...item, qty: nextQty } : item)));
  }

  function removeItem(id: string) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  function clearOrder() {
    setCart([]);
    setTendered(0);
    setDiscountMode("none");
    setPaymentMethod("Cash");
  }

  function completeSale() {
    if (!canPay) {
      return;
    }

    const createdAt = new Date().toISOString();
    const sale: Sale = {
      id: `INV-${createdAt.slice(0, 10).replace(/-/g, "")}-${String(sales.length + 1).padStart(4, "0")}`,
      customerName: customerName.trim() || "Guest",
      orderMode,
      tableNumber: orderMode === "Dine in" ? tableNumber.trim() || "-" : "-",
      paymentMethod,
      items: cart,
      subtotal,
      discount,
      service,
      tax,
      total,
      tendered,
      change,
      createdAt,
    };

    setSales((current) => [sale, ...current]);
    setSelectedSale(sale);
    clearOrder();
  }

  return (
    <main className="min-h-screen bg-[#f6f0e8] text-stone-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="motion-slide-down flex flex-col justify-between gap-4 border-b border-stone-300/80 pb-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-amber-800">Coffee shop POS</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <h1 className="text-4xl font-black tracking-[-0.06em] text-stone-950 sm:text-6xl">KopiKasir</h1>
              <span className="mb-2 rounded-full bg-stone-950 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-amber-100">
                Next-ready
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
              Aplikasi POS coffee shop untuk kasir, pembayaran, ringkasan shift, stok, dan struk transaksi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 lg:min-w-[620px]">
            <Metric label="Omzet shift" value={formatMoney(dailyStats.revenue)} />
            <Metric label="Transaksi" value={String(dailyStats.tickets)} />
            <Metric label="Item terjual" value={String(dailyStats.cups)} />
            <Metric label="Avg bill" value={formatMoney(dailyStats.avgTicket)} />
          </div>
        </header>

        <section className="grid flex-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)_430px]">
          <aside className="motion-slide-up space-y-5 xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)] xl:overflow-auto xl:pb-4">
            <section className="rounded-[2rem] bg-stone-950 p-5 text-amber-50 shadow-2xl shadow-stone-950/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">Shift aktif</p>
                  <h2 className="mt-3 text-2xl font-black tracking-[-0.04em]">Pagi</h2>
                </div>
                <span className="motion-pulse-dot mt-1 h-3 w-3 rounded-full bg-emerald-300" />
              </div>
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex justify-between gap-4 border-t border-amber-50/15 pt-4">
                  <dt className="text-amber-100/70">Kasir</dt>
                  <dd className="font-semibold">Admin Bar</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-amber-50/15 pt-4">
                  <dt className="text-amber-100/70">Best seller</dt>
                  <dd className="text-right font-semibold">{dailyStats.topItem}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-amber-50/15 pt-4">
                  <dt className="text-amber-100/70">Estimasi order ini</dt>
                  <dd className="font-semibold">{estimatedPrep || 0} menit</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[2rem] border border-stone-300/90 bg-white/60 p-5 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-black tracking-[-0.03em]">Stok rendah</h2>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">
                  {lowStockItems.length} item
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-stone-500">{item.sku}</p>
                    </div>
                    <span className="font-black text-amber-800">{item.stock}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-stone-300/90 bg-white/60 p-5 backdrop-blur">
              <h2 className="text-lg font-black tracking-[-0.03em]">Transaksi terakhir</h2>
              <div className="mt-4 space-y-3">
                {sales.slice(0, 4).length ? (
                  sales.slice(0, 4).map((sale) => (
                    <button
                      key={sale.id}
                      className="w-full rounded-2xl border border-stone-200 bg-white px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-amber-500"
                      onClick={() => setSelectedSale(sale)}
                      type="button"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-black">{sale.id}</p>
                        <p className="text-sm font-bold text-amber-800">{formatMoney(sale.total)}</p>
                      </div>
                      <p className="mt-1 text-xs text-stone-500">
                        {formatTime(sale.createdAt)} - {sale.paymentMethod}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="rounded-2xl border border-dashed border-stone-300 p-4 text-sm text-stone-500">
                    Belum ada transaksi. Selesaikan pembayaran pertama untuk melihat riwayat.
                  </p>
                )}
              </div>
              {sales.length > 0 && (
                <button
                  className="mt-4 w-full rounded-2xl bg-stone-200 px-4 py-3 text-xs font-black uppercase tracking-[0.1em] text-stone-700 transition hover:bg-stone-300 hover:text-stone-950"
                  onClick={() => setShowTransactions(true)}
                  type="button"
                >
                  Lihat Semua Transaksi
                </button>
              )}
            </section>
          </aside>

          <section className="motion-slide-up min-w-0 space-y-5 [animation-delay:90ms]">
            <div className="rounded-[2rem] border border-stone-300/90 bg-white/70 p-4 backdrop-blur">
              <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
                <label className="relative block">
                  <span className="sr-only">Cari menu</span>
                  <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
                  <input
                    className="h-13 w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 text-sm font-semibold outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-amber-200"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Cari item, SKU, atau deskripsi"
                    value={searchTerm}
                  />
                </label>

                <div className="flex gap-2 overflow-x-auto pb-1 lg:justify-end lg:pb-0">
                  {categoryOptions.map((category) => (
                    <button
                      key={category.key}
                      className={`shrink-0 rounded-full px-4 py-2 text-sm font-black transition ${
                        selectedCategory === category.key
                          ? "bg-stone-950 text-amber-100 shadow-lg shadow-stone-950/15"
                          : "bg-stone-100 text-stone-600 hover:bg-amber-100 hover:text-stone-950"
                      }`}
                      onClick={() => setSelectedCategory(category.key)}
                      type="button"
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
              {filteredItems.map((item, index) => {
                const orderedQty = cartQtyById[item.id] ?? 0;
                const remainingStock = item.stock - orderedQty;
                const isSoldOut = remainingStock <= 0;

                return (
                  <button
                    key={item.id}
                    className="motion-menu-item group min-h-[180px] rounded-[2rem] border border-stone-300/90 bg-white/75 p-5 text-left shadow-sm shadow-stone-300/30 transition hover:-translate-y-1 hover:border-amber-500 hover:bg-white hover:shadow-xl hover:shadow-amber-900/10 disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={isSoldOut}
                    onClick={() => addToCart(item)}
                    style={{ animationDelay: `${index * 35}ms` }}
                    type="button"
                  >
                    <div className="flex h-full flex-col justify-between gap-6">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-800">{item.sku}</p>
                            <h3 className="mt-2 text-2xl font-black tracking-[-0.05em] text-stone-950">{item.name}</h3>
                          </div>
                          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-black text-stone-600">
                            {remainingStock} stok
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-stone-500">{item.description}</p>
                      </div>

                      <div className="flex items-end justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">Harga</p>
                          <p className="mt-1 text-xl font-black text-stone-950">{formatMoney(item.price)}</p>
                        </div>
                        <span className="rounded-full bg-amber-200 px-4 py-2 text-sm font-black text-stone-950 transition group-hover:bg-stone-950 group-hover:text-amber-100">
                          {isSoldOut ? "Habis" : orderedQty ? `Tambah (${orderedQty})` : "Tambah"}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="motion-slide-up [animation-delay:160ms] xl:sticky xl:top-4 xl:h-[calc(100vh-2rem)]">
            <section className="flex h-full flex-col rounded-[2rem] border border-stone-300/90 bg-stone-50 shadow-2xl shadow-stone-950/10">
              <div className="border-b border-stone-200 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-800">Order aktif</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Keranjang</h2>
                  </div>
                  <button
                    className="rounded-full border border-stone-300 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-stone-600 transition hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                    onClick={clearOrder}
                    type="button"
                  >
                    Reset
                  </button>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-stone-200/70 p-1">
                  {orderModes.map((mode) => (
                    <button
                      key={mode}
                      className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                        orderMode === mode ? "bg-stone-950 text-amber-100 shadow" : "text-stone-500 hover:text-stone-950"
                      }`}
                      onClick={() => setOrderMode(mode)}
                      type="button"
                    >
                      {mode}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Pelanggan</span>
                    <input
                      className="mt-2 h-11 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-amber-200"
                      onChange={(event) => setCustomerName(event.target.value)}
                      value={customerName}
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Meja</span>
                    <input
                      className="mt-2 h-11 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm font-semibold outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-amber-200 disabled:bg-stone-100 disabled:text-stone-400"
                      disabled={orderMode !== "Dine in"}
                      onChange={(event) => setTableNumber(event.target.value)}
                      value={tableNumber}
                    />
                  </label>
                </div>
              </div>

              <div className="min-h-[260px] flex-1 overflow-auto p-5">
                {cart.length ? (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="rounded-3xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-black tracking-[-0.02em]">{item.name}</p>
                            <p className="mt-1 text-xs font-semibold text-stone-500">{formatMoney(item.price)} per item</p>
                          </div>
                          <button
                            className="rounded-full bg-stone-100 px-2 py-1 text-xs font-black text-stone-500 transition hover:bg-red-50 hover:text-red-700"
                            onClick={() => removeItem(item.id)}
                            type="button"
                          >
                            Hapus
                          </button>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3">
                          <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 p-1">
                            <button
                              className="h-8 w-8 rounded-full bg-white text-lg font-black shadow-sm transition hover:bg-amber-100"
                              onClick={() => updateQty(item.id, item.qty - 1)}
                              type="button"
                            >
                              -
                            </button>
                            <span className="w-10 text-center text-sm font-black">{item.qty}</span>
                            <button
                              className="h-8 w-8 rounded-full bg-white text-lg font-black shadow-sm transition hover:bg-amber-100"
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              type="button"
                            >
                              +
                            </button>
                          </div>
                          <p className="text-lg font-black">{formatMoney(item.price * item.qty)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex h-full min-h-[260px] items-center justify-center rounded-3xl border border-dashed border-stone-300 bg-white/60 p-8 text-center">
                    <div>
                      <CartIcon className="mx-auto h-10 w-10 text-stone-300" />
                      <h3 className="mt-4 text-lg font-black">Keranjang kosong</h3>
                      <p className="mt-2 text-sm leading-6 text-stone-500">Pilih menu di daftar produk untuk membuat transaksi.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-stone-200 p-5">
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {(Object.keys(discountLabels) as DiscountMode[]).map((mode) => (
                    <button
                      key={mode}
                      className={`rounded-2xl px-3 py-2 text-xs font-black transition ${
                        discountMode === mode ? "bg-amber-200 text-stone-950" : "bg-white text-stone-500 hover:text-stone-950"
                      }`}
                      onClick={() => setDiscountMode(mode)}
                      type="button"
                    >
                      {discountLabels[mode]}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 rounded-3xl bg-white p-4 text-sm">
                  <ReceiptRow label="Subtotal" value={formatMoney(subtotal)} />
                  <ReceiptRow label="Diskon" value={`-${formatMoney(discount)}`} muted />
                  <ReceiptRow label="Service" value={formatMoney(service)} muted />
                  <ReceiptRow label="PPN 11%" value={formatMoney(tax)} muted />
                  <div className="border-t border-stone-200 pt-3">
                    <ReceiptRow label="Total" value={formatMoney(total)} strong />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  {paymentMethods.map((method) => (
                    <button
                      key={method}
                      className={`rounded-2xl px-2 py-3 text-xs font-black transition ${
                        paymentMethod === method ? "bg-stone-950 text-amber-100" : "bg-white text-stone-500 hover:text-stone-950"
                      }`}
                      onClick={() => setPaymentMethod(method)}
                      type="button"
                    >
                      {method}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid grid-cols-[1fr_auto] gap-2">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Dibayar</span>
                    <input
                      className="mt-2 h-12 w-full rounded-2xl border border-stone-200 bg-white px-3 text-sm font-black outline-none transition focus:border-stone-950 focus:ring-4 focus:ring-amber-200 disabled:bg-stone-100 disabled:text-stone-400"
                      disabled={paymentMethod !== "Cash"}
                      min={0}
                      onChange={(event) => setTendered(Number(event.target.value) || 0)}
                      type="number"
                      value={tendered}
                    />
                  </label>
                  <div className="self-end rounded-2xl bg-stone-200/70 px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Kembali</p>
                    <p className="text-sm font-black">{formatMoney(change)}</p>
                  </div>
                </div>

                {paymentMethod === "Cash" && (
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[total, total + 10000, total + 20000].map((amount) => (
                      <button
                        key={amount}
                        className="rounded-2xl bg-white px-2 py-2 text-xs font-black text-stone-600 transition hover:bg-amber-100 hover:text-stone-950"
                        onClick={() => setTendered(amount)}
                        type="button"
                      >
                        {formatMoney(amount)}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  className="mt-4 h-14 w-full rounded-2xl bg-stone-950 text-sm font-black uppercase tracking-[0.2em] text-amber-100 shadow-xl shadow-stone-950/20 transition hover:-translate-y-0.5 hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  disabled={!canPay}
                  onClick={completeSale}
                  type="button"
                >
                  Bayar dan cetak struk
                </button>
              </div>
            </section>
          </aside>
        </section>
      </div>

      {selectedSale && <ReceiptModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}
      {showTransactions && (
        <TransactionHistoryModal
          sales={sales}
          onClose={() => setShowTransactions(false)}
          onSelectSale={(sale) => {
            setShowTransactions(false);
            setSelectedSale(sale);
          }}
        />
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-stone-300/80 bg-white/60 px-4 py-3 backdrop-blur">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-1 truncate text-lg font-black tracking-[-0.03em] text-stone-950">{value}</p>
    </div>
  );
}

function ReceiptRow({ label, value, muted, strong }: { label: string; value: string; muted?: boolean; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-xl font-black" : "font-semibold"}`}>
      <span className={muted ? "text-stone-500" : "text-stone-700"}>{label}</span>
      <span className="text-right text-stone-950">{value}</span>
    </div>
  );
}

function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm">
      <section className="receipt-print max-h-[92vh] w-full max-w-md overflow-auto rounded-[2rem] bg-white p-6 shadow-2xl">
        <div className="text-center">
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">KopiKasir</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">Struk Pembayaran</h2>
          <p className="mt-2 text-sm text-stone-500">{sale.id}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 rounded-3xl bg-stone-100 p-4 text-sm">
          <ReceiptInfo label="Waktu" value={formatTime(sale.createdAt)} />
          <ReceiptInfo label="Tipe" value={sale.orderMode} />
          <ReceiptInfo label="Pelanggan" value={sale.customerName} />
          <ReceiptInfo label="Meja" value={sale.tableNumber} />
        </div>

        <div className="mt-6 space-y-3">
          {sale.items.map((item) => (
            <div key={item.id} className="flex justify-between gap-4 border-b border-dashed border-stone-200 pb-3 text-sm">
              <div>
                <p className="font-black">{item.name}</p>
                <p className="mt-1 text-stone-500">
                  {item.qty} x {formatMoney(item.price)}
                </p>
              </div>
              <p className="font-black">{formatMoney(item.qty * item.price)}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2 rounded-3xl bg-stone-100 p-4 text-sm">
          <ReceiptRow label="Subtotal" value={formatMoney(sale.subtotal)} />
          <ReceiptRow label="Diskon" value={`-${formatMoney(sale.discount)}`} muted />
          <ReceiptRow label="Service" value={formatMoney(sale.service)} muted />
          <ReceiptRow label="PPN 11%" value={formatMoney(sale.tax)} muted />
          <div className="border-t border-stone-300 pt-3">
            <ReceiptRow label="Total" value={formatMoney(sale.total)} strong />
          </div>
          <ReceiptRow label={`Bayar ${sale.paymentMethod}`} value={formatMoney(sale.tendered)} muted />
          <ReceiptRow label="Kembali" value={formatMoney(sale.change)} muted />
        </div>

        <p className="mt-6 text-center text-sm font-semibold text-stone-500">Terima kasih. Simpan struk ini sebagai bukti transaksi.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 print:hidden">
          <button
            className="h-12 rounded-2xl border border-stone-300 text-sm font-black text-stone-600 transition hover:bg-stone-100"
            onClick={onClose}
            type="button"
          >
            Tutup
          </button>
          <button
            className="h-12 rounded-2xl bg-stone-950 text-sm font-black text-amber-100 transition hover:bg-amber-900"
            onClick={() => window.print()}
            type="button"
          >
            Cetak
          </button>
        </div>
      </section>
    </div>
  );
}

function ReceiptInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-stone-500">{label}</p>
      <p className="mt-1 font-black text-stone-950">{value}</p>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h15l-1.5 8.5a2 2 0 0 1-2 1.5H9a2 2 0 0 1-2-1.6L5 3H2" />
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </svg>
  );
}

function TransactionHistoryModal({ sales, onClose, onSelectSale }: { sales: Sale[]; onClose: () => void; onSelectSale: (sale: Sale) => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-sm">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-200 p-6">
          <h2 className="text-2xl font-black tracking-[-0.05em]">Riwayat Transaksi</h2>
          <button
            className="rounded-full bg-stone-100 p-2 text-stone-500 hover:bg-stone-200"
            onClick={onClose}
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {sales.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-stone-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-stone-50 text-stone-500">
                  <tr>
                    <th className="p-4 font-bold">ID Transaksi</th>
                    <th className="p-4 font-bold">Waktu</th>
                    <th className="p-4 font-bold">Pelanggan</th>
                    <th className="p-4 font-bold">Tipe Order</th>
                    <th className="p-4 font-bold">Metode Bayar</th>
                    <th className="p-4 font-bold">Total</th>
                    <th className="p-4 text-center font-bold">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="transition hover:bg-stone-50">
                      <td className="p-4 font-semibold text-stone-900">{sale.id}</td>
                      <td className="p-4 text-stone-600">{formatTime(sale.createdAt)}</td>
                      <td className="p-4 text-stone-600">{sale.customerName}</td>
                      <td className="p-4 text-stone-600">{sale.orderMode}</td>
                      <td className="p-4 text-stone-600">{sale.paymentMethod}</td>
                      <td className="p-4 font-black text-amber-800">{formatMoney(sale.total)}</td>
                      <td className="p-4 text-center">
                        <button
                          className="rounded-full bg-stone-950 px-4 py-2 text-xs font-bold text-amber-100 transition hover:bg-amber-900"
                          onClick={() => onSelectSale(sale)}
                          type="button"
                        >
                          Lihat Struk
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
             <p className="text-center text-sm text-stone-500">Belum ada transaksi.</p>
          )}
        </div>
      </section>
    </div>
  );
}

export default App;