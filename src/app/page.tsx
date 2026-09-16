"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import {
  InventoryItem,
  InventoryItemFormData,
  InventoryStatus,
} from "../types/inventory";
import { WithdrawalModal } from "../components/inventory/WithdrawalModal";
import { StockInModal } from "../components/inventory/StockInModal";
import { ReturnModal } from "../components/inventory/ReturnModal";

const EMPTY_FORM: InventoryItemFormData = {
  asset_serial_number: "",
  item_description: "",
  acquisition_date: "",
  cost: "",
  quantity: "",
  salvage_value: "",
  depreciation_expense: "",
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

const STATUS_STYLES: Record<string, string> = {
  Serviceable: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  Unserviceable: "bg-red-50 text-red-700 ring-red-600/20",
  "For Repair": "bg-amber-50 text-amber-700 ring-amber-600/20",
  "For Disposal": "bg-orange-50 text-orange-700 ring-orange-600/20",
  Disposed: "bg-slate-100 text-slate-600 ring-slate-500/20",
  Lost: "bg-red-50 text-red-700 ring-red-600/20",
  Borrowed: "bg-sky-50 text-sky-700 ring-sky-600/20",
};

function StatusBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-slate-400">—</span>;
  const cls =
    STATUS_STYLES[value] ?? "bg-slate-100 text-slate-600 ring-slate-500/20";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}
    >
      {value}
    </span>
  );
}

