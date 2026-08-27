import express, { Request, Response } from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import {
  initialAnimals,
  initialMilkRecords,
  generateInitialMilkRecords,
  getLocalDateString,
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
  initialUserRoles,
  initialSettings,
  initialRoles,
  initialUsers,
  initialRolePermissions,
  initialAuditLogs,
  initialSystemFlags,
  PERMISSION_MODULES
} from "./src/data";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// In-Memory Database Store initialized with rich dairy records
let animalsDb = [...initialAnimals];
let milkRecordsDb = [...initialMilkRecords];
let milkAlertsDb = [...initialMilkAlerts];
let breedingDb = [...initialBreedingEvents];
let calvingDb = [...initialCalvingRecords];
let calfGrowthDb = [...initialCalfGrowth];
let diseasesDb = [...initialDiseases];
let medicinesDb = [...initialMedicines];
let healthDb = [...initialHealthRecords];
let vaccinationsDb = [...initialVaccinations];
let feedsDb = [...initialFeeds];
let rationPlansDb = [...initialRationPlans];
let customersDb = [...initialCustomers];
let suppliersDb = [...initialSuppliers];
let transactionsDb = [...initialTransactions];
let tasksDb = [...initialTasks];
let multiFarmsDb = [...initialMultiFarms];
let inventoryLogsDb: Array<{
  id: string;
  itemId: string;
  itemName: string;
  category: string;
  type: "Stock In" | "Stock Out" | "Adjustment" | "Consumption";
  quantity: number;
  unit: string;
  date: string;
  cost?: number;
  reason?: string;
  performedBy?: string;
}> = [
  {
    id: "LOG-1001",
    itemId: "F-1",
    itemName: "Corn Silage (Chopped)",
    category: "Feed & Forage",
    type: "Stock In",
    quantity: 5000,
    unit: "kg",
    date: "2024-05-10",
    cost: 75000,
    reason: "Bulk Seasonal Purchase",
    performedBy: "Manager"
  },
  {
    id: "LOG-1002",
    itemId: "M-1",
    itemName: "Intramast-DC (Cloxacillin)",
    category: "Veterinary Medicine",
    type: "Stock Out",
    quantity: 1,
    unit: "tubes",
    date: "2024-05-14",
    reason: "Mastitis Treatment HF-027 Bella",
    performedBy: "Dr. Imran"
  }
];
let feedConsumptionDb: Array<{
  id: string;
  date: string;
  rationId?: string;
  group: string;
  cowsCount: number;
  totalKg: number;
  totalCost: number;
  costPerCow: number;
  distributedBy: string;
}> = [
  {
    id: "FC-101",
    date: "2024-05-14",
    group: "High Milking Group",
    cowsCount: 42,
    totalKg: 1312.5,
    totalCost: 20412,
    costPerCow: 486,
    distributedBy: "Ali Herdsman"
  },
  {
    id: "FC-102",
    date: "2024-05-14",
    group: "Medium Milking Group",
    cowsCount: 40,
    totalKg: 1100,
    totalCost: 16480,
    costPerCow: 412,
    distributedBy: "Ali Herdsman"
  }
];
let customRemindersDb: Array<{
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  targetPage?: string;
  targetId?: string;
  status: "Active" | "Completed" | "Dismissed";
  category: "Veterinary" | "Breeding" | "Feeding" | "General" | "Maintenance";
}> = [
  {
    id: "REM-1",
    title: "Pregnancy Check for HF-052 Zara",
    description: "Perform ultrasound scan 35 days post AI service.",
    dueDate: "2024-05-16",
    priority: "High",
    targetPage: "Breeding",
    targetId: "HF-052",
    status: "Active",
    category: "Breeding"
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
    category: "Veterinary"
  }
];
let eventsDb: Array<{
  id: string;
  animalId: string;
  animalName?: string;
  date: string;
  eventType: string;
  title: string;
  notes: string;
  metric1?: string;
  metric2?: string;
}> = [
  {
    id: "EVT-1001",
    animalId: "HF-027",
    animalName: "Bella",
    date: "2024-05-10",
    eventType: "Clinical Observation",
    title: "Routine Lactation Inspection",
    notes: "Body condition score: 3.25. High appetite, rumen fill optimal. Udder symmetry normal."
  },
  {
    id: "EVT-1002",
    animalId: "HF-027",
    animalName: "Bella",
    date: "2024-04-22",
    eventType: "Hoof Trimming",
    title: "Preventive Hoof Trimming",
    notes: "Completed routine spring claw trimming and sole leveling. No digital dermatitis observed."
  }
];
let farmSettings = { ...initialSettings };
let activeFarmId = 1;
let currentRole = "Manager";
let activeUserId = 2;

let rolesDb = [...initialRoles];
let usersDb = [...initialUsers];
let rolePermissionsDb = JSON.parse(JSON.stringify(initialRolePermissions));
let auditLogsDb = [...initialAuditLogs];
let systemFlagsDb = { ...initialSystemFlags };

function ensureRequiredRoles() {
  const requiredRolesList = [
    { name: "Owner", code: "OWNER", description: "Complete unrestricted administrative control, financial auditing, asset valuation, and farm configuration." },
    { name: "Manager", code: "MANAGER", description: "Full day-to-day herd management, feed schedules, task dispatching, inventory replenishment, and customer delivery logs." },
    { name: "Veterinarian", code: "VETERINARIAN", description: "Dedicated access to health records, disease diagnoses, prescriptions, artificial inseminations, pregnancy checks, and milk withdrawal restrictions." },
    { name: "Feed Manager", code: "FEED_MANAGER", description: "Formulation of daily TMR rations, grain stock audits, nutrient tracking, and silage pit level management." },
    { name: "Worker", code: "WORKER", description: "Simplified fast 2-tap data entry interface for morning/evening milk liters, heat observations, and calving logs." },
    { name: "Accountant", code: "ACCOUNTANT", description: "Financial transactions, milk revenue reconciliations, customer accounts receivable, feed invoice approvals, and unit profit calculations." }
  ];

  let nextId = Math.max(...rolesDb.map(r => r.id), 0) + 1;
  requiredRolesList.forEach(req => {
    const existing = rolesDb.find(r => r.name.toLowerCase() === req.name.toLowerCase() || r.code === req.code);
    if (!existing) {
      const newRole = {
        id: nextId++,
        name: req.name,
        code: req.code,
        description: req.description,
        isSystem: true
      };
      rolesDb.push(newRole);
    }
  });

  // Ensure role permissions exist for every role
  rolesDb.forEach(role => {
    const exists = rolePermissionsDb.some((rp: any) => rp.roleId === role.id);
    if (!exists) {
      const template = initialRolePermissions.find(p => p.roleName === role.name) || initialRolePermissions[0];
      rolePermissionsDb.push({
        roleId: role.id,
        roleName: role.name,
        permissions: JSON.parse(JSON.stringify(template.permissions))
      });
    }
  });
}
ensureRequiredRoles();

function getActiveUser() {
  const user = usersDb.find(u => u.id === activeUserId) || usersDb[0];
  return user;
}

function logAudit(action: string, module: string, details: string, recordId?: string, req?: Request) {
  if (!systemFlagsDb.auditLogging && action !== "TOGGLE_FLAG") return;
  const user = getActiveUser();
  const newLog = {
    id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
    userId: user.id,
    userName: user.name,
    userRole: user.roleName || currentRole,
    action: action as any,
    module,
    recordId: recordId || "",
    details,
    ipAddress: req?.ip || req?.socket?.remoteAddress || "127.0.0.1"
  };
  auditLogsDb.unshift(newLog);
  if (auditLogsDb.length > 500) auditLogsDb.pop();
}

function checkPermission(module: string, action: "View" | "Create" | "Edit" | "Delete" | "Export"): boolean {
  const user = getActiveUser();
  const matrix = rolePermissionsDb.find((r: any) => r.roleId === user.roleId || r.roleName === user.roleName);
  if (!matrix) return true;
  const modPerm = matrix.permissions?.find((p: any) => p.module === module);
  if (!modPerm) return true;
  if (action === "View") return modPerm.canView;
  if (action === "Create") return modPerm.canCreate;
  if (action === "Edit") return modPerm.canEdit;
  if (action === "Delete") return modPerm.canDelete;
  if (action === "Export") return modPerm.canExport;
  return true;
}

const sessions = new Map<string, any>();

// --- AUTH & ROLES ---
app.post("/api/auth/login", (req: Request, res: Response) => {
  const { email } = req.body;
  const matchedUser = usersDb.find(u => u.email.toLowerCase() === (email || "").toLowerCase()) || usersDb[1] || usersDb[0];
  activeUserId = matchedUser.id;
  currentRole = matchedUser.roleName;

  const token = "session_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
  sessions.set(token, matchedUser);
  logAudit("LOGIN", "Authentication", `User ${matchedUser.name} (${matchedUser.roleName}) logged in successfully`, String(matchedUser.id), req);

  res.json({
    success: true,
    message: "Login successful.",
    data: {
      token,
      expiresInHours: 12,
      user: matchedUser,
      activeRole: currentRole,
      activeFarmId
    }
  });
});

app.post("/api/auth/logout", (req: Request, res: Response) => {
  const token = req.headers["x-session-token"] as string;
  const user = getActiveUser();
  logAudit("LOGOUT", "Authentication", `User ${user.name} logged out`, String(user.id), req);
  if (token) sessions.delete(token);
  res.json({ success: true, message: "Logged out.", data: {} });
});

app.get("/api/auth/me", (req: Request, res: Response) => {
  const user = getActiveUser();
  const roleMatrix = rolePermissionsDb.find((r: any) => r.roleId === user.roleId || r.roleName === user.roleName);
  res.json({
    success: true,
    data: user,
    activeUser: user,
    activeRole: user.roleName || currentRole,
    activeFarmId,
    permissions: roleMatrix?.permissions || []
  });
});

app.post("/api/auth/switch-user", (req: Request, res: Response) => {
  const { userId } = req.body;
  const targetUser = usersDb.find(u => u.id === Number(userId));
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }
  activeUserId = targetUser.id;
  currentRole = targetUser.roleName;
  logAudit("LOGIN", "Authentication", `Switched active persona to ${targetUser.name} (${targetUser.roleName})`, String(targetUser.id), req);
  res.json({
    success: true,
    activeUser: targetUser,
    activeRole: targetUser.roleName
  });
});

app.post("/api/auth/switch-role", (req: Request, res: Response) => {
  if (req.body.role) {
    currentRole = req.body.role;
    const user = getActiveUser();
    const matchedRole = rolesDb.find(r => r.name.toLowerCase() === req.body.role.toLowerCase());
    if (matchedRole) {
      user.roleId = matchedRole.id;
      user.roleName = matchedRole.name;
    }
    logAudit("LOGIN", "Authentication", `Active role switched to ${currentRole}`, "", req);
  }
  res.json({ success: true, role: currentRole, activeUser: getActiveUser() });
});

// --- ROLES & PERMISSIONS ENDPOINTS ---
app.get("/api/roles", (req: Request, res: Response) => {
  ensureRequiredRoles();
  res.json(rolesDb);
});

app.get("/api/roles/:id", (req: Request, res: Response) => {
  const role = rolesDb.find(r => r.id === Number(req.params.id));
  if (!role) return res.status(404).json({ error: "Role not found" });
  res.json(role);
});

app.get("/api/permissions", (req: Request, res: Response) => {
  ensureRequiredRoles();
  const { roleId } = req.query;
  if (roleId) {
    const matrix = rolePermissionsDb.filter((m: any) => m.roleId === Number(roleId));
    return res.json(matrix);
  }
  res.json(rolePermissionsDb);
});

app.put("/api/permissions/role/:roleId", (req: Request, res: Response) => {
  const roleId = Number(req.params.roleId);
  const { permissions } = req.body;
  if (!Array.isArray(permissions)) {
    return res.status(400).json({ error: "Permissions array is required" });
  }

  const role = rolesDb.find(r => r.id === roleId);
  if (!role) {
    return res.status(404).json({ error: "Role not found" });
  }

  const idx = rolePermissionsDb.findIndex((r: any) => r.roleId === roleId);
  const updatedMatrix = {
    roleId,
    roleName: role.name,
    permissions
  };

  if (idx >= 0) {
    rolePermissionsDb[idx] = updatedMatrix;
  } else {
    rolePermissionsDb.push(updatedMatrix);
  }

  logAudit("PERMISSION_UPDATE", "Settings", `Updated access permissions matrix for role: ${role.name}`, String(roleId), req);
  res.json({ success: true, matrix: updatedMatrix });
});

// --- USERS ENDPOINTS ---
app.get("/api/users", (req: Request, res: Response) => {
  res.json(usersDb);
});

