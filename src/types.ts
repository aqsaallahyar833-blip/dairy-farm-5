export type AnimalStatus =
  | "Lactating"
  | "Dry"
  | "Pregnant"
  | "Heifer"
  | "Calf"
  | "Open"
  | "Sick"
  | "Quarantine"
  | "Sold"
  | "Dead"
  | "Bull";

export interface Animal {
  id: string; // e.g. "HF-027"
  dbId?: number;
  earTag: string;
  rfid?: string;
  name: string;
  photo?: string;
  breed: string;
  sex: "Female" | "Male";
  dob: string;
  age: string;
  colorMarkings?: string;
  source?: "Homebred" | "Purchased" | "Imported";
  purchaseDate?: string;
  purchasePrice?: number;
  transportCost?: number;
  landedCost?: number;
  previousFarm?: string;
  quarantineDays?: number;
  status: AnimalStatus;
  group: string;
  location: string;
  dam: string;
  sire: string;
  lactation: number | null;
  dim: number | null;
  milk: number | null;
  weightKg?: number;
  heightCm?: number;
  remarks?: string;
  farmId?: number;
  saleInfo?: {
    buyer: string;
    date: string;
    salePrice: number;
    reason: "Low Production" | "Reproductive Problem" | "Disease" | "Old Age" | "Surplus Herd" | "Commercial Sale";
    weight: number;
    profitLoss: number;
  };
  mortalityInfo?: {
    date: string;
    age: string;
    cause: string;
    diseaseHistory: string;
    treatmentNotes: string;
    financialValue: number;
    postMortemNotes: string;
  };
  activeWithdrawal?: {
    medicine: string;
    safeDate: string;
    active: boolean;
  };
}

export interface LactationRecord {
  id: string;
  animalId: string;
  lactationNumber: number;
  calvingDate: string;
  startDate: string;
  peakMilk: number;
  peakDate: string;
  currentMilk: number;
  dim: number;
  totalMilk: number;
  dryDate?: string;
  endDate?: string;
  status: "Active" | "Completed";
}

export interface MilkRecord {
  id: string;
  animalId: string;
  name: string;
  date: string;
  session: "Morning" | "Evening" | "Both" | "Third";
  morningLitres: number;
  eveningLitres: number;
  thirdMilkingLitres?: number;
  totalLitres: number;
  fatPercent: number;
  proteinPercent?: number;
  snfPercent: number;
  scc?: number; // Somatic cell count in x1000 cells/ml
  quality: "Standard" | "Premium" | "Rejected";
  rejectedLitres?: number;
  rejectionReason?: string;
}

export interface MilkAlert {
  id: string;
  animalId: string;
  animalName: string;
  date: string;
  recentAvg: number;
  todayYield: number;
  dropPercentage: number;
  status: "Active" | "Acknowledged";
  disclaimer: string;
}

export interface BreedingEvent {
  id: string;
  animal: string;
  animalId: string;
  heatDate: string;
  heatSigns?: string;
  heatMethod?: string;
  aiDate: string;
  semenBull: string;
  technician: string;
  pdDate: string;
  pdMethod?: string;
  result: "Positive" | "Pending" | "Negative" | "Suspicious";
  expectedCalving: string;
  actualCalving?: string;
  servicesCount: number;
  notes?: string;
}

export interface CalvingRecord {
  id: string;
  damId: string;
  damName: string;
  sireId: string;
  expectedDate: string;
  actualDate: string;
  difficulty: "Normal" | "Assisted" | "Difficult" | "C-Section";
  calfCount: number;
  calfSex: "Female" | "Male" | "Mixed";
  birthWeight: number;
  calfId: string;
  colostrumFedHours: number;
  colostrumLitres: number;
  complications?: string;
  registeredInHerd: boolean;
}

