"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import {
  InventoryItem,
  InventoryItemFormData,
  InventoryStatus,
  Equipment,
} from "../types/inventory";

import EquipmentTable from "../components/equipment/EquipmentTable";

import { WithdrawalModal } from "../components/inventory/WithdrawalModal";
import { StockInModal } from "../components/inventory/StockInModal";
import { ReturnModal } from "../components/inventory/ReturnModal";

// --- Form Initial State & Options ---

// 1. Update your EMPTY_FORM so numeric fields start at "0.00" instead of ""
const EMPTY_FORM: InventoryItemFormData = {
  asset_serial_number: "",
  item_description: "",
  acquisition_date: "",
  cost: "",
  quantity: "1",
  salvage_value: "0.00",
  depreciation_expense: "0.00",
  book_value: "",
  custodian: "",
  status: "Serviceable",
  status_remarks: "",
};

const STATUS_OPTIONS: { value: InventoryStatus; label: string }[] = [
  { value: "Serviceable", label: "Serviceable" },
  { value: "Unserviceable", label: "Unserviceable" },
  { value: "For Repair", label: "For Repair" },
  { value: "For Disposal", label: "For Disposal" },
  { value: "Disposed", label: "Disposed" },
  { value: "Lost", label: "Lost" },
  { value: "Borrowed", label: "Borrowed" },
];

const STATUS_CONFIG: Record<string, { badge: string; dot: string }> = {
  Serviceable: {
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    dot: "bg-emerald-500",
  },
  Unserviceable: {
    badge: "bg-rose-50 text-rose-700 border-rose-200/60",
    dot: "bg-rose-500",
  },
  "For Repair": {
    badge: "bg-amber-50 text-amber-700 border-amber-200/60",
    dot: "bg-amber-500",
  },
  "For Disposal": {
    badge: "bg-orange-50 text-orange-700 border-orange-200/60",
    dot: "bg-orange-500",
  },
  Disposed: {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  },
  Lost: {
    badge: "bg-red-50 text-red-700 border-red-200/60",
    dot: "bg-red-500",
  },
  Borrowed: {
    badge: "bg-sky-50 text-sky-700 border-sky-200/60",
    dot: "bg-sky-500",
  },
};

// --- Helpers & UI Sub-components ---

