export type InventoryStatus =
  | "active"
  | "withdrawn"
  | "returned"
  | "disposed"
  | "for_repair";

export interface InventoryItem {
  id: number;
  asset_serial_number: string;
  item_description: string;
  acquisition_date: string;
  cost: string | number;
  quantity: string | number;
  remaining_quantity: string | number;
  salvage_value: string | number | null;
  depreciation_expense: string | number | null;
  book_value: string | number | null;
  custodian: string | null;
  date_of_withdrawal: string | null;
  date_of_returned: string | null;
  status: InventoryStatus | string;
  remarks: string | null;
}

export interface InventoryItemFormData {
  asset_serial_number: string;
  item_description: string;
  acquisition_date: string;
  cost: string;
  quantity: string;
  remaining_quantity: string;
  salvage_value: string;
  depreciation_expense: string;
  book_value: string;
  custodian: string;
  date_of_withdrawal: string;
  date_of_returned: string;
  status: InventoryStatus | string;
  remarks: string;
}