export interface CalfGrowthRecord {
  id: string;
  calfId: string;
  calfName: string;
  date: string;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  girthCm: number;
  adgGrams: number; // Average daily gain in g/day
  feedType: "Colostrum" | "Whole Milk" | "Milk Replacer" | "Calf Starter" | "Weaned Hay/TMR";
  dailyMilkAllowanceL: number;
  weaningStatus: "Pre-weaning" | "Weaning in Progress" | "Weaned";
  notes?: string;
}

export interface Disease {
  id: string;
  name: string;
  category: "Mammary" | "Infectious" | "Metabolic" | "Reproductive" | "Parasitic" | "Hoof/Lameness" | "Respiratory";
  commonSymptoms: string;
  recommendedTreatments: string;
  isCustom?: boolean;
}

export interface MedicineItem {
  id: string;
  name: string;
  manufacturer: string;
  batch: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  expiry: string;
  supplier: string;
  withdrawalDays: number;
  category: "Antibiotic" | "Anti-inflammatory" | "Vaccine" | "Dewormer" | "Hormone" | "Supplement";
}

export interface HealthRecord {
  id: string;
  date: string;
  animal: string;
  animalId: string;
  problem: string;
  symptoms: string;
  diagnosis: string;
  veterinarian: string;
  treatment: string;
  medicine: string;
  medicineId?: string;
  dose: string;
  doseQty?: number;
  duration: string;
  cost: number;
  status: "In Treatment" | "Recovered" | "Vaccination" | "Observation";
  withdrawalDays: number;
  withdrawalUntil: string;
  remarks?: string;
}

export interface VaccinationSchedule {
  id: string;
  vaccine: string;
  targetGroup: string;
  animalId?: string;
  date: string;
  batch: string;
  manufacturer: string;
  nextDueDate: string;
  veterinarian: string;
  status: "Completed" | "Scheduled" | "Overdue";
}

export interface FeedItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  stock: number;
  minStock: number;
  supplier: string;
  dmPercent?: number; // Dry Matter %
  cpPercent?: number; // Crude Protein %
  meEnergy?: number; // ME MJ/kg
  status: "Available" | "Low Stock" | "Out of Stock";
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity?: number;
  stock: number;
  unit: string;
  unitPrice: number;
  minLevel?: number;
  minStock: number;
  status: string;
  supplier: string;
  reorderLevel?: number;
}

export interface RationIngredient {
  feedId: string;
  feedName: string;
  kgPerCow: number;
  unitPrice: number;
  totalCostPerCow: number;
}

export interface RationPlan {
  id: string;
  name: string;
  group: "High Milking Group" | "Medium Milking Group" | "Dry Group" | "Heifer Pen" | "Calf Pen";
  targetCowCount: number;
  ingredients: RationIngredient[];
  totalKgPerCow: number;
  totalCostPerCow: number;
  costPerLiterExpected: number;
  dailyGroupConsumptionKg: number;
  dailyGroupCost: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  dailyQuotaLitres: number;
  ratePerLitre: number;
  deliveryTime: "Morning" | "Evening" | "Both";
  outstandingBalance: number;
  paymentTerms: "Daily Cash" | "Weekly" | "Monthly Credit";
  status: "Active" | "Paused";
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  products: string[];
  outstandingPayable: number;
  paymentTerms: string;
}

export interface FinancialTransaction {
  id: string;
  type: "Income" | "Expense";
  category: string;
  amount: number;
  date: string;
  description: string;
  entityName: string;
  paymentMethod: "Cash" | "Bank Transfer" | "Cheque";
  farmName?: string;
  receiptRef?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  taskType?: "Vaccination" | "AI" | "Pregnancy Diagnosis" | "Dry-off" | "Expected Calving" | "Medicine" | "Deworming" | "Hoof Trimming" | "Weight Measurement" | "Health Check" | "General";
  target: string;
  dueDate: string;
  priority: "High" | "Medium" | "Low";
  assignedTo: string;
  status: "Pending" | "Active" | "Upcoming" | "Completed";
  completionDate?: string;
  notes?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  tone: "green" | "orange" | "red" | "blue";
  read: boolean;
  targetPage?: string;
}