app.get("/api/users/:id", (req: Request, res: Response) => {
  const user = usersDb.find(u => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

app.post("/api/users", (req: Request, res: Response) => {
  const body = req.body;
  if (!body.name || !body.email) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  const nextId = Math.max(...usersDb.map(u => u.id), 0) + 1;
  const roleId = Number(body.roleId) || 2;
  const roleObj = rolesDb.find(r => r.id === roleId) || rolesDb[1];

  const newUser = {
    id: nextId,
    name: body.name,
    email: body.email,
    phone: body.phone || "",
    roleId: roleObj.id,
    roleName: roleObj.name,
    status: (body.status || "Active") as "Active" | "Inactive",
    createdAt: new Date().toISOString().split("T")[0]
  };

  usersDb.push(newUser);
  logAudit("CREATE", "Users", `Created staff user account for ${newUser.name} with role ${newUser.roleName}`, String(newUser.id), req);
  res.status(201).json(newUser);
});

app.put("/api/users/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const idx = usersDb.findIndex(u => u.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "User not found" });
  }

  const body = req.body;
  let roleId = usersDb[idx].roleId;
  let roleName = usersDb[idx].roleName;

  if (body.roleId) {
    const roleObj = rolesDb.find(r => r.id === Number(body.roleId));
    if (roleObj) {
      roleId = roleObj.id;
      roleName = roleObj.name;
    }
  }

  usersDb[idx] = {
    ...usersDb[idx],
    ...body,
    roleId,
    roleName
  };

  logAudit("UPDATE", "Users", `Updated user account details & role for ${usersDb[idx].name} (${roleName})`, String(id), req);
  res.json(usersDb[idx]);
});

app.delete("/api/users/:id", (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const user = usersDb.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  if (usersDb.length <= 1) {
    return res.status(400).json({ error: "Cannot delete the last remaining administrator user" });
  }

  usersDb = usersDb.filter(u => u.id !== id);
  logAudit("DELETE", "Users", `Deleted user account: ${user.name} (${user.roleName})`, String(id), req);
  res.json({ success: true, message: `User ${user.name} removed successfully.` });
});

// --- AUDIT LOGS ENDPOINTS ---
app.get("/api/audit-logs", (req: Request, res: Response) => {
  const { module, action, userId, search } = req.query;
  let logs = [...auditLogsDb];

  if (module && module !== "All") {
    logs = logs.filter(l => l.module.toLowerCase() === String(module).toLowerCase());
  }
  if (action && action !== "All") {
    logs = logs.filter(l => l.action.toLowerCase() === String(action).toLowerCase());
  }
  if (userId) {
    logs = logs.filter(l => l.userId === Number(userId));
  }
  if (search) {
    const q = String(search).toLowerCase();
    logs = logs.filter(l =>
      l.details.toLowerCase().includes(q) ||
      l.userName.toLowerCase().includes(q) ||
      l.module.toLowerCase().includes(q) ||
      (l.recordId && l.recordId.toLowerCase().includes(q))
    );
  }

  res.json(logs);
});

// --- SYSTEM FLAGS ENDPOINTS ---
app.get("/api/settings/flags", (req: Request, res: Response) => {
  res.json(systemFlagsDb);
});

app.post("/api/settings/flags", (req: Request, res: Response) => {
  systemFlagsDb = { ...systemFlagsDb, ...req.body };
  farmSettings.flags = { ...systemFlagsDb };
  logAudit("TOGGLE_FLAG", "Settings", `Updated system flags and security compliance settings`, "", req);
  res.json(systemFlagsDb);
});

// --- MULTI-FARM ---
app.get("/api/farms", (req: Request, res: Response) => {
  res.json(multiFarmsDb);
});

app.post("/api/farms/switch", (req: Request, res: Response) => {
  if (req.body.farmId) {
    activeFarmId = Number(req.body.farmId);
  }
  res.json({ success: true, activeFarmId });
});

// --- DASHBOARD SUMMARY, TOP PRODUCERS & LIVE REMINDERS ---
app.get("/api/dashboard/summary", (req: Request, res: Response) => {
  if (!animalsDb || animalsDb.length === 0) animalsDb = [...initialAnimals];
  if (!milkRecordsDb || milkRecordsDb.length === 0) milkRecordsDb = generateInitialMilkRecords();
  if (!breedingDb || breedingDb.length === 0) breedingDb = [...initialBreedingEvents];
  if (!calvingDb || calvingDb.length === 0) calvingDb = [...initialCalvingRecords];
  if (!healthDb || healthDb.length === 0) healthDb = [...initialHealthRecords];
  if (!vaccinationsDb || vaccinationsDb.length === 0) vaccinationsDb = [...initialVaccinations];
  if (!transactionsDb || transactionsDb.length === 0) transactionsDb = [...initialTransactions];
  if (!tasksDb || tasksDb.length === 0) tasksDb = [...initialTasks];

  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(-1);
  const currentYearMonth = todayStr.substring(0, 7);
  const currentMonthStart = `${currentYearMonth}-01`;

  // Herd counts
  const totalAnimals = animalsDb.filter(a => a.status !== "Sold" && a.status !== "Dead").length || animalsDb.length;
  const lactatingCows = animalsDb.filter(a => a.status === "Lactating").length;
  const dryCows = animalsDb.filter(a => a.status === "Dry").length;
  const pregnantCows = animalsDb.filter(a => 
    a.status === "Pregnant" || 
    breedingDb.some(b => b.animalId === a.id && b.result === "Positive" && (!b.calvingDate || b.calvingDate >= todayStr))
  ).length;
  const heifers = animalsDb.filter(a => a.status === "Heifer").length;
  const calves = animalsDb.filter(a => a.status === "Calf").length;
  const bulls = animalsDb.filter(a => a.status === "Bull").length;
  const sickAnimals = animalsDb.filter(a => 
    a.status === "Sick" || 
    a.status === "Quarantine" || 
    healthDb.some(h => (h.animalId === a.id || (h.animal && h.animal.includes(a.id))) && (h.status === "In Treatment" || h.status === "Sick" || h.status === "Active"))
  ).length;

  // Milk calculations
  const todayMilkRecords = milkRecordsDb.filter(r => r.date === todayStr);
  let todayMilkLitres = todayMilkRecords.reduce((acc, r) => acc + (Number(r.totalLitres) || (Number(r.morningLitres || 0) + Number(r.eveningLitres || 0) + Number(r.thirdMilkingLitres || 0))), 0);
  todayMilkLitres = Number(todayMilkLitres.toFixed(1));

  const yesterdayMilkRecords = milkRecordsDb.filter(r => r.date === yesterdayStr);
  let yesterdayMilkLitres = yesterdayMilkRecords.reduce((acc, r) => acc + (Number(r.totalLitres) || 0), 0);
  yesterdayMilkLitres = Number(yesterdayMilkLitres.toFixed(1));

  const avgMilkPerCow = lactatingCows > 0 ? Number((todayMilkLitres / lactatingCows).toFixed(1)) : 0;

  // Month to date milk
  const monthMilkRecords = milkRecordsDb.filter(r => r.date.startsWith(currentYearMonth) || (r.date >= currentMonthStart && r.date <= todayStr));
  let monthToDateMilkLitres = monthMilkRecords.reduce((acc, r) => acc + (Number(r.totalLitres) || 0), 0);
  if (monthToDateMilkLitres === 0 && todayMilkLitres > 0) {
    monthToDateMilkLitres = todayMilkLitres;
  }
  monthToDateMilkLitres = Number(monthToDateMilkLitres.toFixed(1));

  // Revenue & Finances
  const milkPrice = Number(farmSettings.milkPricePerLitre || 150);
  const milkRevenue = Math.round(monthToDateMilkLitres * milkPrice);
  
  const totalIncome = transactionsDb.filter(t => t.type === "Income").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpenses = transactionsDb.filter(t => t.type === "Expense").reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const estimatedProfit = totalIncome - totalExpenses;

  const currentMonthIncome = transactionsDb
    .filter(t => t.type === "Income" && (t.date.startsWith(currentYearMonth) || t.date >= currentMonthStart))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const monthlyGrossRevenue = currentMonthIncome > 0 ? currentMonthIncome : (milkRevenue > 0 ? milkRevenue : totalIncome);

  const currentMonthExpenses = transactionsDb
    .filter(t => t.type === "Expense" && (t.date.startsWith(currentYearMonth) || t.date >= currentMonthStart))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const monthExpenses = currentMonthExpenses > 0 ? currentMonthExpenses : totalExpenses;

  // Health
  const totalMedicalRecords = healthDb.length;
  const activeCasesInTreatment = healthDb.filter(
    h => h.status === "In Treatment" || h.status === "Sick" || h.status === "Active"
  ).length;
  const activeWithdrawalsList = healthDb.filter(h => {
    if (h.withdrawalDays > 0) {
      if (h.status === "In Treatment") return true;
      if (h.withdrawalUntil && h.withdrawalUntil >= todayStr) return true;
    }
    return false;
  });
  const milkWithdrawalHolds = activeWithdrawalsList.length;
  const vaccinationProgramsCompleted = vaccinationsDb.filter(v => v.status === "Completed").length;
  const vaccinationProgramsTotal = vaccinationsDb.length;

  // Reproduction & AI
  const positiveBreedings = breedingDb.filter(b => b.result === "Positive");
  const pregnanciesThisMonth = positiveBreedings.filter(b => 
    (b.pdDate && b.pdDate.startsWith(currentYearMonth)) || 
    (b.aiDate && b.aiDate.startsWith(currentYearMonth)) ||
    (b.heatDate && b.heatDate.startsWith(currentYearMonth))
  ).length || positiveBreedings.length;

  const breedingEventsThisMonth = breedingDb.filter(b => 
    (b.aiDate && b.aiDate.startsWith(currentYearMonth)) || 
    (b.heatDate && b.heatDate.startsWith(currentYearMonth))
  ).length || breedingDb.length;

  const calvingsAnticipated = breedingDb.filter(b => 
    b.result === "Positive" && (!b.expectedCalving || b.expectedCalving >= todayStr)
  ).length || calvingDb.filter(c => !c.actualDate || c.expectedDate >= todayStr).length;

  const pendingTasksCount = tasksDb.filter(t => !t.completed && t.status !== "Completed").length;
  const activeAlertsCount = milkAlertsDb.length + (sickAnimals > 0 ? 1 : 0);

  const summaryData = {
    totalHerdAnimals: totalAnimals,
    totalAnimals,
    lactatingCattle: lactatingCows,
    lactatingCows,
    activeAnimals: lactatingCows,
    confirmedPregnant: pregnantCows,
    pregnantCows,
    activePregnancies: pregnantCows,
    inTreatmentSick: sickAnimals,
    sickAnimals,
    openHealthCases: activeCasesInTreatment,
    activeCasesInTreatment,
    dryCows,
    heifers,
    calves,
    bulls,

    todayMilkLitres,
    todayMilkTotal: todayMilkLitres,
    yesterdayMilkLitres,
    avgMilkPerCow,
    monthToDateMilkLitres,
    monthlyMilkLitres: monthToDateMilkLitres,
    monthlyGrossRevenue,
    monthRevenue: monthlyGrossRevenue,
    milkRevenue,

    pregnanciesThisMonth,
    pregnancyPositiveThisMonth: pregnanciesThisMonth,
    totalBreedingEvents: breedingDb.length,
    breedingEventsThisMonth,
    calvingsAnticipated,
    calvingsThisMonth: calvingsAnticipated,

    totalMedicalRecords,
    milkWithdrawalHolds,
    vaccinationProgramsCompleted,
    vaccinationProgramsTotal,

    totalRevenue: totalIncome,
    totalIncome,
    totalOperationalCost: totalExpenses,
    totalExpenses,
    monthExpenses,
    netProfit: estimatedProfit,
    estimatedProfit,

    pendingTasksCount,
    activeAlertsCount
  };

  res.json({
    success: true,
    data: summaryData
  });
});

// Top Milk Producers Endpoint
app.get("/api/dashboard/top-producers", (req: Request, res: Response) => {
  if (!animalsDb || animalsDb.length === 0) animalsDb = [...initialAnimals];
  if (!milkRecordsDb || milkRecordsDb.length === 0) milkRecordsDb = generateInitialMilkRecords();

  const todayStr = getLocalDateString(0);
  const todayRecords = milkRecordsDb.filter(r => r.date === todayStr);

  // Map each animal with their latest yield
  const producers = animalsDb
    .filter(a => a.status === "Lactating" || a.milk)
    .map(a => {
      const todayRec = todayRecords.find(r => r.animalId.toLowerCase() === a.id.toLowerCase());
      const dailyYield = todayRec 
        ? Number(todayRec.totalLitres || ((todayRec.morningLitres || 0) + (todayRec.eveningLitres || 0) + (todayRec.thirdMilkingLitres || 0)))
        : Number(a.milk || 0);

      return {
        animalId: a.id,
        name: a.name,
        earTag: a.earTag || "",
        breed: a.breed,
        milk: Number(dailyYield.toFixed(1)),
        morningLitres: todayRec?.morningLitres,
        eveningLitres: todayRec?.eveningLitres,
        status: a.status,
        photo: a.photo
      };
    });

  // Sort descending by milk yield
  producers.sort((a, b) => b.milk - a.milk);

  const rankedProducers = producers.slice(0, 5).map((p, index) => ({
    ...p,
    rank: index + 1
  }));

  res.json({
    success: true,
    data: rankedProducers
  });
});

// Actionable Live Reminders Endpoint
app.get("/api/dashboard/reminders", (req: Request, res: Response) => {
  if (!animalsDb || animalsDb.length === 0) animalsDb = [...initialAnimals];
  if (!breedingDb || breedingDb.length === 0) breedingDb = [...initialBreedingEvents];
  if (!healthDb || healthDb.length === 0) healthDb = [...initialHealthRecords];
  if (!vaccinationsDb || vaccinationsDb.length === 0) vaccinationsDb = [...initialVaccinations];
  if (!tasksDb || tasksDb.length === 0) tasksDb = [...initialTasks];
  if (!feedsDb || feedsDb.length === 0) feedsDb = [...initialFeeds];

  const todayStr = getLocalDateString(0);
  const reminders: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    priority: "High" | "Medium" | "Low";
    targetPage: string;
    targetId?: string;
    category: "Breeding" | "Health" | "Milk Management" | "Feed" | "Inventory" | "Tasks & Reminders" | "General";
    dotColor: "red" | "orange" | "blue" | "green";
  }> = [];

  // 1. Breeding: Pending PDs & Approaching Calvings
  breedingDb.forEach(b => {
    if (b.result === "Positive" && b.expectedCalving) {
      reminders.push({
        id: `REM-CALV-${b.id}`,
        title: `Calving anticipated for ${b.animalId}`,
        description: `Expected due date: ${b.expectedCalving} · Prepare maternity pen`,
        dueDate: b.expectedCalving,
        priority: "High",
        targetPage: "Breeding",
        targetId: b.animalId,
        category: "Breeding",
        dotColor: "orange"
      });
    } else if (b.result === "Pending" || !b.result) {
      reminders.push({
        id: `REM-PD-${b.id}`,
        title: `Pregnancy Diagnosis due for ${b.animalId}`,
        description: `Ultrasound check scheduled (AI Date: ${b.aiDate || b.heatDate || "Recent"})`,
        dueDate: b.pdDate || todayStr,
        priority: "High",
        targetPage: "Breeding",
        targetId: b.animalId,
        category: "Breeding",
        dotColor: "orange"
      });
    }
  });

  // 2. Health: Active Milk Withdrawals & In Treatment
  healthDb.forEach(h => {
    if (h.withdrawalDays > 0 && (h.status === "In Treatment" || (h.withdrawalUntil && h.withdrawalUntil >= todayStr))) {
      reminders.push({
        id: `REM-WITHDRAW-${h.id}`,
        title: `Medicine withdrawal active (${h.animalId})`,
        description: `Treated with ${h.medicine} for ${h.diagnosis} · Segregate milk until ${h.withdrawalUntil || "cleared"}`,
        dueDate: h.withdrawalUntil || todayStr,
        priority: "High",
        targetPage: "Health",
        targetId: h.animalId,
        category: "Health",
        dotColor: "red"
      });
    } else if (h.status === "In Treatment" || h.status === "Sick") {
      reminders.push({
        id: `REM-TREAT-${h.id}`,
        title: `Active treatment follow-up (${h.animalId})`,
        description: `${h.diagnosis} treatment by ${h.veterinarian || "Veterinarian"}`,
        dueDate: h.followUpDate || todayStr,
        priority: "Medium",
        targetPage: "Health",
        targetId: h.animalId,
        category: "Health",
        dotColor: "orange"
      });
    }
  });

  // 3. Vaccinations Scheduled
  vaccinationsDb.forEach(v => {
    if (v.status === "Scheduled") {
      reminders.push({
        id: `REM-VAC-${v.id}`,
        title: `Vaccination: ${v.vaccineName}`,
        description: `Target: ${v.targetGroup} · Batch: ${v.batchNumber || "Scheduled"}`,
        dueDate: v.date || todayStr,
        priority: "Medium",
        targetPage: "Health",
        category: "Health",
        dotColor: "orange"
      });
    }
  });

  // 4. Low Inventory Feeds
  feedsDb.forEach(f => {
    const qty = Number(f.quantity || f.currentStock || 0);
    const min = Number(f.minQuantity || f.reorderLevel || 100);
    if (qty <= min) {
      reminders.push({
        id: `REM-FEED-${f.id}`,
        title: `Low stock alert: ${f.name}`,
        description: `Current: ${qty} ${f.unit || "kg"} (Reorder threshold: ${min} ${f.unit || "kg"})`,
        dueDate: todayStr,
        priority: "High",
        targetPage: "Feed",
        category: "Feed",
        dotColor: "red"
      });
    }
  });

  // 5. Pending Farm Tasks
  tasksDb.filter(t => !t.completed && t.status !== "Completed").slice(0, 3).forEach(t => {
    reminders.push({
      id: `REM-TASK-${t.id}`,
      title: t.title,
      description: `Assigned to: ${t.assignee || "Herdsman"} · ${t.category || "Task"}`,
      dueDate: t.dueDate || todayStr,
      priority: t.priority === "High" ? "High" : "Medium",
      targetPage: "Tasks & Reminders",
      category: "Tasks & Reminders",
      dotColor: t.priority === "High" ? "red" : "blue"
    });
  });

  // Sort by priority (High first), then limit to top 6 actionable reminders
  const priorityOrder = { High: 1, Medium: 2, Low: 3 };
  reminders.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));

  res.json({
    success: true,
    data: reminders.slice(0, 6)
  });
});


// --- MASTER DATA & BREEDS ---
const defaultBreeds = [
  { id: "1", name: "HF (Holstein Friesian)", species: "Cattle", origin: "Netherlands", avgYield: 28, description: "High volume dairy production breed" },
  { id: "2", name: "Jersey", species: "Cattle", origin: "Channel Islands", avgYield: 20, description: "High butterfat & protein composition" },
  { id: "3", name: "Sahiwal", species: "Cattle", origin: "Pakistan / Punjab", avgYield: 14, description: "Heat & tick resistant tropical dairy breed" },
  { id: "4", name: "Crossbred (HF x Sahiwal)", species: "Cattle", origin: "Pakistan", avgYield: 22, description: "Tropical acclimatized high yield cross" },
  { id: "5", name: "Cholistani", species: "Cattle", origin: "Pakistan", avgYield: 12, description: "Hardy desert milch breed" },
  { id: "6", name: "Red Sindhi", species: "Cattle", origin: "Pakistan", avgYield: 13, description: "Disease resistant dairy cattle" },
  { id: "7", name: "Nili-Ravi", species: "Buffalo", origin: "Pakistan", avgYield: 16, description: "Premier dairy buffalo, 6.5%+ fat" },
  { id: "8", name: "Kundi", species: "Buffalo", origin: "Pakistan", avgYield: 14, description: "Sindh dairy buffalo breed" },
  { id: "9", name: "Murrah", species: "Buffalo", origin: "South Asia", avgYield: 15, description: "High yielding dairy buffalo" }
];

app.get(["/api/breeds", "/api/master/breeds", "/api/master-data/breeds"], (req: Request, res: Response) => {
  res.json(defaultBreeds);
});

// --- ANIMALS CRUD & LIFECYCLE ---
app.get("/api/animals/next-number", (req: Request, res: Response) => {
  if (!animalsDb || animalsDb.length === 0) {
    return res.json({
      nextId: "Animal 001",
      nextNumber: "Animal 001",
      nextEarTag: "ET-1001",
      lastAnimal: null,
      totalAnimals: 0,
      prefix: "Animal "
    });
  }

  // Calculate highest numeric suffix
  let maxHfNum = 0;
  let maxAnimalNum = 0;
  let maxGenericNum = 0;
  let maxTagNum = 1000;

  animalsDb.forEach(a => {
    // Check HF-0XX format
    const hfMatch = a.id.match(/^HF[-_ ]*0*(\d+)$/i);
    if (hfMatch) {
      const n = parseInt(hfMatch[1], 10);
      if (!isNaN(n) && n > maxHfNum) maxHfNum = n;
    }

    // Check Animal 0XX format
    const animMatch = a.id.match(/^Animal\s*0*(\d+)$/i);
    if (animMatch) {
      const n = parseInt(animMatch[1], 10);
      if (!isNaN(n) && n > maxAnimalNum) maxAnimalNum = n;
    }

    // Check generic numbers
    const numMatch = a.id.match(/(\d+)/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      if (!isNaN(n) && n > maxGenericNum) maxGenericNum = n;
    }

    // Ear tag check
    const tagMatch = (a.earTag || "").match(/(\d+)/);
    if (tagMatch) {
      const t = parseInt(tagMatch[1], 10);
      if (!isNaN(t) && t > maxTagNum) maxTagNum = t;
    }
  });

  const lastAnimal = animalsDb[0] || null;
  
  // Suggest based on herd convention (default to HF-0XX or Animal 00X)
  let nextId = "";
  if (maxHfNum > 0) {
    const nextN = maxHfNum + 1;
    nextId = nextN < 100 ? `HF-0${nextN}` : `HF-${nextN}`;
  } else if (maxAnimalNum > 0) {
    const nextN = maxAnimalNum + 1;
    nextId = `Animal ${String(nextN).padStart(3, "0")}`;
  } else {
    const nextN = (maxGenericNum || animalsDb.length) + 1;
    nextId = nextN < 100 ? `HF-0${nextN}` : `HF-${nextN}`;
  }

  const nextEarTag = `ET-${maxTagNum + 1}`;

  res.json({
    nextId,
    nextNumber: nextId,
    nextEarTag,
    lastAnimal: lastAnimal ? {
      id: lastAnimal.id,
      name: lastAnimal.name,
      earTag: lastAnimal.earTag,
      breed: lastAnimal.breed
    } : null,
    totalAnimals: animalsDb.length
  });
});

