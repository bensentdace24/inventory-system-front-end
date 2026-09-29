"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Equipment } from "../../types/inventory";

interface EquipmentReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment: Equipment | null;
}

export default function EquipmentReturnModal({
  isOpen,
  onClose,
  onSuccess,
  equipment,
}: EquipmentReturnModalProps) {
  const [returnDate, setReturnDate] = useState("");
  const [condition, setCondition] = useState("Good");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split("T")[0];

      setReturnDate(today);
      setCondition(equipment?.condition || "Good");
      setReason("");
      setRemarks("");
    }
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      await api.post(`/equipment/${equipment.id}/return`, {
        return_date: returnDate,
        condition,
        reason: reason.trim() === "" ? null : reason.trim(),
        remarks: remarks.trim() === "" ? null : remarks.trim(),
      });

      alert("Equipment returned to GSO successfully!");

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to return equipment:", error);

      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors);
      }

      alert(
        error.response?.data?.message ||
          "Failed to return equipment. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-bold text-gray-900">
            Return Equipment to GSO
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Record the return of this equipment to the General Services Office.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-5">
            {/* Equipment Information */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Asset Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {equipment.asset_number}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Serial Number
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {equipment.serial_number || "—"}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs font-medium text-gray-500">
                    Description
                  </p>
                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {equipment.description}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Current Custodian
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {equipment.custodian?.name || "Unassigned"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-gray-500">
                    Current Location
                  </p>
                  <p className="mt-1 text-sm text-gray-700">
                    {equipment.location || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Return Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Return Date
              </label>

              <input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Condition */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Condition
              </label>

              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                required
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              >
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Damaged">Damaged</option>
                <option value="Unserviceable">Unserviceable</option>
              </select>
            </div>

            {/* Reason */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Reason
              </label>

              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Employee transfer, replacement, no longer needed"
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            {/* Remarks */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Remarks
              </label>

              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                placeholder="Additional notes about the returned equipment..."
                className="w-full resize-none rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Returning..." : "Return to GSO"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
