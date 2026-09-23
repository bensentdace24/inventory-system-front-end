"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Equipment, EquipmentFormData } from "../../types/inventory";

interface Category {
  id: number;
  name: string;
}

interface Custodian {
  id: number;
  name: string;
  office: string;
  position?: string;
}

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  equipment?: Equipment | null;
}

const EMPTY_FORM: EquipmentFormData = {
  asset_number: "",
  serial_number: "",
  description: "",
  category_id: null,
  acquisition_date: "",
  cost: "",
  custodian_id: null,
  location: "",
  condition: "Good",
  status: "Serviceable",
  remarks: "",
};

export default function EquipmentModal({
  isOpen,
  onClose,
  onSuccess,
  equipment,
}: EquipmentModalProps) {
  const [formData, setFormData] = useState<EquipmentFormData>(EMPTY_FORM);

  const [categories, setCategories] = useState<Category[]>([]);
  const [custodians, setCustodians] = useState<Custodian[]>([]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const initializeModal = async () => {
      try {
        setLoadingOptions(true);

        const [categoriesResponse, custodiansResponse] = await Promise.all([
          api.get("/categories"),
          api.get("/custodians"),
        ]);

        const loadedCategories = categoriesResponse.data;
        const loadedCustodians = custodiansResponse.data;

        setCategories(loadedCategories);
        setCustodians(loadedCustodians);

        // EDIT MODE
        if (equipment) {
          setFormData({
            asset_number: equipment.asset_number,
            serial_number: equipment.serial_number ?? "",
            description: equipment.description,

            category_id:
              equipment.category_id ?? equipment.category?.id ?? null,

            acquisition_date: equipment.acquisition_date,
            cost: String(equipment.cost),

            custodian_id:
              equipment.custodian_id ?? equipment.custodian?.id ?? null,

            location: equipment.location ?? "",
            condition: equipment.condition ?? "Good",
            status: equipment.status,
            remarks: equipment.remarks ?? "",
          });
        } else {
          // ADD MODE
          setFormData(EMPTY_FORM);
        }
      } catch (error) {
        console.error("Failed to load categories/custodians:", error);
        alert("Failed to load categories or custodians.");
      } finally {
        setLoadingOptions(false);
      }
    };

    initializeModal();
  }, [isOpen, equipment]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "category_id" || name === "custodian_id"
          ? value === ""
            ? null
            : Number(value)
          : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        serial_number:
          formData.serial_number.trim() === ""
            ? null
            : formData.serial_number.trim(),
        location:
          formData.location.trim() === "" ? null : formData.location.trim(),
        remarks:
          formData.remarks.trim() === "" ? null : formData.remarks.trim(),
      };

      if (equipment) {
        // EDIT existing equipment
        await api.put(`/equipment/${equipment.id}`, payload);

        alert("Equipment updated successfully!");
      } else {
        // ADD new equipment
        await api.post("/equipment", payload);

        alert("Equipment added successfully!");
      }

      setFormData(EMPTY_FORM);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Failed to save equipment:", error);

      if (error.response?.data?.errors) {
        console.error("Validation errors:", error.response.data.errors);
      }

      alert(
        error.response?.data?.message ||
          "Failed to save equipment. Please check the form.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              {equipment ? "Edit Equipment" : "Add Equipment"}
            </h2>

            <p className="text-sm text-gray-500">
              {equipment
                ? "Update the equipment or property record."
                : "Register a new office equipment or property item."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {/* Asset Number */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Asset Number *
                </label>

                <input
                  type="text"
                  name="asset_number"
                  value={formData.asset_number}
                  onChange={handleChange}
                  required
                  placeholder="e.g. EQ-2026-001"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Serial Number */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Serial Number
                </label>

                <input
                  type="text"
                  name="serial_number"
                  value={formData.serial_number}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Description *
                </label>

                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Dell OptiPlex Desktop Computer"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Category */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Category *
                </label>

                <select
                  name="category_id"
                  value={formData.category_id ?? ""}
                  onChange={handleChange}
                  disabled={loadingOptions}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading categories..."
                      : "Select category"}
                  </option>

                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Acquisition Date */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Acquisition Date *
                </label>

                <input
                  type="date"
                  name="acquisition_date"
                  value={formData.acquisition_date}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Cost */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Cost *
                </label>

                <input
                  type="number"
                  name="cost"
                  value={formData.cost}
                  onChange={handleChange}
                  required
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Custodian */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Custodian
                </label>

                <select
                  name="custodian_id"
                  value={formData.custodian_id ?? ""}
                  onChange={handleChange}
                  disabled={loadingOptions}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">
                    {loadingOptions
                      ? "Loading custodians..."
                      : "Select custodian"}
                  </option>

                  {custodians.map((custodian) => (
                    <option key={custodian.id} value={custodian.id}>
                      {custodian.name}
                      {custodian.office ? ` — ${custodian.office}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Location
                </label>

                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="e.g. SB Office"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              {/* Condition */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Condition *
                </label>

                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Damaged">Damaged</option>
                  <option value="For Repair">For Repair</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Status *
                </label>

                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="Serviceable">Serviceable</option>
                  <option value="Unserviceable">Unserviceable</option>
                  <option value="For Repair">For Repair</option>
                  <option value="For Disposal">For Disposal</option>
                  <option value="Disposed">Disposed</option>
                  <option value="Lost">Lost</option>
                  <option value="Borrowed">Borrowed</option>
                </select>
              </div>

              {/* Remarks */}
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Optional remarks..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t bg-gray-50 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : equipment
                  ? "Update Equipment"
                  : "Add Equipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