app.get("/api/animals", (req: Request, res: Response) => {
  const { search, status, breed, sort } = req.query as { search?: string; status?: string; breed?: string; sort?: string };
  let results = [...animalsDb];
  if (search) {
    const q = search.toLowerCase();
    results = results.filter(a =>
      a.id.toLowerCase().includes(q) ||
      a.name.toLowerCase().includes(q) ||
      a.earTag.toLowerCase().includes(q) ||
      (a.rfid && a.rfid.toLowerCase().includes(q)) ||
      a.breed.toLowerCase().includes(q) ||
      (a.location && a.location.toLowerCase().includes(q))
    );
  }
  if (status && status !== "ALL" && status !== "All") {
    results = results.filter(a => a.status.toLowerCase() === status.toLowerCase());
  }
  if (breed && breed !== "ALL" && breed !== "All") {
    results = results.filter(a => a.breed.toLowerCase().includes(breed.toLowerCase()));
  }

  // Sorting
  if (sort === "name_asc") {
    results.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sort === "milk_desc") {
    results.sort((a, b) => (b.milk || 0) - (a.milk || 0));
  } else if (sort === "id_desc") {
    results.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' }));
  } else {
    // Default: Sort by animal number / ID ascending
    results.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
  }

  res.json(results);
});

app.get("/api/animals/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => 
    a.id.toLowerCase() === id.toLowerCase() || 
    String(a.dbId) === id || 
    a.earTag.toLowerCase() === id.toLowerCase()
  );
  if (!animal) return res.status(404).json({ error: "Animal not found" });
  res.json(animal);
});

app.post("/api/animals", (req: Request, res: Response) => {
  const body = req.body || {};
  let targetId = (body.id || "").trim();
  if (!targetId) {
    targetId = `HF-0${animalsDb.length + 100}`;
  }

  // Validate duplicate animal ID or Ear Tag
  const duplicateId = animalsDb.find(a => a.id.toLowerCase() === targetId.toLowerCase());
  if (duplicateId && !body.allowUpdate) {
    return res.status(400).json({ 
      error: `Animal ID '${targetId}' is already registered in the system. Please use a unique Animal ID or allow update.` 
    });
  }

  if (body.earTag) {
    const duplicateTag = animalsDb.find(a => 
      a.earTag.toLowerCase() === body.earTag.trim().toLowerCase() && 
      a.id.toLowerCase() !== targetId.toLowerCase()
    );
    if (duplicateTag && !body.allowUpdate) {
      return res.status(400).json({ 
        error: `Ear Tag '${body.earTag}' is already assigned to animal ${duplicateTag.id} (${duplicateTag.name}).` 
      });
    }
  }

  // Check if updating existing record
  const existingIdx = animalsDb.findIndex(a => a.id.toLowerCase() === targetId.toLowerCase());
  if (existingIdx !== -1) {
    animalsDb[existingIdx] = { ...animalsDb[existingIdx], ...body };
    return res.status(200).json(animalsDb[existingIdx]);
  }

  const newAnimal = {
    ...body,
    id: targetId,
    dbId: animalsDb.length + 1,
    earTag: body.earTag || `ET-${Math.floor(1000 + Math.random() * 9000)}`,
    rfid: body.rfid || `RF-${Date.now().toString().slice(-8)}`,
    name: body.name || "New Cattle",
    photo: body.photo || undefined,
    breed: body.breed || "HF (Holstein Friesian)",
    sex: body.sex || "Female",
    dob: body.dob || new Date().toISOString().split("T")[0],
    age: body.age || "2y",
    colorMarkings: body.colorMarkings || "Black & White",
    source: body.source || "Homebred",
    purchaseDate: body.purchaseDate || "",
    purchasePrice: body.purchasePrice ? Number(body.purchasePrice) : undefined,
    transportCost: body.transportCost ? Number(body.transportCost) : undefined,
    landedCost: body.landedCost ? Number(body.landedCost) : undefined,
    previousFarm: body.previousFarm || "",
    status: body.status || "Lactating",
    group: body.group || "High Milking Group",
    location: body.location || "Shed 1",
    dam: body.dam || "—",
    sire: body.sire || "—",
    lactation: body.lactation !== undefined && body.lactation !== null ? Number(body.lactation) : (body.status === "Lactating" ? 1 : null),
    dim: body.dim !== undefined && body.dim !== null ? Number(body.dim) : (body.status === "Lactating" ? 50 : null),
    milk: body.milk !== undefined && body.milk !== null ? Number(body.milk) : (body.status === "Lactating" ? 22.0 : null),
    weightKg: body.weightKg ? Number(body.weightKg) : 550,
    heightCm: body.heightCm ? Number(body.heightCm) : 142,
    remarks: body.remarks || "",
    farmId: activeFarmId
  };
  animalsDb.unshift(newAnimal);
  res.status(201).json(newAnimal);
});

app.put("/api/animals/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const targetId = (id && id !== "undefined") ? id : (req.body.id || "");
  const index = animalsDb.findIndex(
    a => a.id.toLowerCase() === targetId.toLowerCase() || String(a.dbId) === targetId || a.earTag.toLowerCase() === targetId.toLowerCase()
  );
  if (index === -1) {
    const created = {
      ...req.body,
      id: targetId || `HF-0${animalsDb.length + 100}`,
      dbId: animalsDb.length + 1,
      earTag: req.body.earTag || `ET-${Math.floor(1000 + Math.random() * 9000)}`,
      name: req.body.name || "Cattle",
      status: req.body.status || "Lactating",
      breed: req.body.breed || "HF (Holstein Friesian)",
    };
    animalsDb.unshift(created);
    return res.status(201).json(created);
  }
  animalsDb[index] = { ...animalsDb[index], ...req.body };
  res.json(animalsDb[index]);
});

// Photo upload endpoint
app.post("/api/animals/:id/image", (req: Request, res: Response) => {
  const id = req.params.id;
  const { photo } = req.body;
  if (!photo) {
    return res.status(400).json({ error: "Photo data URL is required." });
  }
  const animal = animalsDb.find(a => 
    a.id.toLowerCase() === id.toLowerCase() || 
    String(a.dbId) === id || 
    a.earTag.toLowerCase() === id.toLowerCase()
  );
  if (!animal) {
    return res.status(404).json({ error: "Animal not found" });
  }
  animal.photo = photo;
  res.json({ success: true, message: "Animal photo updated successfully", photo, animal });
});

// Photo delete endpoint
app.delete("/api/animals/:id/image", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => 
    a.id.toLowerCase() === id.toLowerCase() || 
    String(a.dbId) === id || 
    a.earTag.toLowerCase() === id.toLowerCase()
  );
  if (!animal) {
    return res.status(404).json({ error: "Animal not found" });
  }
  delete animal.photo;
  res.json({ success: true, message: "Animal photo removed successfully", animal });
});

// QR code data endpoint
app.get("/api/animals/:id/qr", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => 
    a.id.toLowerCase() === id.toLowerCase() || 
    String(a.dbId) === id || 
    a.earTag.toLowerCase() === id.toLowerCase()
  );
  if (!animal) return res.status(404).json({ error: "Animal not found" });

  const recordUrl = `/#animal/${encodeURIComponent(animal.id)}`;
  res.json({
    success: true,
    animalId: animal.id,
    earTag: animal.earTag,
    name: animal.name,
    breed: animal.breed,
    recordUrl,
    qrData: JSON.stringify({
      id: animal.id,
      tag: animal.earTag,
      name: animal.name,
      breed: animal.breed,
      status: animal.status,
      url: recordUrl
    })
  });
});

// Download / Export full passport data package
app.get("/api/animals/:id/download", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => 
    a.id.toLowerCase() === id.toLowerCase() || 
    String(a.dbId) === id || 
    a.earTag.toLowerCase() === id.toLowerCase()
  );
  if (!animal) return res.status(404).json({ error: "Animal not found" });

  const milk = milkRecordsDb.filter(m => m.animalId === animal.id || m.name.toLowerCase() === animal.name.toLowerCase());
  const breeding = breedingDb.filter(b => b.animalId === animal.id || (b.animal && b.animal.includes(animal.id)));
  const health = healthDb.filter(h => h.animalId === animal.id || (h.animal && h.animal.includes(animal.id)));

  res.json({
    success: true,
    animal,
    farm: farmSettings,
    milkRecords: milk,
    breedingRecords: breeding,
    healthRecords: health,
    generatedAt: new Date().toISOString()
  });
});

// Comprehensive Calculated Analytics & Profile Summary for an Animal
app.get("/api/animals/:id/analytics", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => 
    a.id.toLowerCase() === id.toLowerCase() || 
    String(a.dbId) === id || 
    a.earTag.toLowerCase() === id.toLowerCase()
  );
  if (!animal) return res.status(404).json({ error: "Animal not found" });

  // 1. Associated Records
  const animalMilkRecords = milkRecordsDb
    .filter(m => m.animalId === animal.id || (m.name && m.name.toLowerCase() === animal.name.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  const animalBreeding = breedingDb
    .filter(b => b.animalId === animal.id || (b.animal && (b.animal.includes(animal.id) || b.animal.includes(animal.name))))
    .sort((a, b) => (b.aiDate || b.heatDate).localeCompare(a.aiDate || a.heatDate));

  const animalCalvings = calvingDb
    .filter(c => c.damId === animal.id || (c.damName && c.damName.toLowerCase() === animal.name.toLowerCase()))
    .sort((a, b) => (b.actualDate || b.expectedDate).localeCompare(a.actualDate || a.expectedDate));

  const animalHealth = healthDb
    .filter(h => h.animalId === animal.id || (h.animal && (h.animal.includes(animal.id) || h.animal.includes(animal.name))))
    .sort((a, b) => b.date.localeCompare(a.date));

  const animalVaccinations = vaccinationsDb
    .filter(v => v.animalId === animal.id || v.targetGroup === "All Cattle")
    .sort((a, b) => b.date.localeCompare(a.date));

  const animalEvents = eventsDb
    .filter(e => e.animalId === animal.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  // 2. Reproduction & Life Stage Calculations
  const hasBreedingData = animalBreeding.length > 0 || animalCalvings.length > 0 || animal.lactation != null;
  const latestBreeding = animalBreeding[0];
  const latestCalving = animalCalvings[0];

  let reproductiveStage = "No reproductive data recorded";
  if (animal.status === "Dead") {
    reproductiveStage = "Deceased (Archived Record)";
  } else if (animal.status === "Sold") {
    reproductiveStage = "Sold / Discharged from Herd";
  } else if (animal.status === "Pregnant" || (latestBreeding && latestBreeding.result === "Positive")) {
    reproductiveStage = latestBreeding?.expectedCalving 
      ? `Confirmed Pregnant (Due: ${latestBreeding.expectedCalving})`
      : "Confirmed Pregnant (Gestation Active)";
  } else if (latestBreeding && latestBreeding.result === "Pending") {
    reproductiveStage = `Inseminated / AI (${latestBreeding.aiDate || latestBreeding.heatDate || "Recent"}) — PD Pending`;
  } else if (latestBreeding && latestBreeding.result === "Negative") {
    reproductiveStage = "Open / Insemination Repeated (Non-pregnant)";
  } else if (animal.status === "Lactating") {
    reproductiveStage = "Lactating & Milking (Active Production)";
  } else if (animal.status === "Dry") {
    reproductiveStage = "Dry Period (Resting / Pre-calving)";
  } else if (animal.status === "Heifer") {
    reproductiveStage = "Growing Heifer (Pre-breeding)";
  } else if (animal.status === "Calf") {
    reproductiveStage = "Growing Calf (Pre-weaning)";
  } else if (animal.status === "Bull") {
    reproductiveStage = "Breeding Sire / Stud Bull";
  } else if (!hasBreedingData) {
    reproductiveStage = "No reproductive data recorded";
  } else {
    reproductiveStage = "Active";
  }

  let lactationCycle = "No lactation record";
  if (animal.lactation !== null && animal.lactation !== undefined && Number(animal.lactation) > 0) {
    lactationCycle = `Lactation #${animal.lactation}`;
  } else if (animalCalvings.length > 0) {
    lactationCycle = `Lactation #${animalCalvings.length}`;
  } else if (animal.status === "Heifer" || animal.status === "Calf") {
    lactationCycle = "Heifer / Uncalved";
  }

  const daysInMilk = (animal.status === "Lactating" && animal.dim != null) 
    ? `${animal.dim} Days` 
    : "—";

  const reproduction = {
    currentState: animal.status,
    reproductiveStage,
    lactationCycle,
    daysInMilk,
    lastCalvingDate: latestCalving ? (latestCalving.actualDate || latestCalving.expectedDate) : null,
    lastAiDate: latestBreeding ? latestBreeding.aiDate : null,
    expectedCalving: (latestBreeding && latestBreeding.result === "Positive") ? latestBreeding.expectedCalving : null,
    hasData: hasBreedingData
  };

  // 3. Milk Production Calculations
  const recordCount = animalMilkRecords.length;
  let currentDailyYield = 0;
  let sevenDayAvg = 0;
  let peakYield = 0;
  let lifetimeTotal = 0;

  if (recordCount > 0) {
    currentDailyYield = Number(animalMilkRecords[0].totalLitres || 0);
    const recentUpTo7 = animalMilkRecords.slice(0, 7);
    const sum7 = recentUpTo7.reduce((acc, m) => acc + (m.totalLitres || 0), 0);
    sevenDayAvg = Number((sum7 / recentUpTo7.length).toFixed(1));
    peakYield = Number(Math.max(...animalMilkRecords.map(m => m.totalLitres || 0)).toFixed(1));
    lifetimeTotal = Number(animalMilkRecords.reduce((acc, m) => acc + (m.totalLitres || 0), 0).toFixed(1));
  } else if (animal.milk != null && animal.milk > 0) {
    currentDailyYield = Number(animal.milk);
    sevenDayAvg = Number(animal.milk);
    peakYield = Number((animal.milk * 1.1).toFixed(1));
    lifetimeTotal = Number((animal.milk * 150).toFixed(1));
  }

  const milkSummary = {
    currentDailyYield,
    sevenDayAvg,
    peakYield,
    lifetimeTotal,
    recordCount,
    hasData: recordCount > 0 || (animal.milk != null && animal.milk > 0)
  };

  // 4. Daily Economics & Profit Calculations
  const milkPricePerLitre = farmSettings.milkPricePerLitre || 150;
  const dailyYieldUsed = currentDailyYield > 0 ? currentDailyYield : sevenDayAvg;
  const dailyRevenue = Math.round(dailyYieldUsed * milkPricePerLitre);

  // Look up ration cost or fallback to standard physiological requirements
  const groupRation = rationPlansDb.find(r => r.group === animal.group || (animal.group && r.name.toLowerCase().includes(animal.group.toLowerCase())));
  const dailyFeedCost = groupRation 
    ? groupRation.totalCostPerCow 
    : (animal.status === "Lactating" ? 850 : animal.status === "Dry" ? 380 : animal.status === "Calf" ? 200 : 350);

  const dailyNetMargin = dailyRevenue - dailyFeedCost;

  const economics = {
    milkPricePerLitre,
    dailyYieldUsed,
    dailyRevenue,
    dailyFeedCost,
    dailyNetMargin,
    feedRationGroup: animal.group || "High Milking Group"
  };

  // 5. 7-Day Yield Trend
  // Construct 7 chronological slots: Day -6 to Today
  const trendSlots: Array<{ date: string; dayLabel: string; litres: number }> = [];
  const dayNames = ["Day -6", "Day -5", "Day -4", "Day -3", "Day -2", "Yesterday", "Today"];
  
  if (recordCount >= 7) {
    const recent7 = animalMilkRecords.slice(0, 7).reverse();
    recent7.forEach((rec, idx) => {
      trendSlots.push({
        date: rec.date,
        dayLabel: dayNames[idx] || `Day ${idx + 1}`,
        litres: Number(rec.totalLitres || 0)
      });
    });
  } else if (recordCount > 0) {
    // Fill from available records + pad
    const reversed = [...animalMilkRecords].reverse();
    for (let i = 0; i < 7; i++) {
      const recIndex = i - (7 - reversed.length);
      if (recIndex >= 0 && reversed[recIndex]) {
        trendSlots.push({
          date: reversed[recIndex].date,
          dayLabel: dayNames[i],
          litres: Number(reversed[recIndex].totalLitres || 0)
        });
      } else {
        trendSlots.push({
          date: `Day -${6 - i}`,
          dayLabel: dayNames[i],
          litres: Number((currentDailyYield * (0.95 + (i % 3) * 0.03)).toFixed(1))
        });
      }
    }
  } else {
    // If completely empty, show base or 0
    const fallbackYield = animal.milk || 0;
    for (let i = 0; i < 7; i++) {
      trendSlots.push({
        date: `Day -${6 - i}`,
        dayLabel: dayNames[i],
        litres: fallbackYield > 0 ? Number((fallbackYield * (0.96 + (i % 3) * 0.02)).toFixed(1)) : 0
      });
    }
  }

  // 6. Chronological Merged Timeline
  const timeline: Array<{ date: string; title: string; desc: string; type: "Milk" | "Breeding" | "Health" | "Calving" | "Note" | "Sale" | "Mortality" | "General" }> = [];

  // Notes
  animalEvents.forEach(e => {
    timeline.push({
      date: e.date,
      title: `${e.eventType}: ${e.title}`,
      desc: e.notes,
      type: "Note"
    });
  });

  // Milk
  animalMilkRecords.slice(0, 6).forEach(m => {
    timeline.push({
      date: m.date,
      title: `Milking Recorded (${m.totalLitres} L)`,
      desc: `Morning: ${m.morningLitres} L · Evening: ${m.eveningLitres} L · Fat: ${m.fatPercent}% · SNF: ${m.snfPercent}% · Quality: ${m.quality || "Standard"}`,
      type: "Milk"
    });
  });

  // Breeding
  animalBreeding.forEach(b => {
    timeline.push({
      date: b.aiDate || b.heatDate || "Recent",
      title: `Reproduction: ${b.result || "AI Insemination"}`,
      desc: `Semen Straw: ${b.semenBull} · Tech: ${b.technician} · Services: ${b.servicesCount || 1} · Calving Due: ${b.expectedCalving || "—"}`,
      type: "Breeding"
    });
  });

  // Calvings
  animalCalvings.forEach(c => {
    timeline.push({
      date: c.actualDate || c.expectedDate || "Recent",
      title: `Calving Event: Newborn Calf (${c.calfSex}, ${c.birthWeight} kg)`,
      desc: `Calf ID: ${c.calfId} · Delivery: ${c.difficulty} · Colostrum: ${c.colostrumLitres}L within ${c.colostrumFedHours}h`,
      type: "Calving"
    });
  });

  // Health
  animalHealth.forEach(h => {
    timeline.push({
      date: h.date,
      title: `Health: ${h.diagnosis} (${h.status})`,
      desc: `Medicine: ${h.medicine} (${h.dose}) · Vet: ${h.veterinarian} · Withdrawal Safe Date: ${h.withdrawalUntil || "None"}`,
      type: "Health"
    });
  });

  // Sale info if applicable
  if (animal.saleInfo) {
    timeline.push({
      date: animal.saleInfo.date,
      title: `Animal Sold to ${animal.saleInfo.buyer}`,
      desc: `Sale Price: Rs ${animal.saleInfo.salePrice.toLocaleString()} · Reason: ${animal.saleInfo.reason} · Net P&L: Rs ${animal.saleInfo.profitLoss.toLocaleString()}`,
      type: "Sale"
    });
  }

  // Mortality info if applicable
  if (animal.mortalityInfo) {
    timeline.push({
      date: animal.mortalityInfo.date,
      title: `Mortality: Deceased (${animal.mortalityInfo.cause})`,
      desc: `Age: ${animal.mortalityInfo.age} · History: ${animal.mortalityInfo.diseaseHistory} · Autopsy: ${animal.mortalityInfo.postMortemNotes || "Not performed"}`,
      type: "Mortality"
    });
  }

  // Sort timeline descending by date
  timeline.sort((a, b) => (b.date || "").localeCompare(a.date || ""));

  res.json({
    success: true,
    animalId: animal.id,
    reproduction,
    milkSummary,
    economics,
    sevenDayTrend: trendSlots,
    timeline
  });
});

// Specific sub-endpoints for Animal Profile metrics
app.get("/api/animals/:id/milk-summary", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => a.id.toLowerCase() === id.toLowerCase() || String(a.dbId) === id || a.earTag.toLowerCase() === id.toLowerCase());
  if (!animal) return res.status(404).json({ error: "Animal not found" });

  const animalMilkRecords = milkRecordsDb.filter(m => m.animalId === animal.id || (m.name && m.name.toLowerCase() === animal.name.toLowerCase()));
  const currentDailyYield = animalMilkRecords.length > 0 ? animalMilkRecords[0].totalLitres : (animal.milk || 0);
  const recent7 = animalMilkRecords.slice(0, 7);
  const sevenDayAvg = recent7.length > 0 ? Number((recent7.reduce((acc, m) => acc + (m.totalLitres || 0), 0) / recent7.length).toFixed(1)) : currentDailyYield;
  const peakYield = animalMilkRecords.length > 0 ? Math.max(...animalMilkRecords.map(m => m.totalLitres || 0)) : (animal.milk ? animal.milk * 1.1 : 0);
  const lifetimeTotal = animalMilkRecords.reduce((acc, m) => acc + (m.totalLitres || 0), 0);

  res.json({
    currentDailyYield,
    sevenDayAvg,
    peakYield,
    lifetimeTotal,
    recordCount: animalMilkRecords.length
  });
});

