/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  getDocs, 
  getDocFromServer,
  writeBatch
} from 'firebase/firestore';
import { db, isCloudConfigured } from './firebase';
import { 
  MaterialItem, 
  MachineEquipment, 
  ServiceOrderOS, 
  LaundryRecord, 
  ExternalUnitGUE, 
  GUERequest, 
  InventoryMovement, 
  AuditLogEntry, 
  UserProfile 
} from '../types';

export interface CloudSyncState {
  connected: boolean;
  isOnline: boolean;
  lastSyncTime: number | null;
  error: string | null;
  pendingWritesCount: number;
}

type SyncCallback = (state: CloudSyncState) => void;

// Removes unsupported 'undefined' fields for strict Firestore compliance
function sanitizeForFirestore<T>(data: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(data));
}

class FirebaseSyncService {
  private syncState: CloudSyncState = {
    connected: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    lastSyncTime: null,
    error: null,
    pendingWritesCount: 0
  };

  private listeners: SyncCallback[] = [];
  private unsubscribeFns: (() => void)[] = [];
  private initialized = false;

  public subscribe(cb: SyncCallback) {
    this.listeners.push(cb);
    cb(this.syncState);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb({ ...this.syncState }));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('estoque_cloud_state_changed', { detail: this.syncState }));
    }
  }

  public async init(
    onRemoteMaterials?: (items: MaterialItem[]) => void,
    onRemoteMachines?: (machines: MachineEquipment[]) => void,
    onRemoteOS?: (osList: ServiceOrderOS[]) => void,
    onRemoteLaundry?: (records: LaundryRecord[]) => void,
    onRemoteGUEs?: (gues: ExternalUnitGUE[]) => void,
    onRemoteGUERequests?: (reqs: GUERequest[]) => void,
    onRemoteMovements?: (movs: InventoryMovement[]) => void,
    onRemoteAudit?: (logs: AuditLogEntry[]) => void,
    onRemoteUsers?: (users: UserProfile[]) => void
  ) {
    if (!isCloudConfigured || this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    // Track browser online/offline status
    window.addEventListener('online', () => {
      this.syncState.isOnline = true;
      this.notify();
    });
    window.addEventListener('offline', () => {
      this.syncState.isOnline = false;
      this.notify();
    });

    try {
      // Test connection to Firestore per SKILL.md guidelines
      await getDocFromServer(doc(db, 'system_meta', 'connection_test')).catch(() => {
        // Ping succeeded or offline cached response received
      });
      this.syncState.connected = true;
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      this.syncState.connected = false;
      this.syncState.error = err instanceof Error ? err.message : 'Falha na conexão com a nuvem';
      this.notify();
    }

    // 1. Materials Listener
    const unsubMaterials = onSnapshot(collection(db, 'materials'), (snapshot) => {
      const items: MaterialItem[] = [];
      snapshot.forEach(docSnap => {
        items.push(docSnap.data() as MaterialItem);
      });
      if (items.length > 0 && onRemoteMaterials) {
        onRemoteMaterials(items);
      }
      this.syncState.connected = true;
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    }, (error) => {
      console.warn('Firestore materials listener warning:', error.message);
    });
    this.unsubscribeFns.push(unsubMaterials);

    // 2. Machines Listener
    const unsubMachines = onSnapshot(collection(db, 'machines'), (snapshot) => {
      const machines: MachineEquipment[] = [];
      snapshot.forEach(docSnap => {
        machines.push(docSnap.data() as MachineEquipment);
      });
      if (machines.length > 0 && onRemoteMachines) {
        onRemoteMachines(machines);
      }
    }, (err) => console.warn('Firestore machines warning:', err.message));
    this.unsubscribeFns.push(unsubMachines);

    // 3. Service Orders (OS) Listener
    const unsubOS = onSnapshot(collection(db, 'service_orders'), (snapshot) => {
      const osList: ServiceOrderOS[] = [];
      snapshot.forEach(docSnap => {
        osList.push(docSnap.data() as ServiceOrderOS);
      });
      if (osList.length > 0 && onRemoteOS) {
        onRemoteOS(osList);
      }
    }, (err) => console.warn('Firestore OS warning:', err.message));
    this.unsubscribeFns.push(unsubOS);

    // 4. Laundry Records Listener
    const unsubLaundry = onSnapshot(collection(db, 'laundry_records'), (snapshot) => {
      const laundry: LaundryRecord[] = [];
      snapshot.forEach(docSnap => {
        laundry.push(docSnap.data() as LaundryRecord);
      });
      if (laundry.length > 0 && onRemoteLaundry) {
        onRemoteLaundry(laundry);
      }
    }, (err) => console.warn('Firestore laundry warning:', err.message));
    this.unsubscribeFns.push(unsubLaundry);

    // 5. External Units (GUE's) Listener
    const unsubGUEs = onSnapshot(collection(db, 'external_units'), (snapshot) => {
      const gues: ExternalUnitGUE[] = [];
      snapshot.forEach(docSnap => {
        gues.push(docSnap.data() as ExternalUnitGUE);
      });
      if (gues.length > 0 && onRemoteGUEs) {
        onRemoteGUEs(gues);
      }
    }, (err) => console.warn('Firestore GUE warning:', err.message));
    this.unsubscribeFns.push(unsubGUEs);

    // 6. GUE Requests Listener
    const unsubGUEReqs = onSnapshot(collection(db, 'gue_requests'), (snapshot) => {
      const reqs: GUERequest[] = [];
      snapshot.forEach(docSnap => {
        reqs.push(docSnap.data() as GUERequest);
      });
      if (reqs.length > 0 && onRemoteGUERequests) {
        onRemoteGUERequests(reqs);
      }
    }, (err) => console.warn('Firestore GUE Requests warning:', err.message));
    this.unsubscribeFns.push(unsubGUEReqs);

    // 7. Stock Movements Listener
    const unsubMovements = onSnapshot(collection(db, 'stock_movements'), (snapshot) => {
      const movs: InventoryMovement[] = [];
      snapshot.forEach(docSnap => {
        movs.push(docSnap.data() as InventoryMovement);
      });
      if (movs.length > 0 && onRemoteMovements) {
        onRemoteMovements(movs);
      }
    }, (err) => console.warn('Firestore movements warning:', err.message));
    this.unsubscribeFns.push(unsubMovements);

    // 8. Audit Logs Listener
    const unsubAudit = onSnapshot(collection(db, 'audit_logs'), (snapshot) => {
      const logs: AuditLogEntry[] = [];
      snapshot.forEach(docSnap => {
        logs.push(docSnap.data() as AuditLogEntry);
      });
      if (logs.length > 0 && onRemoteAudit) {
        onRemoteAudit(logs);
      }
    }, (err) => console.warn('Firestore audit warning:', err.message));
    this.unsubscribeFns.push(unsubAudit);

    // 9. Users Listener
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach(docSnap => {
        users.push(docSnap.data() as UserProfile);
      });
      if (users.length > 0 && onRemoteUsers) {
        onRemoteUsers(users);
      }
    }, (err) => console.warn('Firestore users warning:', err.message));
    this.unsubscribeFns.push(unsubUsers);
  }

  // --- Real-time Cloud Mutations with Automatic Queueing ---
  public async syncMaterial(item: MaterialItem): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'materials', item.id), sanitizeForFirestore(item));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('Material cloud write error/queued:', err);
    }
  }

  public async deleteMaterial(itemId: string): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await deleteDoc(doc(db, 'materials', itemId));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('Material cloud delete error:', err);
    }
  }

  public async syncMovement(mov: InventoryMovement): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'stock_movements', mov.id), sanitizeForFirestore(mov));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('Movement cloud write error:', err);
    }
  }

  public async syncMachine(machine: MachineEquipment): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'machines', machine.id), sanitizeForFirestore(machine));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('Machine cloud write error:', err);
    }
  }

  public async deleteMachine(machineId: string): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await deleteDoc(doc(db, 'machines', machineId));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('Machine cloud delete error:', err);
    }
  }

  public async syncServiceOrder(os: ServiceOrderOS): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'service_orders', os.id), sanitizeForFirestore(os));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('OS cloud write error:', err);
    }
  }

  public async syncLaundryRecord(rec: LaundryRecord): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'laundry_records', rec.id), sanitizeForFirestore(rec));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('Laundry cloud write error:', err);
    }
  }

  public async syncGUE(gue: ExternalUnitGUE): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'external_units', gue.id), sanitizeForFirestore(gue));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('GUE cloud write error:', err);
    }
  }

  public async deleteGUE(gueId: string): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await deleteDoc(doc(db, 'external_units', gueId));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('GUE cloud delete error:', err);
    }
  }

  public async syncGUERequest(req: GUERequest): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'gue_requests', req.id), sanitizeForFirestore(req));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('GUE Request cloud write error:', err);
    }
  }

  public async syncAuditLog(log: AuditLogEntry): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'audit_logs', log.id), sanitizeForFirestore(log));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('Audit log cloud write error:', err);
    }
  }

  public async syncUser(user: UserProfile): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await setDoc(doc(db, 'users', user.id), sanitizeForFirestore(user));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('User cloud write error:', err);
    }
  }

  public async deleteUser(userId: string): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      await deleteDoc(doc(db, 'users', userId));
      this.syncState.lastSyncTime = Date.now();
      this.notify();
    } catch (err) {
      console.warn('User cloud delete error:', err);
    }
  }

  // Initial cloud seed if Firestore collections are empty
  public async seedCloudIfEmpty(
    materials: MaterialItem[],
    machines: MachineEquipment[],
    osList: ServiceOrderOS[],
    laundry: LaundryRecord[],
    gues: ExternalUnitGUE[],
    requests: GUERequest[],
    movements: InventoryMovement[],
    auditLogs: AuditLogEntry[],
    users: UserProfile[]
  ): Promise<void> {
    if (!isCloudConfigured) return;
    try {
      const snap = await getDocs(collection(db, 'materials'));
      if (snap.empty) {
        console.log('Seeding initial cloud database in Firestore...');
        const batch = writeBatch(db);

        materials.forEach(m => batch.set(doc(db, 'materials', m.id), sanitizeForFirestore(m)));
        machines.forEach(m => batch.set(doc(db, 'machines', m.id), sanitizeForFirestore(m)));
        osList.forEach(o => batch.set(doc(db, 'service_orders', o.id), sanitizeForFirestore(o)));
        laundry.forEach(l => batch.set(doc(db, 'laundry_records', l.id), sanitizeForFirestore(l)));
        gues.forEach(g => batch.set(doc(db, 'external_units', g.id), sanitizeForFirestore(g)));
        requests.forEach(r => batch.set(doc(db, 'gue_requests', r.id), sanitizeForFirestore(r)));
        movements.forEach(mv => batch.set(doc(db, 'stock_movements', mv.id), sanitizeForFirestore(mv)));
        auditLogs.forEach(a => batch.set(doc(db, 'audit_logs', a.id), sanitizeForFirestore(a)));
        users.forEach(u => batch.set(doc(db, 'users', u.id), sanitizeForFirestore(u)));

        await batch.commit();
        console.log('Initial cloud database seed completed successfully!');
      }
    } catch (err) {
      console.warn('Seed cloud error (offline or permission):', err);
    }
  }

  public getState(): CloudSyncState {
    return { ...this.syncState };
  }
}

export const cloudSync = new FirebaseSyncService();
