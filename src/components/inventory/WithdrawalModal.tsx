"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { InventoryItem, Custodian } from "../../types/inventory";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  items: InventoryItem[];
}

export function WithdrawalModal({ isOpen, onClose, onSuccess, items }: Props) {
  const [custodians, setCustodians] = useState<Custodian[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    inventory_item_id: "",
    custodian_id: "",
    quantity: "",
    withdrawal_date: new Date().toISOString().split("T")[0],
    purpose: "",
    remarks: "",
  });

  useEffect(() => {
    if (!isOpen) return;

    api
      .get("/custodians")
      .then((res) => setCustodians(res.data))
      .catch((error) => {
        console.error("Failed to load custodians:", error);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  const selectedItem = items.find(
    (item) => String(item.id) === formData.inventory_item_id,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem) {
      alert("Please select an item.");
      return;
    }

    const quantity = Number(formData.quantity);
    const remaining = Number(selectedItem.remaining_quantity);

    if (quantity <= 0) {
      alert("Quantity must be greater than zero.");
      return;
    }

    if (quantity > remaining) {
      alert(`Insufficient stock. Available quantity: ${remaining}`);
      return;
    }

    setLoading(true);

    try {
      await api.post("/withdrawals", {
        ...formData,
        quantity,
      });

      alert("Withdrawal processed successfully!");

      setFormData({
        inventory_item_id: "",
        custodian_id: "",
        quantity: "",
        withdrawal_date: new Date().toISOString().split("T")[0],
        purpose: "",
        remarks: "",
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Withdrawal error:", error.response?.data || error);

      alert(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Failed to process withdrawal.",
      );
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
              value={formData.inventory_item_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  inventory_item_id: e.target.value,
                  quantity: "",
                })
              }
            >
              <option value="">-- Choose Item --</option>

              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.item_description} ({Number(item.remaining_quantity)}{" "}
                  available)
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <div className="bg-gray-100 p-3 rounded text-sm">
              <strong>Available Quantity:</strong>{" "}
              {Number(selectedItem.remaining_quantity)}
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Custodian (Assigned To)
            </label>

            <select
              className="w-full border p-2 rounded"
              required
              value={formData.custodian_id}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  custodian_id: e.target.value,
                })
              }
            >
              <option value="">-- Choose Custodian --</option>

              {custodians.map((custodian) => (
                <option key={custodian.id} value={custodian.id}>
                  {custodian.name} ({custodian.office})
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
              max={
                selectedItem
                  ? Number(selectedItem.remaining_quantity)
                  : undefined
              }
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
            <label className="block text-sm text-gray-600 mb-1">Date</label>

            <input
              type="date"
              className="w-full border p-2 rounded"
              required
              value={formData.withdrawal_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  withdrawal_date: e.target.value,
                })
              }
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Purpose</label>

            <input
              type="text"
              className="w-full border p-2 rounded"
              placeholder="e.g. Office Use"
              value={formData.purpose}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  purpose: e.target.value,
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
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? "Processing..." : "Withdraw"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