app.get("/api/animals/:id/economics", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => a.id.toLowerCase() === id.toLowerCase() || String(a.dbId) === id || a.earTag.toLowerCase() === id.toLowerCase());
  if (!animal) return res.status(404).json({ error: "Animal not found" });

  const milkPricePerLitre = farmSettings.milkPricePerLitre || 150;
  const dailyYield = animal.milk || 24.0;
  const dailyRevenue = dailyYield * milkPricePerLitre;
  const groupRation = rationPlansDb.find(r => r.group === animal.group);
  const dailyFeedCost = groupRation ? groupRation.totalCostPerCow : (animal.status === "Lactating" ? 850 : 380);

  res.json({
    milkPricePerLitre,
    dailyYield,
    dailyRevenue,
    dailyFeedCost,
    dailyNetMargin: dailyRevenue - dailyFeedCost
  });
});

app.get("/api/animals/:id/milk-trend", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => a.id.toLowerCase() === id.toLowerCase() || String(a.dbId) === id || a.earTag.toLowerCase() === id.toLowerCase());
  if (!animal) return res.status(404).json({ error: "Animal not found" });

  const animalMilkRecords = milkRecordsDb.filter(m => m.animalId === animal.id || (m.name && m.name.toLowerCase() === animal.name.toLowerCase()));
  const trend = animalMilkRecords.slice(0, 7).reverse().map((r, i) => ({
    dayLabel: ["Day -6", "Day -5", "Day -4", "Day -3", "Day -2", "Yesterday", "Today"][i] || `Day ${i+1}`,
    date: r.date,
    litres: r.totalLitres
  }));

  res.json(trend);
});

// Event & Custom Timeline Notes CRUD
app.get("/api/animals/:id/events", (req: Request, res: Response) => {
  const id = req.params.id;
  const events = eventsDb.filter(e => e.animalId.toLowerCase() === id.toLowerCase());
  res.json(events);
});

app.post(["/api/animals/:id/events", "/api/events"], (req: Request, res: Response) => {
  const id = req.params.id || req.body.animalId || "HF-027";
  const body = req.body || {};
  const animal = animalsDb.find(a => a.id.toLowerCase() === id.toLowerCase() || a.earTag.toLowerCase() === id.toLowerCase());

  const newEvent = {
    id: `EVT-${Date.now()}`,
    animalId: animal ? animal.id : id,
    animalName: animal ? animal.name : (body.animalName || "Cattle"),
    date: body.date || new Date().toISOString().split("T")[0],
    eventType: body.eventType || "General Note",
    title: body.title || `${body.eventType || "Event"} Logged`,
    notes: body.notes || body.desc || "",
    metric1: body.metric1,
    metric2: body.metric2
  };

  eventsDb.unshift(newEvent);
  res.status(201).json(newEvent);
});

app.delete("/api/animals/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => a.id.toLowerCase() === id.toLowerCase() || String(a.dbId) === id);
  if (!animal) {
    return res.status(404).json({ error: `Animal '${id}' was not found in records.` });
  }

  // Remove animal
  animalsDb = animalsDb.filter(a => a.id.toLowerCase() !== id.toLowerCase() && String(a.dbId) !== id);
  
  // Note: We preserve historical milk, breeding, and financial vouchers for audit trails,
  // or clean up dangling alert notices:
  milkAlertsDb = milkAlertsDb.filter(a => a.animalId.toLowerCase() !== id.toLowerCase());

  res.json({ success: true, message: `Animal ${animal.id} (${animal.name}) successfully removed from active herd records.` });
});

// Sale of animal
app.post("/api/animals/:id/sell", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => a.id === id);
  if (!animal) return res.status(404).json({ error: "Animal not found" });

  const { buyer, salePrice, reason, weight } = req.body;
  const price = Number(salePrice) || 0;
  const purchaseCost = animal.purchasePrice || 300000;
  const profitLoss = price - purchaseCost;

  animal.status = "Sold";
  animal.group = "Discharged";
  animal.saleInfo = {
    buyer: buyer || "Market Buyer",
    date: new Date().toISOString().split("T")[0],
    salePrice: price,
    reason: reason || "Commercial Sale",
    weight: Number(weight) || (animal.weightKg || 550),
    profitLoss
  };

  // Add revenue transaction
  transactionsDb.unshift({
    id: `TX-${Date.now()}`,
    type: "Income",
    category: "Animal Sales",
    amount: price,
    date: new Date().toISOString().split("T")[0],
    description: `Sale of animal ${animal.id} (${animal.name}) to ${buyer}`,
    entityName: buyer || "Buyer",
    paymentMethod: "Bank Transfer",
    farmName: "Main Punjab Unit",
    receiptRef: `SALE-${Date.now().toString().slice(-6)}`
  });

  res.json({ success: true, message: `Animal ${animal.id} marked as sold. Revenue logged.`, animal });
});

// Mortality record of animal
app.post("/api/animals/:id/mortality", (req: Request, res: Response) => {
  const id = req.params.id;
  const animal = animalsDb.find(a => a.id === id);
  if (!animal) return res.status(404).json({ error: "Animal not found" });

  const { cause, diseaseHistory, treatmentNotes, financialValue, postMortemNotes } = req.body;
  animal.status = "Dead";
  animal.group = "Deceased Herd";
  animal.mortalityInfo = {
    date: new Date().toISOString().split("T")[0],
    age: animal.age || "Adult",
    cause: cause || "Undetermined",
    diseaseHistory: diseaseHistory || "None on record",
    treatmentNotes: treatmentNotes || "",
    financialValue: Number(financialValue) || 300000,
    postMortemNotes: postMortemNotes || ""
  };

  res.json({ success: true, message: `Mortality recorded for ${animal.id}. Historical records preserved.`, animal });
});

// --- MILK MANAGEMENT ---
app.get("/api/milk-records", (req: Request, res: Response) => {
  if (!milkRecordsDb || milkRecordsDb.length === 0) {
    milkRecordsDb = generateInitialMilkRecords();
  }
  let result = [...milkRecordsDb];
  const { date, session, animalId } = req.query;

  if (date) {
    result = result.filter(r => r.date === String(date));
  }
  if (session && session !== "Both" && session !== "All") {
    if (session === "Morning") {
      result = result.filter(r => r.session === "Morning" || (r.morningLitres !== undefined && r.morningLitres > 0) || r.session === "Both");
    } else if (session === "Evening") {
      result = result.filter(r => r.session === "Evening" || (r.eveningLitres !== undefined && r.eveningLitres > 0) || r.session === "Both");
    } else if (session === "Third") {
      result = result.filter(r => r.session === "Third" || (r.thirdMilkingLitres !== undefined && r.thirdMilkingLitres > 0));
    } else {
      result = result.filter(r => r.session === String(session));
    }
  }
  if (animalId) {
    result = result.filter(r => r.animalId.toLowerCase() === String(animalId).toLowerCase());
  }

  res.json(result);
});

app.post("/api/milk-records", (req: Request, res: Response) => {
  if (!milkRecordsDb) milkRecordsDb = generateInitialMilkRecords();

  const body = req.body || {};
  const morning = Number(body.morningLitres ?? body.morning ?? 0);
  const evening = Number(body.eveningLitres ?? body.evening ?? 0);
  const third = Number(body.thirdMilkingLitres ?? body.third ?? 0);
  const total = Number(body.totalLitres ?? (morning + evening + third));

  const rawId = body.animalId || body.animalCode || body.id || "";
  const matchedAnimal = animalsDb.find(a => 
    (rawId && (a.id.toLowerCase() === String(rawId).toLowerCase() || a.earTag?.toLowerCase() === String(rawId).toLowerCase())) ||
    (body.name && a.name.toLowerCase() === String(body.name).toLowerCase())
  );

  const targetAnimalId = rawId || (matchedAnimal ? matchedAnimal.id : (animalsDb[0]?.id || "HF-027"));
  const targetName = body.name || (matchedAnimal ? matchedAnimal.name : (animalsDb[0]?.name || "Bella"));
  const recDate = body.date || getLocalDateString(0);
  const recSession = body.session || "Both";

  // Check if an existing record matches ID or (animalId + date)
  const existingIndex = milkRecordsDb.findIndex(r => 
    (body.id && r.id === body.id) ||
    (r.animalId.toLowerCase() === String(targetAnimalId).toLowerCase() && r.date === recDate)
  );

  let recordToReturn: any;

  if (existingIndex >= 0 && (body.overwrite || body.updateIfExists || body.id)) {
    // Update existing record
    milkRecordsDb[existingIndex] = {
      ...milkRecordsDb[existingIndex],
      name: targetName,
      session: recSession,
      morningLitres: morning,
      eveningLitres: evening,
      thirdMilkingLitres: third,
      totalLitres: total,
      fatPercent: body.fatPercent !== undefined ? Number(body.fatPercent) : milkRecordsDb[existingIndex].fatPercent,
      proteinPercent: body.proteinPercent !== undefined ? Number(body.proteinPercent) : milkRecordsDb[existingIndex].proteinPercent,
      snfPercent: body.snfPercent !== undefined ? Number(body.snfPercent) : milkRecordsDb[existingIndex].snfPercent,
      scc: body.scc !== undefined ? Number(body.scc) : milkRecordsDb[existingIndex].scc,
      quality: body.quality || milkRecordsDb[existingIndex].quality || "Standard",
      rejectedLitres: Number(body.rejectedLitres ?? milkRecordsDb[existingIndex].rejectedLitres ?? 0),
      rejectionReason: body.rejectionReason ?? milkRecordsDb[existingIndex].rejectionReason ?? ""
    };
    recordToReturn = milkRecordsDb[existingIndex];
  } else {
    const newRecord = {
      id: body.id && String(body.id).startsWith("M-") ? body.id : `M-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      animalId: targetAnimalId,
      name: targetName,
      date: recDate,
      session: recSession,
      morningLitres: morning,
      eveningLitres: evening,
      thirdMilkingLitres: third,
      totalLitres: total,
      fatPercent: body.fatPercent !== undefined ? Number(body.fatPercent) : 3.8,
      proteinPercent: body.proteinPercent !== undefined ? Number(body.proteinPercent) : 3.2,
      snfPercent: body.snfPercent !== undefined ? Number(body.snfPercent) : 8.8,
      scc: body.scc !== undefined ? Number(body.scc) : 160,
      quality: body.quality || "Standard",
      rejectedLitres: Number(body.rejectedLitres ?? 0),
      rejectionReason: body.rejectionReason || ""
    };
    milkRecordsDb.unshift(newRecord);
    recordToReturn = newRecord;
  }

  // Update current animal daily yield
  const animal = matchedAnimal || animalsDb.find(a => a.id.toLowerCase() === String(targetAnimalId).toLowerCase());
  if (animal && total > 0) {
    if (animal.milk && total < animal.milk * 0.85) {
      const dropPct = Number((((animal.milk - total) / animal.milk) * 100).toFixed(1));
      milkAlertsDb.unshift({
        id: `ALT-${Date.now()}`,
        animalId: animal.id,
        animalName: animal.name,
        date: recDate,
        recentAvg: animal.milk,
        todayYield: total,
        dropPercentage: dropPct,
        status: "Active",
        disclaimer: "Attention notice: Individual yield drop flagged for manager inspection. Not an automated medical diagnosis."
      });
    }
    animal.milk = total;
  }

  res.status(201).json(recordToReturn);
});

app.put("/api/milk-records/:id", (req: Request, res: Response) => {
  if (!milkRecordsDb) milkRecordsDb = generateInitialMilkRecords();
  const index = milkRecordsDb.findIndex(r => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Milk record not found" });
  }

  const existing = milkRecordsDb[index];
  const body = req.body || {};
  const morning = Number(body.morningLitres ?? existing.morningLitres);
  const evening = Number(body.eveningLitres ?? existing.eveningLitres);
  const third = Number(body.thirdMilkingLitres ?? existing.thirdMilkingLitres ?? 0);
  const total = Number(body.totalLitres ?? (morning + evening + third));

  milkRecordsDb[index] = {
    ...existing,
    date: body.date || existing.date,
    session: body.session || existing.session,
    morningLitres: morning,
    eveningLitres: evening,
    thirdMilkingLitres: third,
    totalLitres: total,
    fatPercent: body.fatPercent !== undefined ? Number(body.fatPercent) : existing.fatPercent,
    proteinPercent: body.proteinPercent !== undefined ? Number(body.proteinPercent) : existing.proteinPercent,
    snfPercent: body.snfPercent !== undefined ? Number(body.snfPercent) : existing.snfPercent,
    scc: body.scc !== undefined ? Number(body.scc) : existing.scc,
    quality: body.quality || existing.quality,
    rejectedLitres: body.rejectedLitres !== undefined ? Number(body.rejectedLitres) : existing.rejectedLitres,
    rejectionReason: body.rejectionReason !== undefined ? body.rejectionReason : existing.rejectionReason,
  };

  res.json(milkRecordsDb[index]);
});

app.delete("/api/milk-records/:id", (req: Request, res: Response) => {
  if (!milkRecordsDb) milkRecordsDb = generateInitialMilkRecords();
  const beforeLen = milkRecordsDb.length;
  milkRecordsDb = milkRecordsDb.filter(r => r.id !== req.params.id);
  res.json({ success: milkRecordsDb.length < beforeLen, message: "Milk record removed." });
});

app.post("/api/milk-records/bulk", (req: Request, res: Response) => {
  if (!milkRecordsDb) milkRecordsDb = generateInitialMilkRecords();
  const records = req.body?.records || req.body || [];
  if (!Array.isArray(records)) {
    return res.status(400).json({ error: "Invalid array of records" });
  }

  const updated: any[] = [];
  records.forEach((rec: any) => {
    const morning = Number(rec.morningLitres ?? rec.morning ?? 0);
    const evening = Number(rec.eveningLitres ?? rec.evening ?? 0);
    const third = Number(rec.thirdMilkingLitres ?? rec.third ?? 0);
    const total = Number(rec.totalLitres ?? (morning + evening + third));
    const targetId = rec.animalId;
    const targetName = rec.name;
    const targetDate = rec.date;
    const targetSession = rec.session || "Both";

    const existingIdx = milkRecordsDb.findIndex(r => 
      (rec.id && r.id === rec.id) ||
      (r.animalId.toLowerCase() === String(targetId).toLowerCase() && r.date === targetDate)
    );

    if (existingIdx >= 0) {
      milkRecordsDb[existingIdx] = {
        ...milkRecordsDb[existingIdx],
        name: targetName || milkRecordsDb[existingIdx].name,
        session: targetSession,
        morningLitres: morning,
        eveningLitres: evening,
        thirdMilkingLitres: third,
        totalLitres: total,
        fatPercent: rec.fatPercent !== undefined ? Number(rec.fatPercent) : milkRecordsDb[existingIdx].fatPercent,
        snfPercent: rec.snfPercent !== undefined ? Number(rec.snfPercent) : milkRecordsDb[existingIdx].snfPercent,
        quality: rec.quality || milkRecordsDb[existingIdx].quality,
      };
      updated.push(milkRecordsDb[existingIdx]);
    } else if (total > 0 || morning > 0 || evening > 0 || third > 0) {
      const newRec = {
        id: `M-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        animalId: targetId,
        name: targetName,
        date: targetDate,
        session: targetSession,
        morningLitres: morning,
        eveningLitres: evening,
        thirdMilkingLitres: third,
        totalLitres: total,
        fatPercent: rec.fatPercent !== undefined ? Number(rec.fatPercent) : 3.8,
        snfPercent: rec.snfPercent !== undefined ? Number(rec.snfPercent) : 8.8,
        quality: rec.quality || "Standard",
      };
      milkRecordsDb.unshift(newRec);
      updated.push(newRec);
    }
  });

  res.json({ success: true, count: updated.length, records: updated });
});

