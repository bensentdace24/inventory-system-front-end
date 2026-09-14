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

export function WithdrawalModal({ isOpen, onClose, onSuccess, items }: Props) {
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [formData, setFormData] = useState({
    item_id: "",
    custodian_id: "",
    quantity: "",
    withdrawal_date: new Date().toISOString().split("T")[0],
    purpose: "",
    remarks: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch custodians when modal opens
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
      await api.post("/withdrawals", formData);
      alert("Withdrawal processed successfully!");
      onSuccess(); // Refresh inventory list
      onClose(); // Close modal
    } catch (error: any) {
      alert(error.response?.data?.error || "Failed to process withdrawal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 text-black">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Withdraw Item</h2>

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
                  {i.description} (Stock: {i.quantity})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Custodian (Assigned To)
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
              Quantity to Withdraw
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
            <label className="block text-sm text-gray-600 mb-1">Date</label>
            <input
              type="date"
              className="w-full border p-2 rounded"
              required
              value={formData.withdrawal_date}
              onChange={(e) =>
                setFormData({ ...formData, withdrawal_date: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Purpose</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="e.g., Office Use"
              value={formData.purpose}
              onChange={(e) =>
                setFormData({ ...formData, purpose: e.target.value })
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Withdraw"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