function formatMoney(value: string | number | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num)) return "—";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Page() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<InventoryItemFormData>(EMPTY_FORM);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  const fetchInventory = async () => {
    try {
      const response = await api.get("/inventory");
      setItems(response.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const updateField = <K extends keyof InventoryItemFormData>(
    field: K,
    value: InventoryItemFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/inventory", formData);
      await fetchInventory();
      setFormData(EMPTY_FORM);
      setIsFormOpen(false);
    } catch (error: any) {
      console.error(
        "Error saving data:",
        error.response?.data || error.message,
      );
      alert("Failed to add item. Check console for validation errors.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.asset_serial_number?.toLowerCase().includes(q) ||
        item.item_description?.toLowerCase().includes(q) ||
        item.custodian?.toLowerCase().includes(q),
    );
  }, [items, query]);

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
    <div className="min-h-screen bg-slate-50">
      {/* ---------- Header ---------- */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Property &amp; Supply
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">
                Office Inventory
              </h1>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsStockInOpen(true)}
                className="rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Stock in
              </button>
              <button
                onClick={() => setIsWithdrawOpen(true)}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Withdraw item
              </button>
              <button
                onClick={() => setIsReturnOpen(true)}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Return item
              </button>
              <button
                onClick={() => setIsFormOpen((v) => !v)}
                className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {isFormOpen ? "Close form" : "Add item"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ---------- Summary strip ---------- */}
        <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total items</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {summary.count}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Currently withdrawn</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {summary.outCount}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total acquisition cost</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              ₱{formatMoney(summary.totalCost)}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-xs text-slate-500">Total book value</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              ₱{formatMoney(summary.totalBookValue)}
            </p>
          </div>
        </div>

        {/* Modals */}
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

        {/* ---------- Add New Item Form (collapsible) ---------- */}
        {isFormOpen && (
          <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">
              Add new item
            </h2>
            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 gap-4 md:grid-cols-3"
            >
              <label className="flex flex-col text-sm text-slate-600 md:col-span-1">
                Asset serial number
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                  value={formData.asset_serial_number}
                  onChange={(e) =>
                    updateField("asset_serial_number", e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col text-sm text-slate-600 md:col-span-2">
                Item description
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  required
                  value={formData.item_description}
                  onChange={(e) =>
                    updateField("item_description", e.target.value)
                  }
                />
              </label>

              <label className="flex flex-col text-sm text-slate-600">
                Acquisition date
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  type="date"
                  required
                  value={formData.acquisition_date}
                  onChange={(e) =>
                    updateField("acquisition_date", e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col text-sm text-slate-600">
                Cost (original purchase price)
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost}
                  onChange={(e) => updateField("cost", e.target.value)}
                />
              </label>
              <label className="flex flex-col text-sm text-slate-600">
                Salvage / residual value
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  type="number"
                  step="0.01"
                  value={formData.salvage_value}
                  onChange={(e) => updateField("salvage_value", e.target.value)}
                />
              </label>

              <label className="flex flex-col text-sm text-slate-600">
                Quantity
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  type="number"
                  required
                  value={formData.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                />
              </label>
              <label className="flex flex-col text-sm text-slate-600">
                Custodian (assigned to)
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={formData.custodian}
                  onChange={(e) => updateField("custodian", e.target.value)}
                />
              </label>
              <label className="flex flex-col text-sm text-slate-600">
                Status
                <select
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
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
              </label>

              <label className="flex flex-col text-sm text-slate-600">
                Depreciation expense
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  type="number"
                  step="0.01"
                  value={formData.depreciation_expense}
                  onChange={(e) =>
                    updateField("depreciation_expense", e.target.value)
                  }
                />
              </label>
              <label className="flex flex-col text-sm text-slate-600">
                Book value (leave blank to auto-compute)
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  type="number"
                  step="0.01"
                  value={formData.book_value}
                  onChange={(e) => updateField("book_value", e.target.value)}
                />
              </label>
              <label className="flex flex-col text-sm text-slate-600">
                Remarks
                <input
                  className="mt-1 rounded-md border border-slate-300 p-2 text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
                  value={formData.status_remarks}
                  onChange={(e) =>
                    updateField("status_remarks", e.target.value)
                  }
                  placeholder="e.g. Issued to front desk"
                />
              </label>

              <div className="flex items-center gap-3 md:col-span-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : "Save item"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(EMPTY_FORM)}
                  className="text-sm font-medium text-slate-500 hover:text-slate-700"
                >
                  Clear
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------- Inventory Table ---------- */}
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <h2 className="text-base font-semibold text-slate-900">
              Current inventory
            </h2>
            <input
              className="w-full max-w-xs rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              placeholder="Search serial, description, custodian…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="p-6 text-sm text-slate-500">Loading inventory…</p>
          ) : filteredItems.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">
              {items.length === 0
                ? "No items yet. Add one to get started."
                : "No items match your search."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="p-3 font-medium">Serial no.</th>
                    <th className="p-3 font-medium">Description</th>
                    <th className="p-3 font-medium">Acquired</th>
                    <th className="p-3 text-right font-medium">Cost</th>
                    <th className="p-3 text-right font-medium">Qty</th>
                    <th className="p-3 text-right font-medium">Remaining</th>
                    <th className="p-3 font-medium">Withdrawn</th>
                    <th className="p-3 font-medium">Returned</th>
                    <th className="p-3 text-right font-medium">
                      Salvage value
                    </th>
                    <th className="p-3 font-medium">Custodian</th>
                    <th className="p-3 text-right font-medium">Depreciation</th>
                    <th className="p-3 text-right font-medium">Book value</th>
                    <th className="p-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono text-xs text-slate-700">
                        {item.asset_serial_number}
                      </td>
                      <td className="p-3 text-slate-900">
                        {item.item_description}
                      </td>
                      <td className="p-3 text-slate-500">
                        {item.acquisition_date}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {formatMoney(item.cost)}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {item.quantity}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {item.remaining_quantity}
                      </td>
                      <td className="p-3 text-slate-500">
                        {item.date_of_withdrawal ?? "—"}
                      </td>
                      <td className="p-3 text-slate-500">
                        {item.date_of_returned ?? "—"}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {formatMoney(item.salvage_value)}
                      </td>
                      <td className="p-3 text-slate-700">
                        {item.custodian ?? "—"}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {formatMoney(item.depreciation_expense)}
                      </td>
                      <td className="p-3 text-right text-slate-700">
                        {formatMoney(item.book_value)}
                      </td>
                      <td className="p-3">
                        <StatusBadge value={item.status_remarks as any} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