app.get("/api/milk-alerts", (req: Request, res: Response) => {
  res.json(milkAlertsDb);
});

app.post("/api/milk-alerts/:id/acknowledge", (req: Request, res: Response) => {
  const alert = milkAlertsDb.find(a => a.id === req.params.id);
  if (alert) alert.status = "Acknowledged";
  res.json({ success: true, alert });
});

// --- BREEDING & CALVING ---
// Helper to enrich breeding records with live animal data from animalsDb
function enrichBreedingRecord(b: any) {
  const animal = animalsDb.find(a => a.id.toLowerCase() === (b.animalId || "").toLowerCase());
  return {
    ...b,
    animal: animal ? `${animal.id} (${animal.name})` : b.animal || b.animalId,
    animalName: animal ? animal.name : undefined,
    animalBreed: animal ? animal.breed : undefined,
    animalEarTag: animal ? animal.earTag : undefined,
    animalStatus: animal ? animal.status : undefined,
  };
}

app.get("/api/breeding", (req: Request, res: Response) => {
  let list = breedingDb.map(enrichBreedingRecord);

  const animalId = req.query.animalId as string;
  const result = req.query.result as string;
  const search = req.query.search as string;
  const from = req.query.from as string;
  const to = req.query.to as string;

  if (animalId) {
    list = list.filter(b => (b.animalId || "").toLowerCase() === animalId.toLowerCase());
  }
  if (result && result !== "All" && result !== "ALL") {
    list = list.filter(b => b.result.toLowerCase() === result.toLowerCase());
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(b =>
      b.animal.toLowerCase().includes(q) ||
      (b.animalId || "").toLowerCase().includes(q) ||
      (b.semenBull || "").toLowerCase().includes(q) ||
      (b.technician || "").toLowerCase().includes(q) ||
      (b.notes || "").toLowerCase().includes(q)
    );
  }
  if (from) {
    list = list.filter(b => (b.heatDate >= from || (b.aiDate && b.aiDate >= from)));
  }
  if (to) {
    list = list.filter(b => (b.heatDate <= to || (b.aiDate && b.aiDate <= to)));
  }

  res.json(list);
});

app.get("/api/breeding/timeline", (req: Request, res: Response) => {
  const animalId = req.query.animalId as string;
  let events: any[] = [];

  breedingDb.forEach(b => {
    if (animalId && (b.animalId || "").toLowerCase() !== animalId.toLowerCase()) return;
    const enriched = enrichBreedingRecord(b);

    // Heat Observed event
    if (b.heatDate) {
      events.push({
        id: `timeline-heat-${b.id}`,
        breedingId: b.id,
        animalId: b.animalId,
        animalName: enriched.animal,
        date: b.heatDate,
        type: "Heat Observed",
        stage: "Day 0 (Standing Heat)",
        title: `Standing Heat Observed for ${enriched.animal}`,
        description: b.notes || "Natural estrus signs detected. Ready for artificial insemination.",
        technician: b.technician || "Herdsman",
        status: "Completed",
        result: b.result
      });
    }

    // AI Performed event
    if (b.aiDate) {
      events.push({
        id: `timeline-ai-${b.id}`,
        breedingId: b.id,
        animalId: b.animalId,
        animalName: enriched.animal,
        date: b.aiDate,
        type: "AI Performed",
        stage: "12h Post Estrus",
        title: `Artificial Insemination Performed (Service #${b.servicesCount || 1})`,
        description: `Straw / Sire: ${b.semenBull || "Standard Straw"} · Inseminator: ${b.technician || "Certified AI Tech"}`,
        technician: b.technician || "AI Tech",
        status: "Completed",
        result: b.result,
        semenBull: b.semenBull
      });
    }

    // Pregnancy Diagnosis event
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
        animalName: enriched.animal,
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
        result: b.result
      });
    }

    // Expected Calving event
    if (b.expectedCalving && b.result !== "Negative") {
      events.push({
        id: `timeline-calving-${b.id}`,
        breedingId: b.id,
        animalId: b.animalId,
        animalName: enriched.animal,
        date: b.expectedCalving,
        type: "Expected Calving",
        stage: "~280 Days Gestation",
        title: `Expected Calving Window for ${enriched.animal}`,
        description: `Projected delivery date based on 280-day bovine gestation cycle from AI date (${b.aiDate}).`,
        technician: "Maternity Team",
        status: b.actualCalving ? "Delivered" : "Upcoming",
        result: b.result
      });
    }
  });

  // Sort chronologically (most recent first or upcoming)
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  res.json(events);
});

app.get("/api/breeding/animal/:animalId", (req: Request, res: Response) => {
  const targetId = req.params.animalId.toLowerCase();
  const animalEvents = breedingDb
    .filter(b => (b.animalId || "").toLowerCase() === targetId)
    .map(enrichBreedingRecord);
  const animalCalvings = calvingDb.filter(c => (c.damId || "").toLowerCase() === targetId);

  res.json({
    animalId: req.params.animalId,
    breedingEvents: animalEvents,
    calvingRecords: animalCalvings,
    totalServices: animalEvents.length,
    activePregnancy: animalEvents.find(b => b.result === "Positive") || null
  });
});

app.get("/api/breeding/:id", (req: Request, res: Response) => {
  const event = breedingDb.find(b => b.id === req.params.id);
  if (!event) {
    return res.status(404).json({ error: "Breeding record not found" });
  }
  res.json(enrichBreedingRecord(event));
});

app.post("/api/breeding", (req: Request, res: Response) => {
  const body = req.body;
  const targetAnimalId = body.animalId || (body.animal ? body.animal.split(" ")[0].trim() : "HF-027");
  const targetAnimal = animalsDb.find(a => a.id.toLowerCase() === targetAnimalId.toLowerCase());

  // Calculate expected calving if AI date is provided (+280 days)
  let calcExpectedCalving = body.expectedCalving || "";
  if (body.aiDate && !calcExpectedCalving) {
    const d = new Date(body.aiDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + 280);
      calcExpectedCalving = d.toISOString().split("T")[0];
    }
  }

  // Calculate default PD date if AI date provided (+35 days)
  let calcPdDate = body.pdDate || "";
  if (body.aiDate && !calcPdDate && body.result === "Pending") {
    const d = new Date(body.aiDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + 35);
      calcPdDate = d.toISOString().split("T")[0];
    }
  }

  const newEvent = {
    id: `B-${Date.now()}`,
    animal: targetAnimal ? `${targetAnimal.id} (${targetAnimal.name})` : (body.animal || targetAnimalId),
    animalId: targetAnimal ? targetAnimal.id : targetAnimalId,
    heatDate: body.heatDate || new Date().toISOString().split("T")[0],
    aiDate: body.aiDate || "",
    semenBull: body.semenBull || "AltaWheel USA Straw #894",
    technician: body.technician || "Ali Hassan (Certified AI Tech)",
    pdDate: calcPdDate,
    result: body.result || "Pending",
    expectedCalving: calcExpectedCalving,
    actualCalving: body.actualCalving || "",
    servicesCount: Number(body.servicesCount) || 1,
    notes: body.notes || ""
  };

  // Validation: AI Date cannot be earlier than Heat Date if both are set
  if (newEvent.heatDate && newEvent.aiDate && newEvent.aiDate < newEvent.heatDate) {
    return res.status(400).json({ error: "AI Date cannot be earlier than Heat Observed Date." });
  }

  breedingDb.unshift(newEvent);

  // If PD is positive, update animal status in animalsDb
  if (newEvent.result === "Positive" && targetAnimal) {
    if (targetAnimal.status !== "Lactating") {
      targetAnimal.status = "Pregnant";
    }
  }

  res.status(201).json(enrichBreedingRecord(newEvent));
});

app.put("/api/breeding/:id", (req: Request, res: Response) => {
  const index = breedingDb.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Breeding record not found" });
  }

  const body = req.body;
  const existing = breedingDb[index];
  const targetAnimalId = body.animalId || existing.animalId;
  const targetAnimal = animalsDb.find(a => a.id.toLowerCase() === targetAnimalId.toLowerCase());

  let calcExpectedCalving = body.expectedCalving !== undefined ? body.expectedCalving : existing.expectedCalving;
  const aiDate = body.aiDate !== undefined ? body.aiDate : existing.aiDate;
  if (aiDate && !calcExpectedCalving) {
    const d = new Date(aiDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + 280);
      calcExpectedCalving = d.toISOString().split("T")[0];
    }
  }

  const updated = {
    ...existing,
    animal: targetAnimal ? `${targetAnimal.id} (${targetAnimal.name})` : (body.animal || existing.animal),
    animalId: targetAnimal ? targetAnimal.id : targetAnimalId,
    heatDate: body.heatDate !== undefined ? body.heatDate : existing.heatDate,
    aiDate: body.aiDate !== undefined ? body.aiDate : existing.aiDate,
    semenBull: body.semenBull !== undefined ? body.semenBull : existing.semenBull,
    technician: body.technician !== undefined ? body.technician : existing.technician,
    pdDate: body.pdDate !== undefined ? body.pdDate : existing.pdDate,
    result: body.result !== undefined ? body.result : existing.result,
    expectedCalving: calcExpectedCalving,
    actualCalving: body.actualCalving !== undefined ? body.actualCalving : existing.actualCalving,
    servicesCount: body.servicesCount !== undefined ? Number(body.servicesCount) : existing.servicesCount,
    notes: body.notes !== undefined ? body.notes : existing.notes,
  };

  // Validation
  if (updated.heatDate && updated.aiDate && updated.aiDate < updated.heatDate) {
    return res.status(400).json({ error: "AI Date cannot be earlier than Heat Observed Date." });
  }

  breedingDb[index] = updated;

  // Update animal status if changed
  if (updated.result === "Positive" && targetAnimal) {
    if (targetAnimal.status !== "Lactating") {
      targetAnimal.status = "Pregnant";
    }
  }

  res.json(enrichBreedingRecord(updated));
});

// Dedicated Lifecycle Record Endpoints
app.post("/api/breeding/record-heat", (req: Request, res: Response) => {
  const body = req.body;
  const targetAnimalId = body.animalId || "HF-027";
  const targetAnimal = animalsDb.find(a => a.id.toLowerCase() === targetAnimalId.toLowerCase());
  const heatDate = body.heatDate || new Date().toISOString().split("T")[0];

  const newEvent = {
    id: `B-${Date.now()}`,
    animal: targetAnimal ? `${targetAnimal.id} (${targetAnimal.name})` : targetAnimalId,
    animalId: targetAnimal ? targetAnimal.id : targetAnimalId,
    heatDate,
    heatSigns: body.heatSigns || "Standing Heat",
    heatMethod: body.heatMethod || "Visual Observation",
    aiDate: "",
    semenBull: "",
    technician: body.technician || "Herdsman Team",
    pdDate: "",
    result: "Pending" as const,
    expectedCalving: "",
    actualCalving: "",
    servicesCount: Number(body.servicesCount) || 1,
    notes: body.notes || "Standing heat observed and recorded."
  };

  breedingDb.unshift(newEvent);
  res.status(201).json(enrichBreedingRecord(newEvent));
});

app.post("/api/breeding/record-ai", (req: Request, res: Response) => {
  const body = req.body;
  const targetAnimalId = body.animalId || "HF-027";
  const targetAnimal = animalsDb.find(a => a.id.toLowerCase() === targetAnimalId.toLowerCase());
  const aiDate = body.aiDate || new Date().toISOString().split("T")[0];

  // Calculate expected calving (+280 days)
  let calcExpectedCalving = "";
  const dCalv = new Date(aiDate);
  if (!isNaN(dCalv.getTime())) {
    dCalv.setDate(dCalv.getDate() + (farmSettings.gestationPeriodDays || 280));
    calcExpectedCalving = dCalv.toISOString().split("T")[0];
  }

  // Calculate default PD date (+35 days)
  let calcPdDate = "";
  const dPd = new Date(aiDate);
  if (!isNaN(dPd.getTime())) {
    dPd.setDate(dPd.getDate() + (farmSettings.pdCheckDays || 35));
    calcPdDate = dPd.toISOString().split("T")[0];
  }

  // Check if existing pending breeding record exists for this animal
  let event = breedingDb.find(b => b.animalId.toLowerCase() === targetAnimalId.toLowerCase() && !b.aiDate);
  if (event) {
    event.aiDate = aiDate;
    event.semenBull = body.semenBull || "AltaWheel USA Straw #894";
    event.technician = body.technician || "Ali Hassan (Certified AI Tech)";
    event.servicesCount = Number(body.servicesCount) || event.servicesCount || 1;
    event.expectedCalving = calcExpectedCalving;
    event.pdDate = calcPdDate;
    if (body.notes) event.notes = (event.notes ? event.notes + " | " : "") + body.notes;
  } else {
    event = {
      id: `B-${Date.now()}`,
      animal: targetAnimal ? `${targetAnimal.id} (${targetAnimal.name})` : targetAnimalId,
      animalId: targetAnimal ? targetAnimal.id : targetAnimalId,
      heatDate: body.heatDate || aiDate,
      aiDate,
      semenBull: body.semenBull || "AltaWheel USA Straw #894",
      technician: body.technician || "Ali Hassan (Certified AI Tech)",
      pdDate: calcPdDate,
      result: "Pending",
      expectedCalving: calcExpectedCalving,
      actualCalving: "",
      servicesCount: Number(body.servicesCount) || 1,
      notes: body.notes || "Insemination performed."
    };
    breedingDb.unshift(event);
  }

  res.status(201).json(enrichBreedingRecord(event));
});

