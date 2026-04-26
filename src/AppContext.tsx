import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MaterialRequest, Location, RequestStatus, Notification, RAPItem, StockEntry } from './types';
import { GoogleSheetsService, SpreadsheetRow } from './services/GoogleSheetsService';
import { db, auth } from './lib/firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  setDoc,
  collectionGroup,
  where,
  getDocs,
  runTransaction
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

interface NotificationExtended extends Notification {
  targetRole: 'SM' | 'SCM' | 'FINANCE' | 'RAP' | 'ALL';
  readBy: string[];
}

interface AppContextType {
  locations: Location[];
  requests: MaterialRequest[];
  notifications: NotificationExtended[];
  rapData: RAPItem[];
  addLocation: (name: string) => void;
  removeLocation: (id: string) => void;
  addRequest: (request: Omit<MaterialRequest, 'id' | 'status' | 'history'>) => void;
  updateRequestStatus: (requestId: string, newStatus: RequestStatus, extraData?: { recipient?: string; deliverer?: string }) => void;
  dismissNotification: (id: string) => void;
  markNotificationsAsRead: (role: 'SM' | 'SCM' | 'FINANCE' | 'RAP') => void;
  setRapData: (locationId: string, data: RAPItem[]) => void;
  updateStock: (locationId: string, stockId: string, newQuantity: number) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationExtended[]>([]);
  const [rapData, setRapData] = useState<RAPItem[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Real-time Listeners
  useEffect(() => {
    // 1. Locations with their stock subcollections
    const unsubscribeLocations = onSnapshot(collection(db, 'locations'), (snapshot) => {
      const locs: Location[] = [];
      snapshot.forEach(doc => {
        locs.push({ id: doc.id, ...doc.data(), stock: [] } as Location);
      });
      setLocations(locs);

      // Fetch stock for each location (or use collectionGroup for all stock)
      locs.forEach(loc => {
        onSnapshot(collection(db, `locations/${loc.id}/stock`), (stockSnapshot) => {
          const stocks: StockEntry[] = [];
          stockSnapshot.forEach(sDoc => {
            stocks.push({ id: sDoc.id, ...sDoc.data() } as StockEntry);
          });
          setLocations(prev => prev.map(l => l.id === loc.id ? { ...l, stock: stocks } : l));
        }, (error) => handleFirestoreError(error, OperationType.GET, `locations/${loc.id}/stock`));
      });
    }, (error) => handleFirestoreError(error, OperationType.GET, 'locations'));

    // 2. Requests
    const unsubscribeRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const reqs: MaterialRequest[] = [];
      snapshot.forEach(doc => {
        reqs.push({ id: doc.id, ...doc.data() } as MaterialRequest);
      });
      // Sort in memory as safety against missing fields in firestore
      reqs.sort((a, b) => {
        const dateA = a.dateRequested ? new Date(a.dateRequested).getTime() : 0;
        const dateB = b.dateRequested ? new Date(b.dateRequested).getTime() : 0;
        return dateB - dateA;
      });
      setRequests(reqs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'requests'));

    // 3. RAP Data
    const unsubscribeRap = onSnapshot(collectionGroup(db, 'rapData'), (snapshot) => {
      const items: RAPItem[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as RAPItem);
      });
      setRapData(items);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'rapData (collectionGroup)'));

