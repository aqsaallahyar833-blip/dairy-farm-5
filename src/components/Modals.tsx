import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  X,
  Plus,
  Save,
  Trash2,
  CheckCircle2,
  QrCode,
  Printer,
  DollarSign,
  AlertTriangle,
  Heart,
  Droplets,
  Activity,
  Calendar,
  Layers,
  Scale,
  ShieldCheck,
  Truck,
  TrendingUp,
  UserCheck,
  Upload,
  Image as ImageIcon,
  Copy,
  ExternalLink,
  Info,
  RefreshCw,
  Sparkles,
  Download
} from "lucide-react";
import QRCode from "qrcode";
import {
  Animal,
  AnimalStatus,
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
  TaskItem
} from "../types";
import { initialAnimals, initialDiseases, initialMedicines } from "../data";
import { getNextAnimalNumber } from "../api";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function BaseModal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose} type="button" title="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

// 1. ADD ANIMAL MODAL
export function AddAnimalModal({
  isOpen,
  onClose,
  existingAnimals = [],
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  existingAnimals?: Animal[];
  onSave: (animal: Partial<Animal>) => void;
}) {
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("HF (Holstein Friesian)");
  const [sex, setSex] = useState<"Female" | "Male">("Female");
  const [status, setStatus] = useState<AnimalStatus>("Lactating");
  const [dob, setDob] = useState("2022-06-15");
  const [age, setAge] = useState("2y");
  const [earTag, setEarTag] = useState("");
  const [rfid, setRfid] = useState("");
  const [colorMarkings, setColorMarkings] = useState("Black & White");
  const [source, setSource] = useState<"Homebred" | "Purchased" | "Imported">("Homebred");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [group, setGroup] = useState("High Milking Group");
  const [location, setLocation] = useState("Shed 1 - Row A");
  const [dam, setDam] = useState("HF-011");
  const [sire, setSire] = useState("Bull-04");
  const [lactation, setLactation] = useState("2");
  const [dim, setDim] = useState("120");
  const [milk, setMilk] = useState("26.5");
  const [weightKg, setWeightKg] = useState("560");
  const [heightCm, setHeightCm] = useState("142");
  const [remarks, setRemarks] = useState("");
  const [photo, setPhoto] = useState<string>("");
  const [loadingNext, setLoadingNext] = useState(false);
  const [lastAnimalInfo, setLastAnimalInfo] = useState<{ id: string; earTag: string; totalAnimals: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch next sequential number and initialize fields
  useEffect(() => {
    if (isOpen) {
      setLoadingNext(true);
      getNextAnimalNumber()
        .then((res) => {
          setId(res.nextId);
          setEarTag(res.nextEarTag);
          setRfid(`RF-${Math.floor(10000000 + Math.random() * 90000000)}`);
          if (res.lastAnimal) {
            setLastAnimalInfo({
              id: res.lastAnimal.id,
              earTag: res.lastAnimal.earTag,
              totalAnimals: res.totalAnimals,
            });
          }
        })
        .catch(() => {
          const rand = Math.floor(100 + Math.random() * 900);
          setId(`HF-0${rand}`);
          setEarTag(`ET-${Math.floor(1000 + Math.random() * 9000)}`);
          setRfid(`RF-${Math.floor(10000000 + Math.random() * 90000000)}`);
        })
        .finally(() => {
          setLoadingNext(false);
        });

      setName("");
      setStatus("Lactating");
      setRemarks("");
      setPhoto("");
    }
  }, [isOpen]);

  // Duplicate checks
  const isDuplicateId = existingAnimals.some((a) => a.id.trim().toLowerCase() === id.trim().toLowerCase());
  const isDuplicateEarTag = existingAnimals.some((a) => a.earTag.trim().toLowerCase() === earTag.trim().toLowerCase());

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) setPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateId) {
      alert(`Animal ID "${id}" is already in use by another animal in the herd. Please choose a unique ID.`);
      return;
    }
    if (isDuplicateEarTag) {
      alert(`Ear Tag "${earTag}" is already assigned to another animal. Please verify ear tag number.`);
      return;
    }

    onSave({
      id: id || `HF-0${Math.floor(100 + Math.random() * 900)}`,
      name: name || "Unnamed Cattle",
      breed,
      sex,
      status,
      dob,
      age: age || "2y",
      earTag: earTag || `ET-${Math.floor(1000 + Math.random() * 9000)}`,
      rfid,
      colorMarkings,
      source,
      purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
      group,
      location,
      dam,
      sire,
      lactation: status === "Lactating" ? Number(lactation) || 1 : null,
      dim: status === "Lactating" ? Number(dim) || 0 : null,
      milk: status === "Lactating" ? Number(milk) || 0 : null,
      weightKg: Number(weightKg) || 550,
      heightCm: Number(heightCm) || 142,
      remarks,
      photo: photo || undefined,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Register New Livestock Animal" subtitle="Complete permanent digital passport for herd record">
      <form onSubmit={handleSubmit}>
        {/* Sequential numbering info banner */}
        {lastAnimalInfo && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#eff6ff",
            border: "1px solid #bfdbfe",
            color: "#1e40af",
            padding: "8px 12px",
            borderRadius: "8px",
            fontSize: "0.85rem",
            marginBottom: "16px"
          }}>
            <Sparkles size={16} />
            <span>
              <b>Sequential Auto-Numbering:</b> Last animal in herd is <b>{lastAnimalInfo.id}</b> (Tag: {lastAnimalInfo.earTag}). Suggested next: <b>{id}</b>.
            </span>
          </div>
        )}

        {/* PHOTO UPLOAD SECTION */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "16px"
        }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "8px" }}>
            Animal Profile Photograph
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "10px",
                border: "2px dashed #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                background: "#ffffff",
                position: "relative",
                cursor: "pointer"
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {photo ? (
                <img src={photo} alt="Animal Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.75rem", padding: "4px" }}>
                  <Upload size={20} style={{ margin: "0 auto 4px" }} />
                  <span>Upload / Drop</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "200px" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 10px" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> Choose Photo
                </button>
                <button
                  type="button"
                  className="secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 10px" }}
                  onClick={() => setPhoto("/bella-cow.jpg")}
                >
                  <ImageIcon size={14} /> Use Farm Preset
                </button>
                {photo && (
                  <button
                    type="button"
                    className="secondary"
                    style={{ fontSize: "0.8rem", padding: "6px 10px", color: "#dc2626" }}
                    onClick={() => setPhoto("")}
                  >
                    <Trash2 size={14} /> Remove Photo
                  </button>
                )}
              </div>
              <small style={{ color: "#64748b", fontSize: "0.75rem" }}>
                Supports JPG, PNG, WebP up to 10MB. Photo will appear on cow profile, ear tag cards, and export PDFs.
              </small>
            </div>
          </div>
        </div>

        <div className="form-grid">
          <label className="input-group">
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Animal ID / Code *</span>
              {isDuplicateId && <span style={{ color: "#dc2626", fontWeight: "bold" }}>⚠️ ID already exists!</span>}
            </span>
            <input
              value={id}
              onChange={(e) => setId(e.target.value)}
              required
              style={isDuplicateId ? { borderColor: "#dc2626", backgroundColor: "#fef2f2" } : {}}
            />
          </label>
          <label className="input-group">
            <span>Animal Name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bella" required />
          </label>
          <label className="input-group">
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Ear Tag Number *</span>
              {isDuplicateEarTag && <span style={{ color: "#dc2626", fontWeight: "bold" }}>⚠️ Tag already assigned!</span>}
            </span>
            <input
              value={earTag}
              onChange={(e) => setEarTag(e.target.value)}
              required
              style={isDuplicateEarTag ? { borderColor: "#dc2626", backgroundColor: "#fef2f2" } : {}}
            />
          </label>
          <label className="input-group">
            <span>RFID Electronic Tag</span>
            <input value={rfid} onChange={(e) => setRfid(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Breed</span>
            <select value={breed} onChange={(e) => setBreed(e.target.value)}>
              <option value="HF (Holstein Friesian)">Holstein Friesian (HF)</option>
              <option value="Jersey">Jersey</option>
              <option value="Sahiwal">Sahiwal Purebred</option>
              <option value="Crossbred (HF x Sahiwal)">Crossbred (HF x Sahiwal)</option>
              <option value="Nili Ravi">Nili Ravi (Buffalo)</option>
            </select>
          </label>
          <label className="input-group">
            <span>Sex</span>
            <select value={sex} onChange={(e) => setSex(e.target.value as any)}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </label>
          <label className="input-group">
            <span>Current Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as AnimalStatus)}>
              <option value="Lactating">Lactating</option>
              <option value="Dry">Dry</option>
              <option value="Pregnant">Pregnant</option>
              <option value="Heifer">Heifer</option>
              <option value="Calf">Calf</option>
              <option value="Open">Open</option>
              <option value="Sick">Sick</option>
              <option value="Quarantine">Quarantine</option>
              <option value="Bull">Bull</option>
            </select>
          </label>
          <label className="input-group">
            <span>Source Origin</span>
            <select value={source} onChange={(e) => setSource(e.target.value as any)}>
              <option value="Homebred">Homebred on Farm</option>
              <option value="Purchased">Purchased Domestically</option>
              <option value="Imported">Imported (Exotic Stock)</option>
            </select>
          </label>
          {source !== "Homebred" && (
            <label className="input-group">
              <span>Purchase Price (Rs)</span>
              <input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="e.g. 450000" />
            </label>
          )}
          <label className="input-group">
            <span>Date of Birth</span>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Age (Display)</span>
            <input value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 2y 4m" />
          </label>
          <label className="input-group">
            <span>Housing Location</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Shed 1 - Row A" />
          </label>
          <label className="input-group">
            <span>Management Group</span>
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="High Milking Group">High Milking Group</option>
              <option value="Medium Milking Group">Medium Milking Group</option>
              <option value="Dry Group">Dry Group</option>
              <option value="Pregnant Group">Pregnant Group</option>
              <option value="Heifer Pen">Heifer Pen</option>
              <option value="Calf Pen">Calf Pen</option>
              <option value="Bull Pen">Bull Pen</option>
              <option value="Quarantine Shed">Quarantine Shed</option>
            </select>
          </label>
          <label className="input-group">
            <span>Dam (Mother ID)</span>
            <input value={dam} onChange={(e) => setDam(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Sire (Father ID)</span>
            <input value={sire} onChange={(e) => setSire(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Body Weight (kg)</span>
            <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Height at Withers (cm)</span>
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </label>
        </div>

        {status === "Lactating" && (
          <div className="form-sub-section" style={{ marginTop: "12px" }}>
            <h4>Lactation Baseline Data</h4>
            <div className="form-grid three">
              <label className="input-group">
                <span>Lactation No.</span>
                <input type="number" value={lactation} onChange={(e) => setLactation(e.target.value)} min="1" max="12" />
              </label>
              <label className="input-group">
                <span>Days in Milk (DIM)</span>
                <input type="number" value={dim} onChange={(e) => setDim(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Current Milk (L/day)</span>
                <input type="number" step="0.1" value={milk} onChange={(e) => setMilk(e.target.value)} />
              </label>
            </div>
          </div>
        )}

        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Remarks / Health Notes</span>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="Optional notes about markings, temperament, vaccinations..." />
        </label>

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={isDuplicateId || isDuplicateEarTag}>
            <Save size={16} /> Save Animal to Herd
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 2. ANIMAL PROFILE MODAL (with tabs: Overview, Milk, Health, Breeding, Pedigree, Growth, Profitability, QR Card)
export function AnimalProfileModal({
  isOpen,
  onClose,
  animal,
  onEdit,
  onDelete,
  onSell,
  onMortality,
  milkRecords = [],
  healthRecords = [],
  breedingEvents = [],
  calfGrowth = [],
}: {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
  onEdit: (animal: Animal) => void;
  onDelete: (id: string) => void;
  onSell: (animal: Animal) => void;
  onMortality: (animal: Animal) => void;
  milkRecords?: MilkRecord[];
  healthRecords?: HealthRecord[];
  breedingEvents?: BreedingEvent[];
  calfGrowth?: CalfGrowthRecord[];
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "milk" | "health" | "breeding" | "growth" | "pedigree" | "profitability" | "qrcode">("overview");

  if (!isOpen || !animal) return null;

  const cowMilk = (milkRecords || []).filter((m) => m.animalId === animal.id);
  const cowHealth = (healthRecords || []).filter((h) => h.animalId === animal.id);
  const cowBreeding = (breedingEvents || []).filter((b) => b.animalId === animal.id);
  const cowGrowth = (calfGrowth || []).filter((g) => g.calfId === animal.id);

  // Profitability calculations (milk revenue vs feed vs health)
  const totalMilkLitres = cowMilk.reduce((acc, m) => acc + (m.totalLitres || 0), 0) || (animal.milk ? animal.milk * 30 : 750);
  const milkRevenueRs = totalMilkLitres * 150;
  const feedCostPerDay = animal.status === "Lactating" ? 890 : 380;
  const totalFeedCostRs = feedCostPerDay * 30;
  const vetCostRs = cowHealth.reduce((acc, h) => acc + (h.cost || 0), 0);
  const netProfitRs = milkRevenueRs - totalFeedCostRs - vetCostRs;

  const printPassport = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window wide" onClick={(e) => e.stopPropagation()} id="animal-profile-modal">
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="animal-avatar">
              <Scale size={24} color="#1565c0" />
            </div>
            <div>
              <h3>
                {animal.name} ({animal.id})
              </h3>
              <p>
                Ear Tag: <b>{animal.earTag}</b> · RFID: {animal.rfid || "—"} · Breed: {animal.breed}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button className="secondary sm" onClick={printPassport} title="Print Passport">
              <Printer size={15} /> Print Card
            </button>
            <button className="modal-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="profile-banner">
          <div className="banner-item">
            <span>Status</span>
            <span className={`status ${animal.status.toLowerCase()}`}>{animal.status}</span>
          </div>
          <div className="banner-item">
            <span>Daily Milk Yield</span>
            <b>{animal.milk ? `${animal.milk} Litres` : "—"}</b>
          </div>
          <div className="banner-item">
            <span>Lactation / DIM</span>
            <b>{animal.lactation ? `Lact ${animal.lactation} · ${animal.dim} DIM` : "—"}</b>
          </div>
          <div className="banner-item">
            <span>Location</span>
            <b>{animal.location}</b>
          </div>
          <div className="banner-item">
            <span>Live Weight</span>
            <b>{animal.weightKg ? `${animal.weightKg} kg` : "550 kg"}</b>
          </div>
        </div>

        {animal.activeWithdrawal?.active && (
          <div className="withdrawal-alert-box">
            <AlertTriangle size={18} color="#c84545" />
            <div>
              <b>Active Milk Withdrawal Restriction</b>
              <p>
                Treated with <b>{animal.activeWithdrawal.medicine}</b>. Milk must remain segregated until <b>{animal.activeWithdrawal.safeDate}</b>.
              </p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="profile-tabs">
          {[
            { id: "overview", label: "Overview & Profile" },
            { id: "milk", label: `Milk History (${cowMilk.length})` },
            { id: "health", label: `Health & Vet (${cowHealth.length})` },
            { id: "breeding", label: `Reproduction (${cowBreeding.length})` },
            { id: "growth", label: `Growth & Weight (${cowGrowth.length})` },
            { id: "pedigree", label: "Pedigree Lineage" },
            { id: "profitability", label: "Animal P&L" },
            { id: "qrcode", label: "QR Passport" },
          ].map((t) => (
            <button key={t.id} className={activeTab === t.id ? "active" : ""} onClick={() => setActiveTab(t.id as any)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto" }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="profile-grid">
              <div className="info-card">
                <h4>Identity & Biological Specifications</h4>
                <table className="meta-table">
                  <tbody>
                    <tr>
                      <td>Permanent ID</td>
                      <td>
                        <b>{animal.id}</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Official Ear Tag</td>
                      <td>{animal.earTag}</td>
                    </tr>
                    <tr>
                      <td>RFID Transponder</td>
                      <td>{animal.rfid || "Not assigned"}</td>
                    </tr>
                    <tr>
                      <td>Breed</td>
                      <td>{animal.breed}</td>
                    </tr>
                    <tr>
                      <td>Sex</td>
                      <td>{animal.sex}</td>
                    </tr>
                    <tr>
                      <td>Date of Birth / Age</td>
                      <td>
                        {animal.dob} ({animal.age})
                      </td>
                    </tr>
                    <tr>
                      <td>Coat Markings</td>
                      <td>{animal.colorMarkings || "Black & White"}</td>
                    </tr>
                    <tr>
                      <td>Source Origin</td>
                      <td>{animal.source || "Homebred"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="info-card">
                <h4>Management & Facility Location</h4>
                <table className="meta-table">
                  <tbody>
                    <tr>
                      <td>Current Pen / Shed</td>
                      <td>
                        <b>{animal.location}</b>
                      </td>
                    </tr>
                    <tr>
                      <td>Assigned Group</td>
                      <td>{animal.group}</td>
                    </tr>
                    <tr>
                      <td>Dam (Mother)</td>
                      <td className="blue-text">{animal.dam}</td>
                    </tr>
                    <tr>
                      <td>Sire (Father)</td>
                      <td className="blue-text">{animal.sire}</td>
                    </tr>
                    <tr>
                      <td>Withers Height</td>
                      <td>{animal.heightCm ? `${animal.heightCm} cm` : "142 cm"}</td>
                    </tr>
                    <tr>
                      <td>Body Weight</td>
                      <td>{animal.weightKg ? `${animal.weightKg} kg` : "560 kg"}</td>
                    </tr>
                    <tr>
                      <td>Remarks</td>
                      <td>{animal.remarks || "Healthy herd member."}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: MILK */}
          {activeTab === "milk" && (
            <div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Session</th>
                      <th>Morning (L)</th>
                      <th>Evening (L)</th>
                      <th>Total (L)</th>
                      <th>Fat %</th>
                      <th>SNF %</th>
                      <th>Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cowMilk.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                          No milk records logged for this animal yet.
                        </td>
                      </tr>
                    ) : (
                      cowMilk.map((m) => (
                        <tr key={m.id}>
                          <td>{m.date}</td>
                          <td>{m.session}</td>
                          <td>{m.morningLitres}</td>
                          <td>{m.eveningLitres}</td>
                          <td>
                            <b>{m.totalLitres} L</b>
                          </td>
                          <td>{m.fatPercent}%</td>
                          <td>{m.snfPercent}%</td>
                          <td>
                            <span className="status available">{m.quality}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH */}
          {activeTab === "health" && (
            <div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Diagnosis</th>
                      <th>Medicine & Dose</th>
                      <th>Veterinarian</th>
                      <th>Status</th>
                      <th>Withdrawal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cowHealth.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                          No medical conditions recorded.
                        </td>
                      </tr>
                    ) : (
                      cowHealth.map((h) => (
                        <tr key={h.id}>
                          <td>{h.date}</td>
                          <td>
                            <b>{h.diagnosis}</b>
                          </td>
                          <td>
                            {h.medicine} ({h.dose})
                          </td>
                          <td>{h.veterinarian}</td>
                          <td>
                            <span className={`status ${h.status === "In Treatment" ? "sick" : "available"}`}>{h.status}</span>
                          </td>
                          <td>{h.withdrawalDays > 0 ? `Hold till ${h.withdrawalUntil}` : "None"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: BREEDING */}
          {activeTab === "breeding" && (
            <div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Heat Date</th>
                      <th>AI Date</th>
                      <th>Semen Straw / Bull</th>
                      <th>Technician</th>
                      <th>PD Result</th>
                      <th>Expected Calving</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cowBreeding.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                          No breeding events on record.
                        </td>
                      </tr>
                    ) : (
                      cowBreeding.map((b) => (
                        <tr key={b.id}>
                          <td>{b.heatDate}</td>
                          <td>{b.aiDate || "—"}</td>
                          <td>{b.semenBull}</td>
                          <td>{b.technician}</td>
                          <td>
                            <span className={`status ${b.result === "Positive" ? "available" : "pending"}`}>{b.result}</span>
                          </td>
                          <td>
                            <b>{b.expectedCalving || "Pending PD"}</b>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: GROWTH & WEIGHT */}
          {activeTab === "growth" && (
            <div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Age (Months)</th>
                      <th>Weight (kg)</th>
                      <th>Height (cm)</th>
                      <th>Heart Girth (cm)</th>
                      <th>ADG (g/day)</th>
                      <th>Weaning Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cowGrowth.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                          No growth logs for this adult or unrecorded animal.
                        </td>
                      </tr>
                    ) : (
                      cowGrowth.map((g) => (
                        <tr key={g.id}>
                          <td>{g.date}</td>
                          <td>{g.ageMonths}m</td>
                          <td>
                            <b>{g.weightKg} kg</b>
                          </td>
                          <td>{g.heightCm} cm</td>
                          <td>{g.girthCm} cm</td>
                          <td>+{g.adgGrams} g/d</td>
                          <td>
                            <span className="status available">{g.weaningStatus}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: PEDIGREE */}
          {activeTab === "pedigree" && (
            <div className="pedigree-tree">
              <div className="pedigree-level">
                <div className="pedigree-node active">
                  <b>{animal.name}</b>
                  <span>
                    ID: {animal.id} ({animal.breed})
                  </span>
                  <small>Status: {animal.status}</small>
                </div>
              </div>
              <div className="pedigree-branches">
                <div className="pedigree-node">
                  <small>Dam (Mother)</small>
                  <b>{animal.dam}</b>
                  <span>HF Purebred Dairy Cow</span>
                </div>
                <div className="pedigree-node">
                  <small>Sire (Father)</small>
                  <b>{animal.sire}</b>
                  <span>Proven Alta Sire Straw</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PROFITABILITY */}
          {activeTab === "profitability" && (
            <div className="profit-analysis">
              <h4>Individual Cow Financial Performance (30-Day Analysis)</h4>
              <div className="profit-grid">
                <div>
                  <span>Est. Milk Revenue</span>
                  <b style={{ color: "#167a4b" }}>+Rs {milkRevenueRs.toLocaleString()}</b>
                  <small>{totalMilkLitres.toFixed(1)} L @ Rs 150/L</small>
                </div>
                <div>
                  <span>Feed & TMR Cost</span>
                  <b style={{ color: "#c84545" }}>-Rs {totalFeedCostRs.toLocaleString()}</b>
                  <small>Rs {feedCostPerDay}/day for 30d</small>
                </div>
                <div>
                  <span>Vet & Medicine Cost</span>
                  <b style={{ color: "#c84545" }}>-Rs {vetCostRs.toLocaleString()}</b>
                  <small>Treatments on record</small>
                </div>
                <div>
                  <span>Net Estimated Profit</span>
                  <b style={{ color: netProfitRs >= 0 ? "#167a4b" : "#c84545", fontSize: "1.2rem" }}>
                    Rs {netProfitRs.toLocaleString()}
                  </b>
                  <small>Rs {(netProfitRs / 30).toFixed(0)} / day</small>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: QR CODE PASSPORT */}
          {activeTab === "qrcode" && (
            <div className="qr-passport-card" id="qr-passport-printable">
              <div className="qr-box">
                <QrCode size={120} color="#1565c0" />
                <span>SCAN FOR INSTANT MOBILE LOOKUP</span>
              </div>
              <div className="qr-details">
                <h3>{animal.name}</h3>
                <p>
                  Livestock Passport ID: <b>{animal.id}</b>
                </p>
                <p>
                  Ear Tag: <b>{animal.earTag}</b>
                </p>
                <p>RFID: {animal.rfid || "Not assigned"}</p>
                <p>Breed: {animal.breed}</p>
                <p>
                  DOB: {animal.dob} (Age: {animal.age})
                </p>
                <p>Dam / Sire: {animal.dam} / {animal.sire}</p>
                <p>Farm: Punjab Commercial Dairy - Unit 1</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div style={{ display: "flex", gap: "8px" }}>
            {animal.status !== "Sold" && animal.status !== "Dead" && (
              <>
                <button
                  className="secondary danger sm"
                  onClick={() => {
                    onClose();
                    onSell(animal);
                  }}
                >
                  <DollarSign size={14} /> Sell Animal
                </button>
                <button
                  className="secondary danger sm"
                  onClick={() => {
                    onClose();
                    onMortality(animal);
                  }}
                >
                  <AlertTriangle size={14} /> Record Mortality
                </button>
              </>
            )}
            <button
              className="secondary danger sm"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${animal.id}?`)) {
                  onDelete(animal.id);
                  onClose();
                }
              }}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
          <button className="primary sm" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// 3. ADD MILK MODAL
export function AddMilkModal({
  isOpen,
  onClose,
  animals,
  existingRecords = [],
  initialAnimalId,
  initialDate,
  initialSession,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  existingRecords?: MilkRecord[];
  initialAnimalId?: string;
  initialDate?: string;
  initialSession?: "Morning" | "Evening" | "Both" | "Third";
  onSave: (record: Partial<MilkRecord> & { overwrite?: boolean }) => Promise<void> | void;
}) {
  const lactating = animals.filter((a) => a.status === "Lactating");
  const availableAnimals = lactating.length > 0 ? lactating : animals;
  
  const [selectedAnimal, setSelectedAnimal] = useState(initialAnimalId || availableAnimals[0]?.id || "HF-027");
  const [date, setDate] = useState(initialDate || new Date().toISOString().split("T")[0]);
  const [session, setSession] = useState<"Morning" | "Evening" | "Both" | "Third">(initialSession || "Both");
  const [morning, setMorning] = useState("");
  const [evening, setEvening] = useState("");
  const [third, setThird] = useState("");
  const [fat, setFat] = useState("");
  const [protein, setProtein] = useState("");
  const [snf, setSnf] = useState("");
  const [scc, setScc] = useState("");
  const [quality, setQuality] = useState<"Standard" | "Premium" | "Rejected">("Standard");
  const [rejectedLitres, setRejectedLitres] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [existingRecordId, setExistingRecordId] = useState<string | null>(null);

  // Check for duplicate record
  const matchingDuplicate = existingRecords.find(
    (r) => r.animalId.toLowerCase() === selectedAnimal.toLowerCase() && r.date === date && r.session === session
  );

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
      setIsEditingExisting(false);
      setExistingRecordId(null);
      
      const activeList = animals.filter((a) => a.status === "Lactating");
      const pool = activeList.length > 0 ? activeList : animals;
      const targetId = initialAnimalId || (pool.length > 0 ? pool[0].id : "HF-027");
      setSelectedAnimal(targetId);
      setDate(initialDate || new Date().toISOString().split("T")[0]);
      setSession(initialSession || "Both");

      // Check if existing record for this initial setup
      const existing = existingRecords.find(
        (r) => r.animalId.toLowerCase() === targetId.toLowerCase() && r.date === (initialDate || new Date().toISOString().split("T")[0])
      );
      if (existing) {
        setMorning(existing.morningLitres ? String(existing.morningLitres) : "");
        setEvening(existing.eveningLitres ? String(existing.eveningLitres) : "");
        setThird(existing.thirdMilkingLitres ? String(existing.thirdMilkingLitres) : "");
        setFat(existing.fatPercent !== undefined ? String(existing.fatPercent) : "");
        setProtein(existing.proteinPercent !== undefined ? String(existing.proteinPercent) : "");
        setSnf(existing.snfPercent !== undefined ? String(existing.snfPercent) : "");
        setScc(existing.scc !== undefined ? String(existing.scc) : "");
        setQuality(existing.quality || "Standard");
        setRejectedLitres(existing.rejectedLitres ? String(existing.rejectedLitres) : "");
        setRejectionReason(existing.rejectionReason || "");
        setIsEditingExisting(true);
        setExistingRecordId(existing.id);
      } else {
        setMorning("");
        setEvening("");
        setThird("");
        setFat("");
        setProtein("");
        setSnf("");
        setScc("");
        setQuality("Standard");
        setRejectedLitres("");
        setRejectionReason("");
      }
    }
  }, [isOpen, initialAnimalId, initialDate, initialSession, animals]);

  const loadExistingRecordData = (rec: MilkRecord) => {
    setMorning(rec.morningLitres ? String(rec.morningLitres) : "");
    setEvening(rec.eveningLitres ? String(rec.eveningLitres) : "");
    setThird(rec.thirdMilkingLitres ? String(rec.thirdMilkingLitres) : "");
    setFat(rec.fatPercent !== undefined ? String(rec.fatPercent) : "");
    setProtein(rec.proteinPercent !== undefined ? String(rec.proteinPercent) : "");
    setSnf(rec.snfPercent !== undefined ? String(rec.snfPercent) : "");
    setScc(rec.scc !== undefined ? String(rec.scc) : "");
    setQuality(rec.quality || "Standard");
    setRejectedLitres(rec.rejectedLitres ? String(rec.rejectedLitres) : "");
    setRejectionReason(rec.rejectionReason || "");
    setIsEditingExisting(true);
    setExistingRecordId(rec.id);
    setErrorMessage(null);
  };

  // Calculate dynamic total daily yield
  const mVal = Number(morning) || 0;
  const eVal = Number(evening) || 0;
  const tVal = Number(third) || 0;
  
  let calculatedTotal = 0;
  if (session === "Morning") calculatedTotal = mVal;
  else if (session === "Evening") calculatedTotal = eVal;
  else if (session === "Third") calculatedTotal = tVal;
  else calculatedTotal = +(mVal + eVal).toFixed(2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate yield for chosen session
    if (session === "Morning" && mVal <= 0) {
      setErrorMessage("Please enter a valid Morning Yield in Litres.");
      return;
    }
    if (session === "Evening" && eVal <= 0) {
      setErrorMessage("Please enter a valid Evening Yield in Litres.");
      return;
    }
    if (session === "Third" && tVal <= 0) {
      setErrorMessage("Please enter a valid 3rd Milking Yield in Litres.");
      return;
    }
    if (session === "Both" && mVal <= 0 && eVal <= 0) {
      setErrorMessage("Please enter at least Morning or Evening yield in Litres.");
      return;
    }

    const cow = animals.find((a) => a.id.toLowerCase() === selectedAnimal.toLowerCase());
    const targetId = selectedAnimal || (animals[0]?.id || "HF-027");
    const targetName = cow ? cow.name : (animals.find((a) => a.id === targetId)?.name || "Cow");

    const recordPayload: Partial<MilkRecord> & { overwrite?: boolean } = {
      ...(existingRecordId ? { id: existingRecordId } : {}),
      animalId: targetId,
      name: targetName,
      date,
      session,
      morningLitres: session === "Evening" || session === "Third" ? 0 : mVal,
      eveningLitres: session === "Morning" || session === "Third" ? 0 : eVal,
      thirdMilkingLitres: session === "Third" ? tVal : 0,
      totalLitres: calculatedTotal,
      fatPercent: fat !== "" ? Number(fat) : undefined,
      proteinPercent: protein !== "" ? Number(protein) : undefined,
      snfPercent: snf !== "" ? Number(snf) : undefined,
      scc: scc !== "" ? Number(scc) : undefined,
      quality,
      rejectedLitres: quality === "Rejected" && rejectedLitres !== "" ? Number(rejectedLitres) : 0,
      rejectionReason: quality === "Rejected" ? rejectionReason : "",
      overwrite: isEditingExisting || Boolean(matchingDuplicate),
      updateIfExists: true,
    };

    setIsSubmitting(true);
    try {
      await onSave(recordPayload);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || "Failed to save milk record. Please verify and retry.");
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditingExisting ? "Edit Milk Yield & Quality Record" : "Record Milk Yield & Quality"}
      subtitle="Log daily liters and laboratory milk composition directly to database"
    >
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="alert-box error" style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #f87171", color: "#b91c1c", fontSize: "13px" }}>
            <b>Error:</b> {errorMessage}
          </div>
        )}

        {matchingDuplicate && !isEditingExisting && (
          <div className="alert-box warning" style={{ marginBottom: "14px", padding: "12px 14px", borderRadius: "8px", background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div>
                <strong>Notice:</strong> A milk record already exists for <b>{selectedAnimal}</b> on <b>{date}</b> ({session} session · Recorded: {matchingDuplicate.totalLitres} L).
              </div>
              <button
                type="button"
                className="secondary sm"
                style={{ background: "#ffffff", borderColor: "#d97706", color: "#b45309" }}
                onClick={() => loadExistingRecordData(matchingDuplicate)}
              >
                Load & Edit Existing Record
              </button>
            </div>
          </div>
        )}

        {isEditingExisting && (
          <div className="alert-box info" style={{ marginBottom: "14px", padding: "8px 12px", borderRadius: "8px", background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "12px" }}>
            ℹ️ Updating existing record (ID: {existingRecordId}). Changes will replace the previously stored numbers in MySQL.
          </div>
        )}

        <div className="form-grid">
          <label className="input-group" style={{ gridColumn: "span 2" }}>
            <span>Select Animal *</span>
            <select
              value={selectedAnimal}
              onChange={(e) => {
                setSelectedAnimal(e.target.value);
                setIsEditingExisting(false);
                setExistingRecordId(null);
              }}
              required
            >
              {availableAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.status} · Ear Tag: {a.earTag || "N/A"}{a.group ? ` · ${a.group}` : ""})
                </option>
              ))}
              {availableAnimals.length === 0 && (
                <option value="HF-027">HF-027 - Bella (Lactating · Ear Tag: ET-1027)</option>
              )}
            </select>
          </label>

          <label className="input-group">
            <span>Milking Date *</span>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setIsEditingExisting(false);
                setExistingRecordId(null);
              }}
              required
            />
          </label>

          <label className="input-group">
            <span>Milking Session *</span>
            <select
              value={session}
              onChange={(e) => {
                setSession(e.target.value as any);
                setIsEditingExisting(false);
                setExistingRecordId(null);
              }}
            >
              <option value="Both">Morning & Evening (Both)</option>
              <option value="Morning">Morning Only</option>
              <option value="Evening">Evening Only</option>
              <option value="Third">3rd Milking (Special)</option>
            </select>
          </label>

          {/* DYNAMIC YIELD FIELDS BASED ON SESSION SELECTION */}
          {(session === "Morning" || session === "Both") && (
            <label className="input-group">
              <span>Morning Yield (L) *</span>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 14.5"
                value={morning}
                onChange={(e) => setMorning(e.target.value)}
                required={session === "Morning"}
              />
            </label>
          )}

          {(session === "Evening" || session === "Both") && (
            <label className="input-group">
              <span>Evening Yield (L) *</span>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 12.8"
                value={evening}
                onChange={(e) => setEvening(e.target.value)}
                required={session === "Evening"}
              />
            </label>
          )}

          {session === "Third" && (
            <label className="input-group">
              <span>3rd Milking Yield (L) *</span>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 8.2"
                value={third}
                onChange={(e) => setThird(e.target.value)}
                required
              />
            </label>
          )}

          {/* TOTAL DAILY YIELD SUMMARY BADGE */}
          <div className="input-group" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>Calculated Total Yield</span>
            <div style={{ padding: "8px 12px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", fontWeight: "700", color: "#0f172a", fontSize: "15px" }}>
              {calculatedTotal > 0 ? `${calculatedTotal.toFixed(1)} Litres` : "0.0 Litres"}
              {session === "Both" && <small style={{ fontWeight: "normal", color: "#64748b", marginLeft: "6px" }}>(Morning + Evening)</small>}
            </div>
          </div>
        </div>

        {/* LABORATORY MILK COMPOSITION */}
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e2e8f0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>Laboratory Milk Composition</h4>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Optional laboratory testing parameters</span>
          </div>

          <div className="form-grid">
            <label className="input-group">
              <span>Fat Content (%)</span>
              <input
                type="number"
                step="0.01"
                placeholder="Optional, e.g. 3.85"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </label>
            <label className="input-group">
              <span>Protein (%)</span>
              <input
                type="number"
                step="0.01"
                placeholder="Optional, e.g. 3.25"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </label>
            <label className="input-group">
              <span>SNF (%)</span>
              <input
                type="number"
                step="0.01"
                placeholder="Optional, e.g. 8.80"
                value={snf}
                onChange={(e) => setSnf(e.target.value)}
              />
            </label>
            <label className="input-group">
              <span>Somatic Cell Count (x10³ SCC/ml)</span>
              <input
                type="number"
                placeholder="Optional, e.g. 140"
                value={scc}
                onChange={(e) => setScc(e.target.value)}
              />
            </label>
            <label className="input-group" style={{ gridColumn: "span 2" }}>
              <span>Grade Quality</span>
              <select value={quality} onChange={(e) => setQuality(e.target.value as any)}>
                <option value="Standard">Standard Commercial Grade</option>
                <option value="Premium">Premium High Butterfat</option>
                <option value="Rejected">Rejected / Withheld</option>
              </select>
            </label>
          </div>
        </div>

        {quality === "Rejected" && (
          <div className="form-sub-section" style={{ marginTop: "12px", background: "#fef2f2", border: "1px solid #fecaca", padding: "12px", borderRadius: "8px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#b91c1c", fontSize: "13px" }}>Rejection / Withholding Details</h4>
            <div className="form-grid">
              <label className="input-group">
                <span>Rejected Volume (L)</span>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 15.0"
                  value={rejectedLitres}
                  onChange={(e) => setRejectedLitres(e.target.value)}
                />
              </label>
              <label className="input-group">
                <span>Reason for Withholding</span>
                <input
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Antibiotic withdrawal period, colostrum"
                />
              </label>
            </div>
          </div>
        )}

        <div className="form-actions" style={{ marginTop: "18px" }}>
          <button type="button" className="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "Saving to MySQL..." : isEditingExisting ? "Update Milk Record" : "Save Milk Record"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 4. ADD / EDIT BREEDING MODAL
export function AddBreedingModal({
  isOpen,
  onClose,
  animals,
  initialEvent,
  initialAnimalId,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  initialEvent?: BreedingEvent | null;
  initialAnimalId?: string;
  onSave: (event: Partial<BreedingEvent>) => Promise<void> | void;
}) {
  const eligibleAnimals = animals.filter(
    (a) =>
      a.status !== "Calf" &&
      a.status !== "Bull" &&
      a.status !== "Sold" &&
      a.status !== "Dead" &&
      a.status?.toLowerCase() !== "calf" &&
      a.status?.toLowerCase() !== "bull" &&
      a.status?.toLowerCase() !== "sold" &&
      a.status?.toLowerCase() !== "dead"
  );
  const availableAnimals =
    eligibleAnimals.length > 0
      ? eligibleAnimals
      : animals.length > 0
      ? animals
      : initialAnimals.filter((a) => a.status !== "Dead" && a.status !== "Sold");

  const [selectedAnimal, setSelectedAnimal] = useState(initialAnimalId || availableAnimals[0]?.id || "HF-027");
  const [heatDate, setHeatDate] = useState(new Date().toISOString().split("T")[0]);
  const [aiDate, setAiDate] = useState("");
  const [breedingMethod, setBreedingMethod] = useState<"Artificial Insemination" | "Natural Service">("Artificial Insemination");
  const [semenBull, setSemenBull] = useState("AltaWheel USA Straw #894");
  const [technician, setTechnician] = useState("Ali Hassan (Certified AI Tech)");
  const [pdDate, setPdDate] = useState("");
  const [result, setResult] = useState<"Positive" | "Pending" | "Negative" | "Suspicious">("Pending");
  const [servicesCount, setServicesCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auto-calculated preview of Expected Calving (AI Date + 280 days)
  const calculatedCalving = useMemo(() => {
    if (!aiDate) return "";
    const d = new Date(aiDate);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + 280);
    return d.toISOString().split("T")[0];
  }, [aiDate]);

  // Auto-calculated suggested PD Date (AI Date + 35 days)
  const suggestedPdDate = useMemo(() => {
    if (!aiDate) return "";
    const d = new Date(aiDate);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + 35);
    return d.toISOString().split("T")[0];
  }, [aiDate]);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);

      if (initialEvent) {
        // Editing existing record
        setSelectedAnimal(initialEvent.animalId || availableAnimals[0]?.id || "HF-027");
        setHeatDate(initialEvent.heatDate || new Date().toISOString().split("T")[0]);
        setAiDate(initialEvent.aiDate || "");
        setSemenBull(initialEvent.semenBull || "AltaWheel USA Straw #894");
        setTechnician(initialEvent.technician || "Ali Hassan (Certified AI Tech)");
        setPdDate(initialEvent.pdDate || "");
        setResult(initialEvent.result || "Pending");
        setServicesCount(String(initialEvent.servicesCount || 1));
        setNotes(initialEvent.notes || "");
      } else {
        // New record
        const activeEligible = animals.filter(
          (a) =>
            a.status !== "Calf" &&
            a.status !== "Bull" &&
            a.status !== "Sold" &&
            a.status !== "Dead"
        );
        const pool = activeEligible.length > 0 ? activeEligible : availableAnimals;
        const targetId = initialAnimalId || (pool.length > 0 ? pool[0].id : "HF-027");
        setSelectedAnimal(targetId);
        setHeatDate(new Date().toISOString().split("T")[0]);
        setAiDate(new Date().toISOString().split("T")[0]);
        setSemenBull("AltaWheel USA Straw #894");
        setTechnician("Ali Hassan (Certified AI Tech)");
        setPdDate("");
        setResult("Pending");
        setServicesCount("1");
        setNotes("");
      }
    }
  }, [isOpen, initialEvent, initialAnimalId, animals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation 1: Animal selection
    if (!selectedAnimal) {
      setErrorMessage("Please select a target cow / heifer.");
      return;
    }

    // Validation 2: Heat date
    if (!heatDate) {
      setErrorMessage("Heat observed date is required.");
      return;
    }

    // Validation 3: AI Date vs Heat Date
    if (aiDate && heatDate && aiDate < heatDate) {
      setErrorMessage("Artificial Insemination (AI) date cannot be earlier than Heat Observed date.");
      return;
    }

    // Validation 4: PD Date vs AI Date
    if (pdDate && aiDate && pdDate < aiDate) {
      setErrorMessage("Pregnancy Diagnosis (PD) date cannot be earlier than the Insemination date.");
      return;
    }

    const cow = animals.find((a) => a.id === selectedAnimal) || initialAnimals.find((a) => a.id === selectedAnimal);

    setIsSubmitting(true);
    try {
      await onSave({
        id: initialEvent?.id,
        animal: `${cow?.id || selectedAnimal} (${cow?.name || "Cow"})`,
        animalId: selectedAnimal || "HF-027",
        heatDate,
        aiDate: aiDate || "",
        semenBull: semenBull.trim() || (aiDate ? "AltaWheel USA Straw #894" : "To be selected"),
        technician: technician.trim() || "—",
        pdDate: pdDate || (aiDate && result === "Pending" ? suggestedPdDate : undefined),
        result,
        expectedCalving: calculatedCalving || initialEvent?.expectedCalving || "",
        servicesCount: Number(servicesCount) || 1,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to save breeding record. Please verify server connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = Boolean(initialEvent?.id);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Breeding Record (${initialEvent?.id})` : "New Breeding Record"}
      subtitle={isEditing ? "Update estrus observation, insemination straw, and diagnosis" : "Log standing heat, artificial insemination, bull straw, and PD schedule"}
    >
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="alert-box error" style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #f87171", color: "#b91c1c", fontSize: "13px" }}>
            <b>Validation Notice:</b> {errorMessage}
          </div>
        )}

        <div className="form-grid">
          <label className="input-group" style={{ gridColumn: "span 2" }}>
            <span>Target Cow / Heifer *</span>
            <select
              value={selectedAnimal}
              onChange={(e) => setSelectedAnimal(e.target.value)}
              required
              disabled={isEditing}
            >
              {availableAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.breed} · {a.status} · Ear Tag: {a.earTag || "N/A"})
                </option>
              ))}
              {availableAnimals.length === 0 && (
                <option value="HF-027">HF-027 - Bella (HF · Lactating)</option>
              )}
            </select>
          </label>

          <label className="input-group">
            <span>Heat Observed Date *</span>
            <input
              type="date"
              value={heatDate}
              onChange={(e) => setHeatDate(e.target.value)}
              required
            />
          </label>

          <label className="input-group">
            <span>Breeding Method</span>
            <select
              value={breedingMethod}
              onChange={(e) => setBreedingMethod(e.target.value as any)}
            >
              <option value="Artificial Insemination">Artificial Insemination (AI)</option>
              <option value="Natural Service">Natural Service (Stud Bull)</option>
            </select>
          </label>

          <label className="input-group">
            <span>Insemination (AI) Date</span>
            <input
              type="date"
              value={aiDate}
              onChange={(e) => setAiDate(e.target.value)}
              placeholder="Optional if heat only"
            />
          </label>

          <label className="input-group">
            <span>Service Number</span>
            <input
              type="number"
              min="1"
              max="10"
              value={servicesCount}
              onChange={(e) => setServicesCount(e.target.value)}
            />
          </label>

          <label className="input-group">
            <span>Bull / Semen Straw</span>
            <input
              value={semenBull}
              onChange={(e) => setSemenBull(e.target.value)}
              placeholder="e.g. AltaWheel USA Straw #894 or Bull-02"
            />
          </label>

          <label className="input-group">
            <span>Technician / Vet</span>
            <input
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="e.g. Ali Hassan (Certified AI Tech)"
            />
          </label>

          <label className="input-group">
            <span>Pregnancy Diagnosis (PD) Date</span>
            <input
              type="date"
              value={pdDate}
              onChange={(e) => setPdDate(e.target.value)}
              placeholder={suggestedPdDate ? `Suggested: ${suggestedPdDate}` : undefined}
            />
          </label>

          <label className="input-group">
            <span>PD Status / Result</span>
            <select value={result} onChange={(e) => setResult(e.target.value as any)}>
              <option value="Pending">Pending (Scheduled Ultrasound)</option>
              <option value="Positive">Positive (Confirmed Pregnant)</option>
              <option value="Negative">Negative (Open / Repeat Estrus)</option>
              <option value="Suspicious">Suspicious / Recheck Required</option>
            </select>
          </label>

          {/* EXPECTED CALVING CALCULATION PREVIEW */}
          <div className="input-group" style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", background: "#f8fafc", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>
                Calculated Expected Calving Date (280-Day Bovine Gestation)
              </span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>Automatic Biological Projection</span>
            </div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: calculatedCalving ? "#0f766e" : "#64748b", marginTop: "4px" }}>
              {calculatedCalving ? `${calculatedCalving} (~280 days from AI)` : aiDate ? "Calculating..." : "Enter AI Date to compute projected calving window"}
            </div>
          </div>
        </div>

        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Notes & Clinical Observations</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Standing heat verified, clear cervical mucus discharge, high activity score."
            rows={2}
          />
        </label>

        <div className="form-actions" style={{ marginTop: "18px" }}>
          <button type="button" className="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "Saving to Database..." : isEditing ? "Update Breeding Record" : "Save Breeding Record"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 4A. RECORD HEAT MODAL
export function RecordHeatModal({
  isOpen,
  onClose,
  animals,
  initialAnimalId,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  initialAnimalId?: string;
  onSave: (data: {
    animalId: string;
    heatDate: string;
    heatSigns?: string;
    heatMethod?: string;
    technician?: string;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const eligibleAnimals = animals.filter(
    (a) =>
      a.status !== "Calf" &&
      a.status !== "Bull" &&
      a.status !== "Sold" &&
      a.status !== "Dead"
  );
  const pool = eligibleAnimals.length > 0 ? eligibleAnimals : animals;
  const [selectedAnimal, setSelectedAnimal] = useState(initialAnimalId || pool[0]?.id || "HF-027");
  const [heatDate, setHeatDate] = useState(new Date().toISOString().split("T")[0]);
  const [heatSigns, setHeatSigns] = useState("Standing Heat (Allows Mounting)");
  const [heatMethod, setHeatMethod] = useState("Visual Observation");
  const [technician, setTechnician] = useState("Herdsman Team");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
      if (initialAnimalId) {
        setSelectedAnimal(initialAnimalId);
      } else if (pool.length > 0 && !pool.some((a) => a.id === selectedAnimal)) {
        setSelectedAnimal(pool[0].id);
      }
      setHeatDate(new Date().toISOString().split("T")[0]);
      setHeatSigns("Standing Heat (Allows Mounting)");
      setHeatMethod("Visual Observation");
      setTechnician("Herdsman Team");
      setNotes("");
    }
  }, [isOpen, initialAnimalId, animals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) {
      setErrorMessage("Please select an animal.");
      return;
    }
    if (!heatDate) {
      setErrorMessage("Please enter the heat observation date.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        animalId: selectedAnimal,
        heatDate,
        heatSigns,
        heatMethod,
        technician: technician.trim() || "Herdsman Team",
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to record heat event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Estrus / Heat Observation"
      subtitle="Log biological standing heat signs and start reproductive cycle timeline"
    >
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="alert-box error" style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #f87171", color: "#b91c1c", fontSize: "13px" }}>
            <b>Notice:</b> {errorMessage}
          </div>
        )}

        <div className="form-grid">
          <label className="input-group" style={{ gridColumn: "span 2" }}>
            <span>Target Cow / Heifer *</span>
            <select
              value={selectedAnimal}
              onChange={(e) => setSelectedAnimal(e.target.value)}
              required
            >
              {pool.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.breed} · {a.status} · Tag: {a.earTag || "N/A"})
                </option>
              ))}
            </select>
          </label>

          <label className="input-group">
            <span>Heat Observed Date (Day 0) *</span>
            <input
              type="date"
              value={heatDate}
              onChange={(e) => setHeatDate(e.target.value)}
              required
            />
          </label>

          <label className="input-group">
            <span>Detection Method</span>
            <select value={heatMethod} onChange={(e) => setHeatMethod(e.target.value)}>
              <option value="Visual Observation">Visual Observation (Herdsman)</option>
              <option value="Activity Pedometer / Collar">Activity Pedometer / Neck Sensor</option>
              <option value="Tail Paint / Heat Detector">Tail Paint / Scratch Patch</option>
              <option value="Teaser Bull">Teaser Bull (Marker Harness)</option>
            </select>
          </label>

          <label className="input-group" style={{ gridColumn: "span 2" }}>
            <span>Primary Heat Signs / Symptoms</span>
            <select value={heatSigns} onChange={(e) => setHeatSigns(e.target.value)}>
              <option value="Standing Heat (Allows Mounting)">Standing Heat (Stands to be mounted - Prime sign)</option>
              <option value="Clear Mucus Discharge">Clear Stringy Cervical Mucus Discharge</option>
              <option value="Mounting Other Cows">Mounting Other Cows (Proestrus)</option>
              <option value="Restlessness & Bellowing">High Restlessness, Bellowing & Pacing</option>
              <option value="Swollen Pink Vulva">Swollen, Congested Vulva & Licked Tailhead</option>
            </select>
          </label>

          <label className="input-group" style={{ gridColumn: "span 2" }}>
            <span>Observer / Technician</span>
            <input
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="e.g. Ali Hassan (Herdsman) or Vet Team"
            />
          </label>
        </div>

        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Clinical & Behavioral Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Standing heat confirmed at 07:00 AM. Clear mucus discharge. Optimal AI window: 12-18h."
            rows={2}
          />
        </label>

        <div className="form-actions" style={{ marginTop: "18px" }}>
          <button type="button" className="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "Recording Heat..." : "Save Heat Record"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 4B. RECORD AI MODAL
export function RecordAiModal({
  isOpen,
  onClose,
  animals,
  initialAnimalId,
  initialHeatDate,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  initialAnimalId?: string;
  initialHeatDate?: string;
  onSave: (data: {
    animalId: string;
    heatDate?: string;
    aiDate: string;
    semenBull?: string;
    technician?: string;
    servicesCount?: number;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const eligibleAnimals = animals.filter(
    (a) =>
      a.status !== "Calf" &&
      a.status !== "Bull" &&
      a.status !== "Sold" &&
      a.status !== "Dead"
  );
  const pool = eligibleAnimals.length > 0 ? eligibleAnimals : animals;
  const [selectedAnimal, setSelectedAnimal] = useState(initialAnimalId || pool[0]?.id || "HF-027");
  const [heatDate, setHeatDate] = useState(initialHeatDate || new Date().toISOString().split("T")[0]);
  const [aiDate, setAiDate] = useState(new Date().toISOString().split("T")[0]);
  const [semenBull, setSemenBull] = useState("AltaWheel USA Straw #894");
  const [technician, setTechnician] = useState("Ali Hassan (Certified AI Tech)");
  const [servicesCount, setServicesCount] = useState("1");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
      if (initialAnimalId) {
        setSelectedAnimal(initialAnimalId);
      }
      setHeatDate(initialHeatDate || new Date().toISOString().split("T")[0]);
      setAiDate(new Date().toISOString().split("T")[0]);
      setSemenBull("AltaWheel USA Straw #894");
      setTechnician("Ali Hassan (Certified AI Tech)");
      setServicesCount("1");
      setNotes("");
    }
  }, [isOpen, initialAnimalId, initialHeatDate, animals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) {
      setErrorMessage("Please select target cow/heifer.");
      return;
    }
    if (!aiDate) {
      setErrorMessage("Insemination (AI) date is required.");
      return;
    }
    if (heatDate && aiDate < heatDate) {
      setErrorMessage("AI date cannot be earlier than Heat Observed date.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        animalId: selectedAnimal,
        heatDate,
        aiDate,
        semenBull: semenBull.trim() || "AltaWheel USA Straw #894",
        technician: technician.trim() || "Ali Hassan (Certified AI Tech)",
        servicesCount: Number(servicesCount) || 1,
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to record AI event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Artificial Insemination (AI)"
      subtitle="Document straw serial, technician, service count, and schedule pregnancy check"
    >
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="alert-box error" style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #f87171", color: "#b91c1c", fontSize: "13px" }}>
            <b>Notice:</b> {errorMessage}
          </div>
        )}

        <div className="form-grid">
          <label className="input-group" style={{ gridColumn: "span 2" }}>
            <span>Target Cow / Heifer *</span>
            <select
              value={selectedAnimal}
              onChange={(e) => setSelectedAnimal(e.target.value)}
              required
            >
              {pool.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.breed} · {a.status} · Tag: {a.earTag || "N/A"})
                </option>
              ))}
            </select>
          </label>

          <label className="input-group">
            <span>Insemination (AI) Date *</span>
            <input
              type="date"
              value={aiDate}
              onChange={(e) => setAiDate(e.target.value)}
              required
            />
          </label>

          <label className="input-group">
            <span>Service Number</span>
            <input
              type="number"
              min="1"
              max="10"
              value={servicesCount}
              onChange={(e) => setServicesCount(e.target.value)}
            />
          </label>

          <label className="input-group">
            <span>Bull / Semen Straw Spec *</span>
            <input
              value={semenBull}
              onChange={(e) => setSemenBull(e.target.value)}
              placeholder="e.g. AltaWheel USA Straw #894 or Bull-02"
              required
            />
          </label>

          <label className="input-group">
            <span>Certified AI Technician *</span>
            <input
              value={technician}
              onChange={(e) => setTechnician(e.target.value)}
              placeholder="e.g. Ali Hassan (Certified AI Tech)"
              required
            />
          </label>

          <div className="input-group" style={{ gridColumn: "span 2", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px 14px", borderRadius: "8px" }}>
            <div style={{ fontSize: "12px", fontWeight: 600, color: "#166534" }}>
              Automated Schedule Notice:
            </div>
            <div style={{ fontSize: "13px", color: "#15803d", marginTop: "2px" }}>
              Saving this AI record calculates a ~35-day Ultrasound Diagnosis due date and ~280-day Expected Calving date.
            </div>
          </div>
        </div>

        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Insemination Notes & Site</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Deep uterine horn placement, semen thawed at 37°C for 45s, good cervical passage."
            rows={2}
          />
        </label>

        <div className="form-actions" style={{ marginTop: "18px" }}>
          <button type="button" className="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "Recording AI..." : "Save AI Record"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 4C. RECORD PREGNANCY DIAGNOSIS MODAL
export function RecordPdModal({
  isOpen,
  onClose,
  animals,
  initialAnimalId,
  suggestedPdDate,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  initialAnimalId?: string;
  suggestedPdDate?: string;
  onSave: (data: {
    animalId: string;
    pdDate: string;
    result: "Positive" | "Negative" | "Suspicious" | "Pending";
    pdMethod?: string;
    veterinarian?: string;
    notes?: string;
  }) => Promise<void> | void;
}) {
  const eligibleAnimals = animals.filter(
    (a) =>
      a.status !== "Calf" &&
      a.status !== "Bull" &&
      a.status !== "Sold" &&
      a.status !== "Dead"
  );
  const pool = eligibleAnimals.length > 0 ? eligibleAnimals : animals;
  const [selectedAnimal, setSelectedAnimal] = useState(initialAnimalId || pool[0]?.id || "HF-027");
  const [pdDate, setPdDate] = useState(suggestedPdDate || new Date().toISOString().split("T")[0]);
  const [result, setResult] = useState<"Positive" | "Negative" | "Suspicious" | "Pending">("Positive");
  const [pdMethod, setPdMethod] = useState("Transrectal Ultrasound (30-45d)");
  const [veterinarian, setVeterinarian] = useState("Dr. Imran Khan (DVM)");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      setIsSubmitting(false);
      if (initialAnimalId) {
        setSelectedAnimal(initialAnimalId);
      }
      setPdDate(suggestedPdDate || new Date().toISOString().split("T")[0]);
      setResult("Positive");
      setPdMethod("Transrectal Ultrasound (30-45d)");
      setVeterinarian("Dr. Imran Khan (DVM)");
      setNotes("");
    }
  }, [isOpen, initialAnimalId, suggestedPdDate, animals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal) {
      setErrorMessage("Please select target cow/heifer.");
      return;
    }
    if (!pdDate) {
      setErrorMessage("Diagnosis date is required.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        animalId: selectedAnimal,
        pdDate,
        result,
        pdMethod,
        veterinarian: veterinarian.trim() || "Dr. Imran Khan (DVM)",
        notes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to record pregnancy diagnosis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Pregnancy Diagnosis (PD)"
      subtitle="Log clinical ultrasound or palpation diagnosis to confirm pregnancy or repeat estrus"
    >
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="alert-box error" style={{ marginBottom: "14px", padding: "10px 14px", borderRadius: "8px", background: "#fef2f2", border: "1px solid #f87171", color: "#b91c1c", fontSize: "13px" }}>
            <b>Notice:</b> {errorMessage}
          </div>
        )}

        <div className="form-grid">
          <label className="input-group" style={{ gridColumn: "span 2" }}>
            <span>Target Cow / Heifer *</span>
            <select
              value={selectedAnimal}
              onChange={(e) => setSelectedAnimal(e.target.value)}
              required
            >
              {pool.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.breed} · {a.status} · Tag: {a.earTag || "N/A"})
                </option>
              ))}
            </select>
          </label>

          <label className="input-group">
            <span>Examination Date *</span>
            <input
              type="date"
              value={pdDate}
              onChange={(e) => setPdDate(e.target.value)}
              required
            />
          </label>

          <label className="input-group">
            <span>Diagnosis Result *</span>
            <select
              value={result}
              onChange={(e) => setResult(e.target.value as any)}
              style={{
                fontWeight: 700,
                color:
                  result === "Positive"
                    ? "#15803d"
                    : result === "Negative"
                    ? "#b91c1c"
                    : result === "Suspicious"
                    ? "#b45309"
                    : "#475569",
              }}
            >
              <option value="Positive">Positive (Confirmed Pregnant ✓)</option>
              <option value="Negative">Negative (Open / Repeat Estrus ✗)</option>
              <option value="Suspicious">Suspicious / Recheck in 7-10 Days ⚠️</option>
              <option value="Pending">Pending (Scheduled)</option>
            </select>
          </label>

          <label className="input-group">
            <span>Examination Method</span>
            <select value={pdMethod} onChange={(e) => setPdMethod(e.target.value)}>
              <option value="Transrectal Ultrasound (30-45d)">Transrectal Ultrasound (Day 30-45)</option>
              <option value="Rectal Palpation (45-60d)">Rectal Palpation (Day 45-60)</option>
              <option value="Blood/Milk PAG / Progesterone">Blood/Milk PAG / Progesterone Test</option>
              <option value="Visual/Clinical Signs">Clinical Observation / Non-Return</option>
            </select>
          </label>

          <label className="input-group">
            <span>Veterinarian / Examiner</span>
            <input
              value={veterinarian}
              onChange={(e) => setVeterinarian(e.target.value)}
              placeholder="e.g. Dr. Imran Khan (DVM)"
            />
          </label>
        </div>

        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Ultrasound Findings & Clinical Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Viable embryo detected with clear heartbeat. Left horn gravid. Corpus luteum present on left ovary."
            rows={2}
          />
        </label>

        <div className="form-actions" style={{ marginTop: "18px" }}>
          <button type="button" className="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "Saving Diagnosis..." : "Save Pregnancy Diagnosis"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 4D. BREEDING PROTOCOL SETTINGS MODAL
export function BreedingSettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    gestationPeriodDays: number;
    pdCheckDays: number;
    heatToAiHours: number;
  };
  onSave: (settings: {
    gestationPeriodDays: number;
    pdCheckDays: number;
    heatToAiHours: number;
  }) => Promise<void> | void;
}) {
  const [gestationPeriodDays, setGestationPeriodDays] = useState(String(settings.gestationPeriodDays || 280));
  const [pdCheckDays, setPdCheckDays] = useState(String(settings.pdCheckDays || 35));
  const [heatToAiHours, setHeatToAiHours] = useState(String(settings.heatToAiHours || 12));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGestationPeriodDays(String(settings.gestationPeriodDays || 280));
      setPdCheckDays(String(settings.pdCheckDays || 35));
      setHeatToAiHours(String(settings.heatToAiHours || 12));
    }
  }, [isOpen, settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({
        gestationPeriodDays: Number(gestationPeriodDays) || 280,
        pdCheckDays: Number(pdCheckDays) || 35,
        heatToAiHours: Number(heatToAiHours) || 12,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Reproductive Protocols & Calculation Parameters"
      subtitle="Configure biological intervals for pregnancy checks, AI timing, and expected calving projections"
    >
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Bovine Gestation Period (Days)</span>
            <input
              type="number"
              min="260"
              max="305"
              value={gestationPeriodDays}
              onChange={(e) => setGestationPeriodDays(e.target.value)}
              required
            />
            <small style={{ color: "#64748b", marginTop: "4px" }}>Standard: ~280 days (Holstein / Friesian / Sahiwal: 279-283d)</small>
          </label>

          <label className="input-group">
            <span>Pregnancy Diagnosis (PD) Interval (Days)</span>
            <input
              type="number"
              min="25"
              max="90"
              value={pdCheckDays}
              onChange={(e) => setPdCheckDays(e.target.value)}
              required
            />
            <small style={{ color: "#64748b", marginTop: "4px" }}>Standard: ~35 days post-AI (Ultrasound diagnosis)</small>
          </label>

          <label className="input-group" style={{ gridColumn: "span 2" }}>
            <span>Heat-to-Insemination Guideline Window (Hours)</span>
            <input
              type="number"
              min="4"
              max="24"
              value={heatToAiHours}
              onChange={(e) => setHeatToAiHours(e.target.value)}
              required
            />
            <small style={{ color: "#64748b", marginTop: "4px" }}>AM/PM Rule: Inseminate ~12 hours following standing heat observation</small>
          </label>
        </div>

        <div className="form-actions" style={{ marginTop: "18px" }}>
          <button type="button" className="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </button>
          <button type="submit" className="primary" disabled={isSubmitting}>
            <Save size={16} /> {isSubmitting ? "Saving Parameters..." : "Save Protocol Settings"}
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 5. ADD CALVING MODAL
export function AddCalvingModal({
  isOpen,
  onClose,
  animals = [],
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals?: Animal[];
  onSave: (record: Partial<CalvingRecord> & { registerInHerd: boolean }) => void;
}) {
  const availableAnimals = animals.length > 0 ? animals : initialAnimals.filter((a) => a.status !== "Dead");
  const [damId, setDamId] = useState(availableAnimals[0]?.id || "HF-052");
  const [sireId, setSireId] = useState("Bull-04");
  const [actualDate, setActualDate] = useState(new Date().toISOString().split("T")[0]);
  const [difficulty, setDifficulty] = useState<"Normal" | "Assisted" | "Difficult" | "C-Section">("Normal");
  const [calfCount, setCalfCount] = useState("1");
  const [calfSex, setCalfSex] = useState<"Female" | "Male" | "Mixed">("Female");
  const [birthWeight, setBirthWeight] = useState("38.5");
  const [calfId, setCalfId] = useState(`HF-0${Math.floor(100 + Math.random() * 900)}`);
  const [colostrumFedHours, setColostrumFedHours] = useState("1.5");
  const [colostrumLitres, setColostrumLitres] = useState("4.0");
  const [complications, setComplications] = useState("");
  const [registerInHerd, setRegisterInHerd] = useState(true);

  useEffect(() => {
    if (isOpen) {
      const pool = animals.length > 0 ? animals : initialAnimals.filter((a) => a.status !== "Dead");
      if (pool.length > 0 && !pool.some((a) => a.id === damId)) {
        setDamId(pool[0].id);
      }
    }
  }, [isOpen, animals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dam = animals.find((a) => a.id === damId) || initialAnimals.find((a) => a.id === damId);
    onSave({
      damId: damId || "HF-052",
      damName: dam?.name || "Dam",
      sireId,
      actualDate,
      difficulty,
      calfCount: Number(calfCount) || 1,
      calfSex,
      birthWeight: Number(birthWeight) || 38.0,
      calfId,
      colostrumFedHours: Number(colostrumFedHours) || 2,
      colostrumLitres: Number(colostrumLitres) || 4,
      complications,
      registerInHerd,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Record Calving & Birth" subtitle="Document newborn calf delivery and automatically register to herd">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Mother (Dam) *</span>
            <select value={damId} onChange={(e) => setDamId(e.target.value)} required>
              {availableAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.breed} · {a.status})
                </option>
              ))}
            </select>
          </label>
          <label className="input-group">
            <span>Father (Sire ID)</span>
            <input value={sireId} onChange={(e) => setSireId(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Calving Date *</span>
            <input type="date" value={actualDate} onChange={(e) => setActualDate(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Calving Difficulty</span>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as any)}>
              <option value="Normal">Normal (Unassisted)</option>
              <option value="Assisted">Assisted (Slight Pull)</option>
              <option value="Difficult">Difficult (Dystocia)</option>
              <option value="C-Section">Caesarean Section</option>
            </select>
          </label>
          <label className="input-group">
            <span>Calf Sex</span>
            <select value={calfSex} onChange={(e) => setCalfSex(e.target.value as any)}>
              <option value="Female">Female (Heifer Calf)</option>
              <option value="Male">Male (Bull Calf)</option>
              <option value="Mixed">Twins (Mixed)</option>
            </select>
          </label>
          <label className="input-group">
            <span>Birth Weight (kg)</span>
            <input type="number" step="0.1" value={birthWeight} onChange={(e) => setBirthWeight(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Newborn Calf ID</span>
            <input value={calfId} onChange={(e) => setCalfId(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Colostrum Fed Within (Hours)</span>
            <input type="number" step="0.5" value={colostrumFedHours} onChange={(e) => setColostrumFedHours(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Colostrum Amount (L)</span>
            <input type="number" step="0.5" value={colostrumLitres} onChange={(e) => setColostrumLitres(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Complications / Notes</span>
            <input value={complications} onChange={(e) => setComplications(e.target.value)} placeholder="e.g. Placenta expelled cleanly" />
          </label>
        </div>

        <div className="checkbox-row" style={{ marginTop: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input type="checkbox" checked={registerInHerd} onChange={(e) => setRegisterInHerd(e.target.checked)} />
            <b>Automatically register newborn calf into Herd Master records</b>
          </label>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <Save size={16} /> Save Calving & Create Record
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 6. ADD CALF GROWTH MODAL
export function AddCalfGrowthModal({
  isOpen,
  onClose,
  calves = [],
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  calves?: Animal[];
  onSave: (growth: Partial<CalfGrowthRecord>) => void;
}) {
  const availableCalves =
    calves && calves.length > 0
      ? calves
      : initialAnimals.filter((a) => a.status === "Calf" || a.status === "Heifer" || a.age.includes("m") || a.age.includes("1y"));

  const [calfId, setCalfId] = useState(availableCalves[0]?.id || "HF-072");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [ageMonths, setAgeMonths] = useState("3");
  const [weightKg, setWeightKg] = useState("98.0");
  const [heightCm, setHeightCm] = useState("92");
  const [girthCm, setGirthCm] = useState("108");
  const [adgGrams, setAdgGrams] = useState("750");
  const [feedType, setFeedType] = useState<any>("Calf Starter");
  const [dailyMilkAllowanceL, setDailyMilkAllowanceL] = useState("2.0");
  const [weaningStatus, setWeaningStatus] = useState<any>("Weaned");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      const pool =
        calves && calves.length > 0
          ? calves
          : initialAnimals.filter((a) => a.status === "Calf" || a.status === "Heifer" || a.age.includes("m") || a.age.includes("1y"));
      if (pool.length > 0 && !pool.some((c) => c.id === calfId)) {
        setCalfId(pool[0].id);
      }
    }
  }, [isOpen, calves]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const c = availableCalves.find((a) => a.id === calfId);
    onSave({
      calfId: calfId || "HF-072",
      calfName: c?.name || "Calf",
      date,
      ageMonths: Number(ageMonths) || 1,
      weightKg: Number(weightKg) || 50,
      heightCm: Number(heightCm) || 80,
      girthCm: Number(girthCm) || 85,
      adgGrams: Number(adgGrams) || 700,
      feedType,
      dailyMilkAllowanceL: Number(dailyMilkAllowanceL) || 0,
      weaningStatus,
      notes,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Log Calf Growth & Body Metrics" subtitle="Record monthly heart-girth scale and Average Daily Gain (ADG)">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Select Calf / Heifer *</span>
            <select value={calfId} onChange={(e) => setCalfId(e.target.value)} required>
              {availableCalves.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} - {c.name} ({c.breed} · {c.age})
                </option>
              ))}
            </select>
          </label>
          <label className="input-group">
            <span>Measurement Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Age (Months)</span>
            <input type="number" step="0.5" value={ageMonths} onChange={(e) => setAgeMonths(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Live Weight (kg) *</span>
            <input type="number" step="0.5" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Withers Height (cm)</span>
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Heart Girth (cm)</span>
            <input type="number" value={girthCm} onChange={(e) => setGirthCm(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Average Daily Gain (g/day)</span>
            <input type="number" value={adgGrams} onChange={(e) => setAdgGrams(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Current Diet Feed</span>
            <select value={feedType} onChange={(e) => setFeedType(e.target.value)}>
              <option value="Colostrum">Colostrum</option>
              <option value="Whole Milk">Whole Milk (Warm)</option>
              <option value="Milk Replacer">Milk Replacer</option>
              <option value="Calf Starter">Calf Starter (20% CP Pellets)</option>
              <option value="Weaned Hay/TMR">Weaned Hay / Forage TMR</option>
            </select>
          </label>
          <label className="input-group">
            <span>Daily Milk Allowance (L)</span>
            <input type="number" step="0.5" value={dailyMilkAllowanceL} onChange={(e) => setDailyMilkAllowanceL(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Weaning Status</span>
            <select value={weaningStatus} onChange={(e) => setWeaningStatus(e.target.value)}>
              <option value="Pre-weaning">Pre-weaning (Liquid Diet)</option>
              <option value="Weaning in Progress">Weaning in Progress (Transition)</option>
              <option value="Weaned">Weaned (100% Solid Feed)</option>
            </select>
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <Save size={16} /> Save Growth Metric
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 7. ADD HEALTH & MEDICAL MODAL
export function AddHealthModal({
  isOpen,
  onClose,
  animals = [],
  diseases = [],
  medicines = [],
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals?: Animal[];
  diseases?: Disease[];
  medicines?: MedicineItem[];
  onSave: (record: Partial<HealthRecord>) => void;
}) {
  const availableAnimals = animals && animals.length > 0 ? animals : initialAnimals;
  const availableDiseases = diseases && diseases.length > 0 ? diseases : initialDiseases;
  const availableMedicines = medicines && medicines.length > 0 ? medicines : initialMedicines;

  const [animalId, setAnimalId] = useState(availableAnimals[0]?.id || "HF-027");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDiseaseId, setSelectedDiseaseId] = useState(availableDiseases[0]?.id || "");
  const [problem, setProblem] = useState("Mastitis clinical symptoms");
  const [diagnosis, setDiagnosis] = useState("Mastitis (Clinical / Subclinical)");
  const [selectedMedId, setSelectedMedId] = useState(availableMedicines[0]?.id || "");
  const [medicine, setMedicine] = useState("Intramast-DC");
  const [dose, setDose] = useState("1 tube (10ml)");
  const [duration, setDuration] = useState("3 Days");
  const [cost, setCost] = useState("1350");
  const [vet, setVet] = useState("Dr. Imran (DVM)");
  const [status, setStatus] = useState<any>("In Treatment");
  const [withdrawalDays, setWithdrawalDays] = useState("5");
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    if (isOpen) {
      const animalPool = animals && animals.length > 0 ? animals : initialAnimals;
      if (animalPool.length > 0 && !animalPool.some((a) => a.id === animalId)) {
        setAnimalId(animalPool[0].id);
      }
      const diseasePool = diseases && diseases.length > 0 ? diseases : initialDiseases;
      if (diseasePool.length > 0 && !selectedDiseaseId) {
        setSelectedDiseaseId(diseasePool[0].id);
        setDiagnosis(diseasePool[0].name);
        setProblem(diseasePool[0].commonSymptoms);
      }
      const medPool = medicines && medicines.length > 0 ? medicines : initialMedicines;
      if (medPool.length > 0 && !selectedMedId) {
        setSelectedMedId(medPool[0].id);
        setMedicine(medPool[0].name);
        setWithdrawalDays(String(medPool[0].withdrawalDays));
        setCost(String(medPool[0].unitPrice));
      }
    }
  }, [isOpen, animals, diseases, medicines]);

  const handleDiseaseChange = (dId: string) => {
    setSelectedDiseaseId(dId);
    const d = availableDiseases.find((x) => x.id === dId);
    if (d) {
      setDiagnosis(d.name);
      setProblem(d.commonSymptoms);
    }
  };

  const handleMedChange = (mId: string) => {
    setSelectedMedId(mId);
    const m = availableMedicines.find((x) => x.id === mId);
    if (m) {
      setMedicine(m.name);
      setWithdrawalDays(String(m.withdrawalDays));
      setCost(String(m.unitPrice));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cow = availableAnimals.find((a) => a.id === animalId);
    onSave({
      animal: `${cow?.id || animalId} (${cow?.name || "Cow"})`,
      animalId,
      date,
      problem,
      symptoms: problem,
      diagnosis,
      veterinarian: vet,
      treatment: `${medicine} (${dose}) for ${duration}`,
      medicine,
      medicineId: selectedMedId,
      dose,
      doseQty: 1,
      duration,
      cost: Number(cost) || 0,
      status,
      withdrawalDays: Number(withdrawalDays) || 0,
      remarks,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Record Medical Treatment & Prescription" subtitle="Deducts medication stock and flags milk withdrawal safety">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Target Animal *</span>
            <select value={animalId} onChange={(e) => setAnimalId(e.target.value)} required>
              {availableAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.status})
                </option>
              ))}
            </select>
          </label>
          <label className="input-group">
            <span>Treatment Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Disease Category Database</span>
            <select value={selectedDiseaseId} onChange={(e) => handleDiseaseChange(e.target.value)}>
              {availableDiseases.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.category})
                </option>
              ))}
            </select>
          </label>
          <label className="input-group">
            <span>Diagnosis / Condition</span>
            <input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Medicine Inventory</span>
            <select value={selectedMedId} onChange={(e) => handleMedChange(e.target.value)}>
              {availableMedicines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} (Stock: {m.quantity} {m.unit}) - Withdrawal: {m.withdrawalDays}d
                </option>
              ))}
            </select>
          </label>
          <label className="input-group">
            <span>Prescribed Dosage</span>
            <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 15 ml IV" />
          </label>
          <label className="input-group">
            <span>Course Duration</span>
            <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 3 Days" />
          </label>
          <label className="input-group">
            <span>Attending Veterinarian</span>
            <input value={vet} onChange={(e) => setVet(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Milk Withdrawal Hold (Days)</span>
            <input type="number" min="0" value={withdrawalDays} onChange={(e) => setWithdrawalDays(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Treatment Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="In Treatment">In Treatment (Active)</option>
              <option value="Recovered">Recovered / Discharged</option>
              <option value="Observation">Under Observation</option>
              <option value="Vaccination">Vaccination Program</option>
            </select>
          </label>
          <label className="input-group">
            <span>Medicine / Vet Cost (Rs)</span>
            <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
          </label>
        </div>

        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Clinical Symptoms & Notes</span>
          <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} />
        </label>

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <Save size={16} /> Save Health Record
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 8. ADD TRANSACTION MODAL
export function AddTransactionModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Partial<FinancialTransaction>) => void;
}) {
  const [type, setType] = useState<"Income" | "Expense">("Expense");
  const [category, setCategory] = useState("Feed Purchase");
  const [amount, setAmount] = useState("92000");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [entityName, setEntityName] = useState("AgriSilage Punjab Ltd");
  const [description, setDescription] = useState("Bulk silage & concentrate delivery");
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Bank Transfer" | "Cheque">("Bank Transfer");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      category,
      amount: Number(amount) || 0,
      date,
      entityName,
      description,
      paymentMethod,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Record Financial Voucher" subtitle="Add farm operational income or expense entry">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Transaction Type</span>
            <select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="Expense">Expense (Operational Cost)</option>
              <option value="Income">Income (Revenue Receipt)</option>
            </select>
          </label>
          <label className="input-group">
            <span>Category</span>
            {type === "Expense" ? (
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Feed Purchase">Feed & Silage Purchase</option>
                <option value="Veterinary & Medicine">Veterinary & Medicine</option>
                <option value="Labor / Wages">Labor / Wages & Payroll</option>
                <option value="Electricity & Utilities">Electricity & Utilities (LESCO)</option>
                <option value="Diesel & Generator Fuel">Diesel & Generator Fuel</option>
                <option value="Equipment Maintenance">Equipment Maintenance & Repairs</option>
                <option value="Animal Purchase">Livestock Animal Purchase</option>
                <option value="Transport & Logistics">Transport & Logistics</option>
                <option value="Miscellaneous Expense">Miscellaneous Expense</option>
              </select>
            ) : (
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Milk Sales">Milk Sales (Bulk / Direct)</option>
                <option value="Animal Sales">Live Cattle / Calf Sales</option>
                <option value="Manure Sales">Organic Manure & Fertilizer</option>
                <option value="Other Farm Income">Other Farm Income</option>
              </select>
            )}
          </label>
          <label className="input-group">
            <span>Total Amount (Rs) *</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Transaction Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Counterparty (Vendor / Customer)</span>
            <input value={entityName} onChange={(e) => setEntityName(e.target.value)} placeholder="e.g. Nestlé Pakistan" required />
          </label>
          <label className="input-group">
            <span>Payment Method</span>
            <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
              <option value="Bank Transfer">Bank Transfer (Online/IBFT)</option>
              <option value="Cash">Cash on Hand</option>
              <option value="Cheque">Bank Cheque</option>
            </select>
          </label>
        </div>
        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Description / Reference</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Payment for 1,980L milk delivery" />
        </label>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <Save size={16} /> Record Transaction
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 9. ADD TASK MODAL
export function AddTaskModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<TaskItem>) => void;
}) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<any>("Vaccination");
  const [target, setTarget] = useState("Entire Herd");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("Medium");
  const [assignedTo, setAssignedTo] = useState("Dr. Imran (Vet)");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title || "Scheduled Farm Duty",
      taskType,
      target,
      dueDate,
      priority,
      assignedTo,
      status: "Pending",
      notes,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Schedule Farm Task or Reminder" subtitle="Assign reproductive checks, vaccinations, or routine management duties">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Task Title *</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Pregnancy Diagnosis 35d Post AI" required />
          </label>
          <label className="input-group">
            <span>Task Category</span>
            <select value={taskType} onChange={(e) => setTaskType(e.target.value)}>
              <option value="Pregnancy Diagnosis">Pregnancy Diagnosis (PD)</option>
              <option value="Vaccination">Vaccination Booster</option>
              <option value="AI">Artificial Insemination (AI)</option>
              <option value="Dry-off">Dry-Off Protocol</option>
              <option value="Expected Calving">Expected Calving / Maternity</option>
              <option value="Medicine">Medicine & Withdrawal Check</option>
              <option value="Deworming">Deworming Routine</option>
              <option value="Hoof Trimming">Hoof Trimming</option>
              <option value="Weight Measurement">Weight & Girth Scale</option>
              <option value="Health Check">General Health Check</option>
            </select>
          </label>
          <label className="input-group">
            <span>Target Animal / Shed *</span>
            <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. HF-052 (Zara) or Shed 1" required />
          </label>
          <label className="input-group">
            <span>Due Date *</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Priority Level</span>
            <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
              <option value="High">High (Immediate Action)</option>
              <option value="Medium">Medium (Scheduled Routine)</option>
              <option value="Low">Low (General Maintenance)</option>
            </select>
          </label>
          <label className="input-group">
            <span>Assigned Staff / Vet</span>
            <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} />
          </label>
        </div>
        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Instructions & Protocol Details</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </label>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <Save size={16} /> Schedule Duty
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 10. SELL ANIMAL MODAL
export function SellAnimalModal({
  isOpen,
  onClose,
  animal,
  onSave,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
  onSave?: (data: { buyer: string; salePrice: number; reason: string; weight: number }) => void;
  onConfirm?: (soldAnimal: Animal, salePrice: number, buyerName: string, reason: string) => void;
}) {
  const [buyer, setBuyer] = useState("Malik Dairy Farm Okara");
  const [salePrice, setSalePrice] = useState("340000");
  const [reason, setReason] = useState<any>("Surplus Herd");
  const [weight, setWeight] = useState(String(animal?.weightKg || 550));

  if (!isOpen || !animal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = Number(salePrice) || 0;
    const weightNum = Number(weight) || 550;
    if (onConfirm) {
      onConfirm(animal, priceNum, buyer, reason);
    } else if (onSave) {
      onSave({
        buyer,
        salePrice: priceNum,
        reason,
        weight: weightNum,
      });
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Record Sale of Animal ${animal.id}`} subtitle="Archives animal from active herd and credits sale revenue">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Buyer Name / Farm *</span>
            <input value={buyer} onChange={(e) => setBuyer(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Sale Price (Rs) *</span>
            <input type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Sale Reason</span>
            <select value={reason} onChange={(e) => setReason(e.target.value)}>
              <option value="Surplus Herd">Surplus Herd / Commercial Sale</option>
              <option value="Low Production">Low Milk Production (Cull)</option>
              <option value="Reproductive Problem">Reproductive Infertility</option>
              <option value="Old Age">Old Age Replacement</option>
              <option value="Disease">Chronic Mastitis / Lameness</option>
            </select>
          </label>
          <label className="input-group">
            <span>Live Sale Weight (kg)</span>
            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <DollarSign size={16} /> Confirm Sale & Archive
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 11. RECORD MORTALITY MODAL
export function RecordMortalityModal({
  isOpen,
  onClose,
  animal,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
  onSave: (data: { cause: string; diseaseHistory: string; treatmentNotes: string; financialValue: number; postMortemNotes: string }) => void;
}) {
  const [cause, setCause] = useState("Acute Ruminal Tympany (Bloat)");
  const [diseaseHistory, setDiseaseHistory] = useState("Previous mild indigestion");
  const [treatmentNotes, setTreatmentNotes] = useState("Emergency trocarization attempted");
  const [financialValue, setFinancialValue] = useState("320000");
  const [postMortemNotes, setPostMortemNotes] = useState("Severe ruminal distension verified by vet.");

  if (!isOpen || !animal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      cause,
      diseaseHistory,
      treatmentNotes,
      financialValue: Number(financialValue) || 300000,
      postMortemNotes,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Record Mortality for Animal ${animal.id}`} subtitle="Archives deceased animal while retaining complete lifetime data">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Cause of Death *</span>
            <input value={cause} onChange={(e) => setCause(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Estimated Financial Value Loss (Rs)</span>
            <input type="number" value={financialValue} onChange={(e) => setFinancialValue(e.target.value)} />
          </label>
        </div>
        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Clinical Disease History</span>
          <input value={diseaseHistory} onChange={(e) => setDiseaseHistory(e.target.value)} />
        </label>
        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Emergency Treatment Notes</span>
          <input value={treatmentNotes} onChange={(e) => setTreatmentNotes(e.target.value)} />
        </label>
        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Post-Mortem Findings</span>
          <textarea value={postMortemNotes} onChange={(e) => setPostMortemNotes(e.target.value)} rows={2} />
        </label>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary" style={{ backgroundColor: "#c84545" }}>
            <AlertTriangle size={16} /> Record Deceased & Archive
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 12. QUICK 2-TAP MOBILE DATA ENTRY MODAL
export function QuickDataEntryModal({
  isOpen,
  onClose,
  animals = [],
  onLogMilk,
  onLogHealth,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals?: Animal[];
  onLogMilk: (record: Partial<MilkRecord>) => void;
  onLogHealth: (record: Partial<HealthRecord>) => void;
}) {
  const safeAnimals = animals && animals.length > 0 ? animals : [];
  const [selectedAnimalId, setSelectedAnimalId] = useState(safeAnimals[0]?.id || "HF-027");
  const [mode, setMode] = useState<"milk" | "heat" | "sickness">("milk");
  const [morningL, setMorningL] = useState("14.0");
  const [eveningL, setEveningL] = useState("13.5");
  const [symptom, setSymptom] = useState("Mastitis / Udder swelling");

  useEffect(() => {
    if (safeAnimals.length > 0 && !safeAnimals.some(a => a.id === selectedAnimalId)) {
      setSelectedAnimalId(safeAnimals[0].id);
    }
  }, [isOpen, safeAnimals, selectedAnimalId]);

  if (!isOpen) return null;

  const handleQuickSubmit = () => {
    const cow = safeAnimals.find((a) => a.id === selectedAnimalId);
    if (mode === "milk") {
      onLogMilk({
        animalId: selectedAnimalId,
        name: cow?.name || "Cow",
        date: new Date().toISOString().split("T")[0],
        session: "Both",
        morningLitres: Number(morningL) || 0,
        eveningLitres: Number(eveningL) || 0,
        totalLitres: (Number(morningL) || 0) + (Number(eveningL) || 0),
        fatPercent: 3.8,
        snfPercent: 8.8,
        quality: "Standard",
      });
    } else if (mode === "sickness") {
      onLogHealth({
        animal: `${cow?.id || selectedAnimalId} (${cow?.name || "Cow"})`,
        animalId: selectedAnimalId,
        date: new Date().toISOString().split("T")[0],
        problem: symptom,
        diagnosis: symptom,
        veterinarian: "Field Worker",
        treatment: "Flagged for Veterinary Inspection",
        medicine: "Pending Vet Visit",
        dose: "—",
        duration: "1 Day",
        cost: 0,
        status: "In Treatment",
        withdrawalDays: 0,
        withdrawalUntil: new Date().toISOString().split("T")[0],
      });
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="⚡ Quick 2-Tap Mobile Entry" subtitle="Rapid field logger designed for parlor operators and herdsmen">
      <div className="quick-entry-container">
        <label className="input-group">
          <span>1. Select Animal (or Scan Tag)</span>
          <select value={selectedAnimalId} onChange={(e) => setSelectedAnimalId(e.target.value)}>
            {safeAnimals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} - {a.name} ({a.earTag})
              </option>
            ))}
            {safeAnimals.length === 0 && (
              <option value="HF-027">HF-027 - Bella</option>
            )}
          </select>
        </label>

        <div className="quick-action-tabs">
          <button className={mode === "milk" ? "active" : ""} onClick={() => setMode("milk")}>
            <Droplets size={16} /> Milk Yield
          </button>
          <button className={mode === "sickness" ? "active" : ""} onClick={() => setMode("sickness")}>
            <Activity size={16} /> Flag Sick
          </button>
        </div>

        {mode === "milk" && (
          <div className="form-grid">
            <label className="input-group">
              <span>Morning (Litres)</span>
              <input type="number" step="0.5" value={morningL} onChange={(e) => setMorningL(e.target.value)} style={{ fontSize: "1.3rem", fontWeight: "bold" }} />
            </label>
            <label className="input-group">
              <span>Evening (Litres)</span>
              <input type="number" step="0.5" value={eveningL} onChange={(e) => setEveningL(e.target.value)} style={{ fontSize: "1.3rem", fontWeight: "bold" }} />
            </label>
          </div>
        )}

        {mode === "sickness" && (
          <label className="input-group">
            <span>Observed Symptoms</span>
            <select value={symptom} onChange={(e) => setSymptom(e.target.value)}>
              <option value="Mastitis / Swollen Quarter">Mastitis / Swollen Quarter</option>
              <option value="Lameness / Foot Injury">Lameness / Foot Injury</option>
              <option value="Fever / Loss of Appetite">Fever / Loss of Appetite</option>
              <option value="Bloat / Indigestion">Bloat / Indigestion</option>
              <option value="Respiratory Cough / Nasal">Respiratory Cough / Nasal</option>
            </select>
          </label>
        )}

        <div className="form-actions" style={{ marginTop: "20px" }}>
          <button className="primary" style={{ width: "100%", padding: "14px" }} onClick={handleQuickSubmit}>
            <CheckCircle2 size={18} /> Tap to Save Log Instantly
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

// 14. EDIT ANIMAL MODAL
export function EditAnimalModal({
  isOpen,
  onClose,
  animal,
  existingAnimals = [],
  onSave,
  onDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
  existingAnimals?: Animal[];
  onSave: (animal: Animal) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(animal?.name || "");
  const [earTag, setEarTag] = useState(animal?.earTag || "");
  const [rfid, setRfid] = useState(animal?.rfid || "");
  const [breed, setBreed] = useState(animal?.breed || "HF (Holstein Friesian)");
  const [sex, setSex] = useState<"Female" | "Male">(animal?.sex || "Female");
  const [status, setStatus] = useState<AnimalStatus>(animal?.status || "Lactating");
  const [dob, setDob] = useState(animal?.dob || "2022-06-15");
  const [age, setAge] = useState(animal?.age || "2y");
  const [location, setLocation] = useState(animal?.location || "Shed 1");
  const [group, setGroup] = useState(animal?.group || "High Milking Group");
  const [dam, setDam] = useState(animal?.dam || "");
  const [sire, setSire] = useState(animal?.sire || "");
  const [lactation, setLactation] = useState(String(animal?.lactation || 1));
  const [dim, setDim] = useState(String(animal?.dim || 0));
  const [milk, setMilk] = useState(String(animal?.milk || 0));
  const [weightKg, setWeightKg] = useState(String(animal?.weightKg || 550));
  const [heightCm, setHeightCm] = useState(String(animal?.heightCm || 142));
  const [remarks, setRemarks] = useState(animal?.remarks || "");
  const [photo, setPhoto] = useState<string>(animal?.photo || "");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && animal) {
      setName(animal.name || "");
      setEarTag(animal.earTag || "");
      setRfid(animal.rfid || "");
      setBreed(animal.breed || "HF (Holstein Friesian)");
      setSex(animal.sex || "Female");
      setStatus(animal.status || "Lactating");
      setDob(animal.dob || "2022-06-15");
      setAge(animal.age || "2y");
      setLocation(animal.location || "Shed 1");
      setGroup(animal.group || "High Milking Group");
      setDam(animal.dam || "");
      setSire(animal.sire || "");
      setLactation(animal.lactation !== null && animal.lactation !== undefined ? String(animal.lactation) : "1");
      setDim(animal.dim !== null && animal.dim !== undefined ? String(animal.dim) : "0");
      setMilk(animal.milk !== null && animal.milk !== undefined ? String(animal.milk) : "0");
      setWeightKg(String(animal.weightKg || 550));
      setHeightCm(String(animal.heightCm || 142));
      setRemarks(animal.remarks || "");
      setPhoto(animal.photo || "");
    }
  }, [isOpen, animal]);

  if (!isOpen || !animal) return null;

  // Duplicate Ear Tag check against OTHER animals
  const isDuplicateEarTag = existingAnimals.some(
    (a) => a.id !== animal.id && a.earTag.trim().toLowerCase() === earTag.trim().toLowerCase()
  );

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file (PNG, JPG, WebP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) setPhoto(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDuplicateEarTag) {
      alert(`Ear Tag "${earTag}" is already assigned to another animal in the herd.`);
      return;
    }

    const updatedAnimal: Animal = {
      ...animal,
      id: animal.id,
      name: name || animal.name,
      earTag: earTag || animal.earTag,
      rfid: rfid || animal.rfid,
      breed,
      sex,
      status,
      dob,
      age,
      location,
      group,
      dam,
      sire,
      lactation: status === "Lactating" ? Number(lactation) : null,
      dim: status === "Lactating" ? Number(dim) : null,
      milk: status === "Lactating" ? Number(milk) : null,
      weightKg: Number(weightKg) || 550,
      heightCm: Number(heightCm) || 142,
      remarks,
      photo: photo || undefined,
    };
    onSave(updatedAnimal);
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={`Edit Animal ${animal.id} (${animal.name})`} subtitle="Update livestock passport, status, pedigree, and profile image">
      <form onSubmit={handleSubmit}>
        {/* PHOTO UPLOAD / EDIT SECTION */}
        <div style={{
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          padding: "12px 16px",
          marginBottom: "16px"
        }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#334155", display: "block", marginBottom: "8px" }}>
            Animal Profile Photograph
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "10px",
                border: "2px dashed #cbd5e1",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                background: "#ffffff",
                position: "relative",
                cursor: "pointer"
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {photo ? (
                <img src={photo} alt="Animal Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ textAlign: "center", color: "#94a3b8", fontSize: "0.75rem", padding: "4px" }}>
                  <Upload size={20} style={{ margin: "0 auto 4px" }} />
                  <span>Upload / Drop</span>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "200px" }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleImageFile(e.target.files[0]);
                  }
                }}
              />
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 10px" }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> Change Photo
                </button>
                <button
                  type="button"
                  className="secondary"
                  style={{ fontSize: "0.8rem", padding: "6px 10px" }}
                  onClick={() => setPhoto("/bella-cow.jpg")}
                >
                  <ImageIcon size={14} /> Use Farm Preset
                </button>
                {photo && (
                  <button
                    type="button"
                    className="secondary"
                    style={{ fontSize: "0.8rem", padding: "6px 10px", color: "#dc2626" }}
                    onClick={() => setPhoto("")}
                  >
                    <Trash2 size={14} /> Remove Photo
                  </button>
                )}
              </div>
              <small style={{ color: "#64748b", fontSize: "0.75rem" }}>
                Supports JPG, PNG, WebP up to 10MB.
              </small>
            </div>
          </div>
        </div>

        <div className="form-grid">
          <label className="input-group">
            <span>Animal ID (Permanent)</span>
            <input value={animal.id} readOnly disabled style={{ background: "#f1f5f9", cursor: "not-allowed" }} />
          </label>
          <label className="input-group">
            <span>Animal Name *</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="input-group">
            <span style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Ear Tag Number *</span>
              {isDuplicateEarTag && <span style={{ color: "#dc2626", fontWeight: "bold" }}>⚠️ Duplicate!</span>}
            </span>
            <input
              value={earTag}
              onChange={(e) => setEarTag(e.target.value)}
              required
              style={isDuplicateEarTag ? { borderColor: "#dc2626", backgroundColor: "#fef2f2" } : {}}
            />
          </label>
          <label className="input-group">
            <span>RFID Tag</span>
            <input value={rfid} onChange={(e) => setRfid(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Breed</span>
            <select value={breed} onChange={(e) => setBreed(e.target.value)}>
              <option value="HF (Holstein Friesian)">Holstein Friesian (HF)</option>
              <option value="Jersey">Jersey</option>
              <option value="Sahiwal">Sahiwal Purebred</option>
              <option value="Crossbred (HF x Sahiwal)">Crossbred (HF x Sahiwal)</option>
              <option value="Nili Ravi">Nili Ravi (Buffalo)</option>
            </select>
          </label>
          <label className="input-group">
            <span>Sex</span>
            <select value={sex} onChange={(e) => setSex(e.target.value as any)}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </label>
          <label className="input-group">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as AnimalStatus)}>
              <option value="Lactating">Lactating</option>
              <option value="Dry">Dry</option>
              <option value="Pregnant">Pregnant</option>
              <option value="Heifer">Heifer</option>
              <option value="Calf">Calf</option>
              <option value="Open">Open</option>
              <option value="Sick">Sick</option>
              <option value="Quarantine">Quarantine</option>
              <option value="Bull">Bull</option>
            </select>
          </label>
          <label className="input-group">
            <span>Housing Location</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Group</span>
            <select value={group} onChange={(e) => setGroup(e.target.value)}>
              <option value="High Milking Group">High Milking Group</option>
              <option value="Medium Milking Group">Medium Milking Group</option>
              <option value="Dry Group">Dry Group</option>
              <option value="Pregnant Group">Pregnant Group</option>
              <option value="Heifer Pen">Heifer Pen</option>
              <option value="Calf Pen">Calf Pen</option>
              <option value="Bull Pen">Bull Pen</option>
              <option value="Quarantine Shed">Quarantine Shed</option>
            </select>
          </label>
          <label className="input-group">
            <span>Date of Birth</span>
            <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Age (Display)</span>
            <input value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Dam (Mother ID)</span>
            <input value={dam} onChange={(e) => setDam(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Sire (Father ID)</span>
            <input value={sire} onChange={(e) => setSire(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Weight (kg)</span>
            <input type="number" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Height (cm)</span>
            <input type="number" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          </label>
          {status === "Lactating" && (
            <>
              <label className="input-group">
                <span>Lactation No.</span>
                <input type="number" value={lactation} onChange={(e) => setLactation(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Days in Milk (DIM)</span>
                <input type="number" value={dim} onChange={(e) => setDim(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Current Milk (L/day)</span>
                <input type="number" step="0.1" value={milk} onChange={(e) => setMilk(e.target.value)} />
              </label>
            </>
          )}
        </div>
        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Remarks / Medical Notes</span>
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} />
        </label>
        <div className="form-actions" style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {onDelete && (
              <button
                type="button"
                className="secondary"
                style={{ color: "#dc2626", borderColor: "#fecaca" }}
                onClick={() => {
                  onClose();
                  onDelete(animal.id);
                }}
              >
                <Trash2 size={16} /> Delete Animal
              </button>
            )}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="button" className="secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary" disabled={isDuplicateEarTag}>
              <Save size={16} /> Save Changes
            </button>
          </div>
        </div>
      </form>
    </BaseModal>
  );
}

// 14B. DEDICATED DELETE CONFIRMATION MODAL
export function DeleteAnimalModal({
  isOpen,
  onClose,
  animal,
  onConfirmDelete,
}: {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
  onConfirmDelete: (id: string) => void;
}) {
  if (!isOpen || !animal) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Delete Animal ${animal.id}?`}
      subtitle="Permanent removal confirmation"
    >
      <div style={{ textAlign: "left", padding: "8px 0" }}>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "10px",
          padding: "16px",
          marginBottom: "16px"
        }}>
          {animal.photo ? (
            <img
              src={animal.photo}
              alt={animal.name}
              style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "8px",
              background: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#dc2626"
            }}>
              <AlertTriangle size={32} />
            </div>
          )}
          <div>
            <h4 style={{ margin: "0 0 4px 0", color: "#991b1b", fontSize: "1.1rem" }}>
              {animal.name} ({animal.id})
            </h4>
            <p style={{ margin: 0, color: "#7f1d1d", fontSize: "0.85rem" }}>
              Ear Tag: <b>{animal.earTag}</b> · Breed: <b>{animal.breed}</b> · Status: <b>{animal.status}</b>
            </p>
          </div>
        </div>

        <p style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "20px" }}>
          Are you sure you want to permanently delete <b>{animal.name} ({animal.id})</b> from the active herd?
          This action will remove the animal from the herd register.
        </p>

        <div className="form-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="primary"
            style={{ backgroundColor: "#dc2626", borderColor: "#dc2626" }}
            onClick={() => {
              onConfirmDelete(animal.id);
              onClose();
            }}
          >
            <Trash2 size={16} /> Yes, Permanently Delete
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

// 14C. ANIMAL QR CODE & PASSPORT PLACARD MODAL
export function AnimalQrModal({
  isOpen,
  onClose,
  animal,
}: {
  isOpen: boolean;
  onClose: () => void;
  animal: Animal | null;
}) {
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const deepLink = animal
    ? typeof window !== "undefined"
      ? `${window.location.origin}/#animal/${encodeURIComponent(animal.id)}`
      : `https://dairyfarm.local/#animal/${encodeURIComponent(animal.id)}`
    : "";

  useEffect(() => {
    if (isOpen && animal) {
      QRCode.toDataURL(deepLink, {
        width: 260,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error("QR Code Generation Error", err));
    }
  }, [isOpen, animal, deepLink]);

  if (!isOpen || !animal) return null;

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement("a");
    a.href = qrUrl;
    a.download = `QR_${animal.id}_${animal.earTag}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintPlacard = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ear Tag Placard - ${animal.id}</title>
          <style>
            @page { size: A5 landscape; margin: 10mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 20px; color: #0f172a; }
            .card { border: 3px solid #1565c0; border-radius: 12px; padding: 24px; text-align: center; max-width: 500px; margin: 0 auto; }
            .header { background: #1565c0; color: white; padding: 8px 16px; border-radius: 6px; font-weight: bold; font-size: 16px; margin-bottom: 16px; }
            .id-big { font-size: 32px; font-weight: 900; color: #1565c0; margin: 8px 0; }
            .tag { font-size: 20px; font-weight: 700; color: #334155; margin-bottom: 12px; }
            .qr-img { width: 180px; height: 180px; margin: 12px auto; display: block; }
            .details { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; text-align: left; font-size: 13px; background: #f8fafc; padding: 12px; border-radius: 8px; margin-top: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">PUNJAB DAIRY FARM — LIVESTOCK PASSPORT</div>
            <div class="id-big">${animal.id} — ${animal.name}</div>
            <div class="tag">EAR TAG: ${animal.earTag} ${animal.rfid ? "· RFID: " + animal.rfid : ""}</div>
            ${qrUrl ? `<img class="qr-img" src="${qrUrl}" alt="QR" />` : ""}
            <div class="details">
              <div><b>Breed:</b> ${animal.breed}</div>
              <div><b>Status:</b> ${animal.status}</div>
              <div><b>Location:</b> ${animal.location || "Shed 1"}</div>
              <div><b>Group:</b> ${animal.group || "Lactation Group"}</div>
              <div><b>DOB / Age:</b> ${animal.dob} (${animal.age})</div>
              <div><b>Weight:</b> ${animal.weightKg || 550} kg</div>
            </div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Live QR Code & Ear Tag Placard: ${animal.id}`}
      subtitle="Digital passport link for field scanning, pen signs, and cattle stall inspection"
    >
      <div style={{ textAlign: "center", padding: "8px 0" }}>
        {/* Printable Placard Container */}
        <div style={{
          background: "#f8fafc",
          border: "2px solid #cbd5e1",
          borderRadius: "12px",
          padding: "20px",
          maxWidth: "400px",
          margin: "0 auto 20px"
        }}>
          <div style={{
            background: "#1565c0",
            color: "#ffffff",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "0.8rem",
            fontWeight: 700,
            letterSpacing: "0.05em",
            marginBottom: "12px"
          }}>
            LIVESTOCK DIGITAL PASSPORT
          </div>

          <h3 style={{ margin: "4px 0", fontSize: "1.4rem", color: "#0f172a" }}>
            {animal.id} — {animal.name}
          </h3>
          <div style={{ color: "#475569", fontWeight: 600, fontSize: "0.95rem", marginBottom: "12px" }}>
            Ear Tag: <span style={{ color: "#1565c0" }}>{animal.earTag}</span> {animal.rfid && `· RFID: ${animal.rfid}`}
          </div>

          {qrUrl ? (
            <div style={{
              background: "#ffffff",
              padding: "10px",
              borderRadius: "8px",
              display: "inline-block",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              marginBottom: "12px"
            }}>
              <img src={qrUrl} alt={`QR Code for ${animal.id}`} style={{ width: "180px", height: "180px", display: "block" }} />
            </div>
          ) : (
            <div style={{ padding: "40px", color: "#94a3b8" }}>Generating QR code...</div>
          )}

          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "6px",
            fontSize: "0.8rem",
            textAlign: "left",
            background: "#ffffff",
            padding: "10px 12px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0"
          }}>
            <div><b>Breed:</b> {animal.breed}</div>
            <div><b>Status:</b> {animal.status}</div>
            <div><b>Location:</b> {animal.location || "Shed 1"}</div>
            <div><b>Group:</b> {animal.group || "Lactation"}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
          <button type="button" className="primary" onClick={handleDownloadQr} disabled={!qrUrl}>
            <Download size={16} /> Download QR PNG
          </button>
          <button type="button" className="secondary" onClick={handlePrintPlacard} disabled={!qrUrl}>
            <Printer size={16} /> Print Ear Tag Placard
          </button>
          <button type="button" className="secondary" onClick={handleCopyLink}>
            {copied ? <CheckCircle2 size={16} color="#16a34a" /> : <Copy size={16} />}
            {copied ? "Link Copied!" : "Copy Public Deep Link"}
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

// 15. ADD EVENT MODAL (General farm event logger & individual profile event logger)
export function AddEventModal({
  isOpen,
  onClose,
  animals = [],
  animalId: initialAnimalId,
  animalName,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals?: Animal[];
  animalId?: string;
  animalName?: string;
  onSave: (event: any) => void;
}) {
  const safeAnimals = animals && animals.length > 0 ? animals : [];
  const [animalId, setAnimalId] = useState(initialAnimalId || safeAnimals[0]?.id || "");
  const [eventType, setEventType] = useState("Heat");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (initialAnimalId) {
      setAnimalId(initialAnimalId);
    } else if (safeAnimals.length > 0 && !animalId) {
      setAnimalId(safeAnimals[0].id);
    }
  }, [isOpen, initialAnimalId, safeAnimals, animalId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      animalId: animalId || initialAnimalId || safeAnimals[0]?.id || "HF-027",
      animalName: animalName || safeAnimals.find(a => a.id === animalId)?.name || "",
      eventType,
      date,
      notes,
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Log Farm Event / Note" subtitle="Record herd management milestone, treatment note, or life stage event">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {safeAnimals.length > 0 ? (
            <label className="input-group">
              <span>Select Animal</span>
              <select value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
                {safeAnimals.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} - {a.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="input-group">
              <span>Animal Code & Name</span>
              <input value={animalName ? `${animalId || initialAnimalId} (${animalName})` : (animalId || initialAnimalId || "General Event")} readOnly disabled />
            </label>
          )}
          <label className="input-group">
            <span>Event Category</span>
            <select value={eventType} onChange={(e) => setEventType(e.target.value)}>
              <option value="Heat">Heat Observed</option>
              <option value="Hoof Trimming">Hoof Trimming</option>
              <option value="Deworming">Deworming</option>
              <option value="Body Condition Score">Body Condition Scoring</option>
              <option value="Group Move">Pen / Group Transfer</option>
              <option value="Clinical Observation">Clinical Observation / Check</option>
              <option value="General Note">General Farm Note</option>
            </select>
          </label>
          <label className="input-group">
            <span>Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
        </div>
        <label className="input-group" style={{ marginTop: "12px" }}>
          <span>Notes & Details</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Add observations, measurements, or follow-up instructions..." />
        </label>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <Save size={16} /> Save Event
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 16. PURCHASE STOCK MODAL
export function PurchaseStockModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stock: any) => void;
}) {
  const [itemName, setItemName] = useState("Corn Silage (Premium)");
  const [category, setCategory] = useState("Feed");
  const [quantity, setQuantity] = useState("5000");
  const [unit, setUnit] = useState("kg");
  const [unitPrice, setUnitPrice] = useState("18.5");
  const [supplier, setSupplier] = useState("Punjab Agri Silage Ltd");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      itemName,
      category,
      quantity: Number(quantity) || 0,
      unit,
      unitPrice: Number(unitPrice) || 0,
      totalCost: (Number(quantity) || 0) * (Number(unitPrice) || 0),
      supplier,
      paymentMethod,
      date: new Date().toISOString().split("T")[0],
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Purchase Feed / Medicine Stock" subtitle="Replenish farm inventory and automatically log purchase voucher">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Item Name *</span>
            <input value={itemName} onChange={(e) => setItemName(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Inventory Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Feed">Feed & Silage</option>
              <option value="Medicine">Veterinary Medicine</option>
              <option value="Semen">Breeding Semen Straws</option>
              <option value="Equipment">Farm Supplies & Spare Parts</option>
            </select>
          </label>
          <label className="input-group">
            <span>Quantity Purchased *</span>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Unit of Measurement</span>
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              <option value="kg">kg</option>
              <option value="L">Litres (L)</option>
              <option value="vial">Vials / Bottles</option>
              <option value="straw">Straws</option>
              <option value="bag">50kg Bags</option>
            </select>
          </label>
          <label className="input-group">
            <span>Unit Price (Rs) *</span>
            <input type="number" step="0.1" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Supplier / Vendor</span>
            <input value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
          </label>
        </div>
        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <Save size={16} /> Confirm Stock Purchase
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

// 17. RATION PLANNER MODAL
export function RationPlannerModal({
  isOpen,
  onClose,
  feeds = [],
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  feeds?: FeedItem[];
  onSave: (ration: any) => void;
}) {
  const [rationName, setRationName] = useState("High Milking Lactation TMR");
  const [targetGroup, setTargetGroup] = useState("High Milking Group");
  const [cowCount, setCowCount] = useState("8");
  const [silageKg, setSilageKg] = useState("28");
  const [concentrateKg, setConcentrateKg] = useState("8");
  const [hayKg, setHayKg] = useState("3");
  const [mineralGrams, setMineralGrams] = useState("250");
  const [expectedYieldL, setExpectedYieldL] = useState("28.0");

  if (!isOpen) return null;

  const costPerCow = Number(silageKg) * 18.5 + Number(concentrateKg) * 98.0 + Number(hayKg) * 35.0 + 120;
  const costPerLiter = expectedYieldL ? costPerCow / Number(expectedYieldL) : 95;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name: rationName,
      group: targetGroup,
      targetCowCount: Number(cowCount) || 5,
      totalKgPerCow: Number(silageKg) + Number(concentrateKg) + Number(hayKg) + 0.25,
      totalCostPerCow: Number(costPerCow.toFixed(0)),
      costPerLiterExpected: Number(costPerLiter.toFixed(1)),
      dailyGroupConsumptionKg: (Number(silageKg) + Number(concentrateKg) + Number(hayKg)) * Number(cowCount),
      dailyGroupCost: Number((costPerCow * Number(cowCount)).toFixed(0)),
      ingredients: [
        { feedId: "F-01", feedName: "Corn Silage", kgPerCow: Number(silageKg), costPerCow: Number(silageKg) * 18.5 },
        { feedId: "F-02", feedName: "Lactation WMC", kgPerCow: Number(concentrateKg), costPerCow: Number(concentrateKg) * 98.0 },
        { feedId: "F-03", feedName: "Rhodes Grass Hay", kgPerCow: Number(hayKg), costPerCow: Number(hayKg) * 35.0 },
      ],
    });
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Formulate TMR Diet & Ration Plan" subtitle="Optimize Dry Matter (DM), Crude Protein (CP), and Feed Cost per Liter">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="input-group">
            <span>Ration Plan Name *</span>
            <input value={rationName} onChange={(e) => setRationName(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Target Animal Group</span>
            <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
              <option value="High Milking Group">High Milking Cows (&gt;25 L/day)</option>
              <option value="Medium Milking Group">Medium Milking Cows (15-25 L/day)</option>
              <option value="Dry Group">Dry Cows (Far-off / Close-up)</option>
              <option value="Heifer Pen">Growing Heifers (12-24m)</option>
              <option value="Calf Pen">Calf Weaning Group</option>
            </select>
          </label>
          <label className="input-group">
            <span>Herd Head Count in Group</span>
            <input type="number" value={cowCount} onChange={(e) => setCowCount(e.target.value)} required />
          </label>
          <label className="input-group">
            <span>Target Daily Milk (L/cow)</span>
            <input type="number" step="0.5" value={expectedYieldL} onChange={(e) => setExpectedYieldL(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Corn Silage (kg/cow/day)</span>
            <input type="number" step="0.5" value={silageKg} onChange={(e) => setSilageKg(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Dairy WMC Concentrate (kg/cow/day)</span>
            <input type="number" step="0.5" value={concentrateKg} onChange={(e) => setConcentrateKg(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Rhodes / Lucerne Hay (kg/cow/day)</span>
            <input type="number" step="0.5" value={hayKg} onChange={(e) => setHayKg(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Mineral Premix & Buffer (g/cow/day)</span>
            <input type="number" value={mineralGrams} onChange={(e) => setMineralGrams(e.target.value)} />
          </label>
        </div>

        <div className="profit-grid" style={{ marginTop: "16px" }}>
          <div>
            <span>Est. Feed Cost / Cow</span>
            <b>Rs {costPerCow.toFixed(0)} / day</b>
          </div>
          <div>
            <span>Feed Cost / Litre Milk</span>
            <b style={{ color: "#167a4b" }}>Rs {costPerLiter.toFixed(1)} / L</b>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="primary">
            <Save size={16} /> Save TMR Ration Formula
          </button>
        </div>
      </form>
    </BaseModal>
  );
}

export function QrScannerModal({
  isOpen,
  onClose,
  animals,
  onSelectAnimal,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  onSelectAnimal: (animal: Animal) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const handleSelect = (a: Animal) => {
    onSelectAnimal(a);
    onClose();
  };

  const filtered = animals.filter(
    (a) =>
      a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.earTag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.rfid && a.rfid.toLowerCase().includes(searchTerm.toLowerCase())) ||
      a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="🔍 QR Code & RFID Tag Scanner" subtitle="Scan cow ear tag barcode or look up digital passport instantly">
      <div className="qr-scanner-sim">
        <div className="scanner-camera-box">
          <QrCode size={64} color="#1565c0" />
          <span>Point device camera at cattle Ear Tag or RFID collar</span>
          <div className="scanner-laser-line"></div>
        </div>

        <div className="scanner-manual-input">
          <label className="input-group">
            <span>Or Enter Tag / ID Manually</span>
            <input placeholder="Search Ear Tag (ET-1027), RFID, or Code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} autoFocus />
          </label>
        </div>

        <div className="scanner-results-list">
          {filtered.slice(0, 5).map((a) => (
            <div key={a.id} className="scanner-item" onClick={() => handleSelect(a)}>
              <div>
                <b>
                  {a.name} ({a.id})
                </b>
                <p>
                  Ear Tag: {a.earTag} · RFID: {a.rfid || "—"} · Location: {a.location}
                </p>
              </div>
              <span className={`status ${a.status.toLowerCase()}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </BaseModal>
  );
}
