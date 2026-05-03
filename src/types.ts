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

export interface MaterialRequest {
  id: string;
  materialName: string;
  quantity: number;
  unit: string;
  dateRequested: string;
  dateNeeded: string;
  locationId: string;
  status: RequestStatus;
  history: StatusHistory[];
  pendingEdit?: {
    materialName: string;
    quantity: number;
    unit: string;
    dateNeeded: string;
  };
}

export interface Location {
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
