import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { MaterialRequest, Profile, Sub, RequestStatus, Notification, RAPItem, StockEntry, MainMaterial, FieldFundEntry, FieldFundDeposit, ReportTemplate } from './types';
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
  profiles: Profile[];
  subs: Sub[];
  requests: MaterialRequest[];
  notifications: NotificationExtended[];
  rapData: RAPItem[];
  mainMaterials: MainMaterial[];
  fieldFunds: FieldFundEntry[];
  fieldFundDeposits: FieldFundDeposit[];
  reportTemplates: ReportTemplate[];
  addProfile: (name: string, avatarUrl?: string) => void;
  updateProfile: (id: string, name: string, avatarUrl?: string) => void;
  removeProfile: (id: string) => void;
  addSub: (name: string, profileId: string) => void;
  updateSub: (id: string, name: string) => void;
  removeSub: (id: string, cascade?: boolean) => void;
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
  setRapData: (subId: string, data: RAPItem[]) => void;
  updateStock: (subId: string, stockId: string, newQuantity: number) => void;
  addManualStock: (subId: string, materialName: string, quantity: number, unit: string) => void;
  addFieldFundEntry: (entry: Omit<FieldFundEntry, 'id' | 'createdAt'>) => void;
  deleteFieldFundEntry: (id: string) => void;
  addFieldFundDeposit: (deposit: Omit<FieldFundDeposit, 'id' | 'createdAt'>) => void;
  updateFieldFundDeposit: (id: string, amount: number, type: 'in' | 'out') => void;
  deleteFieldFundDeposit: (id: string) => void;
  updateReportTemplate: (subId: string, heading: string, footer: string) => void;
  accessToken: string | null;
  setAccessToken: (token: string | null) => void;
  syncDirectToSheet: (req: MaterialRequest, locName: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [notifications, setNotifications] = useState<NotificationExtended[]>([]);
  const [rapData, setRapItems] = useState<RAPItem[]>([]);
  const [mainMaterials, setMainMaterials] = useState<MainMaterial[]>([]);
  const [fieldFunds, setFieldFunds] = useState<FieldFundEntry[]>([]);
  const [fieldFundDeposits, setFieldFundDeposits] = useState<FieldFundDeposit[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Real-time Listeners
  useEffect(() => {
    // ... existing listeners ...
    // ... 5. Main Materials ...

    // 6. Field Funds
    const unsubscribeFieldFunds = onSnapshot(collection(db, 'fieldFunds'), (snapshot) => {
      const items: FieldFundEntry[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as FieldFundEntry);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setFieldFunds(items);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'fieldFunds'));
    
    // 6b. Field Fund Deposits
    const unsubscribeDeposits = onSnapshot(collection(db, 'fieldFundDeposits'), (snapshot) => {
      const items: FieldFundDeposit[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as FieldFundDeposit);
      });
      items.sort((a, b) => b.createdAt - a.createdAt);
      setFieldFundDeposits(items);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'fieldFundDeposits'));

    // 7. Report Templates
    const unsubscribeTemplates = onSnapshot(collection(db, 'reportTemplates'), (snapshot) => {
      const items: ReportTemplate[] = [];
      snapshot.forEach(doc => {
        items.push({ id: doc.id, ...doc.data() } as ReportTemplate);
      });
      setReportTemplates(items);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'reportTemplates'));

    const unsubscribeProfiles = onSnapshot(collection(db, 'profiles'), (snapshot) => {
      const projs: Profile[] = [];
      snapshot.forEach(doc => {
        projs.push({ id: doc.id, ...doc.data() } as Profile);
      });
      setProfiles(projs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'profiles'));

    // 1b. Subs
    const unsubscribeSubs = onSnapshot(collection(db, 'subs'), (snapshot) => {
      const sbs: Sub[] = [];
      snapshot.forEach(doc => {
        sbs.push({ id: doc.id, ...doc.data() } as Sub);
      });
      setSubs(sbs);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'subs'));

    // 2. Requests
    const unsubscribeRequests = onSnapshot(collection(db, 'requests'), (snapshot) => {
      const reqs: MaterialRequest[] = [];
      snapshot.forEach(doc => {
        reqs.push({ id: doc.id, ...doc.data() } as MaterialRequest);
      });
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
      setRapItems(items);
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
      items.sort((a, b) => {
        const timeA = (a as any).createdAt || 0;
        const timeB = (b as any).createdAt || 0;
        return timeB - timeA;
      });
      setMainMaterials(items);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'mainMaterials'));

    return () => {
      unsubscribeProfiles();
      unsubscribeSubs();
      unsubscribeRequests();
      unsubscribeRap();
      unsubscribeNotifications();
      unsubscribeMainMaterials();
      unsubscribeFieldFunds();
      unsubscribeDeposits();
      unsubscribeTemplates();
    };
  }, []);

  const updateRapData = async (subId: string, newData: RAPItem[]) => {
    try {
      const q = query(collection(db, `subs/${subId}/rapData`));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      const addPromises = newData.map(item => {
        const { id, ...data } = item;
        return addDoc(collection(db, `subs/${subId}/rapData`), { ...data, locationId: subId });
      });
      await Promise.all(addPromises);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `subs/${subId}/rapData`);
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

  const addProfile = async (name: string, avatarUrl?: string) => {
    try {
      await addDoc(collection(db, 'profiles'), { 
        name, 
        avatarUrl: avatarUrl || '', 
        createdAt: Date.now() 
      });
      addNotification(`Profile baru dibuat: ${name}`, 'SM', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'profiles');
    }
  };

  const updateProfile = async (id: string, name: string, avatarUrl?: string) => {
    try {
      const updateData: any = { name };
      if (avatarUrl) updateData.avatarUrl = avatarUrl;
      await updateDoc(doc(db, 'profiles', id), updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${id}`);
    }
  };

  const removeProfile = async (id: string) => {
    try {
      const prof = profiles.find(p => p.id === id);
      await deleteDoc(doc(db, 'profiles', id));
      addNotification(`Profile ${prof?.name} dihapus`, 'SM', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${id}`);
    }
  };

  const addSub = async (name: string, profileId: string) => {
    try {
      await addDoc(collection(db, 'subs'), { 
        name, 
        profileId, 
        createdAt: Date.now() 
      });
      addNotification(`Sub Lokasi baru dibuat: ${name}`, 'SM', 'success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'subs');
    }
  };

  const updateSub = async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, 'subs', id), { name });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subs/${id}`);
    }
  };

  const removeSub = async (id: string, cascade: boolean = false) => {
    try {
      const sub = subs.find(s => s.id === id);
      if (!sub) return;

      if (cascade) {
        // 1. Delete associated requests
        const reqsToDelete = requests.filter(r => r.subId === id);
        const reqPromises = reqsToDelete.map(r => deleteDoc(doc(db, 'requests', r.id)));
        
        // 2. Delete associated field funds
        const fundsToDelete = fieldFunds.filter(f => f.subId === id);
        const fundPromises = fundsToDelete.map(f => deleteDoc(doc(db, 'fieldFunds', f.id)));

        // 3. Delete Stock (Subcollection)
        const stockSnapshot = await getDocs(collection(db, `subs/${id}/stock`));
        const stockPromises = stockSnapshot.docs.map(d => deleteDoc(d.ref));

        // 4. Delete RAP Data (Subcollection)
        const rapSnapshot = await getDocs(collection(db, `subs/${id}/rapData`));
        const rapPromises = rapSnapshot.docs.map(d => deleteDoc(d.ref));

        // 5. Delete Report Template
        const template = reportTemplates.find(t => t.subId === id);
        const templatePromise = template ? [deleteDoc(doc(db, 'reportTemplates', template.id))] : [];

        await Promise.all([
          ...reqPromises,
          ...fundPromises,
          ...stockPromises,
          ...rapPromises,
          ...templatePromise
        ]);
      }

      await deleteDoc(doc(db, 'subs', id));
      addNotification(`Sub Lokasi ${sub.name} dihapus ${cascade ? 'beserta seluruh data terkait' : ''}`, 'SM', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `subs/${id}`);
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
        await updateDoc(doc(db, 'requests', requestId), data);
        addNotification(`Request ${req.materialName} telah diperbarui langsung`, 'SCM', 'update');
      } else {
        await updateDoc(doc(db, 'requests', requestId), {
          pendingEdit: {
            materialName: data.materialName || req.materialName,
            quantity: data.quantity || req.quantity,
            unit: data.unit || req.unit,
            dateNeeded: data.dateNeeded || req.dateNeeded
          }
        });
        const targetSubId = data.subId || req.subId;
        const sub = subs.find(s => s.id === targetSubId);
        const subName = sub?.name;
        addNotification(`Permintaan Edit untuk ${req.materialName} (${subName})`, 'SCM', 'update', subName);
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
      createdAt: Date.now()
    };
    try {
      const docRef = await addDoc(collection(db, 'requests'), newRequestData);
      const subName = subs.find(s => s.id === reqData.subId)?.name;
      addNotification(`Request baru untuk ${newRequestData.materialName} dari ${subName}`, 'SCM', 'info', subName);
      
      if (accessToken) {
        syncToSheets({ ...newRequestData, id: docRef.id } as MaterialRequest, subName || 'Unknown');
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
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxBOB9bwNHK033vpgxQsU30Tnczn2l0s5OmsembojVKq6G_0qE_bo91BP4sWk2tB8g/exec";
    
    const payload = {
      lokasi: locName,
      tanggal_request: req.createdAt ? new Date(req.createdAt).toLocaleDateString("id-ID") : (req.dateRequested || "-"),
      nama_barang: req.materialName,
      jumlah: req.quantity,
      satuan: req.unit.toUpperCase(),
      tanggal_diperlukan: new Date(req.dateNeeded).toLocaleDateString("id-ID"),
      tanggal_diterima: new Date().toLocaleDateString("id-ID"),
      penerima: req.recipient || "-",
      pengantar: req.deliverer || "-"
    };
    
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "text/plain",
        },
        body: JSON.stringify(payload)
      });
      console.log("Sinkronisasi otomatis berhasil dikirim untuk:", req.materialName);
    } catch (error) {
      console.error("Gagal sinkronisasi:", error);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: RequestStatus, extraData?: { recipient?: string; deliverer?: string }) => {
    try {
      const currentReq = requests.find(r => r.id === requestId);
      if (!currentReq || currentReq.status === newStatus) return;

      const sub = subs.find(s => s.id === currentReq.subId);
      const subName = sub?.name;

      await runTransaction(db, async (transaction) => {
        const reqRef = doc(db, 'requests', requestId);
        const reqDoc = await transaction.get(reqRef);
        
        if (!reqDoc.exists()) {
          throw new Error("Permintaan tidak ditemukan di database.");
        }

        const reqData = reqDoc.data() as MaterialRequest;
        const updatedHistory = [...(reqData.history || []), { status: newStatus, timestamp: Date.now() }];
        const updateData: any = {
          status: newStatus,
          history: updatedHistory,
          ...(newStatus === 'received' ? { receivedAt: Date.now() } : {}),
          ...(extraData?.recipient ? { recipient: extraData.recipient } : {}),
          ...(extraData?.deliverer ? { deliverer: extraData.deliverer } : {})
        };

        transaction.update(reqRef, updateData);
      });

      if (newStatus === 'received' && currentReq.status !== 'received') {
        const q = query(
          collection(db, `subs/${currentReq.subId}/stock`), 
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
          await addDoc(collection(db, `subs/${currentReq.subId}/stock`), {
            materialName: currentReq.materialName,
            quantity: currentReq.quantity,
            unit: currentReq.unit,
            dateReceived: Date.now(),
            subId: currentReq.subId
          });
        }
      }

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
        addNotification(`Request ${currentReq.materialName} menunggu pembayaran (${subName})`, 'FINANCE', 'info', subName);
      }
      addNotification(`Material ${currentReq.materialName}: ${statusLabels[newStatus]}`, 'SM', 'update', subName);

      if (accessToken) {
        syncToSheets({ ...currentReq, status: newStatus, ...(extraData || {}) } as MaterialRequest, subName || 'Unknown');
      }

      if (newStatus === 'received') {
        syncDirectToSheet({ ...currentReq, status: newStatus, ...(extraData || {}) } as MaterialRequest, subName || 'Unknown');
      }

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `requests/${requestId}`);
    }
  };

  const updateStock = async (subId: string, stockId: string, newQuantity: number) => {
    try {
      await updateDoc(doc(db, `subs/${subId}/stock`, stockId), { quantity: newQuantity });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `subs/${subId}/stock/${stockId}`);
    }
  };

  const addManualStock = async (subId: string, materialName: string, quantity: number, unit: string) => {
    try {
      const q = query(
        collection(db, `subs/${subId}/stock`), 
        where('materialName', '==', materialName)
      );
      const stockSnapshot = await getDocs(q);
      if (!stockSnapshot.empty) {
        const sDoc = stockSnapshot.docs[0];
        await updateDoc(sDoc.ref, {
          quantity: (sDoc.data().quantity || 0) + quantity,
          dateReceived: Date.now()
        });
      } else {
        await addDoc(collection(db, `subs/${subId}/stock`), {
          materialName,
          quantity,
          unit,
          dateReceived: Date.now(),
          subId
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `subs/${subId}/stock`);
    }
  };

  const addFieldFundEntry = async (entry: Omit<FieldFundEntry, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'fieldFunds'), {
        ...entry,
        createdAt: Date.now()
      });
      addNotification(`Dana Lapangan baru diinput: ${entry.notaNo}`, 'FINANCE', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'fieldFunds');
    }
  };

  const deleteFieldFundEntry = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'fieldFunds', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `fieldFunds/${id}`);
    }
  };

  const addFieldFundDeposit = async (deposit: Omit<FieldFundDeposit, 'id' | 'createdAt'>) => {
    try {
      await addDoc(collection(db, 'fieldFundDeposits'), {
        ...deposit,
        createdAt: Date.now()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'fieldFundDeposits');
    }
  };

  const updateFieldFundDeposit = async (id: string, amount: number, type: 'in' | 'out') => {
    try {
      await updateDoc(doc(db, 'fieldFundDeposits', id), { amount, type });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `fieldFundDeposits/${id}`);
    }
  };

  const deleteFieldFundDeposit = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'fieldFundDeposits', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `fieldFundDeposits/${id}`);
    }
  };

  const updateReportTemplate = async (subId: string, heading: string, footer: string) => {
    try {
      const existing = reportTemplates.find(t => t.subId === subId);
      if (existing) {
        await updateDoc(doc(db, 'reportTemplates', existing.id), { heading, footer });
      } else {
        await addDoc(collection(db, 'reportTemplates'), { subId, heading, footer });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'reportTemplates');
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
      profiles,
      subs,
      requests,
      notifications,
      addProfile,
      updateProfile,
      removeProfile,
      addSub,
      updateSub,
      removeSub,
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
      addManualStock,
      addFieldFundEntry,
      deleteFieldFundEntry,
      addFieldFundDeposit,
      updateFieldFundDeposit,
      deleteFieldFundDeposit,
      updateReportTemplate,
      fieldFunds,
      fieldFundDeposits,
      reportTemplates,
      mainMaterials,
      accessToken,
      setAccessToken,
      syncDirectToSheet
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
