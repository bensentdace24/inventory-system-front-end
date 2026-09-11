"use client";

import { useMemo, useState } from "react";
import type { InventoryItem, InventoryItemFormInput } from "@/types/inventory";
import { formatCurrency, formatDate } from "@/lib/format";
import ItemFormModal from "./ItemFormModal";

interface InventoryDashboardProps {
  initialItems: InventoryItem[];
}

interface ApiValidationError extends Error {
  errors?: Record<string, string[]>;
}

const statusStyles: Record<string, string> = {
  Serviceable: "bg-emerald-100 text-emerald-700",
  Unserviceable: "bg-amber-100 text-amber-700",
  "For Repair": "bg-orange-100 text-orange-700",
  "For Disposal": "bg-rose-100 text-rose-700",
  Disposed: "bg-slate-200 text-slate-600",
  Lost: "bg-rose-100 text-rose-700",
  Borrowed: "bg-sky-100 text-sky-700",
};

export default function InventoryDashboard({ initialItems }: InventoryDashboardProps) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const statusOptions = useMemo(() => {
    const unique = new Set(items.map((item) => item.statusRemarks));
    return ["All", ...Array.from(unique)];
  }, [items]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      const matchesStatus = statusFilter === "All" || item.statusRemarks === statusFilter;
      if (!matchesStatus) return false;
      if (!term) return true;
      return (
        item.assetSerialNumber.toLowerCase().includes(term) ||
        item.itemDescription.toLowerCase().includes(term) ||
        item.custodian.toLowerCase().includes(term)
      );
    });
  }, [items, search, statusFilter]);

  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        acc.cost += Number(item.cost) || 0;
        acc.bookValue += Number(item.bookValue) || 0;
        acc.quantity += Number(item.quantity) || 0;
        acc.remaining += Number(item.remainingQuantity) || 0;
        return acc;
      },
      { cost: 0, bookValue: 0, quantity: 0, remaining: 0 },
    );
  }, [filteredItems]);

  async function refresh() {
    const res = await fetch("/api/inventory", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      setItems(json.data);
    }
  }

  async function handleCreate(payload: InventoryItemFormInput) {
    const res = await fetch("/api/inventory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      const error: ApiValidationError = new Error(json.message ?? "Failed to create item.");
      error.errors = json.errors;
      throw error;
    }
    setItems((prev) => [...prev, json.data]);
    setModalMode(null);
    setBanner({ type: "success", message: `Item "${json.data.assetSerialNumber}" added successfully.` });
  }

  async function handleUpdate(payload: InventoryItemFormInput) {
    if (!editingItem) return;
    const res = await fetch(`/api/inventory/${editingItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      const error: ApiValidationError = new Error(json.message ?? "Failed to update item.");
      error.errors = json.errors;
      throw error;
    }
    setItems((prev) => prev.map((item) => (item.id === json.data.id ? json.data : item)));
    setModalMode(null);
    setEditingItem(null);
    setBanner({ type: "success", message: `Item "${json.data.assetSerialNumber}" updated successfully.` });
  }

  async function handleDelete(item: InventoryItem) {
    if (!confirm(`Delete "${item.assetSerialNumber}" — ${item.itemDescription}? This cannot be undone.`)) {
      return;
    }
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/inventory/${item.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.message ?? "Failed to delete item.");
      }
      setItems((prev) => prev.filter((existing) => existing.id !== item.id));
      setBanner({ type: "success", message: `Item "${item.assetSerialNumber}" deleted.` });
    } catch (error) {
      setBanner({
        type: "error",
        message: error instanceof Error ? error.message : "Failed to delete item.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">
            Office Equipment &amp; Supplies
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">Inventory System</h1>
          <p className="mt-1 text-sm text-slate-500">
            Track assets, custodians, withdrawals, returns, and depreciation in one place.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingItem(null);
            setModalMode("create");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          <span className="text-lg leading-none">+</span> Add New Item
        </button>
      </header>

      {banner && (
        <div
          className={`mb-4 flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium ${
            banner.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
          }`}
        >
          {banner.message}
          <button onClick={() => setBanner(null)} className="ml-4 text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase text-slate-500">Total Items</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{filteredItems.length}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase text-slate-500">On Hand Qty</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{totals.remaining}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase text-slate-500">Total Cost</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totals.cost)}</p>
        </div>
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-medium uppercase text-slate-500">Total Book Value</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{formatCurrency(totals.bookValue)}</p>
        </div>
      </section>

      <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by serial number, description, or custodian…"
          className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-500">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <button
            onClick={() => refresh()}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {[
                  "Asset Serial Number",
                  "Item Description",
                  "Acquisition Date",
                  "Cost",
                  "Qty",
                  "Date of Withdrawal",
                  "Remaining Qty",
                  "Date Returned",
                  "Salvage Value",
                  "Custodian",
                  "Depreciation Expense",
                  "Book Value",
                  "Status / Remarks",
                  "Actions",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="whitespace-nowrap px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-4 py-10 text-center text-slate-400">
                    No inventory items found. Click &quot;Add New Item&quot; to create one.
                  </td>
                </tr>
              )}
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-900">
                    {item.assetSerialNumber}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-slate-700">{item.itemDescription}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(item.acquisitionDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{formatCurrency(item.cost)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.quantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(item.dateOfWithdrawal)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.remainingQuantity}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatDate(item.dateOfReturned)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatCurrency(item.salvageValue)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">{item.custodian}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatCurrency(item.depreciationExpense)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-slate-800">
                    {formatCurrency(item.bookValue)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        statusStyles[item.statusRemarks] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.statusRemarks}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setModalMode("edit");
                        }}
                        className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        disabled={deletingId === item.id}
                        className="rounded-md border border-rose-200 px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                      >
                        {deletingId === item.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalMode && (
        <ItemFormModal
          mode={modalMode}
          initialItem={modalMode === "edit" ? editingItem : null}
          onClose={() => {
            setModalMode(null);
            setEditingItem(null);
          }}
          onSubmit={modalMode === "create" ? handleCreate : handleUpdate}
        />
      )}
    </div>
  );
}