app.post("/api/breeding/record-pd", (req: Request, res: Response) => {
  const body = req.body;
  const targetAnimalId = body.animalId || "HF-027";
  const targetAnimal = animalsDb.find(a => a.id.toLowerCase() === targetAnimalId.toLowerCase());
  const pdDate = body.pdDate || new Date().toISOString().split("T")[0];
  const result = body.result || "Positive";

  // Find latest active breeding record for animal
  let event = breedingDb.find(b => b.animalId.toLowerCase() === targetAnimalId.toLowerCase());
  if (event) {
    event.pdDate = pdDate;
    event.pdMethod = body.pdMethod || "Transrectal Ultrasound";
    event.result = result;
    if (body.veterinarian) event.technician = body.veterinarian;
    if (body.notes) event.notes = (event.notes ? event.notes + " | " : "") + body.notes;
  } else {
    event = {
      id: `B-${Date.now()}`,
      animal: targetAnimal ? `${targetAnimal.id} (${targetAnimal.name})` : targetAnimalId,
      animalId: targetAnimal ? targetAnimal.id : targetAnimalId,
      heatDate: pdDate,
      aiDate: pdDate,
      semenBull: "Recorded at PD",
      technician: body.veterinarian || "Dr. Imran",
      pdDate,
      pdMethod: body.pdMethod || "Transrectal Ultrasound",
      result,
      expectedCalving: "",
      actualCalving: "",
      servicesCount: 1,
      notes: body.notes || `Pregnancy Diagnosis: ${result}`
    };
    breedingDb.unshift(event);
  }

  // If positive, update animal status
  if (result === "Positive" && targetAnimal) {
    if (targetAnimal.status !== "Lactating") {
      targetAnimal.status = "Pregnant";
    }
  }

  res.status(201).json(enrichBreedingRecord(event));
});

app.get("/api/breeding/settings", (req: Request, res: Response) => {
  res.json({
    gestationPeriodDays: farmSettings.gestationPeriodDays || 280,
    pdCheckDays: farmSettings.pdCheckDays || 35,
    heatToAiHours: farmSettings.heatToAiHours || 12
  });
});

app.put("/api/breeding/settings", (req: Request, res: Response) => {
  const body = req.body;
  if (body.gestationPeriodDays !== undefined) farmSettings.gestationPeriodDays = Number(body.gestationPeriodDays);
  if (body.pdCheckDays !== undefined) farmSettings.pdCheckDays = Number(body.pdCheckDays);
  if (body.heatToAiHours !== undefined) farmSettings.heatToAiHours = Number(body.heatToAiHours);
  res.json({
    success: true,
    gestationPeriodDays: farmSettings.gestationPeriodDays,
    pdCheckDays: farmSettings.pdCheckDays,
    heatToAiHours: farmSettings.heatToAiHours
  });
});

app.delete("/api/breeding/:id", (req: Request, res: Response) => {
  const index = breedingDb.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Breeding record not found" });
  }
  const removed = breedingDb.splice(index, 1)[0];
  res.json({ success: true, message: "Breeding record deleted", record: removed });
});

app.get("/api/calving", (req: Request, res: Response) => {
  res.json(calvingDb);
});

app.post("/api/calving", (req: Request, res: Response) => {
  const body = req.body;
  const newCalving = {
    id: `CALV-${Date.now()}`,
    damId: body.damId || "HF-027",
    damName: body.damName || "Bella",
    sireId: body.sireId || "Bull-04",
    expectedDate: body.expectedDate || new Date().toISOString().split("T")[0],
    actualDate: body.actualDate || new Date().toISOString().split("T")[0],
    difficulty: body.difficulty || "Normal",
    calfCount: Number(body.calfCount) || 1,
    calfSex: body.calfSex || "Female",
    birthWeight: Number(body.birthWeight) || 38.0,
    calfId: body.calfId || `HF-0${animalsDb.length + 101}`,
    colostrumFedHours: Number(body.colostrumFedHours) || 2,
    colostrumLitres: Number(body.colostrumLitres) || 4,
    complications: body.complications || "None",
    registeredInHerd: !!body.registerInHerd
  };
  calvingDb.unshift(newCalving);

  // Sync actual calving with dam's breeding record while preserving expectedCalving
  const damBreeding = breedingDb.find(b => b.animalId.toLowerCase() === newCalving.damId.toLowerCase());
  if (damBreeding) {
    damBreeding.actualCalving = newCalving.actualDate;
  }

  // If registered in herd, automatically create animal record
  if (body.registerInHerd) {
    const calfAnimal = {
      id: newCalving.calfId,
      dbId: animalsDb.length + 1,
      earTag: `ET-${Math.floor(1000 + Math.random() * 9000)}`,
      rfid: `RF-${Date.now().toString().slice(-8)}`,
      name: `Calf of ${newCalving.damName}`,
      breed: "HF (Holstein Friesian)",
      sex: (newCalving.calfSex === "Male" ? "Male" : "Female") as "Male" | "Female",
      dob: newCalving.actualDate,
      age: "0d",
      colorMarkings: "Black & White",
      source: "Homebred" as const,
      status: "Calf" as const,
      group: "Calf Pen",
      location: "Calf Barn - Hutch Village",
      dam: newCalving.damId,
      sire: newCalving.sireId,
      lactation: null,
      dim: null,
      milk: null,
      weightKg: newCalving.birthWeight,
      heightCm: 76,
      remarks: `Born on farm from Dam ${newCalving.damId}. Colostrum fed ${newCalving.colostrumLitres}L at ${newCalving.colostrumFedHours}h.`,
      farmId: activeFarmId
    };
    animalsDb.unshift(calfAnimal);

    // Also add initial calf growth baseline
    calfGrowthDb.unshift({
      id: `CG-${Date.now()}`,
      calfId: calfAnimal.id,
      calfName: calfAnimal.name,
      date: newCalving.actualDate,
      ageMonths: 0,
      weightKg: newCalving.birthWeight,
      heightCm: 76,
      girthCm: 78,
      adgGrams: 0,
      feedType: "Colostrum",
      dailyMilkAllowanceL: 4.0,
      weaningStatus: "Pre-weaning",
      notes: "Birth entry from calving management."
    });
  }

  // Update mother lactation & status
  const mother = animalsDb.find(a => a.id === newCalving.damId);
  if (mother) {
    mother.status = "Lactating";
    mother.lactation = (mother.lactation || 0) + 1;
    mother.dim = 1;
  }

  res.status(201).json(newCalving);
});

// --- CALF & HEIFER MANAGEMENT ---
app.get("/api/calves/growth", (req: Request, res: Response) => {
  res.json(calfGrowthDb);
});

app.post("/api/calves/growth", (req: Request, res: Response) => {
  const body = req.body;
  const newGrowth = {
    id: `CG-${Date.now()}`,
    calfId: body.calfId || "HF-072",
    calfName: body.calfName || "Coco",
    date: body.date || new Date().toISOString().split("T")[0],
    ageMonths: Number(body.ageMonths) || 1,
    weightKg: Number(body.weightKg) || 60,
    heightCm: Number(body.heightCm) || 85,
    girthCm: Number(body.girthCm) || 90,
    adgGrams: Number(body.adgGrams) || 700,
    feedType: body.feedType || "Calf Starter",
    dailyMilkAllowanceL: Number(body.dailyMilkAllowanceL) || 2.0,
    weaningStatus: body.weaningStatus || "Pre-weaning",
    notes: body.notes || ""
  };
  calfGrowthDb.unshift(newGrowth);

  // Update animal's current weight
  const calf = animalsDb.find(a => a.id === body.calfId);
  if (calf) {
    calf.weightKg = newGrowth.weightKg;
    calf.heightCm = newGrowth.heightCm;
  }

  res.status(201).json(newGrowth);
});

// --- HEALTH, DISEASES & MEDICATIONS ---
app.get("/api/diseases", (req: Request, res: Response) => {
  res.json(diseasesDb);
});

app.post("/api/diseases", (req: Request, res: Response) => {
  const body = req.body;
  const newDisease = {
    id: `DIS-${Date.now()}`,
    name: body.name || "Custom Disease",
    category: body.category || "Infectious",
    commonSymptoms: body.commonSymptoms || "",
    recommendedTreatments: body.recommendedTreatments || "",
    isCustom: true
  };
  diseasesDb.unshift(newDisease);
  res.status(201).json(newDisease);
});

app.put("/api/diseases/:id", (req: Request, res: Response) => {
  const idx = diseasesDb.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Disease not found" });
  diseasesDb[idx] = { ...diseasesDb[idx], ...req.body };
  res.json(diseasesDb[idx]);
});

app.delete("/api/diseases/:id", (req: Request, res: Response) => {
  diseasesDb = diseasesDb.filter(d => d.id !== req.params.id);
  res.json({ success: true });
});

app.get("/api/medicines", (req: Request, res: Response) => {
  res.json(medicinesDb);
});

app.post("/api/medicines", (req: Request, res: Response) => {
  const body = req.body;
  const newMed = {
    id: `M-${Date.now()}`,
    name: body.name || "Custom Medicine",
    manufacturer: body.manufacturer || "Vet Pharma",
    batch: body.batch || `B-${Date.now().toString().slice(-4)}`,
    quantity: Number(body.quantity) || 10,
    unit: body.unit || "vials",
    unitPrice: Number(body.unitPrice) || 500,
    expiry: body.expiry || "2025-12-31",
    supplier: body.supplier || "Vet Supply Co.",
    withdrawalDays: Number(body.withdrawalDays) || 0,
    category: body.category || "Antibiotic"
  };
  medicinesDb.unshift(newMed);
  res.status(201).json(newMed);
});

app.put("/api/medicines/:id", (req: Request, res: Response) => {
  const idx = medicinesDb.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Medicine not found" });
  medicinesDb[idx] = { ...medicinesDb[idx], ...req.body };
  res.json(medicinesDb[idx]);
});

app.delete("/api/medicines/:id", (req: Request, res: Response) => {
  medicinesDb = medicinesDb.filter(m => m.id !== req.params.id);
  res.json({ success: true });
});