export interface MultiFarm {
  id: number;
  name: string;
  code: string;
  location: string;
  totalCattle: number;
  sheds: { id: string; name: string; capacity: number; currentCount: number }[];
}

export interface UserRoleProfile {
  role: "Owner" | "Manager" | "Veterinarian" | "Feed Manager" | "Worker" | "Accountant";
  name: string;
  email: string;
  phone: string;
  description: string;
}

export interface SystemFlags {
  auditLogging: boolean;
  authRequired: boolean;
  confirmDelete: boolean;
  recordUserActivity: boolean;
  enableDataExport: boolean;
  enableAuditHistory: boolean;
  autoSyncRestApi: boolean;
  milkWithdrawalSafety: boolean;
  pregnancyReminders: boolean;
  autoBackups: boolean;
  duplicateEarTagCheck: boolean;
}

export type PermissionModule =
  | "Animals"
  | "Milk Management"
  | "Breeding"
  | "Health"
  | "Vaccinations"
  | "Treatments"
  | "Feed"
  | "Inventory"
  | "Finance"
  | "Finance Reports"
  | "Tasks"
  | "Reminders"
  | "Farms"
  | "Groups"
  | "Sheds"
  | "Companies / Suppliers"
  | "Users"
  | "Settings";

export type PermissionAction = "View" | "Create" | "Edit" | "Delete" | "Export";

export interface AppRole {
  id: number;
  name: string;
  code: string;
  description: string;
  isSystem?: boolean;
}

export interface AppUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  roleId: number;
  roleName: string;
  status: "Active" | "Inactive";
  createdAt?: string;
}

export interface ModulePermission {
  module: PermissionModule;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

export interface RolePermissionMatrix {
  roleId: number;
  roleName: string;
  permissions: ModulePermission[];
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: number;
  userName: string;
  userRole: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "EXPORT" | "LOGIN" | "LOGOUT" | "SETTINGS_CHANGE" | "TOGGLE_FLAG" | "PERMISSION_UPDATE";
  module: string;
  recordId?: string;
  details: string;
  ipAddress?: string;
}

export interface FarmSettings {
  farmName: string;
  companyName: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  defaultMilkUnit: string;
  milkPricePerLitre: number;
  managerName: string;
  managerUserId?: number;
  phone: string;
  email: string;
  notificationsEnabled: boolean;
  autoBackup: boolean;
  productionDropAlertThreshold: number; // e.g. 15%
  prolongedOpenDaysThreshold: number; // e.g. 90 DIM
  heiferBreedingAgeMonths: number; // e.g. 14 months
  gestationPeriodDays: number; // e.g. 280 days
  pdCheckDays?: number; // e.g. 35 days
  heatToAiHours?: number; // e.g. 12 hours
  flags?: SystemFlags;
}

export interface AnimalAnalytics {
  reproduction: {
    currentState: string;
    reproductiveStage: string;
    lactationCycle: string;
    daysInMilk: string;
    lastCalvingDate?: string | null;
    lastAiDate?: string | null;
    expectedCalving?: string | null;
    hasData: boolean;
  };
  milkSummary: {
    currentDailyYield: number;
    sevenDayAvg: number;
    peakYield: number;
    lifetimeTotal: number;
    recordCount: number;
    hasData: boolean;
  };
  economics: {
    milkPricePerLitre: number;
    dailyYieldUsed: number;
    dailyRevenue: number;
    dailyFeedCost: number;
    dailyNetMargin: number;
    feedRationGroup: string;
  };
  sevenDayTrend: Array<{
    date: string;
    dayLabel: string;
    litres: number;
  }>;
  timeline: Array<{
    date: string;
    title: string;
    desc: string;
    type: "Milk" | "Breeding" | "Health" | "Calving" | "Note" | "Sale" | "Mortality" | "General";
  }>;
}

export interface FarmEventNote {
  id: string;
  animalId: string;
  animalName?: string;
  date: string;
  eventType: string;
  title: string;
  notes: string;
  metric1?: string;
  metric2?: string;
}
