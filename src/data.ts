import {
  Animal,
  MilkRecord,
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
  NotificationItem,
  MultiFarm,
  UserRoleProfile,
  FarmSettings,
  MilkAlert,
  AppRole,
  AppUser,
  RolePermissionMatrix,
  ModulePermission,
  PermissionModule,
  AuditLogItem,
  SystemFlags
} from "./types";

export const initialAnimals: Animal[] = [
  {
    id: "HF-027",
    dbId: 1,
    earTag: "ET-1027",
    rfid: "RF-9206100027",
    name: "Bella",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2022-01-12",
    age: "2y 4m",
    colorMarkings: "Black & White (80% White)",
    source: "Homebred",
    status: "Lactating",
    group: "High Milking Group",
    location: "Shed 1 - Row A",
    dam: "HF-011",
    sire: "Bull-04 (Champion Alta)",
    lactation: 3,
    dim: 216,
    milk: 28.7,
    weightKg: 580,
    heightCm: 144,
    remarks: "Top herd producer, calm temperament, excellent udder conformation.",
    photo: "/bella-cow.jpg",
    farmId: 1,
    activeWithdrawal: {
      medicine: "Intramast-DC",
      safeDate: "2024-05-21",
      active: true,
    }
  },
  {
    id: "HF-031",
    dbId: 2,
    earTag: "ET-1031",
    rfid: "RF-9206100031",
    name: "Daisy",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2021-02-03",
    age: "3y 3m",
    colorMarkings: "Black & White Spotted",
    source: "Purchased",
    purchaseDate: "2022-05-10",
    purchasePrice: 420000,
    landedCost: 435000,
    previousFarm: "Al-Rehman Dairy Farm Kasur",
    status: "Lactating",
    group: "High Milking Group",
    location: "Shed 1 - Row A",
    dam: "HF-008",
    sire: "Bull-02 (Semex Star)",
    lactation: 2,
    dim: 185,
    milk: 27.4,
    weightKg: 565,
    heightCm: 142,
    remarks: "High butterfat yield, regular estrus cycle.",
    farmId: 1
  },
  {
    id: "HF-014",
    dbId: 3,
    earTag: "ET-1014",
    rfid: "RF-9206100014",
    name: "Molly",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2020-07-20",
    age: "3y 10m",
    colorMarkings: "Dominant Black with White Star",
    source: "Homebred",
    status: "Lactating",
    group: "Medium Milking Group",
    location: "Shed 1 - Row B",
    dam: "HF-006",
    sire: "Bull-03",
    lactation: 3,
    dim: 142,
    milk: 26.1,
    weightKg: 590,
    heightCm: 145,
    remarks: "Strong rumination, high feed conversion ratio.",
    farmId: 1
  },
  {
    id: "HF-021",
    dbId: 4,
    earTag: "ET-1021",
    rfid: "RF-9206100021",
    name: "Lucy",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2019-11-08",
    age: "4y 6m",
    colorMarkings: "Evenly Patched Black & White",
    source: "Purchased",
    purchaseDate: "2021-03-15",
    purchasePrice: 380000,
    status: "Lactating",
    group: "Medium Milking Group",
    location: "Shed 1 - Row B",
    dam: "HF-004",
    sire: "Bull-01",
    lactation: 4,
    dim: 230,
    milk: 25.3,
    weightKg: 610,
    heightCm: 146,
    remarks: "Solid 4th lactation cow, veteran milker.",
    farmId: 1
  },
  {
    id: "HF-033",
    dbId: 5,
    earTag: "ET-1033",
    rfid: "RF-9206100033",
    name: "Nora",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2021-03-14",
    age: "3y 2m",
    colorMarkings: "White body with black head",
    source: "Homebred",
    status: "Lactating",
    group: "Medium Milking Group",
    location: "Shed 1 - Row C",
    dam: "HF-012",
    sire: "Bull-04",
    lactation: 2,
    dim: 160,
    milk: 24.8,
    weightKg: 540,
    heightCm: 140,
    remarks: "Mother of calf Coco (HF-072).",
    farmId: 1
  },
  {
    id: "HF-045",
    dbId: 6,
    earTag: "ET-1045",
    rfid: "RF-9206100045",
    name: "Rose",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2020-05-05",
    age: "4y",
    colorMarkings: "Classic HF Pattern",
    source: "Homebred",
    status: "Dry",
    group: "Dry Group",
    location: "Shed 2 - Row A",
    dam: "HF-017",
    sire: "Bull-02",
    lactation: 2,
    dim: null,
    milk: null,
    weightKg: 620,
    heightCm: 145,
    remarks: "Dry-off period underway. Scheduled for mineral bolus.",
    farmId: 1
  },
  {
    id: "HF-052",
    dbId: 7,
    earTag: "ET-1052",
    rfid: "RF-9206100052",
    name: "Zara",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2021-08-18",
    age: "2y 9m",
    colorMarkings: "Black mantle",
    source: "Homebred",
    status: "Pregnant",
    group: "Pregnant Group",
    location: "Shed 2 - Row A",
    dam: "HF-019",
    sire: "Bull-03",
    lactation: null,
    dim: null,
    milk: null,
    weightKg: 530,
    heightCm: 141,
    remarks: "Confirmed pregnant on ultrasound. Calving expected Jan 2025.",
    farmId: 1
  },
  {
    id: "HF-061",
    dbId: 8,
    earTag: "ET-1061",
    rfid: "RF-9206100061",
    name: "Lily",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2022-12-22",
    age: "1y 5m",
    colorMarkings: "White blaze on forehead",
    source: "Homebred",
    status: "Heifer",
    group: "Heifer Pen",
    location: "Heifer Pen - North",
    dam: "HF-024",
    sire: "Bull-05",
    lactation: null,
    dim: null,
    milk: null,
    weightKg: 360,
    heightCm: 130,
    remarks: "Approaching breeding weight (Target 380kg for AI).",
    farmId: 1
  },
  {
    id: "HF-072",
    dbId: 9,
    earTag: "ET-1072",
    rfid: "RF-9206100072",
    name: "Coco",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2024-02-10",
    age: "3m 4d",
    colorMarkings: "Black coat with four white socks",
    source: "Homebred",
    status: "Calf",
    group: "Calf Pen",
    location: "Calf Barn - Hutch 4",
    dam: "HF-033",
    sire: "Bull-04",
    lactation: null,
    dim: null,
    milk: null,
    weightKg: 98,
    heightCm: 92,
    remarks: "Excellent vigor, consuming 1.8kg calf starter daily.",
    farmId: 1
  },
  {
    id: "HF-081",
    dbId: 10,
    earTag: "ET-1081",
    rfid: "RF-9206100081",
    name: "Minnie",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2022-09-28",
    age: "1y 8m",
    colorMarkings: "Evenly balanced HF markings",
    source: "Homebred",
    status: "Lactating",
    group: "High Milking Group",
    location: "Shed 1 - Row C",
    dam: "HF-027",
    sire: "Bull-06 (AltaWheel)",
    lactation: 1,
    dim: 95,
    milk: 20.2,
    weightKg: 490,
    heightCm: 138,
    remarks: "First lactation heifer doing very well. Daughter of Bella (HF-027).",
    farmId: 1
  },
  {
    id: "HF-095",
    dbId: 11,
    earTag: "ET-1095",
    rfid: "RF-9206100095",
    name: "Sultan",
    breed: "HF (Holstein Friesian)",
    sex: "Male",
    dob: "2021-06-10",
    age: "2y 11m",
    colorMarkings: "Black dominant bull",
    source: "Imported",
    purchaseDate: "2022-08-01",
    purchasePrice: 650000,
    status: "Bull",
    group: "Bull Pen",
    location: "Sire Barn 1",
    dam: "Import-Dam-USA",
    sire: "AltaGenetics Sire 88",
    lactation: null,
    dim: null,
    milk: null,
    weightKg: 780,
    heightCm: 156,
    remarks: "Primary stud bull with high genetic milk transmission traits.",
    farmId: 1
  },
  {
    id: "HF-018",
    dbId: 12,
    earTag: "ET-1018",
    rfid: "RF-9206100018",
    name: "Luna",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2020-04-18",
    age: "4y 1m",
    colorMarkings: "White belt pattern",
    source: "Purchased",
    status: "Sold",
    group: "Discharged",
    location: "Archived",
    dam: "HF-003",
    sire: "Bull-01",
    lactation: 3,
    dim: null,
    milk: null,
    weightKg: 570,
    heightCm: 142,
    remarks: "Sold to commercial buyer due to surplus heifer batch.",
    farmId: 1,
    saleInfo: {
      buyer: "Malik Dairy Farm Okara",
      date: "2024-04-10",
      salePrice: 340000,
      reason: "Surplus Herd",
      weight: 570,
      profitLoss: 60000
    }
  },
  {
    id: "HF-009",
    dbId: 13,
    earTag: "ET-1009",
    rfid: "RF-9206100009",
    name: "Ruby",
    breed: "HF (Holstein Friesian)",
    sex: "Female",
    dob: "2018-03-12",
    age: "5y 11m",
    colorMarkings: "Black patches",
    source: "Homebred",
    status: "Dead",
    group: "Deceased Herd",
    location: "Archived",
    dam: "HF-001",
    sire: "Bull-00",
    lactation: 4,
    dim: null,
    milk: null,
    weightKg: 580,
    heightCm: 144,
    remarks: "Deceased due to acute bloat during monsoon. Full historical records preserved.",
    farmId: 1,
    mortalityInfo: {
      date: "2024-02-18",
      age: "5y 11m",
      cause: "Acute Ruminal Tympany (Bloat)",
      diseaseHistory: "Previous mild indigestion in Dec 2023",
      treatmentNotes: "Emergency trocarization attempted by Dr. Imran",
      financialValue: 320000,
      postMortemNotes: "Severe ruminal distension, diaphragm pressure confirmed."
    }
  }
];

