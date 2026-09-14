"use client";

import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { Item, Custodian } from "../../types/inventory";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  items: Item[];
}

export function ReturnModal({ isOpen, onClose, onSuccess, items }: Props) {
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [formData, setFormData] = useState({
    item_id: "",
    custodian_id: "",
    quantity: "",
    return_date: new Date().toISOString().split("T")[0],
    condition: "Good",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api
        .get("/custodians")
        .then((res) => setCustodians(res.data))
        .catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/returns", formData);
      alert("Return processed successfully!");
      onSuccess();
      onClose();
      setFormData({
        item_id: "",
        custodian_id: "",
        quantity: "",
        return_date: new Date().toISOString().split("T")[0],
        condition: "Good",
        remarks: "",
      });
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to process return.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-black">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Return Item</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Select Item
            </label>
            <select
              className="w-full border p-2 rounded"
              required
              value={formData.item_id}
              onChange={(e) =>
                setFormData({ ...formData, item_id: e.target.value })
              }
            >
              <option value="">-- Choose Item --</option>
              {items.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Returning Custodian
            </label>
            <select
              className="w-full border p-2 rounded"
              required
              value={formData.custodian_id}
              onChange={(e) =>
                setFormData({ ...formData, custodian_id: e.target.value })
              }
            >
              <option value="">-- Choose Custodian --</option>
              {custodians.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.office})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Quantity to Return
            </label>
            <input
              type="number"
              min="1"
              className="w-full border p-2 rounded"
              required
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Return Date
            </label>
            <input
              type="date"
              className="w-full border p-2 rounded"
              required
              value={formData.return_date}
              onChange={(e) =>
                setFormData({ ...formData, return_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Condition
            </label>
            <select
              className="w-full border p-2 rounded"
              value={formData.condition}
              onChange={(e) =>
                setFormData({ ...formData, condition: e.target.value })
              }
            >
              <option value="Good">Good / Unused</option>
              <option value="Damaged">Damaged</option>
              <option value="For Repair">For Repair</option>
            </select>
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Process Return"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
