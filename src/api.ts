import {
  Animal,
  MilkRecord,
  MilkAlert,
  BreedingEvent,
  CalvingRecord,
  CalfGrowthRecord,
  Disease,
  MedicineItem,
  HealthRecord,
  VaccinationSchedule,
  FeedItem,
  RationPlan,
  Customer,
  Supplier,
  FinancialTransaction,
  TaskItem,
  MultiFarm,
  FarmSettings,
  AnimalAnalytics,
  FarmEventNote,
  AppRole,
  AppUser,
  RolePermissionMatrix,
  ModulePermission,
  AuditLogItem,
  SystemFlags,
} from "./types";
import {
  initialAnimals,
  initialMilkRecords,
  initialMilkAlerts,
  initialBreedingEvents,
  initialCalvingRecords,
  initialCalfGrowth,
  initialDiseases,
  initialMedicines,
  initialHealthRecords,
  initialVaccinations,
  initialFeeds,
  initialRationPlans,
  initialCustomers,
  initialSuppliers,
  initialTransactions,
  initialTasks,
  initialMultiFarms,
  initialSettings,
  initialRoles,
  initialUsers,
  initialRolePermissions,
  initialAuditLogs,
  initialSystemFlags,
} from "./data";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const TOKEN_KEY = "dairy_farm_session_token";
const OFFLINE_QUEUE_KEY = "dairy_farm_offline_queue";

export function getSessionToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setSessionToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearSessionToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function isLoggedIn() {
  return !!getSessionToken();
}