    // 4. Notifications
    const qNotifications = query(collection(db, 'notifications'), orderBy('timestamp', 'desc'));
    const unsubscribeNotifications = onSnapshot(qNotifications, (snapshot) => {
      const notifs: NotificationExtended[] = [];
      snapshot.forEach(doc => {
        notifs.push({ id: doc.id, ...doc.data() } as NotificationExtended);
      });
      setNotifications(notifs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'notifications'));

    return () => {
      unsubscribeLocations();
      unsubscribeRequests();
      unsubscribeRap();
      unsubscribeNotifications();
    };
  }, []);

  const updateRapData = async (locationId: string, newData: RAPItem[]) => {
    try {
      // First, clear old rap data for this location as batch (simplified: delete then add)
      const q = query(collection(db, `locations/${locationId}/rapData`));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      const addPromises = newData.map(item => {
        const { id, ...data } = item;
        return addDoc(collection(db, `locations/${locationId}/rapData`), { ...data, locationId });
      });
      await Promise.all(addPromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `locations/${locationId}/rapData`);
    }
  };

  const addNotification = useCallback(async (message: string, targetRole: 'SM' | 'SCM' | 'FINANCE' | 'RAP' | 'ALL', type: Notification['type'] = 'info', locationName?: string) => {
    const newNotif = {
      message,
      timestamp: Date.now(),
      type,
      targetRole,
      readBy: [],
      locationName
    };
    try {
      await addDoc(collection(db, 'notifications'), newNotif);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'notifications');
    }
  }, []);

  const addLocation = async (name: string) => {
    try {
      await addDoc(collection(db, 'locations'), { name });
      addNotification(`Lokasi baru dibuat: ${name}`, 'SM', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'locations');
    }
  };

  const removeLocation = async (id: string) => {
    try {
      const loc = locations.find(l => l.id === id);
      await deleteDoc(doc(db, 'locations', id));
      addNotification(`Lokasi ${loc?.name} dihapus`, 'SM', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `locations/${id}`);
    }
  };

  const addRequest = async (reqData: Omit<MaterialRequest, 'id' | 'status' | 'history'>) => {
    const newRequestData = {
      ...reqData,
      status: 'pending' as RequestStatus,
      history: [{ status: 'pending', timestamp: Date.now() }],
    };
    try {
      const docRef = await addDoc(collection(db, 'requests'), newRequestData);
      const locName = locations.find(l => l.id === reqData.locationId)?.name;
      addNotification(`Request baru untuk ${newRequestData.materialName} dari ${locName}`, 'SCM', 'info', locName);
      
      // Sync to Sheets
      if (accessToken) {
        syncToSheets({ ...newRequestData, id: docRef.id } as MaterialRequest, locName || 'Unknown');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    }
  };

  const syncToSheets = async (req: MaterialRequest, locName: string) => {
    if (!accessToken) return;
    const row: SpreadsheetRow = {
      requestId: req.id,
      materialName: req.materialName,
      quantity: req.quantity.toString(),
      unit: req.unit,
      dateRequested: new Date(req.dateRequested).toLocaleString(),
      dateNeeded: new Date(req.dateNeeded).toLocaleDateString(),
      location: locName,
      status: req.status.toUpperCase(),
      recipient: (req as any).recipient || '-',
      deliverer: (req as any).deliverer || '-',
      timestamp: new Date().toLocaleString()
    };
    try {
      await GoogleSheetsService.appendRequest(accessToken, row);
    } catch (err) {
      console.error('Sheets sync failed:', err);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus, extraData?: { recipient?: string; deliverer?: string }) => {
    try {
      const currentReq = requests.find(r => r.id === requestId);
      if (!currentReq || currentReq.status === newStatus) return;

      const loc = locations.find(l => l.id === currentReq.locationId);
      const locName = loc?.name;

      // 1. Read outside transaction (Queries cannot run inside transactions directly in Firestore Web SDK)
      let existingStockRef = null;
      let existingStockData = null;
      if (newStatus === 'received' && currentReq.status !== 'received') {
        const q = query(
          collection(db, `locations/${currentReq.locationId}/stock`), 
          where('materialName', '==', currentReq.materialName)
        );
        const stockSnapshot = await getDocs(q);
        if (!stockSnapshot.empty) {
          existingStockRef = stockSnapshot.docs[0].ref;
          existingStockData = stockSnapshot.docs[0].data();
        }
      }

      await runTransaction(db, async (transaction) => {
        // 2. Perform write
        const updatedHistory = [...currentReq.history, { status: newStatus, timestamp: Date.now() }];
        const updateData: any = {
          status: newStatus,
          history: updatedHistory,
          ...(extraData?.recipient ? { recipient: extraData.recipient } : {}),
          ...(extraData?.deliverer ? { deliverer: extraData.deliverer } : {})
        };
        transaction.update(doc(db, 'requests', requestId), updateData);

        // 3. Update stock if received
        if (newStatus === 'received' && currentReq.status !== 'received') {
          const addedQty = currentReq.quantity * 0.5;
          if (existingStockRef) {
            transaction.update(existingStockRef, {
              quantity: (existingStockData?.quantity || 0) + addedQty,
              dateReceived: Date.now()
            });
          } else {
            const newStockId = Math.random().toString(36).substring(7);
            transaction.set(doc(db, `locations/${currentReq.locationId}/stock`, newStockId), {
              materialName: currentReq.materialName,
              quantity: addedQty,
              unit: currentReq.unit,
              dateReceived: Date.now(),
              locationName: locName
            });
          }
        }
      });

      // Notification Logic
      const statusLabels: Record<RequestStatus, string> = {
        pending: 'Antrian',
        processing: 'Diproses',
        awaiting_payment: 'Menunggu Pembayaran',
        paid: 'Sudah Dibayar',
        delivered: 'Diantarkan',
        received: 'Diterima',
        on_hold: 'Hold / Indent'
      };

      if (newStatus === 'awaiting_payment') {
        addNotification(`Request ${currentReq.materialName} menunggu pembayaran (${locName})`, 'FINANCE', 'info', locName);
      }
      addNotification(`Material ${currentReq.materialName}: ${statusLabels[newStatus]}`, 'SM', 'update', locName);

      // Sync update to Sheets
      if (accessToken) {
        syncToSheets({ ...currentReq, status: newStatus, ...(extraData || {}) } as MaterialRequest, locName || 'Unknown');
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${requestId}`);
    }
  };

  const updateStock = async (locationId: string, stockId: string, newQuantity: number) => {
    try {
      await updateDoc(doc(db, `locations/${locationId}/stock`, stockId), { quantity: newQuantity });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `locations/${locationId}/stock/${stockId}`);
    }
  };

  const markNotificationsAsRead = async (role: 'SM' | 'SCM' | 'FINANCE' | 'RAP') => {
    try {
      const updates = notifications
        .filter(n => (n.targetRole === role || n.targetRole === 'ALL') && !n.readBy.includes(role))
        .map(n => updateDoc(doc(db, 'notifications', n.id), { readBy: [...n.readBy, role] }));
      await Promise.all(updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'notifications');
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  return (
    <AppContext.Provider value={{
      locations,
      requests,
      notifications,
      addLocation,
      removeLocation,
      addRequest,
      updateRequestStatus,
      dismissNotification,
      markNotificationsAsRead,
      rapData,
      setRapData: updateRapData,
      updateStock,
      accessToken,
      setAccessToken
    }}>
      {children}
    </AppContext.Provider>
  );
};


export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
