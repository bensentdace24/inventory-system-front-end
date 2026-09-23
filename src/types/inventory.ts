export interface Custodian {
  id: number;
  name: string;
  office: string;
  position?: string;
}

export type InventoryStatus =
  | "Serviceable"
  | "Unserviceable"
  | "For Repair"
  | "For Disposal"
  | "Disposed"
  | "Lost"
  | "Borrowed";

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
  status: string;
  status_remarks: string | null;
}

export interface InventoryItemFormData {
  asset_serial_number: string;
  item_description: string;
  acquisition_date: string;
  cost: string;
  quantity: string;
  salvage_value: string;
  depreciation_expense: string;
  book_value: string;
  custodian: string;
  status: InventoryStatus;
  status_remarks: string;
}

export interface Equipment {
  id: number;
  asset_number: string;
  serial_number: string | null;
  description: string;
  category_id: number | null;
  acquisition_date: string;
  cost: string | number;
  custodian_id: number | null;
  location: string | null;
  condition: string | null;
  status: string;
  remarks: string | null;

  category?: {
    id: number;
    name: string;
  } | null;

  custodian?: Custodian | null;
}

export interface EquipmentFormData {
  asset_number: string;
  serial_number: string;
  description: string;
  category_id: number | null;
  acquisition_date: string;
  cost: string;
  custodian_id: number | null;
  location: string;
  condition: string;
  status: string;
  remarks: string;
}