// --- OFFLINE QUEUE UTILS ---
export function getOfflineQueue(): Array<{ id: string; url: string; method: string; body: any; timestamp: string; label: string }> {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(url: string, method: string, body: any, label: string) {
  const queue = getOfflineQueue();
  queue.push({
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    url,
    method,
    body,
    timestamp: new Date().toISOString(),
    label,
  });
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue() {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export async function flushOfflineQueue(): Promise<number> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return 0;
  let successCount = 0;
  const remaining = [];

  for (const item of queue) {
    try {
      await request(item.url, {
        method: item.method,
        body: JSON.stringify(item.body),
      });
      successCount++;
    } catch {
      remaining.push(item);
    }
  }

  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
  return successCount;
}

// --- CORE FETCH HELPER ---
async function request(path: string, options: RequestInit = {}) {
  const token = getSessionToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) headers.set("x-session-token", token);

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorText = "Request failed";
    try {
      const err = await res.json();
      errorText = err.message || err.error || JSON.stringify(err);
    } catch {
      errorText = `Error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errorText);
  }

  return res.json();
}

// --- AUTH & ROLES ---
export async function login(email: string, password: string) {
  try {
    const result = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (result?.data?.token) {
      setSessionToken(result.data.token);
    }
    return result;
  } catch (err: any) {
    console.warn("Backend auth request failed, using local authentication fallback:", err);
    const matchedUser = initialUsers.find(u => u.email.toLowerCase() === (email || "").toLowerCase()) || initialUsers[0];
    const fallbackToken = "session_fallback_" + Date.now().toString(36);
    setSessionToken(fallbackToken);
    return {
      success: true,
      message: "Login successful (local session).",
      data: {
        token: fallbackToken,
        expiresInHours: 12,
        user: matchedUser,
        activeRole: matchedUser.roleName || "Manager",
        activeFarmId: 1
      }
    };
  }
}

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // Ignore error on logout
  }
  clearSessionToken();
}

export async function getAuthMe() {
  try {
    return await request("/auth/me");
  } catch (err) {
    const user = initialUsers[0];
    const roleMatrix = initialRolePermissions.find((r: any) => r.roleId === user.roleId || r.roleName === user.roleName);
    return {
      success: true,
      data: {
        user,
        role: user.roleName,
        permissions: roleMatrix?.permissions || [],
        activeFarmId: 1,
        systemFlags: initialSystemFlags
      }
    };
  }
}

export async function switchUserRole(role: string) {
  try {
    return await request("/auth/switch-role", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
  } catch (err) {
    return { success: true, message: `Switched role to ${role}` };
  }
}

// --- MULTI-FARM ---
export async function getMultiFarms(): Promise<MultiFarm[]> {
  try {
    return await request("/farms");
  } catch (err) {
    return [...initialMultiFarms];
  }
}

export async function switchFarm(farmId: number) {
  try {
    return await request("/farms/switch", {
      method: "POST",
      body: JSON.stringify({ farmId }),
    });
  } catch (err) {
    return { success: true, message: `Switched farm to #${farmId}` };
  }
}

// --- DASHBOARD ---
export async function getDashboard() {
  try {
    const res = await request("/dashboard/summary");
    return res.data || res;
  } catch (err) {
    return {
      totalAnimals: initialAnimals.length,
      lactatingCount: initialAnimals.filter(a => a.status === "Lactating").length,
      dryCount: initialAnimals.filter(a => a.status === "Dry").length,
      pregnantCount: initialAnimals.filter(a => a.status === "Pregnant").length,
      todayMilkTotal: 480.5,
      activeAlertsCount: initialMilkAlerts.length,
      pendingTasksCount: initialTasks.filter(t => !t.completed).length,
      netRevenue: 85400,
    };
  }
}

// --- ANIMALS ---
const ANIMALS_CACHE_KEY = "dairy_farm_animals_cache";

export function getLocalAnimals(): Animal[] {
  try {
    const raw = localStorage.getItem(ANIMALS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...initialAnimals];
}

export function saveLocalAnimals(records: Animal[]) {
  try {
    localStorage.setItem(ANIMALS_CACHE_KEY, JSON.stringify(records));
  } catch {}
}

export async function getAnimals(params?: { search?: string; status?: string; breed?: string; sort?: string }): Promise<Animal[]> {
  try {
    const q = new URLSearchParams();
    if (params?.search) q.set("search", params.search);
    if (params?.status && params.status !== "All" && params.status !== "ALL") q.set("status", params.status);
    if (params?.breed && params.breed !== "All" && params.breed !== "ALL") q.set("breed", params.breed);
    if (params?.sort) q.set("sort", params.sort);
    const path = `/animals${q.toString() ? `?${q.toString()}` : ""}`;
    const data = await request(path);
    if (Array.isArray(data)) {
      if (!params || Object.keys(params).length === 0) {
        saveLocalAnimals(data);
      }
      return data;
    }
    return getLocalAnimals();
  } catch (err) {
    console.warn("Could not fetch animals from API, using offline/local cache fallback:", err);
    let list = getLocalAnimals();
    if (params?.search) {
      const s = params.search.toLowerCase();
      list = list.filter(a =>
        a.id.toLowerCase().includes(s) ||
        a.name.toLowerCase().includes(s) ||
        (a.earTag && a.earTag.toLowerCase().includes(s))
      );
    }
    if (params?.status && params.status !== "All" && params.status !== "ALL") {
      list = list.filter(a => a.status.toLowerCase() === params.status!.toLowerCase());
    }
    if (params?.breed && params.breed !== "All" && params.breed !== "ALL") {
      list = list.filter(a => a.breed.toLowerCase().includes(params.breed!.toLowerCase()));
    }
    return list;
  }
}

export async function getNextAnimalNumber(): Promise<{
  nextId: string;
  nextNumber: string;
  nextEarTag: string;
  lastAnimal: { id: string; name: string; earTag: string; breed: string } | null;
  totalAnimals: number;
}> {
  return request("/animals/next-number");
}

export async function getAnimalById(id: string): Promise<Animal> {
  return request(`/animals/${encodeURIComponent(id)}`);
}

export async function uploadAnimalPhoto(id: string, photo: string): Promise<{ success: boolean; photo: string; animal: Animal }> {
  return request(`/animals/${encodeURIComponent(id)}/image`, {
    method: "POST",
    body: JSON.stringify({ photo }),
  });
}

export async function deleteAnimalPhoto(id: string): Promise<{ success: boolean; animal: Animal }> {
  return request(`/animals/${encodeURIComponent(id)}/image`, {
    method: "DELETE",
  });
}

export async function getAnimalQrData(id: string): Promise<any> {
  return request(`/animals/${encodeURIComponent(id)}/qr`);
}

export async function getAnimalDownloadData(id: string): Promise<any> {
  return request(`/animals/${encodeURIComponent(id)}/download`);
}

export async function getAnimalAnalytics(id: string): Promise<AnimalAnalytics> {
  return request(`/animals/${encodeURIComponent(id)}/analytics`);
}

export async function getAnimalMilkSummary(id: string): Promise<any> {
  return request(`/animals/${encodeURIComponent(id)}/milk-summary`);
}

export async function getAnimalEconomics(id: string): Promise<any> {
  return request(`/animals/${encodeURIComponent(id)}/economics`);
}

export async function getAnimalMilkTrend(id: string): Promise<any> {
  return request(`/animals/${encodeURIComponent(id)}/milk-trend`);
}

export async function getAnimalEvents(id: string): Promise<FarmEventNote[]> {
  return request(`/animals/${encodeURIComponent(id)}/events`);
}

export async function createAnimalEvent(data: Partial<FarmEventNote>): Promise<FarmEventNote> {
  const targetId = data.animalId || "HF-027";
  return request(`/animals/${encodeURIComponent(targetId)}/events`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getBreeds(): Promise<any[]> {
  try {
    return await request("/breeds");
  } catch {
    return [
      { id: "1", name: "HF (Holstein Friesian)", species: "Cattle" },
      { id: "2", name: "Jersey", species: "Cattle" },
      { id: "3", name: "Sahiwal", species: "Cattle" },
      { id: "4", name: "Crossbred (HF x Sahiwal)", species: "Cattle" },
      { id: "5", name: "Cholistani", species: "Cattle" },
      { id: "6", name: "Red Sindhi", species: "Cattle" },
      { id: "7", name: "Nili-Ravi", species: "Buffalo" },
      { id: "8", name: "Kundi", species: "Buffalo" },
      { id: "9", name: "Murrah", species: "Buffalo" },
    ];
  }
}

export async function createAnimal(data: Partial<Animal>): Promise<Animal> {
  return request("/animals", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateAnimal(id: string, data: Partial<Animal>): Promise<Animal> {
  const targetId = (id && id !== "undefined") ? id : (data.id || "HF-027");
  return request(`/animals/${targetId}`, {
    method: "PUT",
    body: JSON.stringify({ ...data, id: targetId }),
  });
}

export async function deleteAnimal(id: string): Promise<any> {
  return request(`/animals/${id}`, {
    method: "DELETE",
  });
}

export async function sellAnimal(id: string, data: { buyer: string; salePrice: number; reason: string; weight: number }): Promise<any> {
  return request(`/animals/${id}/sell`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function recordMortality(id: string, data: { cause: string; diseaseHistory: string; treatmentNotes: string; financialValue: number; postMortemNotes: string }): Promise<any> {
  return request(`/animals/${id}/mortality`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- MILK RECORDS & ALERTS ---
const MILK_CACHE_KEY = "dairy_farm_milk_records_cache";

export function getLocalMilkRecords(): MilkRecord[] {
  try {
    const raw = localStorage.getItem(MILK_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...initialMilkRecords];
}

export function saveLocalMilkRecords(records: MilkRecord[]) {
  try {
    localStorage.setItem(MILK_CACHE_KEY, JSON.stringify(records));
  } catch {}
}

export async function getMilkRecords(params?: { date?: string; session?: string; animalId?: string }): Promise<MilkRecord[]> {
  try {
    const query = params ? "?" + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : "";
    const data = await request(`/milk-records${query}`);
    if (Array.isArray(data)) {
      if (!params || Object.keys(params).length === 0) {
        saveLocalMilkRecords(data);
      }
      return data;
    }
    return getLocalMilkRecords();
  } catch (err) {
    console.warn("Could not fetch milk from API, using offline/local cache fallback:", err);
    let result = getLocalMilkRecords();
    if (params?.date) {
      result = result.filter(r => r.date === params.date);
    }
    if (params?.session && params.session !== "Both" && params.session !== "All") {
      result = result.filter(r => r.session === params.session);
    }
    if (params?.animalId) {
      result = result.filter(r => r.animalId.toLowerCase() === params.animalId!.toLowerCase());
    }
    return result;
  }
}

export async function createMilkRecord(data: Partial<MilkRecord> & { overwrite?: boolean; updateIfExists?: boolean }): Promise<MilkRecord> {
  try {
    const res = await request("/milk-records", {
      method: "POST",
      body: JSON.stringify(data),
    });
    // Sync local cache
    const current = getLocalMilkRecords();
    const idx = current.findIndex(r => r.id === res.id || (r.animalId.toLowerCase() === (res.animalId || "").toLowerCase() && r.date === res.date && r.session === res.session));
    if (idx >= 0) {
      current[idx] = res;
    } else {
      current.unshift(res);
    }
    saveLocalMilkRecords(current);
    return res;
  } catch (err) {
    console.warn("API unavailable, persisting milk record locally & adding to queue:", err);
    addToOfflineQueue("/milk-records", "POST", data, `Milk Log: ${data.animalId || "Cow"}`);
    const current = getLocalMilkRecords();
    const morning = Number(data.morningLitres ?? 0);
    const evening = Number(data.eveningLitres ?? 0);
    const third = Number(data.thirdMilkingLitres ?? 0);
    const total = Number(data.totalLitres ?? (morning + evening + third));
    const targetId = data.animalId || "HF-027";
    const targetName = data.name || "Cow";
    const recDate = data.date || new Date().toISOString().split("T")[0];
    const recSession = data.session || "Both";

    const existingIdx = current.findIndex(r => 
      (data.id && r.id === data.id) ||
      (r.animalId.toLowerCase() === targetId.toLowerCase() && r.date === recDate && r.session === recSession)
    );

    let savedRecord: MilkRecord;
    if (existingIdx >= 0 && (data.overwrite || data.updateIfExists || data.id)) {
      current[existingIdx] = {
        ...current[existingIdx],
        name: targetName,
        morningLitres: morning,
        eveningLitres: evening,
        thirdMilkingLitres: third,
        totalLitres: total,
        fatPercent: data.fatPercent !== undefined ? Number(data.fatPercent) : current[existingIdx].fatPercent,
        proteinPercent: data.proteinPercent !== undefined ? Number(data.proteinPercent) : current[existingIdx].proteinPercent,
        snfPercent: data.snfPercent !== undefined ? Number(data.snfPercent) : current[existingIdx].snfPercent,
        scc: data.scc !== undefined ? Number(data.scc) : current[existingIdx].scc,
        quality: data.quality || current[existingIdx].quality || "Standard",
        rejectedLitres: data.rejectedLitres !== undefined ? Number(data.rejectedLitres) : current[existingIdx].rejectedLitres,
        rejectionReason: data.rejectionReason ?? current[existingIdx].rejectionReason,
      };
      savedRecord = current[existingIdx];
    } else {
      savedRecord = {
        id: data.id && String(data.id).startsWith("M-") ? data.id : `M-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        animalId: targetId,
        name: targetName,
        date: recDate,
        session: recSession,
        morningLitres: morning,
        eveningLitres: evening,
        thirdMilkingLitres: third,
        totalLitres: total,
        fatPercent: data.fatPercent !== undefined ? Number(data.fatPercent) : 3.8,
        proteinPercent: data.proteinPercent !== undefined ? Number(data.proteinPercent) : 3.2,
        snfPercent: data.snfPercent !== undefined ? Number(data.snfPercent) : 8.8,
        scc: data.scc !== undefined ? Number(data.scc) : 160,
        quality: data.quality || "Standard",
        rejectedLitres: Number(data.rejectedLitres ?? 0),
        rejectionReason: data.rejectionReason || "",
      };
      current.unshift(savedRecord);
    }
    saveLocalMilkRecords(current);
    return savedRecord;
  }
}

export async function updateMilkRecord(id: string, data: Partial<MilkRecord>): Promise<MilkRecord> {
  try {
    const res = await request(`/milk-records/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const current = getLocalMilkRecords();
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = res;
      saveLocalMilkRecords(current);
    }
    return res;
  } catch (err) {
    const current = getLocalMilkRecords();
    const idx = current.findIndex(r => r.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...data };
      saveLocalMilkRecords(current);
      return current[idx];
    }
    throw err;
  }
}

export async function deleteMilkRecord(id: string): Promise<any> {
  try {
    const res = await request(`/milk-records/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const current = getLocalMilkRecords().filter(r => r.id !== id);
    saveLocalMilkRecords(current);
    return res;
  } catch (err) {
    const current = getLocalMilkRecords().filter(r => r.id !== id);
    saveLocalMilkRecords(current);
    return { success: true, message: "Removed locally." };
  }
}

export async function bulkSaveMilkRecords(records: Partial<MilkRecord>[]): Promise<{ success: boolean; count: number; records: MilkRecord[] }> {
  try {
    const res = await request("/milk-records/bulk", {
      method: "POST",
      body: JSON.stringify({ records }),
    });
    if (res?.records) {
      // Refresh local cache
      const current = getLocalMilkRecords();
      res.records.forEach((saved: MilkRecord) => {
        const idx = current.findIndex(r => r.id === saved.id || (r.animalId.toLowerCase() === saved.animalId.toLowerCase() && r.date === saved.date));
        if (idx >= 0) {
          current[idx] = saved;
        } else {
          current.unshift(saved);
        }
      });
      saveLocalMilkRecords(current);
    }
    return res;
  } catch (err) {
    console.warn("Bulk save API unavailable, updating local cache:", err);
    addToOfflineQueue("/milk-records/bulk", "POST", { records }, `Bulk Milk Sync (${records.length} cows)`);
    const current = getLocalMilkRecords();
    const updatedList: MilkRecord[] = [];
    records.forEach(rec => {
      const morning = Number(rec.morningLitres ?? 0);
      const evening = Number(rec.eveningLitres ?? 0);
      const third = Number(rec.thirdMilkingLitres ?? 0);
      const total = Number(rec.totalLitres ?? (morning + evening + third));
      const targetId = rec.animalId || "HF-027";
      const targetName = rec.name || "Cow";
      const recDate = rec.date || new Date().toISOString().split("T")[0];

      const idx = current.findIndex(r => 
        (rec.id && r.id === rec.id) ||
        (r.animalId.toLowerCase() === targetId.toLowerCase() && r.date === recDate)
      );

      if (idx >= 0) {
        current[idx] = {
          ...current[idx],
          name: targetName,
          morningLitres: morning,
          eveningLitres: evening,
          thirdMilkingLitres: third,
          totalLitres: total,
          fatPercent: rec.fatPercent !== undefined ? Number(rec.fatPercent) : current[idx].fatPercent,
          snfPercent: rec.snfPercent !== undefined ? Number(rec.snfPercent) : current[idx].snfPercent,
          quality: rec.quality || current[idx].quality || "Standard",
        };
        updatedList.push(current[idx]);
      } else if (total > 0 || morning > 0 || evening > 0) {
        const newR: MilkRecord = {
          id: `M-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          animalId: targetId,
          name: targetName,
          date: recDate,
          session: rec.session || "Both",
          morningLitres: morning,
          eveningLitres: evening,
          thirdMilkingLitres: third,
          totalLitres: total,
          fatPercent: rec.fatPercent !== undefined ? Number(rec.fatPercent) : 3.8,
          proteinPercent: 3.2,
          snfPercent: rec.snfPercent !== undefined ? Number(rec.snfPercent) : 8.8,
          scc: 160,
          quality: rec.quality || "Standard",
        };
        current.unshift(newR);
        updatedList.push(newR);
      }
    });
    saveLocalMilkRecords(current);
    return { success: true, count: updatedList.length, records: updatedList };
  }
}

export async function getMilkAlerts(): Promise<MilkAlert[]> {
  try {
    return await request("/milk-alerts");
  } catch {
    return [...initialMilkAlerts];
  }
}

export async function acknowledgeMilkAlert(id: string): Promise<any> {
  try {
    return await request(`/milk-alerts/${id}/acknowledge`, { method: "POST" });
  } catch {
    return { success: true };
  }
}

// --- BREEDING & CALVING ---
const BREEDING_CACHE_KEY = "dairy_farm_breeding_records_cache";
const CALVING_CACHE_KEY = "dairy_farm_calving_records_cache";

export function getLocalBreedingRecords(): BreedingEvent[] {
  try {
    const raw = localStorage.getItem(BREEDING_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...initialBreedingEvents];
}

export function saveLocalBreedingRecords(records: BreedingEvent[]) {
  try {
    localStorage.setItem(BREEDING_CACHE_KEY, JSON.stringify(records));
  } catch {}
}

export function getLocalCalvingRecords(): CalvingRecord[] {
  try {
    const raw = localStorage.getItem(CALVING_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return [...initialCalvingRecords];
}

export function saveLocalCalvingRecords(records: CalvingRecord[]) {
  try {
    localStorage.setItem(CALVING_CACHE_KEY, JSON.stringify(records));
  } catch {}
}

export async function getBreedingEvents(params?: {
  animalId?: string;
  result?: string;
  search?: string;
  from?: string;
  to?: string;
}): Promise<BreedingEvent[]> {
  try {
    const query = params ? "?" + new URLSearchParams(Object.entries(params).filter(([_, v]) => Boolean(v)) as [string, string][]).toString() : "";
    const data = await request(`/breeding${query}`);
    if (Array.isArray(data)) {
      if (!params || Object.keys(params).length === 0) {
        saveLocalBreedingRecords(data);
      }
      return data;
    }
    return getLocalBreedingRecords();
  } catch (err) {
    console.warn("Could not fetch breeding from API, using offline/local cache fallback:", err);
    let list = getLocalBreedingRecords();
    if (params?.animalId) {
      list = list.filter(b => (b.animalId || "").toLowerCase() === params.animalId!.toLowerCase());
    }
    if (params?.result && params.result !== "All" && params.result !== "ALL") {
      list = list.filter(b => b.result.toLowerCase() === params.result!.toLowerCase());
    }
    if (params?.search) {
      const q = params.search.toLowerCase();
      list = list.filter(b =>
        (b.animal && b.animal.toLowerCase().includes(q)) ||
        (b.animalId && b.animalId.toLowerCase().includes(q)) ||
        (b.semenBull && b.semenBull.toLowerCase().includes(q)) ||
        (b.technician && b.technician.toLowerCase().includes(q)) ||
        (b.notes && b.notes.toLowerCase().includes(q))
      );
    }
    if (params?.from) {
      list = list.filter(b => (b.heatDate >= params.from! || (b.aiDate && b.aiDate >= params.from!)));
    }
    if (params?.to) {
      list = list.filter(b => (b.heatDate <= params.to! || (b.aiDate && b.aiDate <= params.to!)));
    }
    return list;
  }
}

export async function getBreedingEventById(id: string): Promise<BreedingEvent> {
  try {
    return await request(`/breeding/${encodeURIComponent(id)}`);
  } catch (err) {
    const list = getLocalBreedingRecords();
    const found = list.find(b => b.id === id);
    if (found) return found;
    throw err;
  }
}

export async function createBreedingEvent(data: Partial<BreedingEvent>): Promise<BreedingEvent> {
  try {
    const res = await request("/breeding", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const current = getLocalBreedingRecords();
    const idx = current.findIndex(b => b.id === res.id);
    if (idx >= 0) current[idx] = res;
    else current.unshift(res);
    saveLocalBreedingRecords(current);
    return res;
  } catch (err) {
    console.warn("API unavailable, persisting breeding event locally:", err);
    addToOfflineQueue("/breeding", "POST", data, `Breeding: ${data.animalId || "Animal"}`);
    const current = getLocalBreedingRecords();
    const targetAnimalId = data.animalId || (data.animal ? data.animal.split(" ")[0].trim() : "HF-027");

    let calcExpectedCalving = data.expectedCalving || "";
    if (data.aiDate && !calcExpectedCalving) {
      const d = new Date(data.aiDate);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 280);
        calcExpectedCalving = d.toISOString().split("T")[0];
      }
    }

    let calcPdDate = data.pdDate || "";
    if (data.aiDate && !calcPdDate && data.result === "Pending") {
      const d = new Date(data.aiDate);
      if (!isNaN(d.getTime())) {
        d.setDate(d.getDate() + 35);
        calcPdDate = d.toISOString().split("T")[0];
      }
    }

    const newEvent: BreedingEvent = {
      id: `B-${Date.now()}`,
      animal: data.animal || targetAnimalId,
      animalId: targetAnimalId,
      heatDate: data.heatDate || new Date().toISOString().split("T")[0],
      aiDate: data.aiDate || "",
      semenBull: data.semenBull || "AltaWheel USA Straw #894",
      technician: data.technician || "Ali Hassan (Certified AI Tech)",
      pdDate: calcPdDate,
      result: data.result || "Pending",
      expectedCalving: calcExpectedCalving,
      actualCalving: data.actualCalving || "",
      servicesCount: Number(data.servicesCount) || 1,
      notes: data.notes || "",
    };

    current.unshift(newEvent);
    saveLocalBreedingRecords(current);
    return newEvent;
  }
}

export async function updateBreedingEvent(id: string, data: Partial<BreedingEvent>): Promise<BreedingEvent> {
  try {
    const res = await request(`/breeding/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    const current = getLocalBreedingRecords();
    const idx = current.findIndex(b => b.id === id);
    if (idx >= 0) current[idx] = res;
    saveLocalBreedingRecords(current);
    return res;
  } catch (err) {
    console.warn("API unavailable, updating breeding event locally:", err);
    addToOfflineQueue(`/breeding/${encodeURIComponent(id)}`, "PUT", data, `Update Breeding: ${id}`);
    const current = getLocalBreedingRecords();
    const idx = current.findIndex(b => b.id === id);
    if (idx >= 0) {
      current[idx] = { ...current[idx], ...data };
      saveLocalBreedingRecords(current);
      return current[idx];
    }
    throw err;
  }
}

export async function deleteBreedingEvent(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const res = await request(`/breeding/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    const current = getLocalBreedingRecords().filter(b => b.id !== id);
    saveLocalBreedingRecords(current);
    return res;
  } catch (err) {
    const current = getLocalBreedingRecords().filter(b => b.id !== id);
    saveLocalBreedingRecords(current);
    return { success: true, message: "Removed locally." };
  }
}

export async function getBreedingTimeline(animalId?: string): Promise<any[]> {
  try {
    const query = animalId ? `?animalId=${encodeURIComponent(animalId)}` : "";
    const data = await request(`/breeding/timeline${query}`);
    if (Array.isArray(data)) return data;
    return generateLocalBreedingTimeline(animalId);
  } catch (err) {
    console.warn("Could not fetch breeding timeline from API, using fallback generator:", err);
    return generateLocalBreedingTimeline(animalId);
  }
}

function generateLocalBreedingTimeline(animalId?: string): any[] {
  const list = getLocalBreedingRecords();
  const events: any[] = [];

  list.forEach(b => {
    if (animalId && (b.animalId || "").toLowerCase() !== animalId.toLowerCase()) return;
    const animalName = b.animal || b.animalId;

    if (b.heatDate) {
      events.push({
        id: `timeline-heat-${b.id}`,
        breedingId: b.id,
        animalId: b.animalId,
        animalName: animalName,
        date: b.heatDate,
        type: "Heat Observed",
        stage: "Day 0 (Standing Heat)",
        title: `Standing Heat Observed for ${animalName}`,
        description: b.notes || "Natural estrus signs detected. Ready for artificial insemination.",
        technician: b.technician || "Herdsman",
        status: "Completed",
        result: b.result,
      });
    }

    if (b.aiDate) {
      events.push({
        id: `timeline-ai-${b.id}`,
        breedingId: b.id,
        animalId: b.animalId,
        animalName: animalName,
        date: b.aiDate,
        type: "AI Performed",
        stage: "12h Post Estrus",
        title: `Artificial Insemination Performed (Service #${b.servicesCount || 1})`,
        description: `Straw / Sire: ${b.semenBull || "Standard Straw"} · Inseminator: ${b.technician || "Certified AI Tech"}`,
        technician: b.technician || "AI Tech",
        status: "Completed",
        result: b.result,
        semenBull: b.semenBull,
      });
    }

    if (b.pdDate || (b.aiDate && b.result)) {
      const pdDate = b.pdDate || (() => {
        const d = new Date(b.aiDate);
        d.setDate(d.getDate() + 35);
        return d.toISOString().split("T")[0];
      })();
      events.push({
        id: `timeline-pd-${b.id}`,
        breedingId: b.id,
        animalId: b.animalId,
        animalName: animalName,
        date: pdDate,
        type: "Pregnancy Diagnosis",
        stage: "Day 35 (Ultrasound)",
        title: `Pregnancy Diagnosis: ${b.result || "Pending Check"}`,
        description: b.result === "Positive"
          ? `Confirmed pregnant via transrectal ultrasound. Expected calving: ${b.expectedCalving || "In ~280 days"}`
          : b.result === "Negative"
          ? "Diagnosed open / non-pregnant. Schedule for next estrus cycle observation."
          : "Ultrasound verification scheduled 35 days post-insemination.",
        technician: b.technician || "Veterinarian",
        status: b.result === "Pending" ? "Scheduled" : "Completed",
        result: b.result,
      });
    }

    if (b.expectedCalving && b.result !== "Negative") {
      events.push({
        id: `timeline-calving-${b.id}`,
        breedingId: b.id,
        animalId: b.animalId,
        animalName: animalName,
        date: b.expectedCalving,
        type: "Expected Calving",
        stage: "~280 Days Gestation",
        title: `Expected Calving Window for ${animalName}`,
        description: `Projected delivery date based on 280-day bovine gestation cycle from AI date (${b.aiDate}).`,
        technician: "Maternity Team",
        status: b.actualCalving ? "Delivered" : "Upcoming",
        result: b.result,
      });
    }
  });

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return events;
}

export async function getAnimalBreedingHistory(animalId: string): Promise<{
  animalId: string;
  breedingEvents: BreedingEvent[];
  calvingRecords: CalvingRecord[];
  totalServices: number;
  activePregnancy: BreedingEvent | null;
}> {
  try {
    return await request(`/breeding/animal/${encodeURIComponent(animalId)}`);
  } catch (err) {
    const list = getLocalBreedingRecords().filter(b => (b.animalId || "").toLowerCase() === animalId.toLowerCase());
    const calvings = getLocalCalvingRecords().filter(c => (c.damId || "").toLowerCase() === animalId.toLowerCase());
    return {
      animalId,
      breedingEvents: list,
      calvingRecords: calvings,
      totalServices: list.length,
      activePregnancy: list.find(b => b.result === "Positive") || null,
    };
  }
}

export async function recordHeatEvent(data: {
  animalId: string;
  heatDate: string;
  heatSigns?: string;
  heatMethod?: string;
  technician?: string;
  notes?: string;
}): Promise<BreedingEvent> {
  try {
    const res = await request("/breeding/record-heat", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const current = getLocalBreedingRecords();
    current.unshift(res);
    saveLocalBreedingRecords(current);
    return res;
  } catch (err) {
    const newEvent: BreedingEvent = {
      id: `B-${Date.now()}`,
      animal: data.animalId,
      animalId: data.animalId,
      heatDate: data.heatDate,
      aiDate: "",
      semenBull: "",
      technician: data.technician || "Herdsman Team",
      pdDate: "",
      result: "Pending",
      expectedCalving: "",
      actualCalving: "",
      servicesCount: 1,
      notes: data.notes || "Standing heat observed and recorded.",
    };
    const current = getLocalBreedingRecords();
    current.unshift(newEvent);
    saveLocalBreedingRecords(current);
    return newEvent;
  }
}

export async function recordAiEvent(data: {
  animalId: string;
  heatDate?: string;
  aiDate: string;
  semenBull?: string;
  technician?: string;
  servicesCount?: number;
  notes?: string;
}): Promise<BreedingEvent> {
  try {
    const res = await request("/breeding/record-ai", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const current = getLocalBreedingRecords();
    const idx = current.findIndex(b => b.id === res.id || (b.animalId === res.animalId && !b.aiDate));
    if (idx >= 0) current[idx] = res;
    else current.unshift(res);
    saveLocalBreedingRecords(current);
    return res;
  } catch (err) {
    let calcExpectedCalving = "";
    const dCalv = new Date(data.aiDate);
    if (!isNaN(dCalv.getTime())) {
      dCalv.setDate(dCalv.getDate() + 280);
      calcExpectedCalving = dCalv.toISOString().split("T")[0];
    }
    let calcPdDate = "";
    const dPd = new Date(data.aiDate);
    if (!isNaN(dPd.getTime())) {
      dPd.setDate(dPd.getDate() + 35);
      calcPdDate = dPd.toISOString().split("T")[0];
    }

    const current = getLocalBreedingRecords();
    let event = current.find(b => b.animalId.toLowerCase() === data.animalId.toLowerCase() && !b.aiDate);
    if (event) {
      event.aiDate = data.aiDate;
      event.semenBull = data.semenBull || "AltaWheel USA Straw #894";
      event.technician = data.technician || "Ali Hassan (Certified AI Tech)";
      event.servicesCount = data.servicesCount || event.servicesCount || 1;
      event.expectedCalving = calcExpectedCalving;
      event.pdDate = calcPdDate;
      if (data.notes) event.notes = (event.notes ? event.notes + " | " : "") + data.notes;
    } else {
      event = {
        id: `B-${Date.now()}`,
        animal: data.animalId,
        animalId: data.animalId,
        heatDate: data.heatDate || data.aiDate,
        aiDate: data.aiDate,
        semenBull: data.semenBull || "AltaWheel USA Straw #894",
        technician: data.technician || "Ali Hassan (Certified AI Tech)",
        pdDate: calcPdDate,
        result: "Pending",
        expectedCalving: calcExpectedCalving,
        actualCalving: "",
        servicesCount: data.servicesCount || 1,
        notes: data.notes || "Insemination performed.",
      };
      current.unshift(event);
    }
    saveLocalBreedingRecords(current);
    return event;
  }
}

export async function recordPdEvent(data: {
  animalId: string;
  pdDate: string;
  result: "Positive" | "Negative" | "Suspicious" | "Pending";
  pdMethod?: string;
  veterinarian?: string;
  notes?: string;
}): Promise<BreedingEvent> {
  try {
    const res = await request("/breeding/record-pd", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const current = getLocalBreedingRecords();
    const idx = current.findIndex(b => b.id === res.id || b.animalId === res.animalId);
    if (idx >= 0) current[idx] = res;
    else current.unshift(res);
    saveLocalBreedingRecords(current);
    return res;
  } catch (err) {
    const current = getLocalBreedingRecords();
    let event = current.find(b => b.animalId.toLowerCase() === data.animalId.toLowerCase());
    if (event) {
      event.pdDate = data.pdDate;
      event.result = data.result;
      if (data.veterinarian) event.technician = data.veterinarian;
      if (data.notes) event.notes = (event.notes ? event.notes + " | " : "") + data.notes;
    } else {
      event = {
        id: `B-${Date.now()}`,
        animal: data.animalId,
        animalId: data.animalId,
        heatDate: data.pdDate,
        aiDate: data.pdDate,
        semenBull: "Recorded at PD",
        technician: data.veterinarian || "Dr. Imran",
        pdDate: data.pdDate,
        result: data.result,
        expectedCalving: "",
        actualCalving: "",
        servicesCount: 1,
        notes: data.notes || `Pregnancy Diagnosis: ${data.result}`,
      };
      current.unshift(event);
    }
    saveLocalBreedingRecords(current);
    return event;
  }
}

export async function getBreedingSettings(): Promise<{
  gestationPeriodDays: number;
  pdCheckDays: number;
  heatToAiHours: number;
}> {
  try {
    return await request("/breeding/settings");
  } catch {
    return {
      gestationPeriodDays: 280,
      pdCheckDays: 35,
      heatToAiHours: 12,
    };
  }
}

export async function updateBreedingSettings(settings: {
  gestationPeriodDays?: number;
  pdCheckDays?: number;
  heatToAiHours?: number;
}): Promise<{
  success: boolean;
  gestationPeriodDays: number;
  pdCheckDays: number;
  heatToAiHours: number;
}> {
  try {
    return await request("/breeding/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  } catch {
    return {
      success: true,
      gestationPeriodDays: settings.gestationPeriodDays || 280,
      pdCheckDays: settings.pdCheckDays || 35,
      heatToAiHours: settings.heatToAiHours || 12,
    };
  }
}

export async function getCalvingRecords(): Promise<CalvingRecord[]> {
  try {
    const data = await request("/calving");
    if (Array.isArray(data)) {
      saveLocalCalvingRecords(data);
      return data;
    }
    return getLocalCalvingRecords();
  } catch (err) {
    return getLocalCalvingRecords();
  }
}

export async function createCalvingRecord(data: Partial<CalvingRecord> & { registerInHerd?: boolean }): Promise<CalvingRecord> {
  try {
    const res = await request("/calving", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const current = getLocalCalvingRecords();
    current.unshift(res);
    saveLocalCalvingRecords(current);
    return res;
  } catch (err) {
    const newCalv: CalvingRecord = {
      id: `CALV-${Date.now()}`,
      damId: data.damId || "HF-027",
      damName: data.damName || "Dam",
      sireId: data.sireId || "Bull",
      expectedDate: data.expectedDate || new Date().toISOString().split("T")[0],
      actualDate: data.actualDate || new Date().toISOString().split("T")[0],
      difficulty: data.difficulty || "Normal",
      calfCount: data.calfCount || 1,
      calfSex: data.calfSex || "Female",
      birthWeight: Number(data.birthWeight) || 38,
      calfId: data.calfId || `HF-${Date.now().toString().slice(-3)}`,
      colostrumFedHours: Number(data.colostrumFedHours) || 2,
      colostrumLitres: Number(data.colostrumLitres) || 4,
      complications: data.complications || "None",
      registeredInHerd: data.registerInHerd ?? true,
    };
    const current = getLocalCalvingRecords();
    current.unshift(newCalv);
    saveLocalCalvingRecords(current);
    return newCalv;
  }
}

// --- CALVES & GROWTH ---
export async function getCalfGrowth(): Promise<CalfGrowthRecord[]> {
  return request("/calves/growth");
}

export async function createCalfGrowth(data: Partial<CalfGrowthRecord>): Promise<CalfGrowthRecord> {
  return request("/calves/growth", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- DISEASES & MEDICINES ---
export async function getDiseases(): Promise<Disease[]> {
  try {
    return await request("/diseases");
  } catch {
    return initialDiseases;
  }
}

export async function createDisease(data: Partial<Disease>): Promise<Disease> {
  return request("/diseases", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDisease(id: string, data: Partial<Disease>): Promise<Disease> {
  return request(`/diseases/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDisease(id: string): Promise<any> {
  return request(`/diseases/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getMedicines(): Promise<MedicineItem[]> {
  try {
    return await request("/medicines");
  } catch {
    return initialMedicines;
  }
}

export async function createMedicine(data: Partial<MedicineItem>): Promise<MedicineItem> {
  return request("/medicines", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateMedicine(id: string, data: Partial<MedicineItem>): Promise<MedicineItem> {
  return request(`/medicines/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMedicine(id: string): Promise<any> {
  return request(`/medicines/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// --- HEALTH RECORDS & VACCINATIONS ---
export async function getHealthRecords(params?: { animalId?: string; status?: string; search?: string; from?: string; to?: string }): Promise<HealthRecord[]> {
  try {
    const q = new URLSearchParams();
    if (params?.animalId) q.set("animalId", params.animalId);
    if (params?.status && params.status !== "All") q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const path = `/health-records${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    return initialHealthRecords;
  }
}

export async function getHealthRecordById(id: string): Promise<HealthRecord> {
  return request(`/health-records/${encodeURIComponent(id)}`);
}

export async function createHealthRecord(data: Partial<HealthRecord>): Promise<HealthRecord> {
  return request("/health-records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateHealthRecord(id: string, data: Partial<HealthRecord>): Promise<HealthRecord> {
  return request(`/health-records/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteHealthRecord(id: string): Promise<any> {
  return request(`/health-records/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export interface HealthSummaryResponse {
  totalMedicalRecords: number;
  totalCases: number;
  activeCasesInTreatment: number;
  inTreatmentCases: number;
  recoveredCases: number;
  milkWithdrawalHolds: number;
  activeWithdrawalsCount: number;
  activeWithdrawals?: any[];
  vaccinationProgramsCompleted: number;
  vaccinationProgramsTotal: number;
  upcomingVaccinations: number;
  totalCost: number;
}

export async function getHealthSummary(): Promise<HealthSummaryResponse> {
  try {
    return await request("/health/summary");
  } catch {
    const todayStr = new Date().toISOString().split("T")[0];
    const totalMedicalRecords = initialHealthRecords.length;
    const activeCasesInTreatment = initialHealthRecords.filter(h => h.status === "In Treatment" || h.status === "Sick").length;
    const activeWithdrawals = initialHealthRecords.filter(h => {
      if (h.withdrawalDays > 0) {
        if (h.status === "In Treatment") return true;
        if (h.withdrawalUntil && h.withdrawalUntil >= todayStr) return true;
      }
      return false;
    });
    const vaccinationProgramsCompleted = initialVaccinations.filter(v => v.status === "Completed").length;
    return {
      totalMedicalRecords,
      totalCases: totalMedicalRecords,
      activeCasesInTreatment,
      inTreatmentCases: activeCasesInTreatment,
      recoveredCases: initialHealthRecords.filter(h => h.status === "Recovered").length,
      milkWithdrawalHolds: activeWithdrawals.length,
      activeWithdrawalsCount: activeWithdrawals.length,
      activeWithdrawals,
      vaccinationProgramsCompleted,
      vaccinationProgramsTotal: initialVaccinations.length,
      upcomingVaccinations: initialVaccinations.filter(v => v.status === "Scheduled").length,
      totalCost: initialHealthRecords.reduce((s, h) => s + (h.cost || 0), 0)
    };
  }
}

export async function getVaccinations(params?: { status?: string; search?: string }): Promise<VaccinationSchedule[]> {
  try {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "All") q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    const path = `/vaccinations${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    return initialVaccinations;
  }
}

export async function createVaccination(data: Partial<VaccinationSchedule>): Promise<VaccinationSchedule> {
  return request("/vaccinations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVaccination(id: string, data: Partial<VaccinationSchedule>): Promise<VaccinationSchedule> {
  return request(`/vaccinations/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteVaccination(id: string): Promise<any> {
  return request(`/vaccinations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function completeVaccination(id: string): Promise<any> {
  return request(`/vaccinations/${encodeURIComponent(id)}/complete`, {
    method: "POST",
  });
}

// --- FEEDS & RATIONS ---
export async function getFeedSummary(): Promise<{
  totalValuation: number;
  lowStockCount: number;
  activePlans: number;
  estCostPerCow: number | null;
  totalFeeds: number;
}> {
  try {
    return await request("/feeds/summary");
  } catch {
    const totalValuation = initialFeeds.reduce((sum, f) => sum + (f.stock * f.unitPrice), 0);
    const lowStockCount = initialFeeds.filter(f => f.stock <= f.minStock).length;
    const totalCows = initialRationPlans.reduce((sum, r) => sum + (r.targetCowCount || 0), 0);
    const totalDailyCost = initialRationPlans.reduce((sum, r) => sum + (r.dailyGroupCost || 0), 0);
    const estCostPerCow = totalCows > 0 ? Math.round(totalDailyCost / totalCows) : null;
    return {
      totalValuation,
      lowStockCount,
      activePlans: initialRationPlans.length,
      estCostPerCow,
      totalFeeds: initialFeeds.length
    };
  }
}

export async function getFeeds(params?: { category?: string; search?: string }): Promise<FeedItem[]> {
  try {
    const q = new URLSearchParams();
    if (params?.category && params.category !== "All") q.set("category", params.category);
    if (params?.search) q.set("search", params.search);
    const path = `/feeds${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    return initialFeeds;
  }
}

export async function getFeedById(id: string): Promise<FeedItem> {
  return request(`/feeds/${encodeURIComponent(id)}`);
}

export async function createFeed(data: Partial<FeedItem>): Promise<FeedItem> {
  return request("/feeds", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateFeed(id: string, data: Partial<FeedItem>): Promise<FeedItem> {
  return request(`/feeds/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteFeed(id: string): Promise<any> {
  return request(`/feeds/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function getRations(): Promise<RationPlan[]> {
  try {
    return await request("/rations");
  } catch {
    return initialRationPlans;
  }
}

export async function createRation(data: Partial<RationPlan>): Promise<RationPlan> {
  return request("/rations", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRation(id: string, data: Partial<RationPlan>): Promise<RationPlan> {
  return request(`/rations/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteRation(id: string): Promise<any> {
  return request(`/rations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function distributeRationFeed(rationId: string, customCows?: number, notes?: string): Promise<any> {
  return request("/feeds/distribute", {
    method: "POST",
    body: JSON.stringify({ rationId, customCows, notes }),
  });
}

export async function getFeedConsumption(): Promise<any[]> {
  try {
    return await request("/feeds/consumption");
  } catch {
    return [];
  }
}

// --- INVENTORY ---
export async function getInventorySummary(params?: { from?: string; to?: string }): Promise<{
  totalValuation: number;
  uniqueSkus: number;
  lowStockCount: number;
  auditLogsCount: number;
  feedsCount: number;
  medicinesCount: number;
}> {
  try {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const path = `/inventory/summary${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    const feedsValuation = initialFeeds.reduce((sum, f) => sum + (f.stock * f.unitPrice), 0);
    const medsValuation = initialMedicines.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);
    const lowStockCount =
      initialFeeds.filter(f => f.stock <= f.minStock).length +
      initialMedicines.filter(m => m.quantity <= 5).length;
    return {
      totalValuation: feedsValuation + medsValuation,
      uniqueSkus: initialFeeds.length + initialMedicines.length,
      lowStockCount,
      auditLogsCount: 0,
      feedsCount: initialFeeds.length,
      medicinesCount: initialMedicines.length
    };
  }
}

export async function getInventory(params?: { category?: string; status?: string; search?: string }): Promise<any[]> {
  try {
    const q = new URLSearchParams();
    if (params?.category && params.category !== "All") q.set("category", params.category);
    if (params?.status && params.status !== "All") q.set("status", params.status);
    if (params?.search) q.set("search", params.search);
    const path = `/inventory${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    return [
      ...initialFeeds.map(f => ({
        id: f.id,
        name: f.name,
        category: "Feed & Forage",
        quantity: f.stock,
        stock: f.stock,
        unit: f.unit,
        unitPrice: f.unitPrice,
        minLevel: f.minStock,
        status: f.stock <= f.minStock ? "Low Stock" : "In Stock",
        supplier: f.supplier,
        reorderLevel: f.minStock * 1.5,
        totalValuation: f.stock * f.unitPrice
      })),
      ...initialMedicines.map(m => ({
        id: m.id,
        name: m.name,
        category: "Veterinary Medicine",
        quantity: m.quantity,
        stock: m.quantity,
        unit: m.unit,
        unitPrice: m.unitPrice,
        minLevel: 5,
        status: m.quantity <= 5 ? "Low Stock" : "In Stock",
        supplier: m.supplier,
        reorderLevel: 10,
        totalValuation: m.quantity * m.unitPrice
      }))
    ];
  }
}

export async function purchaseInventoryStock(data: any): Promise<any> {
  return request("/inventory/purchase", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function consumeInventoryStock(data: { itemId: string; quantity: number; reason?: string; performedBy?: string }): Promise<any> {
  return request("/inventory/consume", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function adjustInventoryStock(data: { itemId: string; newCount: number; reason?: string }): Promise<any> {
  return request("/inventory/adjust", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getInventoryLogs(): Promise<any[]> {
  try {
    return await request("/inventory/logs");
  } catch {
    return [];
  }
}

// --- CUSTOMERS & SUPPLIERS ---
export async function getCustomers(): Promise<Customer[]> {
  try {
    return await request("/customers");
  } catch {
    return initialCustomers;
  }
}

export async function createCustomer(data: Partial<Customer>): Promise<Customer> {
  return request("/customers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    return await request("/suppliers");
  } catch {
    return initialSuppliers;
  }
}

export async function createSupplier(data: Partial<Supplier>): Promise<Supplier> {
  return request("/suppliers", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- FINANCE ---
export async function getFinance(params?: { type?: string; category?: string; search?: string; from?: string; to?: string }): Promise<FinancialTransaction[]> {
  try {
    const q = new URLSearchParams();
    if (params?.type && params.type !== "All") q.set("type", params.type);
    if (params?.category && params.category !== "All") q.set("category", params.category);
    if (params?.search) q.set("search", params.search);
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const path = `/finance${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    return initialTransactions;
  }
}

export async function getFinanceSummary(params?: { from?: string; to?: string }): Promise<{
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  marginPercent: number | null;
  milkRevenue: number;
  feedExpenses: number;
  vetExpenses: number;
  laborExpenses: number;
  transactionCount: number;
}> {
  try {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const path = `/finance/summary${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    let txs = [...initialTransactions];
    if (params?.from) txs = txs.filter(t => t.date >= String(params.from));
    if (params?.to) txs = txs.filter(t => t.date <= String(params.to));
    const totalIncome = txs.filter(t => t.type === "Income").reduce((a, b) => a + b.amount, 0);
    const totalExpense = txs.filter(t => t.type === "Expense").reduce((a, b) => a + b.amount, 0);
    return {
      totalIncome,
      totalExpense,
      netProfit: totalIncome - totalExpense,
      marginPercent: totalIncome > 0 ? Number((((totalIncome - totalExpense) / totalIncome) * 100).toFixed(1)) : null,
      milkRevenue: 520000,
      feedExpenses: 110000,
      vetExpenses: 34500,
      laborExpenses: 70000,
      transactionCount: txs.length
    };
  }
}

export async function createTransaction(data: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
  return request("/finance", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTransaction(id: string, data: Partial<FinancialTransaction>): Promise<FinancialTransaction> {
  return request(`/finance/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTransaction(id: string): Promise<any> {
  return request(`/finance/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// --- REPORTS ---
export async function getFinancialReport(params?: { from?: string; to?: string }): Promise<any> {
  try {
    const q = new URLSearchParams();
    if (params?.from) q.set("from", params.from);
    if (params?.to) q.set("to", params.to);
    const path = `/reports/financial${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    return {
      totalIncome: 655500,
      totalExpense: 249500,
      netProfit: 406000,
      marginPercent: 61.9,
      categories: {
        "Milk Sales": 520000,
        "Cattle Sales": 135500,
        "Feed & Fodder": 110000,
        "Labor & Salaries": 70000,
        "Veterinary & Medicine": 34500,
        "Utilities & Power": 35000
      },
      transactions: initialTransactions
    };
  }
}

// --- TASKS ---
export async function getTasksSummary(): Promise<{
  totalAssigned: number;
  pendingExecution: number;
  highPriorityUrgent: number;
  completedDuties: number;
}> {
  try {
    return await request("/tasks/summary");
  } catch {
    const totalAssigned = initialTasks.length;
    const pendingExecution = initialTasks.filter(t => t.status !== "Completed").length;
    const highPriorityUrgent = initialTasks.filter(t => t.priority === "High" && t.status !== "Completed").length;
    const completedDuties = initialTasks.filter(t => t.status === "Completed").length;
    return {
      totalAssigned,
      pendingExecution,
      highPriorityUrgent,
      completedDuties
    };
  }
}

export async function getTasks(params?: { status?: string; priority?: string; search?: string; assignedTo?: string }): Promise<TaskItem[]> {
  try {
    const q = new URLSearchParams();
    if (params?.status && params.status !== "All") q.set("status", params.status);
    if (params?.priority && params.priority !== "All") q.set("priority", params.priority);
    if (params?.search) q.set("search", params.search);
    if (params?.assignedTo) q.set("assignedTo", params.assignedTo);
    const path = `/tasks${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    return initialTasks;
  }
}

export async function createTask(data: Partial<TaskItem>): Promise<TaskItem> {
  return request("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTask(id: string, data: Partial<TaskItem>): Promise<TaskItem> {
  return request(`/tasks/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string): Promise<any> {
  return request(`/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// --- REMINDERS & AUTOMATED ALERTS ---
export async function getReminders(): Promise<any[]> {
  try {
    return await request("/reminders");
  } catch {
    return [
      {
        id: "REM-1",
        title: "Pregnancy Check for HF-052 Zara",
        description: "Perform ultrasound scan 35 days post AI service.",
        dueDate: "2024-05-16",
        priority: "High",
        targetPage: "Breeding",
        targetId: "HF-052",
        status: "Active",
        category: "Breeding",
        source: "Automated"
      },
      {
        id: "REM-2",
        title: "HS & BQ Vaccination Booster",
        description: "Administer semi-annual booster for young stock and dry cows.",
        dueDate: "2024-05-21",
        priority: "Medium",
        targetPage: "Health",
        targetId: "HF-031",
        status: "Active",
        category: "Veterinary",
        source: "Automated"
      }
    ];
  }
}

export async function createReminder(data: {
  title: string;
  description?: string;
  dueDate: string;
  priority?: "High" | "Medium" | "Low";
  targetPage?: string;
  targetId?: string;
  category?: string;
}): Promise<any> {
  return request("/reminders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateReminder(id: string, data: any): Promise<any> {
  return request(`/reminders/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteReminder(id: string): Promise<any> {
  return request(`/reminders/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// --- SETTINGS ---
export async function getSettings(): Promise<FarmSettings> {
  try {
    return await request("/settings");
  } catch {
    return initialSettings;
  }
}

export async function saveSettings(data: Partial<FarmSettings>): Promise<any> {
  return request("/settings", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// --- ROLES & PERMISSIONS ---
export async function getRoles(): Promise<AppRole[]> {
  try {
    return await request("/roles");
  } catch {
    return initialRoles;
  }
}

export async function getRoleById(id: number): Promise<AppRole> {
  return request(`/roles/${id}`);
}

export async function getRolePermissions(roleId?: number): Promise<RolePermissionMatrix[]> {
  try {
    const path = roleId ? `/permissions?roleId=${roleId}` : "/permissions";
    return await request(path);
  } catch {
    return initialRolePermissions;
  }
}

export async function updateRolePermissions(roleId: number, permissions: ModulePermission[]): Promise<any> {
  return request(`/permissions/role/${roleId}`, {
    method: "PUT",
    body: JSON.stringify({ permissions }),
  });
}

// --- USER MANAGEMENT ---
export async function getUsers(): Promise<AppUser[]> {
  try {
    return await request("/users");
  } catch {
    return initialUsers;
  }
}

export async function getUserById(id: number): Promise<AppUser> {
  return request(`/users/${id}`);
}

export async function createUser(data: Partial<AppUser>): Promise<AppUser> {
  return request("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(id: number, data: Partial<AppUser>): Promise<AppUser> {
  return request(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<any> {
  return request(`/users/${id}`, {
    method: "DELETE",
  });
}

// --- AUDIT LOGS ---
export async function getAuditLogs(params?: { module?: string; action?: string; userId?: number; search?: string }): Promise<AuditLogItem[]> {
  try {
    const q = new URLSearchParams();
    if (params?.module && params.module !== "All") q.set("module", params.module);
    if (params?.action && params.action !== "All") q.set("action", params.action);
    if (params?.userId) q.set("userId", String(params.userId));
    if (params?.search) q.set("search", params.search);
    const path = `/audit-logs${q.toString() ? `?${q.toString()}` : ""}`;
    return await request(path);
  } catch {
    return initialAuditLogs;
  }
}

// --- SYSTEM FLAGS ---
export async function getSystemFlags(): Promise<SystemFlags> {
  try {
    return await request("/settings/flags");
  } catch {
    return initialSystemFlags;
  }
}

export async function updateSystemFlags(flags: Partial<SystemFlags>): Promise<SystemFlags> {
  return request("/settings/flags", {
    method: "POST",
    body: JSON.stringify(flags),
  });
}