function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const conf = STATUS_CONFIG[value] ?? {
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    dot: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${conf.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${conf.dot}`} />
      {value}
    </span>
  );
}

function formatMoney(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Page() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [equipmentLoading, setEquipmentLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<InventoryItemFormData>(EMPTY_FORM);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Transaction modals
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await api.get("/inventory");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      setEquipmentLoading(true);

      const response = await api.get("/equipment");

      setEquipment(response.data);
    } catch (error) {
      console.error("Error fetching equipment:", error);
    } finally {
      setEquipmentLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchEquipment();
  }, []);

  const updateField = <K extends keyof InventoryItemFormData>(
    field: K,
    value: InventoryItemFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAutoComputeBookValue = () => {
    const cost = parseFloat(formData.cost as string) || 0;
    const dep = parseFloat(formData.depreciation_expense as string) || 0;
    const computed = Math.max(0, cost - dep);
    updateField("book_value", computed.toFixed(2));
  };

  // 2. Update your handleSubmit function to sanitize and format numbers before posting
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Ensure all numeric fields are properly formatted as numbers/floats
      const payload = {
        ...formData,
        cost: formData.cost !== "" ? parseFloat(formData.cost as string) : 0,
        quantity:
          formData.quantity !== ""
            ? parseInt(formData.quantity as string, 10)
            : 1,
        salvage_value:
          formData.salvage_value !== ""
            ? parseFloat(formData.salvage_value as string)
            : 0,
        depreciation_expense:
          formData.depreciation_expense !== ""
            ? parseFloat(formData.depreciation_expense as string)
            : 0,
        book_value:
          formData.book_value !== ""
            ? parseFloat(formData.book_value as string)
            : 0,
      };

      console.log("SENDING ITEM:", payload);

      await api.post("/inventory", payload);

      alert("Item added successfully!");

      await fetchInventory();
      setFormData(EMPTY_FORM);
    } catch (error: any) {
      console.error(
        "========== ADD ITEM ERROR ==========",
        error.response?.data,
      );
      alert(
        JSON.stringify(
          error.response?.data ?? {
            message: error.message,
          },
          null,
          2,
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        item.asset_serial_number?.toLowerCase().includes(q) ||
        item.item_description?.toLowerCase().includes(q) ||
        item.custodian?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        item.status === statusFilter ||
        (statusFilter === "WITHDRAWN" &&
          item.date_of_withdrawal &&
          !item.date_of_returned);

      return matchesQuery && matchesStatus;
    });
  }, [items, query, statusFilter]);

  const summary = useMemo(() => {
    const totalCost = items.reduce(
      (sum, item) => sum + (parseFloat(item.cost as any) || 0),
      0,
    );
    const totalBookValue = items.reduce(
      (sum, item) => sum + (parseFloat(item.book_value as any) || 0),
      0,
    );
    const outCount = items.filter(
      (item) => item.date_of_withdrawal && !item.date_of_returned,
    ).length;
    return { totalCost, totalBookValue, outCount, count: items.length };
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Navigation / App Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.75"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900">
                  Office Inventory
                </h1>
                <p className="text-xs text-slate-500">
                  Property &amp; Supply Management System
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex sm:items-center sm:gap-1.5 rounded-lg border border-slate-200 bg-slate-50/70 p-1">
                <button
                  type="button"
                  onClick={() => setIsStockInOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition"
                >
                  <svg
                    className="h-3.5 w-3.5 text-emerald-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Stock in
                </button>
                <button
                  type="button"
                  onClick={() => setIsWithdrawOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition"
                >
                  <svg
                    className="h-3.5 w-3.5 text-amber-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                    />
                  </svg>
                  Withdraw
                </button>
                <button
                  type="button"
                  onClick={() => setIsReturnOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 hover:shadow-xs transition"
                >
                  <svg
                    className="h-3.5 w-3.5 text-sky-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
                    />
                  </svg>
                  Return
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFormOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold shadow-xs transition ${
                  isFormOpen
                    ? "bg-slate-200 text-slate-800 hover:bg-slate-300"
                    : "bg-slate-900 text-white hover:bg-slate-800"
                }`}
              >
                {isFormOpen ? (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18 18 6M6 6l12 12"
                      />
                    </svg>
                    Close form
                  </>
                ) : (
                  <>
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Add asset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Metric Summary Cards */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Total Inventory
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 7.5-9-5.25L3 7.5m18 0-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9"
                  />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {summary.count}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Tracked office items
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Currently Out
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9"
                  />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {summary.outCount}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Pending check-in / return
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Acquisition Cost
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6H2.25m0 0v10.5m0-10.5h19.5m0 0v10.5m0 0v.75c0 .754-.726 1.294-1.453 1.096a60.1 60.1 0 0 1-1.547-.417m0 0v-2.179"
                  />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                ₱{formatMoney(summary.totalCost)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Cumulative historical cost
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                Net Book Value
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
                  />
                </svg>
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                ₱{formatMoney(summary.totalBookValue)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Current active value
              </p>
            </div>
          </div>
        </div>

        {/* Collapsible Add Item Form */}
        {isFormOpen && (
          <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition">
            <div className="border-b border-slate-200/80 bg-slate-50/60 px-6 py-4">
              <h2 className="text-base font-semibold text-slate-900">
                Register New Inventory Item
              </h2>
              <p className="text-xs text-slate-500">
                Fill in the item details, cost, initial depreciation, and
                assigned custodian.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Section 1: Item Details */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Item Identity &amp; Classification
                </h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Asset Serial Number{" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                      required
                      placeholder="e.g. SN-2026-0841"
                      value={formData.asset_serial_number}
                      onChange={(e) =>
                        updateField("asset_serial_number", e.target.value)
                      }
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Item Description <span className="text-rose-500">*</span>
                    </label>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                      required
                      placeholder="e.g. Ergonomic Task Chair - Mesh High Back"
                      value={formData.item_description}
                      onChange={(e) =>
                        updateField("item_description", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Acquisition & Financial Valuation */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Valuation &amp; Depreciation
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                  <div className="lg:col-span-2">
                    <label className="block text-xs font-medium text-slate-700">
                      Acquisition Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                      required
                      value={formData.acquisition_date}
                      onChange={(e) =>
                        updateField("acquisition_date", e.target.value)
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Cost (PHP) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-3 text-sm text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                        value={formData.cost}
                        onChange={(e) => updateField("cost", e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Quantity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="1"
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                      value={formData.quantity}
                      onChange={(e) => updateField("quantity", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Salvage Value
                    </label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-3 text-sm text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                        value={formData.salvage_value}
                        onChange={(e) =>
                          updateField("salvage_value", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-medium text-slate-700">
                        Book Value
                      </label>
                      <button
                        type="button"
                        onClick={handleAutoComputeBookValue}
                        className="text-[10px] font-semibold text-sky-600 hover:underline"
                        title="Compute Cost - Depreciation"
                      >
                        Auto-calc
                      </button>
                    </div>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Auto"
                        className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-3 text-sm text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                        value={formData.book_value}
                        onChange={(e) =>
                          updateField("book_value", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Custody & Operational Status */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Custody &amp; Status
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Custodian (Assigned To)
                    </label>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                      placeholder="e.g. Jane Doe (Records)"
                      value={formData.custodian}
                      onChange={(e) => updateField("custodian", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Depreciation Expense
                    </label>
                    <div className="relative mt-1.5">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400">
                        ₱
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 py-2 pl-7 pr-3 text-sm text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                        value={formData.depreciation_expense}
                        onChange={(e) =>
                          updateField("depreciation_expense", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Current Status
                    </label>
                    <select
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                      value={formData.status}
                      onChange={(e) =>
                        updateField("status", e.target.value as InventoryStatus)
                      }
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Remarks / Notes
                    </label>
                    <input
                      className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-600/10"
                      placeholder="e.g. Issued to Room 204"
                      value={formData.status_remarks}
                      onChange={(e) =>
                        updateField("status_remarks", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setFormData(EMPTY_FORM)}
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Reset form
                </button>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-5 py-2 text-xs font-medium text-white shadow-xs hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {submitting ? (
                    <>
                      <svg
                        className="h-3.5 w-3.5 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Saving item…
                    </>
                  ) : (
                    "Save asset"
                  )}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Inventory Table Container */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
          {/* Table Controls (Search & Filters) */}
          <div className="flex flex-col gap-4 border-b border-slate-200/80 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                  />
                </svg>
              </span>
              <input
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-9 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200 transition"
                placeholder="Search serial no., item name, custodian…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18 18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Quick Status Filters */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: "ALL", label: "All items" },
                { id: "Serviceable", label: "Serviceable" },
                { id: "For Repair", label: "For Repair" },
                { id: "WITHDRAWN", label: "Withdrawn" },
                { id: "Unserviceable", label: "Unserviceable" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    statusFilter === tab.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map((idx) => (
                <div
                  key={idx}
                  className="h-10 w-full animate-pulse rounded-lg bg-slate-100"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <svg
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3.75h4m-4.25-4.5h4.5"
                  />
                </svg>
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-900">
                {items.length === 0
                  ? "No inventory assets found"
                  : "No matching assets found"}
              </p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                {items.length === 0
                  ? "Get started by registering your first office item using the button above."
                  : "Try clearing your search query or switching your status filter tab."}
              </p>
              {items.length === 0 && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Add first asset
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/75 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Item &amp; Serial</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Stock &amp; Availability</th>
                    <th className="px-4 py-3">Acquired</th>
                    <th className="px-4 py-3 text-right">Cost</th>
                    <th className="px-4 py-3 text-right">Book value</th>
                    <th className="px-4 py-3">Custodian</th>
                    <th className="px-4 py-3 text-center">Movement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => {
                    const isOut =
                      item.date_of_withdrawal && !item.date_of_returned;

                    return (
                      <tr
                        key={item.id}
                        className="group hover:bg-slate-50/80 transition-colors"
                      >
                        {/* Description & Serial */}
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 leading-snug">
                            {item.item_description}
                          </p>
                          <p className="mt-0.5 font-mono text-[11px] text-slate-400">
                            {item.asset_serial_number || "NO SERIAL"}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge value={item.status} />
                          {item.status_remarks && (
                            <p className="mt-1 text-[11px] text-slate-400 truncate max-w-[140px]">
                              {item.status_remarks}
                            </p>
                          )}
                        </td>

                        {/* Stock & Quantity */}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">
                              {item.remaining_quantity ?? item.quantity}
                            </span>
                            <span className="text-slate-400">/</span>
                            <span className="text-xs text-slate-500">
                              {item.quantity} total
                            </span>
                          </div>
                        </td>

                        {/* Acquisition Date */}
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">
                          {item.acquisition_date || "—"}
                        </td>

                        {/* Financials: Cost */}
                        <td className="px-4 py-3 text-right whitespace-nowrap font-medium text-slate-700">
                          ₱{formatMoney(item.cost)}
                        </td>

                        {/* Financials: Book Value */}
                        <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-slate-900">
                          ₱{formatMoney(item.book_value)}
                        </td>

                        {/* Custodian */}
                        <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                          {item.custodian ? (
                            <span className="inline-flex items-center gap-1.5">
                              <span className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold uppercase">
                                {item.custodian.charAt(0)}
                              </span>
                              <span className="text-xs">{item.custodian}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Movement / Withdrawal Status */}
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          {isOut ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                              title={`Withdrawn on ${item.date_of_withdrawal}`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                              Out: {item.date_of_withdrawal}
                            </span>
                          ) : item.date_of_returned ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600"
                              title={`Returned on ${item.date_of_returned}`}
                            >
                              Returned
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">
                              In Office
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Equipment Inventory
              </h2>

              <p className="text-sm text-gray-500">
                Individual office equipment and property records
              </p>
            </div>

            <EquipmentTable equipment={equipment} loading={equipmentLoading} />
          </section>

          {/* Table Footer / Counter */}
          {!loading && filteredItems.length > 0 && (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
              <span>
                Showing <strong>{filteredItems.length}</strong> of{" "}
                <strong>{items.length}</strong> total records
              </span>
              <span>Values in Philippine Peso (₱)</span>
            </div>
          )}
        </div>
      </main>

      {/* Transaction Modals */}
      <StockInModal
        isOpen={isStockInOpen}
        onClose={() => setIsStockInOpen(false)}
        onSuccess={fetchInventory}
        items={items}
      />
      <WithdrawalModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        onSuccess={fetchInventory}
        items={items}
      />
      <ReturnModal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        onSuccess={fetchInventory}
        items={items}
      />
    </div>
  );
}
