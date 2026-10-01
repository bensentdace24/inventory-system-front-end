"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Equipment, EquipmentReturn } from "../../types/inventory";

interface EquipmentReturnHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment | null;
}

export default function EquipmentReturnHistoryModal({
  isOpen,
  onClose,
  equipment,
}: EquipmentReturnHistoryModalProps) {
  const [returns, setReturns] = useState<EquipmentReturn[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !equipment) {
      return;
    }

    const fetchReturnHistory = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/equipment/${equipment.id}/returns`);

        setReturns(response.data);
      } catch (error) {
        console.error("Failed to fetch equipment return history:", error);
        setReturns([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReturnHistory();
  }, [isOpen, equipment]);

  if (!isOpen || !equipment) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-5xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Equipment Return History
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {equipment.description}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Equipment Information */}
        <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-gray-500">Asset Number</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {equipment.asset_number}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">Serial Number</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {equipment.serial_number || "—"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium text-gray-500">
                Current Status
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {equipment.status}
              </p>
            </div>
          </div>
        </div>

        {/* History */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Loading return history...
            </div>
          ) : returns.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
              <p className="text-sm font-medium text-gray-700">
                No return history found.
              </p>

              <p className="mt-1 text-xs text-gray-500">
                This equipment has not been returned to GSO yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full min-w-[850px] text-left">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                      Return Date
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                      Previous Custodian
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                      Returned To
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                      Condition
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                      Reason
                    </th>

                    <th className="px-4 py-3 text-xs font-semibold text-gray-600">
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {returns.map((returnRecord) => (
                    <tr key={returnRecord.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-700">
                        {returnRecord.return_date}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {returnRecord.previous_custodian?.name || "Unassigned"}
                      </td>

                      <td className="px-4 py-4 text-sm font-medium text-gray-900">
                        {returnRecord.returned_to}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {returnRecord.condition}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {returnRecord.reason || "—"}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {returnRecord.remarks || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
