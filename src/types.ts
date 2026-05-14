/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type RequestStatus = 'pending' | 'processing' | 'awaiting_payment' | 'paid' | 'delivered' | 'received' | 'on_hold';

export interface StatusHistory {
  status: RequestStatus;
  timestamp: number;
}

export interface MainMaterial {
  id: string;
  name: string;
  unit: string;
}

export interface StockEntry {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  dateReceived: number;
  locationName?: string;
  recipient?: string;
  deliverer?: string;
}

export interface RAPItem {
  id: string;
  locationId: string;
  materialName: string;
  quantity: number;
  unit: string;
  totalOrdered?: number;
}

export interface Sub {
  id: string;
  name: string;
  profileId: string;
  createdAt: number;
}

export interface Profile {
  id: string;
  name: string;
  avatarUrl?: string; // Will store base64 or URL
  createdAt: number;
}

export interface MaterialRequest {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  dateRequested: string;
  createdAt: number;
  dateNeeded: string;
  subId: string; // Linked to Sub ID
  status: RequestStatus;
  history: StatusHistory[];
  recipient?: string;
  deliverer?: string;
  pendingEdit?: {
    materialName: string;
    quantity: number;
    unit: string;
    dateNeeded: string;
  };
}

export interface ProfileOld {
  id: string;
  name: string;
  stock: StockEntry[];
  imageUrl?: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: number;
  type: 'info' | 'success' | 'update';
  locationName?: string;
}

export interface FieldFundItem {
  uraian: string;
  klasifikasi: 'BAHAN' | 'ALAT' | 'JASA';
  jumlah: number;
  satuan: string;
  hargaSatuan: number;
  hargaTotal: number;
}

export interface FieldFundDeposit {
  id: string;
  subId: string;
  amount: number;
  type: 'in' | 'out';
  date: string;
  createdAt: number;
}

export interface FieldFundEntry {
  id: string;
  subId: string;
  tanggal: string;
  notaNo: string;
  items: FieldFundItem[];
  totalNota: number;
  keterangan: string;
  createdAt: number;
}

export interface ReportTemplate {
  id: string;
  subId: string;
  heading: string;
  footer: string;
}
