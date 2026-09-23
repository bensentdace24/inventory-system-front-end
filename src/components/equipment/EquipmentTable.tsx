"use client";

import { Equipment } from "../../types/inventory";

interface EquipmentTableProps {
  equipment: Equipment[];
  loading: boolean;
}

export default function EquipmentTable({
  equipment,
  loading,
}: EquipmentTableProps) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        Loading equipment...
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
        No equipment records found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-left">
          <thead className="border-b border-gray-200 bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Asset No.
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Serial No.
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Description
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Category
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Acquisition Date
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Cost
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Custodian
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Location
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Condition
              </th>

              <th className="px-4 py-3 text-sm font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {equipment.map((item) => (
              <tr key={item.id} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-4 text-sm font-medium text-gray-900">
                  {item.asset_number}
                </td>

                <td className="px-4 py-4 text-sm text-gray-600">
                  {item.serial_number || "—"}
                </td>

                <td className="px-4 py-4 text-sm text-gray-900">
                  {item.description}
                </td>

                <td className="px-4 py-4 text-sm text-gray-600">
                  {item.category?.name || "Uncategorized"}
                </td>

                <td className="px-4 py-4 text-sm text-gray-600">
                  {item.acquisition_date}
                </td>

                <td className="px-4 py-4 text-sm text-gray-900">
                  ₱
                  {Number(item.cost).toLocaleString("en-PH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>

                <td className="px-4 py-4 text-sm text-gray-600">
                  {item.custodian?.name || "Unassigned"}
                </td>

                <td className="px-4 py-4 text-sm text-gray-600">
                  {item.location || "—"}
                </td>

                <td className="px-4 py-4 text-sm text-gray-600">
                  {item.condition || "—"}
                </td>

                <td className="px-4 py-4 text-sm">
                  <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
