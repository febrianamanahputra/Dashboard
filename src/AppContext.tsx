import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MaterialRequest, Location, RequestStatus, Notification, RAPItem, StockEntry, MainMaterial } from './types';
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
  mainMaterials: MainMaterial[];
  addLocation: (name: string) => void;
  updateLocation: (id: string, name: string, imageUrl?: string) => void;
  removeLocation: (id: string) => void;
  addMainMaterial: (name: string, unit: string) => void;
  deleteMainMaterial: (id: string) => void;
  addRequest: (request: Omit<MaterialRequest, 'id' | 'status' | 'history'>) => void;
  editRequest: (requestId: string, data: Partial<MaterialRequest>) => void;
  approveEdit: (requestId: string) => void;
  rejectEdit: (requestId: string) => void;
  deleteRequest: (requestId: string) => void;
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
  const [mainMaterials, setMainMaterials] = useState<MainMaterial[]>([]);
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
    
    // 5. Main Materials
    const unsubscribeMainMaterials = onSnapshot(collection(db, 'mainMaterials'), (snapshot) => {
      const items: MainMaterial[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as MainMaterial);
      });
      // Sort in memory to avoid needing a complex index initially
      items.sort((a, b) => {
        const timeA = (a as any).createdAt || 0;
        const timeB = (b as any).createdAt || 0;
        return timeB - timeA;
      });
      setMainMaterials(items);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'mainMaterials'));

    return () => {
      unsubscribeLocations();
      unsubscribeRequests();
      unsubscribeRap();
      unsubscribeNotifications();
      unsubscribeMainMaterials();
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

  const updateLocation = async (id: string, name: string, imageUrl?: string) => {
    try {
      await updateDoc(doc(db, 'locations', id), { name, imageUrl });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `locations/${id}`);
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

  const addMainMaterial = useCallback(async (name: string, unit: string) => {
    try {
      if (!name.trim()) return;
      await addDoc(collection(db, 'mainMaterials'), { 
        name: name.trim(), 
        unit: unit.toLowerCase(),
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'mainMaterials');
    }
  }, []);

  const deleteMainMaterial = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'mainMaterials', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `mainMaterials/${id}`);
    }
  };

  const editRequest = async (requestId: string, data: Partial<MaterialRequest>) => {
    try {
      const req = requests.find(r => r.id === requestId);
      if (!req) return;

      if (req.status === 'pending') {
        // Direct edit
        await updateDoc(doc(db, 'requests', requestId), data);
        addNotification(`Request ${req.materialName} telah diperbarui langsung`, 'SCM', 'update');
      } else {
        // Request for edit (SCM must approve)
        await updateDoc(doc(db, 'requests', requestId), {
          pendingEdit: {
            materialName: data.materialName || req.materialName,
            quantity: data.quantity || req.quantity,
            unit: data.unit || req.unit,
            dateNeeded: data.dateNeeded || req.dateNeeded
          }
        });
        const locName = locations.find(l => l.id === req.locationId)?.name;
        addNotification(`Permintaan Edit untuk ${req.materialName} (${locName})`, 'SCM', 'update', locName);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${requestId}`);
    }
  };

  const approveEdit = async (requestId: string) => {
    try {
      const req = requests.find(r => r.id === requestId);
      if (!req || !req.pendingEdit) return;

      await updateDoc(doc(db, 'requests', requestId), {
        ...req.pendingEdit,
        pendingEdit: null
      });
      addNotification(`Edit untuk ${req.materialName} telah disetujui`, 'SM', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${requestId}`);
    }
  };

  const rejectEdit = async (requestId: string) => {
    try {
      const req = requests.find(r => r.id === requestId);
      if (!req) return;

      await updateDoc(doc(db, 'requests', requestId), {
        pendingEdit: null
      });
      addNotification(`Edit untuk ${req.materialName} ditolak oleh SCM`, 'SM', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${requestId}`);
    }
  };

  const deleteRequest = async (requestId: string) => {
    try {
      const req = requests.find(r => r.id === requestId);
      if (!req) return;
      await deleteDoc(doc(db, 'requests', requestId));
      addNotification(`Request ${req.materialName} telah dibatalkan`, 'SCM', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${requestId}`);
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

  const syncDirectToSheet = async (req: MaterialRequest, locName: string) => {
    const sheetUrl = import.meta.env.VITE_GOOGLE_SHEETS_URL;
    if (!sheetUrl) {
      console.warn('VITE_GOOGLE_SHEETS_URL belum dikonfigurasi di variabel lingkungan.');
      return;
    }

    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script web app with POST often needs no-cors or CORS handling
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: req.id,
          locationName: locName,
          materialName: req.materialName,
          quantity: req.quantity,
          unit: req.unit,
          status: req.status,
          dateRequested: req.dateRequested
        }),
      });
      console.log('Successfully triggered direct sheet sync for:', req.materialName);
    } catch (err) {
      console.error('Direct Sheet sync failed:', err);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus, extraData?: { recipient?: string; deliverer?: string }) => {
    try {
      const currentReq = requests.find(r => r.id === requestId);
      if (!currentReq || currentReq.status === newStatus) return;

      const loc = locations.find(l => l.id === currentReq.locationId);
      const locName = loc?.name;

      await runTransaction(db, async (transaction) => {
        // 1. MUST Read document in transaction before writing
        const reqRef = doc(db, 'requests', requestId);
        const reqDoc = await transaction.get(reqRef);
        
        if (!reqDoc.exists()) {
          throw new Error("Permintaan tidak ditemukan di database.");
        }

        const reqData = reqDoc.data() as MaterialRequest;
        
        // 2. Prepare update data
        const updatedHistory = [...(reqData.history || []), { status: newStatus, timestamp: Date.now() }];
        const updateData: any = {
          status: newStatus,
          history: updatedHistory,
          ...(extraData?.recipient ? { recipient: extraData.recipient } : {}),
          ...(extraData?.deliverer ? { deliverer: extraData.deliverer } : {})
        };

        // 3. Perform update
        transaction.update(reqRef, updateData);

        // 4. Update stock if received
        if (newStatus === 'received' && reqData.status !== 'received') {
          // If we are receiving, we need to check stock. 
          // Note: Queries in standard Firestore Transactions are tricky; 
          // usually better to have a single stock doc per material or use a known ID.
          // Since we already did getDocs outside earlier, we'll try to find it again inside if possible, 
          // or just use setDoc with a deterministic ID if we want truly atomic.
          // For now, we'll keep the logic but ensure we follow transaction rules.
          
          const addedQty = reqData.quantity; // Added full quantity (removed the * 0.5 test logic)
          
          // Since we can't easily query inside a transaction without knowing the ID, 
          // let's use a deterministic ID for material-location stock if possible, 
          // or just fallback to the outside read reference for now as it's better than before.
          // BUT: transaction.get(query) is not valid.
          // We'll stick to updating the request first.
        }
      });

      // Stock logic refinement: move it to separate call or handle after transaction if purely additive
      if (newStatus === 'received' && currentReq.status !== 'received') {
        const q = query(
          collection(db, `locations/${currentReq.locationId}/stock`), 
          where('materialName', '==', currentReq.materialName)
        );
        const stockSnapshot = await getDocs(q);
        if (!stockSnapshot.empty) {
          const sDoc = stockSnapshot.docs[0];
          await updateDoc(sDoc.ref, {
            quantity: (sDoc.data().quantity || 0) + currentReq.quantity,
            dateReceived: Date.now()
          });
        } else {
          await addDoc(collection(db, `locations/${currentReq.locationId}/stock`), {
            materialName: currentReq.materialName,
            quantity: currentReq.quantity,
            unit: currentReq.unit,
            dateReceived: Date.now(),
            locationName: locName
          });
        }
      }

      // Notification Logic
      const statusLabels: Record<RequestStatus, string> = {
        pending: 'Belum di proses',
        processing: 'Diproses',
        awaiting_payment: 'Menunggu Pembayaran',
        paid: 'Pembayaran Berhasil',
        delivered: 'Pengantaran',
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

      // Sync DIRECT to Sheet if received
      if (newStatus === 'received') {
        syncDirectToSheet({ ...currentReq, status: newStatus, ...(extraData || {}) } as MaterialRequest, locName || 'Unknown');
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
      updateLocation,
      removeLocation,
      addMainMaterial,
      deleteMainMaterial,
      addRequest,
      editRequest,
      approveEdit,
      rejectEdit,
      deleteRequest,
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
