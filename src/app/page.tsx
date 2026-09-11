"use client";

import { useEffect, useState } from "react";
import { api } from "../lib/api";
import {
  InventoryItem,
  InventoryItemFormData,
  InventoryStatus,
} from "../types/inventory";

const EMPTY_FORM: InventoryItemFormData = {
  asset_serial_number: "",
  item_description: "",
  acquisition_date: "",
  cost: "",
  salvage_value: "",
  depreciation_expense: "",
  book_value: "",
  quantity: "",
  remaining_quantity: "",
  custodian: "",
  date_of_withdrawal: "",
  date_of_returned: "",
  status: "active",
  remarks: "",
};

const STATUS_OPTIONS: { value: InventoryStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "returned", label: "Returned" },
  { value: "disposed", label: "Disposed" },
  { value: "for_repair", label: "For Repair" },
];

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
      alert("Item added successfully!");
      await fetchInventory();
      setFormData(EMPTY_FORM);
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

  if (loading) return <p className="p-8">Loading inventory...</p>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Office Inventory System
      </h1>

      {/* ---------- Add New Item Form ---------- */}
      <div className="bg-white p-6 rounded-lg shadow-md border mb-8 text-black">
        <h2 className="text-xl font-semibold mb-4">Add New Item</h2>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <input
            className="border p-2 rounded"
            placeholder="Asset Serial Number"
            required
            value={formData.asset_serial_number}
            onChange={(e) => updateField("asset_serial_number", e.target.value)}
          />
          <input
            className="border p-2 rounded md:col-span-2"
            placeholder="Item Description"
            required
            value={formData.item_description}
            onChange={(e) => updateField("item_description", e.target.value)}
          />

          <label className="flex flex-col text-sm text-gray-600">
            Acquisition / Purchase Date
            <input
              className="border p-2 rounded mt-1"
              type="date"
              required
              value={formData.acquisition_date}
              onChange={(e) => updateField("acquisition_date", e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Cost (Original Purchase Price)
            <input
              className="border p-2 rounded mt-1"
              type="number"
              step="0.01"
              required
              value={formData.cost}
              onChange={(e) => updateField("cost", e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Salvage / Residual Value
            <input
              className="border p-2 rounded mt-1"
              type="number"
              step="0.01"
              value={formData.salvage_value}
              onChange={(e) => updateField("salvage_value", e.target.value)}
            />
          </label>

          <label className="flex flex-col text-sm text-gray-600">
            Quantity
            <input
              className="border p-2 rounded mt-1"
              type="number"
              required
              value={formData.quantity}
              onChange={(e) => updateField("quantity", e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Remaining Quantity
            <input
              className="border p-2 rounded mt-1"
              type="number"
              required
              value={formData.remaining_quantity}
              onChange={(e) =>
                updateField("remaining_quantity", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Custodian (assigned to)
            <input
              className="border p-2 rounded mt-1"
              value={formData.custodian}
              onChange={(e) => updateField("custodian", e.target.value)}
            />
          </label>

          <label className="flex flex-col text-sm text-gray-600">
            Date of Withdrawal
            <input
              className="border p-2 rounded mt-1"
              type="date"
              value={formData.date_of_withdrawal}
              onChange={(e) =>
                updateField("date_of_withdrawal", e.target.value)
              }
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Date Returned
            <input
              className="border p-2 rounded mt-1"
              type="date"
              value={formData.date_of_returned}
              onChange={(e) => updateField("date_of_returned", e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Depreciation Expense
            <input
              className="border p-2 rounded mt-1"
              type="number"
              step="0.01"
              value={formData.depreciation_expense}
              onChange={(e) =>
                updateField("depreciation_expense", e.target.value)
              }
            />
          </label>

          <label className="flex flex-col text-sm text-gray-600">
            Book Value (leave blank to auto-compute)
            <input
              className="border p-2 rounded mt-1"
              type="number"
              step="0.01"
              value={formData.book_value}
              onChange={(e) => updateField("book_value", e.target.value)}
            />
          </label>
          <label className="flex flex-col text-sm text-gray-600">
            Status
            <select
              className="border p-2 rounded mt-1"
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
          <label className="flex flex-col text-sm text-gray-600 md:col-span-1">
            Remarks
            <input
              className="border p-2 rounded mt-1"
              value={formData.remarks}
              onChange={(e) => updateField("remarks", e.target.value)}
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="md:col-span-3 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save Item"}
          </button>
        </form>
      </div>

      {/* ---------- Inventory Table ---------- */}
      <div className="bg-white p-6 rounded-lg shadow-md border text-black overflow-x-auto">
        <h2 className="text-xl font-semibold mb-4">Current Inventory</h2>
        {items.length === 0 ? (
          <p className="text-gray-500">No items found. Add one above!</p>
        ) : (
          <table className="min-w-full text-sm border-collapse">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-2">Serial No.</th>
                <th className="p-2">Description</th>
                <th className="p-2">Acquired</th>
                <th className="p-2 text-right">Cost</th>
                <th className="p-2 text-right">Qty</th>
                <th className="p-2 text-right">Remaining</th>
                <th className="p-2">Withdrawn</th>
                <th className="p-2">Returned</th>
                <th className="p-2 text-right">Salvage Value</th>
                <th className="p-2">Custodian</th>
                <th className="p-2 text-right">Depreciation</th>
                <th className="p-2 text-right">Book Value</th>
                <th className="p-2">Status</th>
                <th className="p-2">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">
                    {item.asset_serial_number}
                  </td>
                  <td className="p-2">{item.item_description}</td>
                  <td className="p-2">{item.acquisition_date}</td>
                  <td className="p-2 text-right">{formatMoney(item.cost)}</td>
                  <td className="p-2 text-right">{item.quantity}</td>
                  <td className="p-2 text-right">{item.remaining_quantity}</td>
                  <td className="p-2">{item.date_of_withdrawal ?? "—"}</td>
                  <td className="p-2">{item.date_of_returned ?? "—"}</td>
                  <td className="p-2 text-right">
                    {formatMoney(item.salvage_value)}
                  </td>
                  <td className="p-2">{item.custodian ?? "—"}</td>
                  <td className="p-2 text-right">
                    {formatMoney(item.depreciation_expense)}
                  </td>
                  <td className="p-2 text-right">
                    {formatMoney(item.book_value)}
                  </td>
                  <td className="p-2 capitalize">
                    {item.status.replace("_", " ")}
                  </td>
                  <td className="p-2">{item.remarks ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