app.get("/api/health-records", (req: Request, res: Response) => {
  const { animalId, status, search, from, to } = req.query;
  let records = [...healthDb];

  if (animalId) {
    records = records.filter(h => (h.animalId || "").toLowerCase() === String(animalId).toLowerCase());
  }
  if (status && status !== "All") {
    records = records.filter(h => h.status.toLowerCase() === String(status).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    records = records.filter(h =>
      h.animal.toLowerCase().includes(q) ||
      h.diagnosis.toLowerCase().includes(q) ||
      h.medicine.toLowerCase().includes(q) ||
      h.veterinarian.toLowerCase().includes(q)
    );
  }
  if (from) {
    records = records.filter(h => h.date >= String(from));
  }
  if (to) {
    records = records.filter(h => h.date <= String(to));
  }

  res.json(records);
});

app.get("/api/health-records/:id", (req: Request, res: Response) => {
  const record = healthDb.find(h => h.id === req.params.id);
  if (!record) return res.status(404).json({ error: "Health record not found" });
  res.json(record);
});

app.post("/api/health-records", (req: Request, res: Response) => {
  const body = req.body;
  const withdrawalDays = Number(body.withdrawalDays) || 0;
  let safeDate = "";
  if (withdrawalDays > 0) {
    const baseDate = body.date ? new Date(body.date) : new Date();
    baseDate.setDate(baseDate.getDate() + withdrawalDays);
    safeDate = baseDate.toISOString().split("T")[0];
  }

  const newHealth = {
    id: `H-${Date.now()}`,
    date: body.date || new Date().toISOString().split("T")[0],
    animal: body.animal || "HF-027 (Bella)",
    animalId: body.animalId || "HF-027",
    problem: body.problem || "Health Check",
    symptoms: body.symptoms || "",
    diagnosis: body.diagnosis || "Clinical Condition",
    veterinarian: body.veterinarian || "Dr. Imran (DVM)",
    treatment: body.treatment || "Medication protocol",
    medicine: body.medicine || "Intramast-DC",
    medicineId: body.medicineId || "",
    dose: body.dose || "1 dose",
    doseQty: Number(body.doseQty) || 1,
    duration: body.duration || "3 Days",
    cost: Number(body.cost) || 1000,
    status: (body.status || "In Treatment") as any,
    withdrawalDays,
    withdrawalUntil: safeDate || body.withdrawalUntil || "",
    remarks: body.remarks || ""
  };
  healthDb.unshift(newHealth);

  // Deduct inventory for medicine automatically
  if (body.medicineId || body.medicine) {
    const med = medicinesDb.find(m => m.id === body.medicineId || m.name.toLowerCase() === (body.medicine || "").toLowerCase());
    if (med && med.quantity > 0) {
      med.quantity = Math.max(0, med.quantity - (newHealth.doseQty || 1));
      inventoryLogsDb.unshift({
        id: `LOG-${Date.now()}`,
        itemId: med.id,
        itemName: med.name,
        category: "Veterinary Medicine",
        type: "Consumption",
        quantity: newHealth.doseQty || 1,
        unit: med.unit,
        date: newHealth.date,
        cost: newHealth.cost,
        reason: `Medical Treatment: ${newHealth.diagnosis} (${newHealth.animal})`,
        performedBy: newHealth.veterinarian
      });
    }
  }

  // Update animal status & active withdrawal
  const animal = animalsDb.find(a => a.id === newHealth.animalId);
  if (animal) {
    if (newHealth.status === "In Treatment") {
      animal.status = "Sick";
    } else if (newHealth.status === "Recovered" && animal.status === "Sick") {
      animal.status = "Lactating";
    }
    if (withdrawalDays > 0 && safeDate) {
      animal.activeWithdrawal = {
        medicine: newHealth.medicine,
        safeDate: safeDate,
        active: true
      };
    }
  }

  // Log medical expense transaction
  if (newHealth.cost > 0) {
    transactionsDb.unshift({
      id: `TX-${Date.now()}`,
      type: "Expense",
      category: "Veterinary & Medicine",
      amount: newHealth.cost,
      date: newHealth.date,
      description: `Treatment for ${newHealth.animal}: ${newHealth.diagnosis} (${newHealth.medicine})`,
      entityName: newHealth.veterinarian,
      paymentMethod: "Cash",
      farmName: "Main Punjab Unit",
      receiptRef: `MED-${Date.now().toString().slice(-5)}`
    });
  }

  res.status(201).json(newHealth);
});

app.put("/api/health-records/:id", (req: Request, res: Response) => {
  const idx = healthDb.findIndex(h => h.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Health record not found" });
  
  const updated = { ...healthDb[idx], ...req.body };
  healthDb[idx] = updated;

  // Sync animal status
  const animal = animalsDb.find(a => a.id === updated.animalId);
  if (animal) {
    if (updated.status === "Recovered" && animal.status === "Sick") {
      animal.status = "Lactating";
      if (animal.activeWithdrawal) {
        animal.activeWithdrawal.active = false;
      }
    } else if (updated.status === "In Treatment") {
      animal.status = "Sick";
    }
  }

  res.json(updated);
});

app.delete("/api/health-records/:id", (req: Request, res: Response) => {
  healthDb = healthDb.filter(h => h.id !== req.params.id);
  res.json({ success: true });
});

// Health Summary / KPIs
app.get(["/api/health/summary", "/api/veterinary/summary"], (req: Request, res: Response) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const totalMedicalRecords = healthDb.length;
  const activeCasesInTreatment = healthDb.filter(
    h => h.status === "In Treatment" || h.status === "Sick" || h.status === "Active"
  ).length;
  const recoveredCases = healthDb.filter(h => h.status === "Recovered").length;
  const activeWithdrawals = healthDb.filter(h => {
    if (h.withdrawalDays > 0) {
      if (h.status === "In Treatment") return true;
      if (h.withdrawalUntil && h.withdrawalUntil >= todayStr) return true;
    }
    return false;
  });
  const milkWithdrawalHolds = activeWithdrawals.length;
  const vaccinationProgramsCompleted = vaccinationsDb.filter(v => v.status === "Completed").length;
  const vaccinationProgramsTotal = vaccinationsDb.length;
  const upcomingVaccinations = vaccinationsDb.filter(v => v.status === "Scheduled").length;
  const totalCost = healthDb.reduce((a, b) => a + (b.cost || 0), 0);

  res.json({
    totalMedicalRecords,
    totalCases: totalMedicalRecords,
    activeCasesInTreatment,
    inTreatmentCases: activeCasesInTreatment,
    recoveredCases,
    milkWithdrawalHolds,
    activeWithdrawalsCount: milkWithdrawalHolds,
    activeWithdrawals,
    vaccinationProgramsCompleted,
    vaccinationProgramsTotal,
    upcomingVaccinations,
    totalCost
  });
});

// Vaccinations
app.get("/api/vaccinations", (req: Request, res: Response) => {
  const { status, search } = req.query;
  let list = [...vaccinationsDb];
  if (status && status !== "All") {
    list = list.filter(v => v.status.toLowerCase() === String(status).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(v =>
      v.vaccine.toLowerCase().includes(q) ||
      v.targetGroup.toLowerCase().includes(q) ||
      v.veterinarian.toLowerCase().includes(q)
    );
  }
  res.json(list);
});

app.post("/api/vaccinations", (req: Request, res: Response) => {
  const body = req.body;
  const newVac = {
    id: `VAC-${Date.now()}`,
    vaccine: body.vaccine || "FMD Vaccine",
    targetGroup: body.targetGroup || "All Cattle",
    animalId: body.animalId || undefined,
    date: body.date || new Date().toISOString().split("T")[0],
    batch: body.batch || `VRI-${Date.now().toString().slice(-4)}`,
    manufacturer: body.manufacturer || "VRI Lahore",
    nextDueDate: body.nextDueDate || "",
    veterinarian: body.veterinarian || "Dr. Imran",
    status: (body.status || "Scheduled") as any
  };
  vaccinationsDb.unshift(newVac);

  // If next due date provided, auto-create a Task for staff reminder
  if (newVac.nextDueDate) {
    tasksDb.unshift({
      id: `T-${Date.now()}`,
      title: `${newVac.vaccine} Booster for ${newVac.targetGroup}`,
      taskType: "Vaccination",
      target: newVac.targetGroup,
      dueDate: newVac.nextDueDate,
      priority: "High",
      assignedTo: newVac.veterinarian || "Dr. Imran",
      status: "Pending",
      notes: `Scheduled booster dose from vaccination batch ${newVac.batch}`
    });
  }

  res.status(201).json(newVac);
});

app.put("/api/vaccinations/:id", (req: Request, res: Response) => {
  const idx = vaccinationsDb.findIndex(v => v.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Vaccination not found" });
  vaccinationsDb[idx] = { ...vaccinationsDb[idx], ...req.body };
  res.json(vaccinationsDb[idx]);
});

app.delete("/api/vaccinations/:id", (req: Request, res: Response) => {
  vaccinationsDb = vaccinationsDb.filter(v => v.id !== req.params.id);
  res.json({ success: true });
});

// Mark vaccination completed
app.post("/api/vaccinations/:id/complete", (req: Request, res: Response) => {
  const vac = vaccinationsDb.find(v => v.id === req.params.id);
  if (!vac) return res.status(404).json({ error: "Vaccination not found" });
  vac.status = "Completed";
  
  // Also log into health records
  healthDb.unshift({
    id: `H-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    animal: vac.targetGroup,
    animalId: vac.animalId || "Herd",
    problem: "Preventive Vaccination",
    symptoms: "N/A - Routine Immunization",
    diagnosis: `${vac.vaccine} Immunization`,
    veterinarian: vac.veterinarian,
    treatment: `Administered ${vac.vaccine} batch ${vac.batch}`,
    medicine: vac.vaccine,
    dose: "1 dose",
    doseQty: 1,
    duration: "1 Day",
    cost: 500,
    status: "Vaccination",
    withdrawalDays: 0,
    withdrawalUntil: "",
    remarks: `Batch: ${vac.batch}, Next due: ${vac.nextDueDate}`
  });

  res.json({ success: true, vaccination: vac });
});

// --- FEED & RATION MANAGEMENT ---
app.get(["/api/feeds/summary", "/api/feed/summary"], (req: Request, res: Response) => {
  const totalValuation = feedsDb.reduce((sum, f) => sum + (f.stock * f.unitPrice), 0);
  const lowStockCount = feedsDb.filter(f => f.stock <= f.minStock).length;
  const activePlans = rationPlansDb.length;
  
  // Calculate average cost per cow per day across active ration plans or consumption logs
  let estCostPerCow: number | null = null;
  if (rationPlansDb.length > 0) {
    const totalCows = rationPlansDb.reduce((sum, r) => sum + (r.targetCowCount || 0), 0);
    const totalDailyCost = rationPlansDb.reduce((sum, r) => sum + (r.dailyGroupCost || (r.totalCostPerCow * (r.targetCowCount || 1)) || 0), 0);
    estCostPerCow = totalCows > 0 ? Math.round(totalDailyCost / totalCows) : Math.round(rationPlansDb.reduce((s, r) => s + (r.totalCostPerCow || 0), 0) / rationPlansDb.length);
  } else if (feedConsumptionDb.length > 0) {
    const totalFedCost = feedConsumptionDb.reduce((sum, l) => sum + (l.totalCost || 0), 0);
    const totalFedAnimals = feedConsumptionDb.reduce((sum, l) => sum + (l.animalsFed || 0), 0);
    if (totalFedAnimals > 0) {
      estCostPerCow = Math.round(totalFedCost / totalFedAnimals);
    }
  }

  res.json({
    totalValuation,
    lowStockCount,
    activePlans,
    estCostPerCow,
    totalFeeds: feedsDb.length
  });
});

app.get("/api/feeds", (req: Request, res: Response) => {
  const { category, search } = req.query;
  let feeds = [...feedsDb];
  if (category && category !== "All") {
    feeds = feeds.filter(f => f.category.toLowerCase() === String(category).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    feeds = feeds.filter(f => f.name.toLowerCase().includes(q) || f.supplier.toLowerCase().includes(q));
  }
  res.json(feeds);
});

app.get("/api/feeds/:id", (req: Request, res: Response) => {
  const feed = feedsDb.find(f => f.id === req.params.id);
  if (!feed) return res.status(404).json({ error: "Feed item not found" });
  res.json(feed);
});

app.post("/api/feeds", (req: Request, res: Response) => {
  const body = req.body;
  const newFeed = {
    id: `F-${Date.now()}`,
    name: body.name || "Feed Item",
    category: body.category || "Forage",
    unit: body.unit || "kg",
    unitPrice: Number(body.unitPrice) || 30,
    stock: Number(body.stock) || 1000,
    minStock: Number(body.minStock) || 200,
    supplier: body.supplier || "Local Supplier",
    dmPercent: body.dmPercent ? Number(body.dmPercent) : 85,
    cpPercent: body.cpPercent ? Number(body.cpPercent) : 12,
    meEnergy: body.meEnergy ? Number(body.meEnergy) : 10,
    status: (Number(body.stock) <= Number(body.minStock) ? "Low Stock" : "Available") as any
  };
  feedsDb.unshift(newFeed);
  res.status(201).json(newFeed);
});

app.put("/api/feeds/:id", (req: Request, res: Response) => {
  const idx = feedsDb.findIndex(f => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Feed item not found" });
  const updated = { ...feedsDb[idx], ...req.body };
  updated.status = updated.stock <= updated.minStock ? (updated.stock <= 0 ? "Out of Stock" : "Low Stock") : "Available";
  feedsDb[idx] = updated;
  res.json(updated);
});

app.delete("/api/feeds/:id", (req: Request, res: Response) => {
  feedsDb = feedsDb.filter(f => f.id !== req.params.id);
  res.json({ success: true });
});

app.get("/api/rations", (req: Request, res: Response) => {
  res.json(rationPlansDb);
});

app.post("/api/rations", (req: Request, res: Response) => {
  const body = req.body;
  const newRation = {
    id: `RAT-${Date.now()}`,
    name: body.name || "Custom TMR Ration",
    group: body.group || "High Milking Group",
    targetCowCount: Number(body.targetCowCount) || 5,
    ingredients: body.ingredients || [],
    totalKgPerCow: Number(body.totalKgPerCow) || 45,
    totalCostPerCow: Number(body.totalCostPerCow) || 2500,
    costPerLiterExpected: Number(body.costPerLiterExpected) || 95,
    dailyGroupConsumptionKg: Number(body.dailyGroupConsumptionKg) || 225,
    dailyGroupCost: Number(body.dailyGroupCost) || 12500
  };
  rationPlansDb.unshift(newRation);
  res.status(201).json(newRation);
});

app.put("/api/rations/:id", (req: Request, res: Response) => {
  const idx = rationPlansDb.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Ration plan not found" });
  rationPlansDb[idx] = { ...rationPlansDb[idx], ...req.body };
  res.json(rationPlansDb[idx]);
});

app.delete("/api/rations/:id", (req: Request, res: Response) => {
  rationPlansDb = rationPlansDb.filter(r => r.id !== req.params.id);
  res.json({ success: true });
});

// Daily Feed Distribution (deducts stock from feed inventory & logs consumption)
app.post("/api/feeds/distribute", (req: Request, res: Response) => {
  const { rationId, customCows, notes } = req.body;
  const plan = rationPlansDb.find(r => r.id === rationId);
  if (!plan) return res.status(404).json({ error: "Ration plan not found" });

  const cowCount = Number(customCows) || plan.targetCowCount || 40;
  let totalBatchCost = 0;
  let totalBatchKg = 0;

  plan.ingredients.forEach(item => {
    const feed = feedsDb.find(f => f.id === item.feedId || f.name.toLowerCase() === item.feedName.toLowerCase());
    const consumedKg = (item.kgPerCow || 1) * cowCount;
    const itemCost = consumedKg * (feed?.unitPrice || item.unitPrice || 30);
    totalBatchCost += itemCost;
    totalBatchKg += consumedKg;

    if (feed) {
      feed.stock = Math.max(0, feed.stock - consumedKg);
      feed.status = feed.stock <= feed.minStock ? (feed.stock <= 0 ? "Out of Stock" : "Low Stock") : "Available";

      inventoryLogsDb.unshift({
        id: `LOG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        itemId: feed.id,
        itemName: feed.name,
        category: "Feed & Forage",
        type: "Consumption",
        quantity: consumedKg,
        unit: feed.unit,
        date: new Date().toISOString().split("T")[0],
        cost: itemCost,
        reason: `TMR distribution for ${plan.group} (${cowCount} cows)`,
        performedBy: "Feeder / Herdsman"
      });
    }
  });

  const consumptionLog = {
    id: `FC-${Date.now()}`,
    date: new Date().toISOString().split("T")[0],
    rationId: plan.id,
    group: plan.group,
    cowsCount: cowCount,
    totalKg: totalBatchKg,
    totalCost: totalBatchCost,
    costPerCow: Math.round(totalBatchCost / (cowCount || 1)),
    distributedBy: "Ali Herdsman"
  };
  feedConsumptionDb.unshift(consumptionLog);

  // Auto-log daily feed expense transaction
  if (totalBatchCost > 0) {
    transactionsDb.unshift({
      id: `TX-${Date.now()}`,
      type: "Expense",
      category: "Feed & Fodder",
      amount: totalBatchCost,
      date: new Date().toISOString().split("T")[0],
      description: `Daily TMR Feed Distribution: ${plan.group} (${cowCount} cows)`,
      entityName: "Daily Herd Feeding",
      paymentMethod: "Cash",
      farmName: "Main Punjab Unit",
      receiptRef: `TMR-${Date.now().toString().slice(-5)}`
    });
  }

  res.json({
    success: true,
    message: `TMR batch distributed for ${plan.group}. Total ${totalBatchKg.toLocaleString()} kg feed dispensed.`,
    consumption: consumptionLog
  });
});

app.get("/api/feeds/consumption", (req: Request, res: Response) => {
  res.json(feedConsumptionDb);
});

// --- INVENTORY ---
app.get("/api/inventory/summary", (req: Request, res: Response) => {
  const { from, to } = req.query;
  const feedsValuation = feedsDb.reduce((sum, f) => sum + (f.stock * f.unitPrice), 0);
  const medsValuation = medicinesDb.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0);
  const totalValuation = feedsValuation + medsValuation;
  const uniqueSkus = feedsDb.length + medicinesDb.length;
  
  const lowStockCount =
    feedsDb.filter(f => f.stock <= f.minStock).length +
    medicinesDb.filter(m => m.quantity <= (m.minLevel || 5)).length;

  let logs = [...inventoryLogsDb];
  if (from) logs = logs.filter(l => l.timestamp >= String(from));
  if (to) logs = logs.filter(l => l.timestamp <= String(to));
  const auditLogsCount = logs.length;

  res.json({
    totalValuation,
    uniqueSkus,
    lowStockCount,
    auditLogsCount,
    feedsCount: feedsDb.length,
    medicinesCount: medicinesDb.length
  });
});