export function getLocalDateString(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function generateInitialMilkRecords(): MilkRecord[] {
  const today = getLocalDateString(0);
  const yesterday = getLocalDateString(-1);
  const twoDaysAgo = getLocalDateString(-2);

  return [
    // Today's records
    { id: "M-101", animalId: "HF-027", name: "Bella", date: today, session: "Both", morningLitres: 14.5, eveningLitres: 14.2, totalLitres: 28.7, fatPercent: 3.8, proteinPercent: 3.25, snfPercent: 8.9, scc: 180, quality: "Premium", rejectedLitres: 10.0, rejectionReason: "Active withdrawal (Intramast)" },
    { id: "M-102", animalId: "HF-031", name: "Daisy", date: today, session: "Both", morningLitres: 13.8, eveningLitres: 13.6, totalLitres: 27.4, fatPercent: 3.7, proteinPercent: 3.22, snfPercent: 8.8, scc: 140, quality: "Premium" },
    { id: "M-103", animalId: "HF-014", name: "Molly", date: today, session: "Both", morningLitres: 13.1, eveningLitres: 13.0, totalLitres: 26.1, fatPercent: 3.9, proteinPercent: 3.30, snfPercent: 8.7, scc: 210, quality: "Standard" },
    { id: "M-104", animalId: "HF-021", name: "Lucy", date: today, session: "Both", morningLitres: 12.7, eveningLitres: 12.6, totalLitres: 25.3, fatPercent: 3.6, proteinPercent: 3.18, snfPercent: 8.6, scc: 190, quality: "Standard" },
    { id: "M-105", animalId: "HF-033", name: "Nora", date: today, session: "Both", morningLitres: 12.4, eveningLitres: 12.4, totalLitres: 24.8, fatPercent: 3.7, proteinPercent: 3.20, snfPercent: 8.7, scc: 165, quality: "Standard" },
    { id: "M-106", animalId: "HF-081", name: "Minnie", date: today, session: "Both", morningLitres: 10.2, eveningLitres: 10.0, totalLitres: 20.2, fatPercent: 3.8, proteinPercent: 3.24, snfPercent: 8.8, scc: 130, quality: "Standard" },
    // Yesterday's records
    { id: "M-95", animalId: "HF-027", name: "Bella", date: yesterday, session: "Both", morningLitres: 14.6, eveningLitres: 14.3, totalLitres: 28.9, fatPercent: 3.8, proteinPercent: 3.24, snfPercent: 8.9, quality: "Premium" },
    { id: "M-96", animalId: "HF-031", name: "Daisy", date: yesterday, session: "Both", morningLitres: 13.7, eveningLitres: 13.5, totalLitres: 27.2, fatPercent: 3.7, proteinPercent: 3.20, snfPercent: 8.8, quality: "Premium" },
    { id: "M-97", animalId: "HF-014", name: "Molly", date: yesterday, session: "Both", morningLitres: 13.0, eveningLitres: 12.9, totalLitres: 25.9, fatPercent: 3.9, proteinPercent: 3.29, snfPercent: 8.7, quality: "Standard" },
    { id: "M-98", animalId: "HF-021", name: "Lucy", date: yesterday, session: "Both", morningLitres: 12.5, eveningLitres: 12.5, totalLitres: 25.0, fatPercent: 3.6, proteinPercent: 3.17, snfPercent: 8.6, quality: "Standard" },
    { id: "M-99", animalId: "HF-033", name: "Nora", date: yesterday, session: "Both", morningLitres: 12.3, eveningLitres: 12.3, totalLitres: 24.6, fatPercent: 3.7, proteinPercent: 3.21, snfPercent: 8.7, quality: "Standard" },
    // 2 Days Ago
    { id: "M-88", animalId: "HF-027", name: "Bella", date: twoDaysAgo, session: "Both", morningLitres: 14.4, eveningLitres: 14.1, totalLitres: 28.5, fatPercent: 3.8, proteinPercent: 3.23, snfPercent: 8.8, quality: "Premium" },
    { id: "M-89", animalId: "HF-031", name: "Daisy", date: twoDaysAgo, session: "Both", morningLitres: 13.6, eveningLitres: 13.4, totalLitres: 27.0, fatPercent: 3.7, proteinPercent: 3.19, snfPercent: 8.8, quality: "Premium" },
  ];
}

export const initialMilkRecords: MilkRecord[] = generateInitialMilkRecords();

export const initialMilkAlerts: MilkAlert[] = [
  {
    id: "ALT-1",
    animalId: "HF-014",
    animalName: "Molly",
    date: getLocalDateString(-1),
    recentAvg: 28.5,
    todayYield: 25.9,
    dropPercentage: 9.1,
    status: "Active",
    disclaimer: "Attention notice: Individual yield drop flagged for manager inspection. Not an automated medical diagnosis."
  }
];

export const initialBreedingEvents: BreedingEvent[] = [
  {
    id: "B-1",
    animal: "HF-027 (Bella)",
    animalId: "HF-027",
    heatDate: "2024-03-12",
    aiDate: "2024-03-13",
    semenBull: "AltaWheel USA Straw #894",
    technician: "Ali Hassan (Certified AI Tech)",
    pdDate: "2024-04-18",
    result: "Positive",
    expectedCalving: "2024-12-18",
    servicesCount: 1,
    notes: "Verified positive via transrectal ultrasound at 36 days."
  },
  {
    id: "B-2",
    animal: "HF-052 (Zara)",
    animalId: "HF-052",
    heatDate: "2024-04-10",
    aiDate: "2024-04-11",
    semenBull: "Semex Gold Bull #102",
    technician: "Dr. Imran (Vet)",
    pdDate: "2024-05-16",
    result: "Positive",
    expectedCalving: "2025-01-18",
    servicesCount: 2,
    notes: "Second service successful after return to estrus in March."
  },
  {
    id: "B-3",
    animal: "HF-031 (Daisy)",
    animalId: "HF-031",
    heatDate: "2024-05-02",
    aiDate: "2024-05-03",
    semenBull: "Bull-02 (Semex Star)",
    technician: "Ali Hassan",
    pdDate: "2024-06-08",
    result: "Pending",
    expectedCalving: "2025-02-07",
    servicesCount: 1,
    notes: "PD scheduled for 35 days post-insemination."
  },
  {
    id: "B-4",
    animal: "HF-061 (Lily)",
    animalId: "HF-061",
    heatDate: "2024-05-10",
    aiDate: "",
    semenBull: "To be selected",
    technician: "—",
    pdDate: "",
    result: "Pending",
    expectedCalving: "",
    servicesCount: 0,
    notes: "First standing heat recorded. Approaching breeding weight."
  }
];

export const initialCalvingRecords: CalvingRecord[] = [
  {
    id: "CALV-1",
    damId: "HF-033",
    damName: "Nora",
    sireId: "Bull-04",
    expectedDate: "2024-02-08",
    actualDate: "2024-02-10",
    difficulty: "Normal",
    calfCount: 1,
    calfSex: "Female",
    birthWeight: 38.5,
    calfId: "HF-072",
    colostrumFedHours: 1.5,
    colostrumLitres: 3.8,
    complications: "None, clean placenta expelled in 4 hours.",
    registeredInHerd: true
  },
  {
    id: "CALV-2",
    damId: "HF-027",
    damName: "Bella",
    sireId: "Bull-06",
    expectedDate: "2022-09-26",
    actualDate: "2022-09-28",
    difficulty: "Normal",
    calfCount: 1,
    calfSex: "Female",
    birthWeight: 40.0,
    calfId: "HF-081",
    colostrumFedHours: 2.0,
    colostrumLitres: 4.0,
    complications: "None",
    registeredInHerd: true
  }
];

export const initialCalfGrowth: CalfGrowthRecord[] = [
  {
    id: "CG-1",
    calfId: "HF-072",
    calfName: "Coco",
    date: "2024-02-10",
    ageMonths: 0,
    weightKg: 38.5,
    heightCm: 76,
    girthCm: 78,
    adgGrams: 0,
    feedType: "Colostrum",
    dailyMilkAllowanceL: 4.0,
    weaningStatus: "Pre-weaning",
    notes: "Birth record baseline."
  },
  {
    id: "CG-2",
    calfId: "HF-072",
    calfName: "Coco",
    date: "2024-03-10",
    ageMonths: 1,
    weightKg: 58.0,
    heightCm: 82,
    girthCm: 88,
    adgGrams: 650,
    feedType: "Whole Milk",
    dailyMilkAllowanceL: 5.0,
    weaningStatus: "Pre-weaning",
    notes: "Active calf, introduced to dry calf starter pelleted feed."
  },
  {
    id: "CG-3",
    calfId: "HF-072",
    calfName: "Coco",
    date: "2024-04-10",
    ageMonths: 2,
    weightKg: 79.5,
    heightCm: 88,
    girthCm: 98,
    adgGrams: 716,
    feedType: "Calf Starter",
    dailyMilkAllowanceL: 3.0,
    weaningStatus: "Weaning in Progress",
    notes: "Calf starter intake reached 1.5 kg/day."
  },
  {
    id: "CG-4",
    calfId: "HF-072",
    calfName: "Coco",
    date: "2024-05-10",
    ageMonths: 3,
    weightKg: 98.0,
    heightCm: 92,
    girthCm: 108,
    adgGrams: 750,
    feedType: "Calf Starter",
    dailyMilkAllowanceL: 1.0,
    weaningStatus: "Weaned",
    notes: "Successfully weaned off whole milk onto calf starter + lucerne hay."
  }
];

export const initialDiseases: Disease[] = [
  {
    id: "DIS-1",
    name: "Mastitis (Clinical / Subclinical)",
    category: "Mammary",
    commonSymptoms: "Swollen hot quarter, curdled milk, drop in yield, elevated SCC.",
    recommendedTreatments: "Intramammary antibiotic infusions (Intramast-DC), anti-inflammatories, frequent strip milking."
  },
  {
    id: "DIS-2",
    name: "Foot and Mouth Disease (FMD)",
    category: "Infectious",
    commonSymptoms: "High fever, excessive salivation (stringy), vesicles on tongue/lips, hoof lesions causing lameness.",
    recommendedTreatments: "Isolation, antiseptic mouth washes (potassium permanganate), antibiotic cover for secondary infections, vaccination prophylaxis."
  },
  {
    id: "DIS-3",
    name: "Hemorrhagic Septicemia (HS / Gal Ghotu)",
    category: "Infectious",
    commonSymptoms: "Sudden high fever, swelling of throat/neck, severe respiratory distress, frothing at mouth.",
    recommendedTreatments: "Immediate IV antibiotics (Oxytetracycline/Sulfa drugs), NSAIDs, intensive hydration, pre-monsoon vaccination."
  },
  {
    id: "DIS-4",
    name: "Blackleg (BQ)",
    category: "Infectious",
    commonSymptoms: "Crepitating swelling under skin (gas crackling) on thighs/shoulders, acute lameness, high fever.",
    recommendedTreatments: "High-dose crystalline penicillin in early stages, NSAIDs, annual combined vaccine."
  },
  {
    id: "DIS-5",
    name: "Tick-Borne Fever (Theileriosis / Babesiosis)",
    category: "Parasitic",
    commonSymptoms: "Enlarged superficial lymph nodes, persistent high fever, pale/jaundiced mucous membranes, hemoglobinuria (red urine).",
    recommendedTreatments: "Buparvaquone (Theileriosis), Diminazene aceturate / Imidocarb (Babesiosis), supportive iron/B-complex tonics, acaricide spraying."
  },
  {
    id: "DIS-6",
    name: "Bovine Respiratory Disease (Pneumonia)",
    category: "Respiratory",
    commonSymptoms: "Nasal discharge, coughing, rapid shallow breathing, fever > 103°F, dullness.",
    recommendedTreatments: "Broad-spectrum antibiotics (Florfenicol / Tulathromycin), NSAIDs (Flunixin), clean ventilated bedding."
  },
  {
    id: "DIS-7",
    name: "Subclinical / Clinical Ketosis",
    category: "Metabolic",
    commonSymptoms: "Sweet acetone smell in breath/milk, rapid body condition loss post-calving, appetite drop for concentrates.",
    recommendedTreatments: "Oral propylene glycol drench, IV 50% dextrose, corticosteroid injection, niacin supplement."
  },
  {
    id: "DIS-8",
    name: "Milk Fever (Hypocalcemia)",
    category: "Metabolic",
    commonSymptoms: "Muscle tremors, inability to rise (downer cow), S-shaped neck curvature, cold extremities post-calving.",
    recommendedTreatments: "Slow IV Calcium Borogluconate 400ml warmed to body temp, followed by subcutaneous calcium gel."
  },
  {
    id: "DIS-9",
    name: "Metritis / Retained Placenta",
    category: "Reproductive",
    commonSymptoms: "Foul-smelling reddish-brown uterine discharge 2-10 days postpartum, fever, reduced milk.",
    recommendedTreatments: "Systemic Ceftiofur antibiotics, PGF2a luteolytic hormones, uterine flushes if indicated."
  },
  {
    id: "DIS-10",
    name: "Sole Ulcer / Foot Rot (Lameness)",
    category: "Hoof/Lameness",
    commonSymptoms: "Reluctance to walk, arched back, visible hoof cleft swelling, necrotic odor.",
    recommendedTreatments: "Hoof trimming, block application to healthy claw, topical copper sulfate/antibiotic spray, systemic oxytetracycline."
  }
];

export const initialMedicines: MedicineItem[] = [
  {
    id: "MED-1",
    name: "Intramast-DC",
    manufacturer: "ICI Pakistan / PharmaVet",
    batch: "IM-2024-88",
    quantity: 85,
    unit: "tubes",
    unitPrice: 450,
    expiry: "2025-11-30",
    supplier: "Green Vet Supplies Lahore",
    withdrawalDays: 5,
    category: "Antibiotic"
  },
  {
    id: "MED-2",
    name: "Albendazole 10% Oral",
    manufacturer: "Star Laboratories",
    batch: "ALB-902",
    quantity: 45,
    unit: "bottles (1L)",
    unitPrice: 620,
    expiry: "2025-08-15",
    supplier: "VetCare Multan",
    withdrawalDays: 3,
    category: "Dewormer"
  },
  {
    id: "MED-3",
    name: "FMD Oil Adjuvant Vaccine",
    manufacturer: "Veterinary Research Institute (VRI) Lahore",
    batch: "FMD-VRI-04",
    quantity: 120,
    unit: "doses",
    unitPrice: 350,
    expiry: "2024-12-31",
    supplier: "Livestock & Dairy Development Dept",
    withdrawalDays: 0,
    category: "Vaccine"
  },
  {
    id: "MED-4",
    name: "Flunixin Meglumine (NSAID)",
    manufacturer: "Hilton Pharma Animal Health",
    batch: "FLX-551",
    quantity: 28,
    unit: "vials (100ml)",
    unitPrice: 1250,
    expiry: "2025-10-20",
    supplier: "Green Vet Supplies Lahore",
    withdrawalDays: 2,
    category: "Anti-inflammatory"
  },
  {
    id: "MED-5",
    name: "Oxytetracycline 20% LA",
    manufacturer: "Selmore Agencies",
    batch: "OXY-773",
    quantity: 34,
    unit: "vials (100ml)",
    unitPrice: 850,
    expiry: "2026-01-15",
    supplier: "VetCare Multan",
    withdrawalDays: 7,
    category: "Antibiotic"
  },
  {
    id: "MED-6",
    name: "Cal-Borogluconate 40%",
    manufacturer: "Sami Pharmaceuticals",
    batch: "CBG-110",
    quantity: 18,
    unit: "infusion bottles (450ml)",
    unitPrice: 750,
    expiry: "2025-09-30",
    supplier: "Green Vet Supplies Lahore",
    withdrawalDays: 0,
    category: "Supplement"
  }
];

export const initialHealthRecords: HealthRecord[] = [
  {
    id: "H-1",
    date: "2024-05-14",
    animal: "HF-027 (Bella)",
    animalId: "HF-027",
    problem: "Mild Clinical Mastitis in Right Rear quarter",
    symptoms: "Quarter warmth, slight flaking in foremilk, SCC elevated.",
    diagnosis: "Mastitis (Clinical)",
    veterinarian: "Dr. Imran (DVM)",
    treatment: "Intramammary antibiotic infusion twice daily for 3 days.",
    medicine: "Intramast-DC",
    medicineId: "MED-1",
    dose: "1 tube (10ml)",
    doseQty: 1,
    duration: "3 Days",
    cost: 1350,
    status: "In Treatment",
    withdrawalDays: 5,
    withdrawalUntil: "2024-05-21",
    remarks: "Milk must be discarded and withheld from bulk tank."
  },
  {
    id: "H-2",
    date: "2024-04-22",
    animal: "HF-031 (Daisy)",
    animalId: "HF-031",
    problem: "Tick Infestation & Low-grade Fever",
    symptoms: "Fever 103.5°F, lethargy, reduced silage appetite.",
    diagnosis: "Tick-Borne Fever (Theileriosis / Babesiosis)",
    veterinarian: "Dr. Imran (DVM)",
    treatment: "Antipyretic injection + Buparvaquone and B-Complex.",
    medicine: "Flunixin Meglumine (NSAID)",
    medicineId: "MED-4",
    dose: "15 ml IV",
    doseQty: 1,
    duration: "2 Days",
    cost: 3200,
    status: "Recovered",
    withdrawalDays: 2,
    withdrawalUntil: "2024-04-25",
    remarks: "Complete recovery confirmed on 25 April. Appetite restored."
  },
  {
    id: "H-3",
    date: "2024-02-15",
    animal: "HF-014 (Molly)",
    animalId: "HF-014",
    problem: "Routine Spring Deworming",
    symptoms: "None (preventative)",
    diagnosis: "Routine Parasite Control",
    veterinarian: "Vet Team",
    treatment: "Oral drench",
    medicine: "Albendazole 10% Oral",
    medicineId: "MED-2",
    dose: "90 ml oral",
    doseQty: 1,
    duration: "1 Day",
    cost: 300,
    status: "Recovered",
    withdrawalDays: 3,
    withdrawalUntil: "2024-02-18",
    remarks: "Standard herd protocol."
  },
  {
    id: "H-4",
    date: "2024-01-10",
    animal: "HF-021 (Lucy)",
    animalId: "HF-021",
    problem: "Annual FMD Immunization",
    symptoms: "Healthy cow",
    diagnosis: "Vaccination Program",
    veterinarian: "Dr. Imran",
    treatment: "Subcutaneous injection in neck area",
    medicine: "FMD Oil Adjuvant Vaccine",
    medicineId: "MED-3",
    dose: "2 ml SC",
    doseQty: 1,
    duration: "1 Day",
    cost: 350,
    status: "Vaccination",
    withdrawalDays: 0,
    withdrawalUntil: "2024-01-10",
    remarks: "Next booster due in July 2024."
  }
];

export const initialVaccinations: VaccinationSchedule[] = [
  {
    id: "VAC-1",
    vaccine: "FMD Oil Adjuvant Vaccine",
    targetGroup: "All Adult Cattle (Shed 1 & 2)",
    date: "2024-01-10",
    batch: "FMD-VRI-04",
    manufacturer: "VRI Lahore",
    nextDueDate: "2024-07-10",
    veterinarian: "Dr. Imran",
    status: "Completed"
  },
  {
    id: "VAC-2",
    vaccine: "HS & BQ Combined Vaccine (Pre-Monsoon)",
    targetGroup: "Entire Herd & Heifers",
    date: "2024-05-25",
    batch: "HS-BQ-24",
    manufacturer: "VRI Lahore",
    nextDueDate: "2024-05-25",
    veterinarian: "Dr. Imran",
    status: "Scheduled"
  },
  {
    id: "VAC-3",
    vaccine: "Anthrax Spore Vaccine",
    targetGroup: "Adult Herd",
    date: "2023-11-15",
    batch: "ANT-23-09",
    manufacturer: "VRI Lahore",
    nextDueDate: "2024-11-15",
    veterinarian: "Dr. Imran",
    status: "Scheduled"
  }
];

export const initialFeeds: FeedItem[] = [
  { id: "F-1", name: "Maize Silage (Fermented Corn)", category: "Forage", unit: "kg", unitPrice: 32, stock: 18500, minStock: 3000, supplier: "AgriSilage Punjab Ltd", dmPercent: 32, cpPercent: 8.5, meEnergy: 10.8, status: "Available" },
  { id: "F-2", name: "Wanda / Concentrate Pellets (18% CP)", category: "Concentrate", unit: "kg", unitPrice: 145, stock: 4250, minStock: 1000, supplier: "National Feed Mills Lahore", dmPercent: 88, cpPercent: 18.0, meEnergy: 12.2, status: "Available" },
  { id: "F-3", name: "Lucerne / Alfalfa Hay", category: "Forage", unit: "kg", unitPrice: 42, stock: 6500, minStock: 1200, supplier: "Sahiwal Green Forage", dmPercent: 86, cpPercent: 16.5, meEnergy: 9.5, status: "Available" },
  { id: "F-4", name: "Wheat Straw (Bhoosa)", category: "Roughage", unit: "kg", unitPrice: 22, stock: 9200, minStock: 2000, supplier: "Local Agri Grain Sellers", dmPercent: 90, cpPercent: 3.5, meEnergy: 6.2, status: "Available" },
  { id: "F-5", name: "Minerals & Vitamin Premix", category: "Supplements", unit: "kg", unitPrice: 240, stock: 680, minStock: 150, supplier: "NutriVet Pakistan", dmPercent: 95, cpPercent: 0, meEnergy: 0, status: "Available" },
  { id: "F-6", name: "Di-Calcium Phosphate (DCP)", category: "Minerals", unit: "kg", unitPrice: 180, stock: 340, minStock: 500, supplier: "FeedTech Agro Chemicals", dmPercent: 98, cpPercent: 0, meEnergy: 0, status: "Low Stock" },
  { id: "F-7", name: "Live Yeast Culture & Toxin Binder", category: "Supplements", unit: "kg", unitPrice: 650, stock: 95, minStock: 50, supplier: "BioAgri Solutions", dmPercent: 92, cpPercent: 24.0, meEnergy: 11.0, status: "Available" },
  { id: "F-8", name: "Calf Starter Pellets (20% CP)", category: "Calf Feed", unit: "kg", unitPrice: 165, stock: 1200, minStock: 400, supplier: "National Feed Mills Lahore", dmPercent: 89, cpPercent: 20.0, meEnergy: 12.8, status: "Available" }
];

export const initialRationPlans: RationPlan[] = [
  {
    id: "RAT-1",
    name: "High Producer TMR (25L+ Daily)",
    group: "High Milking Group",
    targetCowCount: 5,
    ingredients: [
      { feedId: "F-1", feedName: "Maize Silage", kgPerCow: 32, unitPrice: 32, totalCostPerCow: 1024 },
      { feedId: "F-2", feedName: "Wanda Concentrate (18% CP)", kgPerCow: 9.5, unitPrice: 145, totalCostPerCow: 1377.5 },
      { feedId: "F-3", feedName: "Lucerne Hay", kgPerCow: 3.5, unitPrice: 42, totalCostPerCow: 147 },
      { feedId: "F-4", feedName: "Wheat Straw", kgPerCow: 1.5, unitPrice: 22, totalCostPerCow: 33 },
      { feedId: "F-5", feedName: "Minerals Premix", kgPerCow: 0.25, unitPrice: 240, totalCostPerCow: 60 },
      { feedId: "F-7", feedName: "Yeast & Toxin Binder", kgPerCow: 0.05, unitPrice: 650, totalCostPerCow: 32.5 }
    ],
    totalKgPerCow: 46.8,
    totalCostPerCow: 2674,
    costPerLiterExpected: 96.5,
    dailyGroupConsumptionKg: 234.0,
    dailyGroupCost: 13370
  },
  {
    id: "RAT-2",
    name: "Medium Producer TMR (18-25L Daily)",
    group: "Medium Milking Group",
    targetCowCount: 3,
    ingredients: [
      { feedId: "F-1", feedName: "Maize Silage", kgPerCow: 28, unitPrice: 32, totalCostPerCow: 896 },
      { feedId: "F-2", feedName: "Wanda Concentrate", kgPerCow: 6.5, unitPrice: 145, totalCostPerCow: 942.5 },
      { feedId: "F-3", feedName: "Lucerne Hay", kgPerCow: 3.0, unitPrice: 42, totalCostPerCow: 126 },
      { feedId: "F-4", feedName: "Wheat Straw", kgPerCow: 2.0, unitPrice: 22, totalCostPerCow: 44 },
      { feedId: "F-5", feedName: "Minerals Premix", kgPerCow: 0.2, unitPrice: 240, totalCostPerCow: 48 }
    ],
    totalKgPerCow: 39.7,
    totalCostPerCow: 2056.5,
    costPerLiterExpected: 91.4,
    dailyGroupConsumptionKg: 119.1,
    dailyGroupCost: 6169.5
  },
  {
    id: "RAT-3",
    name: "Dry Cow Maintenance & Transition",
    group: "Dry Group",
    targetCowCount: 1,
    ingredients: [
      { feedId: "F-1", feedName: "Maize Silage", kgPerCow: 20, unitPrice: 32, totalCostPerCow: 640 },
      { feedId: "F-4", feedName: "Wheat Straw", kgPerCow: 5, unitPrice: 22, totalCostPerCow: 110 },
      { feedId: "F-2", feedName: "Wanda Concentrate", kgPerCow: 2.5, unitPrice: 145, totalCostPerCow: 362.5 },
      { feedId: "F-5", feedName: "Minerals Premix (Dry Cow Spec)", kgPerCow: 0.2, unitPrice: 240, totalCostPerCow: 48 }
    ],
    totalKgPerCow: 27.7,
    totalCostPerCow: 1160.5,
    costPerLiterExpected: 0,
    dailyGroupConsumptionKg: 27.7,
    dailyGroupCost: 1160.5
  }
];

export const initialCustomers: Customer[] = [
  {
    id: "CUST-1",
    name: "Nestlé Pakistan Milk Collection Center",
    phone: "+92 42 111 637 853",
    address: "Chichawatni Road, Sahiwal Milk Grid",
    dailyQuotaLitres: 1600,
    ratePerLitre: 152,
    deliveryTime: "Both",
    outstandingBalance: 486400,
    paymentTerms: "Weekly",
    status: "Active"
  },
  {
    id: "CUST-2",
    name: "Engro Foods / Olpers Direct Depot",
    phone: "+92 42 3578 4000",
    address: "Ferozepur Road Hub, Kasur",
    dailyQuotaLitres: 350,
    ratePerLitre: 155,
    deliveryTime: "Morning",
    outstandingBalance: 162750,
    paymentTerms: "Weekly",
    status: "Active"
  },
  {
    id: "CUST-3",
    name: "Lahore Gourmet Sweets & Dairy",
    phone: "+92 300 8456789",
    address: "Gulberg III, Lahore",
    dailyQuotaLitres: 120,
    ratePerLitre: 175,
    deliveryTime: "Morning",
    outstandingBalance: 31500,
    paymentTerms: "Daily Cash",
    status: "Active"
  }
];

export const initialSuppliers: Supplier[] = [
  {
    id: "SUP-1",
    name: "AgriSilage Punjab Ltd",
    contactPerson: "Chaudhry Tariq Mehmood",
    phone: "+92 301 7766554",
    address: "Kot Radha Kishan, Punjab",
    products: ["Maize Silage", "Alfalfa Bales"],
    outstandingPayable: 184000,
    paymentTerms: "30 Days Net"
  },
  {
    id: "SUP-2",
    name: "National Feed Mills Lahore",
    contactPerson: "Engr. Salman Raza",
    phone: "+92 321 4455667",
    address: "Raiwind Road Industrial Area, Lahore",
    products: ["Wanda 18% CP", "Calf Starter 20% CP"],
    outstandingPayable: 95000,
    paymentTerms: "15 Days Net"
  },
  {
    id: "SUP-3",
    name: "Green Vet Supplies Lahore",
    contactPerson: "Dr. Bilal Aslam",
    phone: "+92 333 5566778",
    address: "Bird Market / Vet Plaza, Lahore",
    products: ["Intramast-DC", "Flunixin", "Oxytetracycline", "AI Straws"],
    outstandingPayable: 24500,
    paymentTerms: "Cash on Delivery"
  }
];

export const initialTransactions: FinancialTransaction[] = [
  { id: "TX-101", type: "Income", category: "Milk Sales", amount: 297000, date: "2024-05-14", description: "1,980 L sold @ Rs 150/L to Nestlé Pakistan", entityName: "Nestlé Pakistan", paymentMethod: "Bank Transfer", farmName: "Main Punjab Unit", receiptRef: "REC-2024-0514-01" },
  { id: "TX-102", type: "Income", category: "Animal Sales", amount: 340000, date: "2024-04-10", description: "Sale of cow HF-018 to Malik Dairy Farm", entityName: "Malik Dairy Farm Okara", paymentMethod: "Bank Transfer", farmName: "Main Punjab Unit", receiptRef: "REC-2024-0410-02" },
  { id: "TX-103", type: "Income", category: "Manure Sales", amount: 18500, date: "2024-05-12", description: "Organic decomposed manure 4 trolley loads", entityName: "Green Valley Orchards", paymentMethod: "Cash", farmName: "Main Punjab Unit", receiptRef: "REC-2024-0512-03" },
  { id: "TX-104", type: "Expense", category: "Feed Purchase", amount: 92000, date: "2024-05-14", description: "3 tonnes maize silage & concentrate delivery", entityName: "AgriSilage Punjab Ltd", paymentMethod: "Bank Transfer", farmName: "Main Punjab Unit", receiptRef: "INV-FEED-9901" },
  { id: "TX-105", type: "Expense", category: "Veterinary & Medicine", amount: 24500, date: "2024-05-14", description: "Intramast tubes & NSAID replenishment", entityName: "Green Vet Supplies Lahore", paymentMethod: "Cash", farmName: "Main Punjab Unit", receiptRef: "VET-BILL-441" },
  { id: "TX-106", type: "Expense", category: "Labor / Wages", amount: 48000, date: "2024-05-14", description: "Fortnightly farm hands & milking parlor staff wages", entityName: "Farm Workers Payroll", paymentMethod: "Cash", farmName: "Main Punjab Unit" },
  { id: "TX-107", type: "Expense", category: "Electricity & Utilities", amount: 38500, date: "2024-05-13", description: "LESCO Agri Tube Well & Chiller Electricity Bill", entityName: "LESCO / WAPDA", paymentMethod: "Bank Transfer", farmName: "Main Punjab Unit" },
  { id: "TX-108", type: "Expense", category: "Diesel & Generator Fuel", amount: 22000, date: "2024-05-11", description: "80 Litres diesel for backup generator during loadshedding", entityName: "PSO Filling Station", paymentMethod: "Cash", farmName: "Main Punjab Unit" }
];

export const initialTasks: TaskItem[] = [
  { id: "T-101", title: "Pregnancy Diagnosis Ultrasound", taskType: "Pregnancy Diagnosis", target: "HF-052 (Zara)", dueDate: "2024-05-16", priority: "High", assignedTo: "Dr. Imran (Vet)", status: "Pending", notes: "Perform 35-day transrectal ultrasound verification." },
  { id: "T-102", title: "Pre-Monsoon HS & BQ Vaccination Booster", taskType: "Vaccination", target: "Entire Herd (Shed 1 & 2)", dueDate: "2024-05-21", priority: "High", assignedTo: "Vet Team", status: "Pending", notes: "Administer combined HS-BQ oil adjuvant vaccine before rainy season." },
  { id: "T-103", title: "Review Medicine Withdrawal Clearance", taskType: "Medicine", target: "HF-027 (Bella)", dueDate: "2024-05-21", priority: "High", assignedTo: "Dr. Imran (Vet)", status: "Active", notes: "Check right rear quarter condition before resuming milk pooling." },
  { id: "T-104", title: "Maternity Pen Bedding & Disinfection", taskType: "Expected Calving", target: "Maternity Barn Pen 1", dueDate: "2024-05-24", priority: "Medium", assignedTo: "Muhammad Ali (Manager)", status: "Upcoming", notes: "Prepare fresh wheat straw bedding for anticipated calvings." },
  { id: "T-105", title: "Routine Hoof Trimming & Claw Check", taskType: "Hoof Trimming", target: "Shed 1 High Milk Row", dueDate: "2024-05-27", priority: "Medium", assignedTo: "Farm Herdsman Team", status: "Upcoming", notes: "Preventative hoof care to maintain locomotion scores." },
  { id: "T-106", title: "Calf Growth Girth & Weight Measurement", taskType: "Weight Measurement", target: "HF-072 (Coco) & Calves", dueDate: "2024-06-10", priority: "Low", assignedTo: "Ali Hassan", status: "Upcoming", notes: "Monthly heart-girth scale logging for ADG verification." }
];

export const initialMultiFarms: MultiFarm[] = [
  {
    id: 1,
    name: "Punjab Commercial Dairy - Unit 1 (Main)",
    code: "FARM-PJB-01",
    location: "Raiwind-Kasur Road, Lahore District, Punjab",
    totalCattle: 13,
    sheds: [
      { id: "SHED-1", name: "Shed 1 - Free Stall Lactating Parlor", capacity: 50, currentCount: 6 },
      { id: "SHED-2", name: "Shed 2 - Dry & Maternity Barn", capacity: 30, currentCount: 2 },
      { id: "SHED-3", name: "Heifer Development Pen", capacity: 25, currentCount: 1 },
      { id: "SHED-4", name: "Calf Individual Hutch Village", capacity: 20, currentCount: 1 },
      { id: "SHED-5", name: "Sire / Quarantine Unit", capacity: 10, currentCount: 1 }
    ]
  },
  {
    id: 2,
    name: "Sahiwal Purebred Cattle Center - Unit 2",
    code: "FARM-SHW-02",
    location: "Old Chichawatni Highway, Sahiwal District, Punjab",
    totalCattle: 45,
    sheds: [
      { id: "SHED-201", name: "Shed A - Sahiwal Milkers", capacity: 40, currentCount: 32 },
      { id: "SHED-202", name: "Shed B - Calves & Heifers", capacity: 30, currentCount: 13 }
    ]
  },
  {
    id: 3,
    name: "Kasur Heifer Rearing & Grazing Facility",
    code: "FARM-KSR-03",
    location: "Ganda Singh Border Road, Kasur, Punjab",
    totalCattle: 28,
    sheds: [
      { id: "SHED-301", name: "Paddock 1 - Open Grazing Paddock", capacity: 50, currentCount: 28 }
    ]
  }
];

export const initialUserRoles: UserRoleProfile[] = [
  {
    role: "Owner",
    name: "Haji Muhammad Tariq",
    email: "owner@punjabdairy.com",
    phone: "+92 300 8400111",
    description: "Complete unrestricted administrative control, financial auditing, asset valuation, and farm configuration."
  },
  {
    role: "Manager",
    name: "Muhammad Ali (Senior Manager)",
    email: "admin@dairyfarm.local",
    phone: "+92 300 1234567",
    description: "Full day-to-day herd management, feed schedules, task dispatching, inventory replenishment, and customer delivery logs."
  },
  {
    role: "Veterinarian",
    name: "Dr. Imran Khan (DVM, MS Theriogenology)",
    email: "dr.imran@vetcare.pk",
    phone: "+92 321 9876543",
    description: "Dedicated access to health records, disease diagnoses, prescriptions, artificial inseminations, pregnancy checks, and milk withdrawal restrictions."
  },
  {
    role: "Feed Manager",
    name: "Chaudhry Asghar",
    email: "feed@dairyfarm.local",
    phone: "+92 312 3456789",
    description: "Formulation of daily TMR rations, grain stock audits, nutrient tracking, and silage pit level management."
  },
  {
    role: "Worker",
    name: "Rashid Mahmood (Milking Operator)",
    email: "staff@dairyfarm.local",
    phone: "+92 345 6789012",
    description: "Simplified fast 2-tap data entry interface for morning/evening milk liters, heat observations, and calving logs."
  },
  {
    role: "Accountant",
    name: "Farhan Siddiqui (CPA)",
    email: "accounts@dairyfarm.local",
    phone: "+92 333 4567890",
    description: "Financial transactions, milk revenue reconciliations, customer accounts receivable, feed invoice approvals, and unit profit calculations."
  }
];

export const PERMISSION_MODULES: PermissionModule[] = [
  "Animals",
  "Milk Management",
  "Breeding",
  "Health",
  "Vaccinations",
  "Treatments",
  "Feed",
  "Inventory",
  "Finance",
  "Finance Reports",
  "Tasks",
  "Reminders",
  "Farms",
  "Groups",
  "Sheds",
  "Companies / Suppliers",
  "Users",
  "Settings"
];

export const initialRoles: AppRole[] = [
  { id: 1, name: "Owner", code: "OWNER", description: "Complete unrestricted administrative control, financial auditing, asset valuation, and farm configuration.", isSystem: true },
  { id: 2, name: "Manager", code: "MANAGER", description: "Full day-to-day herd management, feed schedules, task dispatching, inventory replenishment, and customer delivery logs.", isSystem: true },
  { id: 3, name: "Veterinarian", code: "VETERINARIAN", description: "Dedicated access to health records, disease diagnoses, prescriptions, artificial inseminations, pregnancy checks, and milk withdrawal restrictions.", isSystem: true },
  { id: 4, name: "Feed Manager", code: "FEED_MANAGER", description: "Formulation of daily TMR rations, grain stock audits, nutrient tracking, and silage pit level management.", isSystem: true },
  { id: 5, name: "Worker", code: "WORKER", description: "Simplified fast 2-tap data entry interface for morning/evening milk liters, heat observations, and calving logs.", isSystem: true },
  { id: 6, name: "Accountant", code: "ACCOUNTANT", description: "Financial transactions, milk revenue reconciliations, customer accounts receivable, feed invoice approvals, and unit profit calculations.", isSystem: true }
];

export const initialUsers: AppUser[] = [
  { id: 1, name: "Haji Muhammad Tariq", email: "owner@punjabdairy.com", phone: "+92 300 8400111", roleId: 1, roleName: "Owner", status: "Active", createdAt: "2023-01-01" },
  { id: 2, name: "Muhammad Ali", email: "admin@dairyfarm.local", phone: "+92 300 1234567", roleId: 2, roleName: "Manager", status: "Active", createdAt: "2023-01-15" },
  { id: 3, name: "Dr. Imran Khan", email: "dr.imran@vetcare.pk", phone: "+92 321 9876543", roleId: 3, roleName: "Veterinarian", status: "Active", createdAt: "2023-02-01" },
  { id: 4, name: "Chaudhry Asghar", email: "feed@dairyfarm.local", phone: "+92 312 3456789", roleId: 4, roleName: "Feed Manager", status: "Active", createdAt: "2023-02-15" },
  { id: 5, name: "Rashid Mahmood", email: "staff@dairyfarm.local", phone: "+92 345 6789012", roleId: 5, roleName: "Worker", status: "Active", createdAt: "2023-03-01" },
  { id: 6, name: "Farhan Siddiqui", email: "accounts@dairyfarm.local", phone: "+92 333 4567890", roleId: 6, roleName: "Accountant", status: "Active", createdAt: "2023-03-15" }
];

export const initialSystemFlags: SystemFlags = {
  auditLogging: true,
  authRequired: true,
  confirmDelete: true,
  recordUserActivity: true,
  enableDataExport: true,
  enableAuditHistory: true,
  autoSyncRestApi: true,
  milkWithdrawalSafety: true,
  pregnancyReminders: true,
  autoBackups: true,
  duplicateEarTagCheck: true
};

export function buildDefaultRolePermissions(): RolePermissionMatrix[] {
  return initialRoles.map(role => {
    const permissions: ModulePermission[] = PERMISSION_MODULES.map(mod => {
      let canView = true;
      let canCreate = false;
      let canEdit = false;
      let canDelete = false;
      let canExport = false;

      if (role.name === "Owner") {
        canView = true;
        canCreate = true;
        canEdit = true;
        canDelete = true;
        canExport = true;
      } else if (role.name === "Manager") {
        canView = true;
        canCreate = true;
        canEdit = true;
        canDelete = mod !== "Settings";
        canExport = true;
      } else if (role.name === "Veterinarian") {
        if (["Health", "Vaccinations", "Treatments", "Breeding", "Reminders"].includes(mod)) {
          canView = true; canCreate = true; canEdit = true; canDelete = true; canExport = true;
        } else if (["Animals", "Milk Management", "Tasks"].includes(mod)) {
          canView = true; canCreate = false; canEdit = true; canDelete = false; canExport = true;
        } else {
          canView = !["Finance", "Finance Reports", "Settings", "Users"].includes(mod);
          canCreate = false; canEdit = false; canDelete = false; canExport = false;
        }
      } else if (role.name === "Feed Manager") {
        if (["Feed", "Inventory", "Groups", "Sheds"].includes(mod)) {
          canView = true; canCreate = true; canEdit = true; canDelete = true; canExport = true;
        } else if (["Animals", "Reports", "Tasks"].includes(mod)) {
          canView = true; canCreate = false; canEdit = false; canDelete = false; canExport = true;
        } else {
          canView = !["Finance", "Finance Reports", "Settings", "Users", "Health", "Breeding"].includes(mod);
          canCreate = false; canEdit = false; canDelete = false; canExport = false;
        }
      } else if (role.name === "Worker") {
        if (["Milk Management", "Tasks"].includes(mod)) {
          canView = true; canCreate = true; canEdit = true; canDelete = false; canExport = false;
        } else if (["Animals", "Breeding", "Health", "Feed"].includes(mod)) {
          canView = true; canCreate = false; canEdit = false; canDelete = false; canExport = false;
        } else {
          canView = false; canCreate = false; canEdit = false; canDelete = false; canExport = false;
        }
      } else if (role.name === "Accountant") {
        if (["Finance", "Finance Reports", "Companies / Suppliers", "Inventory"].includes(mod)) {
          canView = true; canCreate = true; canEdit = true; canDelete = true; canExport = true;
        } else if (["Milk Management", "Animals", "Feed"].includes(mod)) {
          canView = true; canCreate = false; canEdit = false; canDelete = false; canExport = true;
        } else {
          canView = !["Health", "Vaccinations", "Treatments", "Breeding", "Settings", "Users"].includes(mod);
          canCreate = false; canEdit = false; canDelete = false; canExport = false;
        }
      }

      return {
        module: mod,
        canView,
        canCreate,
        canEdit,
        canDelete,
        canExport
      };
    });

    return {
      roleId: role.id,
      roleName: role.name,
      permissions
    };
  });
}

export const initialRolePermissions: RolePermissionMatrix[] = buildDefaultRolePermissions();

export const initialAuditLogs: AuditLogItem[] = [
  {
    id: "AUD-1001",
    timestamp: "2024-05-14 09:30:15",
    userId: 2,
    userName: "Muhammad Ali",
    userRole: "Manager",
    action: "CREATE",
    module: "Milk Management",
    recordId: "M-101",
    details: "Recorded morning & evening milk yield (28.7L) for cow HF-027 (Bella)",
    ipAddress: "192.168.1.45"
  },
  {
    id: "AUD-1002",
    timestamp: "2024-05-14 10:15:22",
    userId: 3,
    userName: "Dr. Imran Khan",
    userRole: "Veterinarian",
    action: "CREATE",
    module: "Health",
    recordId: "H-1",
    details: "Prescribed Intramast-DC for HF-027 (Bella) - 5 days milk withdrawal active",
    ipAddress: "192.168.1.88"
  },
  {
    id: "AUD-1003",
    timestamp: "2024-05-14 11:45:00",
    userId: 6,
    userName: "Farhan Siddiqui",
    userRole: "Accountant",
    action: "CREATE",
    module: "Finance",
    recordId: "TX-101",
    details: "Recorded milk sales revenue of Rs 297,000 to Nestlé Pakistan",
    ipAddress: "192.168.1.62"
  },
  {
    id: "AUD-1004",
    timestamp: "2024-05-14 14:20:10",
    userId: 1,
    userName: "Haji Muhammad Tariq",
    userRole: "Owner",
    action: "SETTINGS_CHANGE",
    module: "Settings",
    recordId: "SYS-CONFIG",
    details: "Updated base milk price configuration to Rs 150/L and saved farm profile",
    ipAddress: "192.168.1.10"
  },
  {
    id: "AUD-1005",
    timestamp: "2024-05-14 15:05:40",
    userId: 4,
    userName: "Chaudhry Asghar",
    userRole: "Feed Manager",
    action: "UPDATE",
    module: "Feed",
    recordId: "RAT-1",
    details: "Recalculated high-producer TMR ration with adjusted maize silage ratio",
    ipAddress: "192.168.1.77"
  }
];

export const initialSettings: FarmSettings = {
  farmName: "Punjab Commercial Dairy Farm",
  companyName: "Punjab Agrotech Dairy Pvt. Ltd.",
  currency: "PKR",
  currencySymbol: "Rs",
  timezone: "Asia/Karachi (PKT)",
  defaultMilkUnit: "Liter (L)",
  milkPricePerLitre: 150,
  managerName: "Muhammad Ali",
  managerUserId: 2,
  phone: "+92 300 1234567",
  email: "admin@dairyfarm.local",
  notificationsEnabled: true,
  autoBackup: true,
  productionDropAlertThreshold: 15,
  prolongedOpenDaysThreshold: 90,
  heiferBreedingAgeMonths: 14,
  gestationPeriodDays: 280,
  pdCheckDays: 35,
  heatToAiHours: 12,
  flags: initialSystemFlags
};
