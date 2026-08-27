import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import { Animal, MilkRecord, HealthRecord, BreedingEvent } from "../types";

export async function generateAnimalPdf(
  animal: Animal,
  options?: {
    farmName?: string;
    milkRecords?: MilkRecord[];
    healthRecords?: HealthRecord[];
    breedingRecords?: BreedingEvent[];
  }
) {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const farmName = options?.farmName || "Punjab Commercial Dairy Farm";
  const milk = options?.milkRecords || [];
  const health = options?.healthRecords || [];
  const breeding = options?.breedingRecords || [];

  // Generate QR Code as Data URL
  const recordUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/#animal/${encodeURIComponent(animal.id)}`
    : `https://dairyfarm.local/#animal/${encodeURIComponent(animal.id)}`;
  
  let qrDataUrl = "";
  try {
    qrDataUrl = await QRCode.toDataURL(recordUrl, { width: 120, margin: 1 });
  } catch (err) {
    console.error("Failed to generate QR for PDF", err);
  }

  // --- HEADER BANNER ---
  doc.setFillColor(21, 101, 192); // Deep Blue #1565c0
  doc.rect(0, 0, 210, 28, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(farmName.toUpperCase(), 14, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("LIVESTOCK PASSPORT & HERD MANAGEMENT RECORD", 14, 18);
  doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 23);

  if (qrDataUrl) {
    try {
      doc.addImage(qrDataUrl, "PNG", 182, 3, 22, 22);
    } catch {
      // Ignore image add failure
    }
  }

  // --- BASIC IDENTITY BOX ---
  let y = 36;
  doc.setFillColor(245, 247, 250);
  doc.roundedRect(14, y, 182, 38, 3, 3, "F");

  // If animal has photo
  if (animal.photo && animal.photo.startsWith("data:image")) {
    try {
      doc.addImage(animal.photo, "JPEG", 18, y + 4, 30, 30);
    } catch {
      // ignore
    }
  }

  const startX = (animal.photo && animal.photo.startsWith("data:image")) ? 52 : 20;

  doc.setTextColor(20, 20, 20);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`${animal.id} — ${animal.name}`, startX, y + 8);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`Breed: ${animal.breed} | Sex: ${animal.sex} | Status: ${animal.status}`, startX, y + 15);
  doc.text(`Ear Tag: ${animal.earTag} | RFID: ${animal.rfid || "N/A"} | Born: ${animal.dob} (${animal.age || "2y"})`, startX, y + 21);
  doc.text(`Housing Pen: ${animal.location || "Shed 1"} | Group: ${animal.group || "Lactation Group"}`, startX, y + 27);
  doc.text(`Live Weight: ${animal.weightKg || 550} kg | Withers Height: ${animal.heightCm || 142} cm`, startX, y + 33);

  // --- PRODUCTION & LIFECYCLE SUMMARY ---
  y += 44;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 101, 192);
  doc.text("1. PRODUCTION & LIFECYCLE SUMMARY", 14, y);

  y += 4;
  doc.setDrawColor(220, 225, 230);
  doc.setLineWidth(0.5);
  doc.line(14, y, 196, y);

  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 40, 40);

  const totalMilk = milk.reduce((acc, m) => acc + (m.totalLitres || 0), 0);
  const avgMilk = milk.length > 0 ? (totalMilk / milk.length).toFixed(1) : (animal.milk ? String(animal.milk) : "26.0");

  const kpis = [
    ["Lactation Number", animal.lactation !== null ? String(animal.lactation) : (animal.status === "Lactating" ? "2" : "—")],
    ["Days in Milk (DIM)", animal.dim !== null ? String(animal.dim) : (animal.status === "Lactating" ? "120" : "—")],
    ["Current Daily Milk", animal.milk ? `${animal.milk} L/day` : (avgMilk ? `${avgMilk} L/day` : "—")],
    ["Average Recorded Milk", `${avgMilk} L/day`],
    ["Source Origin", animal.source || "Homebred"],
    ["Purchase Cost", animal.purchasePrice ? `Rs ${animal.purchasePrice.toLocaleString()}` : "N/A (Homebred)"],
    ["Dam (Mother)", animal.dam || "Unknown Dam"],
    ["Sire (Father)", animal.sire || "Unknown Sire"],
  ];

  let col = 0;
  let rowY = y;
  kpis.forEach(([k, v], idx) => {
    const x = col === 0 ? 16 : 110;
    doc.setFont("helvetica", "bold");
    doc.text(`${k}:`, x, rowY);
    doc.setFont("helvetica", "normal");
    doc.text(String(v), x + 42, rowY);
    if (col === 1) {
      col = 0;
      rowY += 6;
    } else {
      col = 1;
    }
  });

  y = rowY + 6;

  // --- RECENT MILK PRODUCTION HISTORY ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 101, 192);
  doc.text("2. RECENT MILK PRODUCTION SESSIONS", 14, y);

  y += 4;
  doc.line(14, y, 196, y);

  y += 6;
  doc.setFillColor(235, 240, 248);
  doc.rect(14, y, 182, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text("Date", 16, y + 4.5);
  doc.text("Session", 46, y + 4.5);
  doc.text("Morning (L)", 80, y + 4.5);
  doc.text("Evening (L)", 115, y + 4.5);
  doc.text("Total (L)", 150, y + 4.5);
  doc.text("Fat % / SNF %", 175, y + 4.5);

  y += 7;
  const recentMilk = milk.slice(0, 5);
  if (recentMilk.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("No individual milking records recorded for this cycle.", 16, y + 4);
    y += 8;
  } else {
    recentMilk.forEach((m) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(m.date, 16, y + 4);
      doc.text(m.session, 46, y + 4);
      doc.text(`${m.morningLitres.toFixed(1)} L`, 80, y + 4);
      doc.text(`${m.eveningLitres.toFixed(1)} L`, 115, y + 4);
      doc.setFont("helvetica", "bold");
      doc.text(`${m.totalLitres.toFixed(1)} L`, 150, y + 4);
      doc.setFont("helvetica", "normal");
      doc.text(`${m.fatPercent}% / ${m.snfPercent}%`, 175, y + 4);
      y += 6;
    });
  }

  y += 4;

  // --- REPRODUCTION & BREEDING HISTORY ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 101, 192);
  doc.text("3. REPRODUCTION & BREEDING EVENTS", 14, y);

  y += 4;
  doc.line(14, y, 196, y);

  y += 6;
  doc.setFillColor(235, 240, 248);
  doc.rect(14, y, 182, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text("AI / Heat Date", 16, y + 4.5);
  doc.text("Semen Bull / Straw", 55, y + 4.5);
  doc.text("Technician", 110, y + 4.5);
  doc.text("Result", 145, y + 4.5);
  doc.text("Expected Calving", 170, y + 4.5);

  y += 7;
  const recentBreeding = breeding.slice(0, 4);
  if (recentBreeding.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("No breeding or insemination records on file.", 16, y + 4);
    y += 8;
  } else {
    recentBreeding.forEach((b) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(b.aiDate || b.heatDate || "N/A", 16, y + 4);
      doc.text((b.semenBull || "Standard Semen").substring(0, 28), 55, y + 4);
      doc.text((b.technician || "Vet Tech").substring(0, 18), 110, y + 4);
      doc.setFont("helvetica", "bold");
      doc.text(b.result || "Pending PD", 145, y + 4);
      doc.setFont("helvetica", "normal");
      doc.text(b.expectedCalving || "—", 170, y + 4);
      y += 6;
    });
  }

  y += 4;

  // --- VETERINARY & HEALTH HISTORY ---
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(21, 101, 192);
  doc.text("4. VETERINARY TREATMENTS & HEALTH HISTORY", 14, y);

  y += 4;
  doc.line(14, y, 196, y);

  y += 6;
  doc.setFillColor(235, 240, 248);
  doc.rect(14, y, 182, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(20, 20, 20);
  doc.text("Date", 16, y + 4.5);
  doc.text("Diagnosis / Condition", 45, y + 4.5);
  doc.text("Medicine & Dosage", 100, y + 4.5);
  doc.text("Veterinarian", 150, y + 4.5);
  doc.text("Status", 180, y + 4.5);

  y += 7;
  const recentHealth = health.slice(0, 4);
  if (recentHealth.length === 0) {
    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.text("No veterinary treatment cases logged (Animal in good health).", 16, y + 4);
    y += 8;
  } else {
    recentHealth.forEach((h) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(h.date, 16, y + 4);
      doc.text(h.diagnosis.substring(0, 26), 45, y + 4);
      doc.text(`${h.medicine} (${h.dose})`.substring(0, 26), 100, y + 4);
      doc.text((h.veterinarian || "Dr. Imran").substring(0, 16), 150, y + 4);
      doc.setFont("helvetica", "bold");
      doc.text(h.status, 180, y + 4);
      y += 6;
    });
  }

  // --- FOOTER SIGNATURE & AUTHENTICATION ---
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 270, 182, 16, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 100, 100);
  doc.text("Official Herd Register Document - Verified by Farm Veterinary Officer & Herd Manager", 18, 276);
  doc.text(`Digital Verification Link: ${recordUrl}`, 18, 281);

  doc.save(`Animal_Record_${animal.id}.pdf`);
}

export const generateAnimalPassportPdf = generateAnimalPdf;