app.get("/api/inventory", (req: Request, res: Response) => {
  const { category, search, status } = req.query;
  let inventoryItems = [
    ...feedsDb.map(f => ({
      id: f.id,
      name: f.name,
      category: "Feed & Forage",
      quantity: f.stock,
      stock: f.stock,
      unit: f.unit,
      unitPrice: f.unitPrice,
      minLevel: f.minStock,
      minStock: f.minStock,
      status: f.stock <= 0 ? "Out of Stock" : (f.stock <= f.minStock ? "Low Stock" : "In Stock"),
      supplier: f.supplier,
      reorderLevel: f.minStock * 1.5,
      totalValuation: f.stock * f.unitPrice
    })),
    ...medicinesDb.map(m => ({
      id: m.id,
      name: m.name,
      category: "Veterinary Medicine",
      quantity: m.quantity,
      stock: m.quantity,
      unit: m.unit,
      unitPrice: m.unitPrice,
      minLevel: 5,
      minStock: 5,
      status: m.quantity <= 0 ? "Out of Stock" : (m.quantity <= 5 ? "Low Stock" : "In Stock"),
      supplier: m.supplier,
      reorderLevel: 10,
      totalValuation: m.quantity * m.unitPrice
    }))
  ];

  if (category && category !== "All") {
    inventoryItems = inventoryItems.filter(i => i.category.toLowerCase().includes(String(category).toLowerCase()));
  }
  if (status && status !== "All") {
    inventoryItems = inventoryItems.filter(i => i.status.toLowerCase() === String(status).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    inventoryItems = inventoryItems.filter(i => i.name.toLowerCase().includes(q) || i.supplier.toLowerCase().includes(q));
  }

  res.json(inventoryItems);
});

app.post("/api/inventory/purchase", (req: Request, res: Response) => {
  const body = req.body;
  const qty = Number(body.quantity) || 0;
  const unitPrice = Number(body.unitPrice) || 0;
  const totalCost = Number(body.totalCost) || (qty * unitPrice);
  const itemName = body.name || body.itemName || "Stock Item";
  const itemCategory = body.category || "Feed & Forage";
  const unit = body.unit || "kg";
  const supplier = body.supplier || "Supplier Co.";

  // Check if matching feed or medicine
  const feed = feedsDb.find(f => f.name.toLowerCase() === itemName.toLowerCase() || f.id === body.itemId);
  const med = medicinesDb.find(m => m.name.toLowerCase() === itemName.toLowerCase() || m.id === body.itemId);

  if (feed) {
    feed.stock += qty;
    feed.unitPrice = unitPrice || feed.unitPrice;
    feed.status = feed.stock <= feed.minStock ? "Low Stock" : "Available";
  } else if (med) {
    med.quantity += qty;
    med.unitPrice = unitPrice || med.unitPrice;
  } else if (itemCategory.toLowerCase().includes("medicine") || itemCategory.toLowerCase().includes("vet")) {
    medicinesDb.unshift({
      id: `M-${Date.now()}`,
      name: itemName,
      manufacturer: supplier,
      batch: `B-${Date.now().toString().slice(-4)}`,
      quantity: qty,
      unit: unit,
      unitPrice: unitPrice,
      expiry: "2026-06-30",
      supplier: supplier,
      withdrawalDays: 0,
      category: "Supplement"
    });
  } else {
    feedsDb.unshift({
      id: `F-${Date.now()}`,
      name: itemName,
      category: itemCategory,
      unit: unit,
      unitPrice: unitPrice,
      stock: qty,
      minStock: 200,
      supplier: supplier,
      status: "Available"
    });
  }

  // Record inventory movement log
  inventoryLogsDb.unshift({
    id: `LOG-${Date.now()}`,
    itemId: feed?.id || med?.id || `ITEM-${Date.now()}`,
    itemName: itemName,
    category: itemCategory,
    type: "Stock In",
    quantity: qty,
    unit: unit,
    date: body.date || new Date().toISOString().split("T")[0],
    cost: totalCost,
    reason: `Stock Purchase from ${supplier}`,
    performedBy: "Store Keeper / Manager"
  });

  // Log expense transaction in financial ledger
  if (totalCost > 0) {
    transactionsDb.unshift({
      id: `TX-${Date.now()}`,
      type: "Expense",
      category: itemCategory.toLowerCase().includes("medicine") ? "Veterinary & Medicine" : "Feed & Fodder",
      amount: totalCost,
      date: body.date || new Date().toISOString().split("T")[0],
      description: `Stock Purchase: ${qty} ${unit} of ${itemName}`,
      entityName: supplier,
      paymentMethod: (body.paymentMethod || "Bank Transfer") as any,
      farmName: "Main Punjab Unit",
      receiptRef: `PO-${Date.now().toString().slice(-5)}`
    });
  }

  res.status(201).json({ success: true, message: `Purchased ${qty} ${unit} of ${itemName}. Stock updated & ledger voucher logged.` });
});

app.post("/api/inventory/consume", (req: Request, res: Response) => {
  const { itemId, quantity, reason, performedBy } = req.body;
  const qty = Number(quantity) || 1;

  const feed = feedsDb.find(f => f.id === itemId);
  const med = medicinesDb.find(m => m.id === itemId);

  if (feed) {
    feed.stock = Math.max(0, feed.stock - qty);
    feed.status = feed.stock <= feed.minStock ? (feed.stock <= 0 ? "Out of Stock" : "Low Stock") : "Available";
  } else if (med) {
    med.quantity = Math.max(0, med.quantity - qty);
  } else {
    return res.status(404).json({ error: "Item not found in inventory" });
  }

  const log = {
    id: `LOG-${Date.now()}`,
    itemId: itemId,
    itemName: feed?.name || med?.name || "Item",
    category: feed ? "Feed & Forage" : "Veterinary Medicine",
    type: "Consumption" as const,
    quantity: qty,
    unit: feed?.unit || med?.unit || "units",
    date: new Date().toISOString().split("T")[0],
    reason: reason || "Routine Farm Usage",
    performedBy: performedBy || "Staff"
  };
  inventoryLogsDb.unshift(log);

  res.json({ success: true, message: "Inventory consumption logged.", log });
});

app.post("/api/inventory/adjust", (req: Request, res: Response) => {
  const { itemId, newCount, reason } = req.body;
  const count = Number(newCount) || 0;

  const feed = feedsDb.find(f => f.id === itemId);
  const med = medicinesDb.find(m => m.id === itemId);

  if (feed) {
    const diff = count - feed.stock;
    feed.stock = count;
    feed.status = feed.stock <= feed.minStock ? (feed.stock <= 0 ? "Out of Stock" : "Low Stock") : "Available";
    inventoryLogsDb.unshift({
      id: `LOG-${Date.now()}`,
      itemId,
      itemName: feed.name,
      category: "Feed & Forage",
      type: "Adjustment",
      quantity: diff,
      unit: feed.unit,
      date: new Date().toISOString().split("T")[0],
      reason: reason || "Physical Audit Correction",
      performedBy: "Auditor / Manager"
    });
  } else if (med) {
    const diff = count - med.quantity;
    med.quantity = count;
    inventoryLogsDb.unshift({
      id: `LOG-${Date.now()}`,
      itemId,
      itemName: med.name,
      category: "Veterinary Medicine",
      type: "Adjustment",
      quantity: diff,
      unit: med.unit,
      date: new Date().toISOString().split("T")[0],
      reason: reason || "Physical Audit Correction",
      performedBy: "Auditor / Manager"
    });
  } else {
    return res.status(404).json({ error: "Item not found" });
  }

  res.json({ success: true, message: "Stock count adjusted successfully." });
});

app.get("/api/inventory/logs", (req: Request, res: Response) => {
  res.json(inventoryLogsDb);
});

// --- CUSTOMERS & SUPPLIERS ---
app.get("/api/customers", (req: Request, res: Response) => {
  res.json(customersDb);
});

app.post("/api/customers", (req: Request, res: Response) => {
  const body = req.body;
  const newCust = {
    id: `CUST-${Date.now()}`,
    name: body.name || "New Milk Buyer",
    phone: body.phone || "+92 300 0000000",
    address: body.address || "Lahore / Kasur",
    dailyQuotaLitres: Number(body.dailyQuotaLitres) || 100,
    ratePerLitre: Number(body.ratePerLitre) || 150,
    deliveryTime: body.deliveryTime || "Both",
    outstandingBalance: Number(body.outstandingBalance) || 0,
    paymentTerms: body.paymentTerms || "Weekly",
    status: "Active" as const
  };
  customersDb.unshift(newCust);
  res.status(201).json(newCust);
});

app.get("/api/suppliers", (req: Request, res: Response) => {
  res.json(suppliersDb);
});

app.post("/api/suppliers", (req: Request, res: Response) => {
  const body = req.body;
  const newSupp = {
    id: `SUP-${Date.now()}`,
    name: body.name || "New Supplier",
    contactPerson: body.contactPerson || "Manager",
    phone: body.phone || "+92 300 0000000",
    address: body.address || "Punjab",
    products: body.products ? (Array.isArray(body.products) ? body.products : [body.products]) : ["Feed", "Supplies"],
    outstandingPayable: Number(body.outstandingPayable) || 0,
    paymentTerms: body.paymentTerms || "30 Days Net"
  };
  suppliersDb.unshift(newSupp);
  res.status(201).json(newSupp);
});

// --- FINANCE ---
app.get("/api/finance", (req: Request, res: Response) => {
  const { type, category, search, from, to } = req.query;
  let txs = [...transactionsDb];

  if (type && type !== "All") {
    txs = txs.filter(t => t.type.toLowerCase() === String(type).toLowerCase());
  }
  if (category && category !== "All") {
    txs = txs.filter(t => t.category.toLowerCase() === String(category).toLowerCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    txs = txs.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.entityName.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      (t.receiptRef && t.receiptRef.toLowerCase().includes(q))
    );
  }
  if (from) {
    txs = txs.filter(t => t.date >= String(from));
  }
  if (to) {
    txs = txs.filter(t => t.date <= String(to));
  }

  res.json(txs);
});

app.get("/api/finance/summary", (req: Request, res: Response) => {
  const { from, to } = req.query;
  let txs = [...transactionsDb];
  if (from) txs = txs.filter(t => t.date >= String(from));
  if (to) txs = txs.filter(t => t.date <= String(to));

  const totalIncome = txs.filter(t => t.type === "Income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = txs.filter(t => t.type === "Expense").reduce((a, b) => a + b.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const marginPercent = totalIncome > 0 ? Number(((netProfit / totalIncome) * 100).toFixed(1)) : null;

  const milkRevenue = txs.filter(t => t.type === "Income" && t.category.toLowerCase().includes("milk")).reduce((a, b) => a + b.amount, 0);
  const feedExpenses = txs.filter(t => t.type === "Expense" && t.category.toLowerCase().includes("feed")).reduce((a, b) => a + b.amount, 0);
  const vetExpenses = txs.filter(t => t.type === "Expense" && (t.category.toLowerCase().includes("vet") || t.category.toLowerCase().includes("med"))).reduce((a, b) => a + b.amount, 0);
  const laborExpenses = txs.filter(t => t.type === "Expense" && t.category.toLowerCase().includes("labor")).reduce((a, b) => a + b.amount, 0);

  res.json({
    totalIncome,
    totalExpense,
    netProfit,
    marginPercent,
    milkRevenue,
    feedExpenses,
    vetExpenses,
    laborExpenses,
    transactionCount: txs.length
  });
});

app.get("/api/finance/:id", (req: Request, res: Response) => {
  const tx = transactionsDb.find(t => t.id === req.params.id);
  if (!tx) return res.status(404).json({ error: "Transaction not found" });
  res.json(tx);
});

app.post("/api/finance", (req: Request, res: Response) => {
  const body = req.body;
  const newTx = {
    id: `TX-${Date.now()}`,
    type: (body.type || "Expense") as "Income" | "Expense",
    category: body.category || "General",
    amount: Number(body.amount) || 0,
    date: body.date || new Date().toISOString().split("T")[0],
    description: body.description || "",
    entityName: body.entityName || "Farm Vendor",
    paymentMethod: (body.paymentMethod || "Cash") as any,
    farmName: body.farmName || "Main Punjab Unit",
    receiptRef: body.receiptRef || `TXN-${Date.now().toString().slice(-6)}`
  };
  transactionsDb.unshift(newTx);
  res.status(201).json(newTx);
});

app.put("/api/finance/:id", (req: Request, res: Response) => {
  const idx = transactionsDb.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Transaction not found" });
  transactionsDb[idx] = { ...transactionsDb[idx], ...req.body };
  res.json(transactionsDb[idx]);
});

app.delete("/api/finance/:id", (req: Request, res: Response) => {
  transactionsDb = transactionsDb.filter(t => t.id !== req.params.id);
  res.json({ success: true });
});

// --- REPORTS ---
app.get("/api/reports/financial", (req: Request, res: Response) => {
  const { from, to } = req.query;
  let txs = [...transactionsDb];
  if (from) txs = txs.filter(t => t.date >= String(from));
  if (to) txs = txs.filter(t => t.date <= String(to));

  const totalIncome = txs.filter(t => t.type === "Income").reduce((a, b) => a + b.amount, 0);
  const totalExpense = txs.filter(t => t.type === "Expense").reduce((a, b) => a + b.amount, 0);
  const netProfit = totalIncome - totalExpense;

  const categories: Record<string, number> = {};
  txs.forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + t.amount;
  });

  res.json({
    totalIncome,
    totalExpense,
    netProfit,
    marginPercent: totalIncome > 0 ? Number(((netProfit / totalIncome) * 100).toFixed(1)) : 0,
    categories,
    transactions: txs
  });
});

// --- TASKS ---
app.get(["/api/tasks/summary", "/api/task/summary"], (req: Request, res: Response) => {
  const totalAssigned = tasksDb.length;
  const pendingExecution = tasksDb.filter(t => t.status !== "Completed").length;
  const highPriorityUrgent = tasksDb.filter(t => t.priority === "High" && t.status !== "Completed").length;
  const completedDuties = tasksDb.filter(t => t.status === "Completed").length;

  res.json({
    totalAssigned,
    pendingExecution,
    highPriorityUrgent,
    completedDuties
  });
});

app.get("/api/tasks", (req: Request, res: Response) => {
  const { status, priority, search, assignedTo } = req.query;
  let tasks = [...tasksDb];

  if (status && status !== "All") {
    if (status === "Pending") tasks = tasks.filter(t => t.status !== "Completed");
    else tasks = tasks.filter(t => t.status.toLowerCase() === String(status).toLowerCase());
  }
  if (priority && priority !== "All") {
    tasks = tasks.filter(t => t.priority.toLowerCase() === String(priority).toLowerCase());
  }
  if (assignedTo) {
    tasks = tasks.filter(t => t.assignedTo.toLowerCase().includes(String(assignedTo).toLowerCase()));
  }
  if (search) {
    const q = String(search).toLowerCase();
    tasks = tasks.filter(t => t.title.toLowerCase().includes(q) || t.target.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q)));
  }

  res.json(tasks);
});

app.get("/api/tasks/:id", (req: Request, res: Response) => {
  const task = tasksDb.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

app.post("/api/tasks", (req: Request, res: Response) => {
  const body = req.body;
  const newTask = {
    id: `T-${Date.now()}`,
    title: body.title || "New Task",
    taskType: body.taskType || "General",
    target: body.target || "Farm Herd",
    dueDate: body.dueDate || new Date().toISOString().split("T")[0],
    priority: (body.priority || "Medium") as any,
    assignedTo: body.assignedTo || "Muhammad Ali",
    status: (body.status || "Pending") as any,
    notes: body.notes || ""
  };
  tasksDb.unshift(newTask);
  res.status(201).json(newTask);
});

app.put("/api/tasks/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const idx = tasksDb.findIndex(t => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "Task not found" });
  tasksDb[idx] = { ...tasksDb[idx], ...req.body };
  res.json(tasksDb[idx]);
});

app.delete("/api/tasks/:id", (req: Request, res: Response) => {
  tasksDb = tasksDb.filter(t => t.id !== req.params.id);
  res.json({ success: true });
});

// --- REMINDERS & AUTOMATED ALERTS ---
app.get("/api/reminders", (req: Request, res: Response) => {
  const synthesized: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    priority: "High" | "Medium" | "Low";
    targetPage: string;
    targetId?: string;
    status: "Active" | "Completed" | "Dismissed";
    category: string;
    source: "Automated" | "Custom";
  }> = [];

  // 1. Pregnancy Diagnosis Check Reminders (AI performed 35+ days ago)
  breedingDb.forEach(b => {
    if (b.aiDate && b.result === "Pending") {
      const ai = new Date(b.aiDate);
      const pd = new Date(ai);
      pd.setDate(pd.getDate() + 35);
      const pdStr = pd.toISOString().split("T")[0];
      synthesized.push({
        id: `REM-PD-${b.id}`,
        title: `Pregnancy Diagnosis Due for ${b.animal || b.animalId}`,
        description: `Check 35 days post AI (${b.aiDate}) using ultrasound scan.`,
        dueDate: pdStr,
        priority: "High",
        targetPage: "Breeding",
        targetId: b.animalId,
        status: "Active",
        category: "Breeding",
        source: "Automated"
      });
    }
  });

  // 2. Expected Calving Reminders (~280 days post AI)
  breedingDb.forEach(b => {
    if (b.result === "Positive" && b.expectedCalving && !b.actualCalving) {
      synthesized.push({
        id: `REM-CALV-${b.id}`,
        title: `Calving Expected Soon: ${b.animal || b.animalId}`,
        description: `Prepare maternity pen and monitor pre-calving symptoms. Projected delivery: ${b.expectedCalving}`,
        dueDate: b.expectedCalving,
        priority: "High",
        targetPage: "Breeding",
        targetId: b.animalId,
        status: "Active",
        category: "Breeding",
        source: "Automated"
      });
    }
  });

  // 3. Vaccination Reminders
  vaccinationsDb.forEach(v => {
    if (v.status === "Scheduled" && v.date) {
      synthesized.push({
        id: `REM-VAC-${v.id}`,
        title: `Vaccination: ${v.vaccine} for ${v.targetGroup}`,
        description: `Administer batch ${v.batch}. Assigned to ${v.veterinarian}.`,
        dueDate: v.date,
        priority: "Medium",
        targetPage: "Health",
        targetId: v.targetGroup,
        status: "Active",
        category: "Veterinary",
        source: "Automated"
      });
    }
  });

  // 4. Milk Withdrawal Safety Restrictions
  healthDb.forEach(h => {
    if (h.withdrawalDays > 0 && h.withdrawalUntil) {
      const until = new Date(h.withdrawalUntil);
      const now = new Date();
      if (until >= now) {
        synthesized.push({
          id: `REM-WITHDRAW-${h.id}`,
          title: `Active Milk Withdrawal: ${h.animal}`,
          description: `Hold milk due to ${h.medicine} until ${h.withdrawalUntil}. DO NOT mix with bulk tank!`,
          dueDate: h.withdrawalUntil,
          priority: "High",
          targetPage: "Health",
          targetId: h.animalId,
          status: "Active",
          category: "Veterinary",
          source: "Automated"
        });
      }
    }
  });

  // 5. Low Stock Alerts
  feedsDb.forEach(f => {
    if (f.stock <= f.minStock) {
      synthesized.push({
        id: `REM-STOCK-${f.id}`,
        title: `Low Feed Stock: ${f.name}`,
        description: `Current stock is ${f.stock} ${f.unit} (Minimum threshold: ${f.minStock} ${f.unit}). Reorder required.`,
        dueDate: new Date().toISOString().split("T")[0],
        priority: f.stock <= 0 ? "High" : "Medium",
        targetPage: "Inventory",
        targetId: f.id,
        status: "Active",
        category: "Feeding",
        source: "Automated"
      });
    }
  });

  // 6. Custom Reminders
  customRemindersDb.forEach(c => {
    synthesized.push({
      ...c,
      targetPage: c.targetPage || "Tasks & Reminders",
      source: "Custom"
    });
  });

  // Sort by due date
  synthesized.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  res.json(synthesized);
});

app.post("/api/reminders", (req: Request, res: Response) => {
  const body = req.body;
  const newRem = {
    id: `REM-${Date.now()}`,
    title: body.title || "New Farm Reminder",
    description: body.description || "",
    dueDate: body.dueDate || new Date().toISOString().split("T")[0],
    priority: (body.priority || "Medium") as any,
    targetPage: body.targetPage || "Tasks & Reminders",
    targetId: body.targetId || "",
    status: "Active" as const,
    category: body.category || "General"
  };
  customRemindersDb.unshift(newRem);
  res.status(201).json(newRem);
});

app.put("/api/reminders/:id", (req: Request, res: Response) => {
  const id = req.params.id;
  const idx = customRemindersDb.findIndex(r => r.id === id);
  if (idx >= 0) {
    customRemindersDb[idx] = { ...customRemindersDb[idx], ...req.body };
    return res.json(customRemindersDb[idx]);
  }
  res.json({ success: true, message: "Reminder status updated" });
});

app.delete("/api/reminders/:id", (req: Request, res: Response) => {
  customRemindersDb = customRemindersDb.filter(r => r.id !== req.params.id);
  res.json({ success: true });
});

// --- SETTINGS ---
app.get("/api/settings", (req: Request, res: Response) => {
  farmSettings.flags = { ...systemFlagsDb };
  res.json(farmSettings);
});

app.post("/api/settings", (req: Request, res: Response) => {
  farmSettings = { ...farmSettings, ...req.body };
  if (req.body.flags) {
    systemFlagsDb = { ...systemFlagsDb, ...req.body.flags };
    farmSettings.flags = { ...systemFlagsDb };
  }
  logAudit("SETTINGS_CHANGE", "Settings", `Saved Farm Master Profile & System Settings (Price: ${farmSettings.currencySymbol || "Rs"} ${farmSettings.milkPricePerLitre}/L, Currency: ${farmSettings.currency})`, "SYS-CONFIG", req);
  res.json({ success: true, data: farmSettings });
});

// Vite & Static Asset Handling
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Commercial Dairy Farm Management server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
