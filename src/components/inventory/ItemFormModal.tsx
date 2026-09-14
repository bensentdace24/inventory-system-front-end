"use client";

import { FormEvent, useEffect, useState } from "react";
import type { InventoryItem, InventoryItemFormInput } from "@/types/inventory";
import { STATUS_OPTIONS } from "@/types/inventory";

interface ItemFormModalProps {
  mode: "create" | "edit";
  initialItem?: InventoryItem | null;
  onClose: () => void;
  onSubmit: (payload: InventoryItemFormInput) => Promise<void>;
}

type FieldErrors = Record<string, string[]>;

const emptyForm: InventoryItemFormInput = {
  assetSerialNumber: "",
  itemDescription: "",
  acquisitionDate: "",
  cost: "",
  quantity: "1",
  dateOfWithdrawal: "",
  remainingQuantity: "1",
  dateOfReturned: "",
  salvageValue: "0",
  custodian: "",
  depreciationExpense: "0",
  bookValue: "",
  statusRemarks: "Serviceable",
};

function toFormInput(item: InventoryItem): InventoryItemFormInput {
  return {
    assetSerialNumber: item.assetSerialNumber,
    itemDescription: item.itemDescription,
    acquisitionDate: item.acquisitionDate,
    cost: String(item.cost),
    quantity: String(item.quantity),
    dateOfWithdrawal: item.dateOfWithdrawal ?? "",
    remainingQuantity: String(item.remainingQuantity),
    dateOfReturned: item.dateOfReturned ?? "",
    salvageValue: String(item.salvageValue),
    custodian: item.custodian,
    depreciationExpense: String(item.depreciationExpense),
    bookValue: String(item.bookValue),
    statusRemarks: item.statusRemarks,
  };
}

export default function ItemFormModal({
  mode,
  initialItem,
  onClose,
  onSubmit,
}: ItemFormModalProps) {
  const [form, setForm] = useState<InventoryItemFormInput>(
    initialItem ? toFormInput(initialItem) : emptyForm,
  );
  const [bookValueTouched, setBookValueTouched] = useState(mode === "edit");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (bookValueTouched) return;
    const cost = Number(form.cost) || 0;
    const depreciation = Number(form.depreciationExpense) || 0;
    const computed = cost - depreciation;
    setForm((prev) => ({ ...prev, bookValue: computed.toFixed(2) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.cost, form.depreciationExpense]);

  function update<K extends keyof InventoryItemFormInput>(
    key: K,
    value: InventoryItemFormInput[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});
    try {
      await onSubmit(form);
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      if (typeof error === "object" && error !== null && "errors" in error) {
        setErrors((error as { errors: FieldErrors }).errors);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function fieldError(name: string) {
    const messages = errors[name];
    if (!messages || messages.length === 0) return null;
    return (
      <p className="mt-1 text-xs font-medium text-rose-600">{messages[0]}</p>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {mode === "create" ? "Add New Item" : "Edit Item"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2"
        >
          {formError && (
            <div className="col-span-full rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Asset Serial Number <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={form.assetSerialNumber}
              onChange={(e) => update("assetSerialNumber", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. ASN-2024-0001"
            />
            {fieldError("assetSerialNumber")}
          </div>

          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Custodian <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={form.custodian}
              onChange={(e) => update("custodian", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Person assigned to"
            />
            {fieldError("custodian")}
          </div>

          <div className="col-span-full">
            <label className="block text-sm font-medium text-slate-700">
              Item Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={form.itemDescription}
              onChange={(e) => update("itemDescription", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="e.g. HP LaserJet Pro M404dn Printer"
            />
            {fieldError("itemDescription")}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Acquisition / Purchase Date{" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="date"
              value={form.acquisitionDate}
              onChange={(e) => update("acquisitionDate", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError("acquisitionDate")}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Cost (Original Purchase Price){" "}
              <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="number"
              min={0}
              step="0.01"
              value={form.cost}
              onChange={(e) => update("cost", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError("cost")}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Quantity <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="number"
              min={0}
              step="1"
              value={form.quantity}
              onChange={(e) => update("quantity", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError("quantity")}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Date of Withdrawal
            </label>
            <input
              type="date"
              value={form.dateOfWithdrawal ?? ""}
              onChange={(e) => update("dateOfWithdrawal", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError("dateOfWithdrawal")}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Date Returned
            </label>
            <input
              type="date"
              value={form.dateOfReturned ?? ""}
              onChange={(e) => update("dateOfReturned", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError("dateOfReturned")}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Salvage / Residual Value
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.salvageValue}
              onChange={(e) => update("salvageValue", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError("salvageValue")}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Depreciation Expense
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.depreciationExpense}
              onChange={(e) => update("depreciationExpense", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError("depreciationExpense")}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Book Value
              <span className="ml-1 text-xs font-normal text-slate-400">
                (auto: cost − depreciation)
              </span>
            </label>
            <input
              type="number"
              step="0.01"
              value={form.bookValue}
              onChange={(e) => {
                setBookValueTouched(true);
                update("bookValue", e.target.value);
              }}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {fieldError("bookValue")}
          </div>

          <div className="col-span-full sm:col-span-1">
            <label className="block text-sm font-medium text-slate-700">
              Status / Remarks
            </label>
            <select
              value={form.statusRemarks}
              onChange={(e) => update("statusRemarks", e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {fieldError("statusRemarks")}
          </div>

          <div className="col-span-full mt-2 flex justify-end gap-3 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Saving…"
                : mode === "create"
                  ? "Save Item"
                  : "Update Item"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
