"use client";

import { useState } from "react";
import { api } from "../../lib/api";
import { InventoryItem } from "../../types/inventory";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  items: InventoryItem[];
}

export function StockInModal({ isOpen, onClose, onSuccess, items }: Props) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    inventory_item_id: "",
    quantity: "",
    stock_in_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  if (!isOpen) return null;

  const selectedItem = items.find(
    (item) => String(item.id) === formData.inventory_item_id,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await api.post("/stock-ins", {
        ...formData,
        quantity: Number(formData.quantity),
      });

      alert("Stock added successfully!");

      setFormData({
        inventory_item_id: "",
        quantity: "",
        stock_in_date: new Date().toISOString().split("T")[0],
        remarks: "",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Stock-in error:", error.response?.data || error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to add stock.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-black">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Stock In (Add Quantity)</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Select Item
            </label>

            <select
              className="w-full border p-2 rounded"
              required
              value={formData.inventory_item_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  inventory_item_id: e.target.value,
                })
              }
            >
              <option value="">-- Choose Item --</option>

              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_description} ({Number(item.remaining_quantity)}{" "}
                  current)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Quantity to Add
            </label>

            <input
              type="number"
              min="1"
              className="w-full border p-2 rounded"
              required
              value={formData.quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  quantity: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Stock-In Date
            </label>

            <input
              type="date"
              className="w-full border p-2 rounded"
              required
              value={formData.stock_in_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock_in_date: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Remarks / Source
            </label>

            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="e.g. New purchase order"
              value={formData.remarks}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  remarks: e.target.value,
                })
              }
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !selectedItem}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Add Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
