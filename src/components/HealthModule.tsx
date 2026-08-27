import React, { useState, useEffect, useMemo } from "react";
import {
  HeartPulse, Syringe, Download, Plus, AlertTriangle, CheckCircle2,
  Trash2, Search, Filter, Calendar, ShieldCheck, Pill, Stethoscope,
  Activity, X, Save, Edit3, ArrowRight, Eye, ArrowLeft, RefreshCw
} from "lucide-react";
import { Animal, HealthRecord, VaccinationSchedule, MedicineItem, Disease } from "../types";
import {
  getHealthRecords, createHealthRecord, updateHealthRecord, deleteHealthRecord,
  getHealthSummary, getVaccinations, createVaccination, completeVaccination, deleteVaccination,
  getMedicines, createMedicine, getDiseases
} from "../api";
import { useToast } from "./Toast";
import { SummaryCard } from "./SummaryCard";
import { exportToCsv } from "../utils/exportCsv";

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  if (s.includes("recovered") || s.includes("completed") || s.includes("available")) {
    return <span className="status pregnant">{status}</span>;
  }
  if (s.includes("treatment") || s.includes("sick") || s.includes("overdue")) {
    return <span className="status sick">{status}</span>;
  }
  if (s.includes("observation") || s.includes("pending") || s.includes("scheduled")) {
    return <span className="status pending">{status}</span>;
  }
  return <span className="status default">{status}</span>;
}

export function HealthModule({
  animals,
  onAnimal,
  onNavigate,
}: {
  animals: Animal[];
  onAnimal?: (a: Animal) => void;
  onNavigate?: (page: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"treatments" | "vaccines" | "medicines" | "diseases">("treatments");
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationSchedule[]>([]);
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [diseases, setDiseases] = useState<Disease[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState("All");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modals
  const [treatmentModalOpen, setTreatmentModalOpen] = useState(false);
  const [vaccineModalOpen, setVaccineModalOpen] = useState(false);
  const [medicineModalOpen, setMedicineModalOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<HealthRecord | null>(null);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [recData, vacData, medData, disData, sumData] = await Promise.all([
        getHealthRecords(),
        getVaccinations(),
        getMedicines(),
        getDiseases(),
        getHealthSummary(),
      ]);
      setHealthRecords(Array.isArray(recData) ? recData : []);
      setVaccinations(Array.isArray(vacData) ? vacData : []);
      setMedicines(Array.isArray(medData) ? medData : []);
      setDiseases(Array.isArray(disData) ? disData : []);
      setSummary(sumData);
    } catch (err: any) {
      showToast(`Error loading health data: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Treatment Records
  const filteredRecords = useMemo(() => {
    return healthRecords.filter((h) => {
      if (filterStatus !== "All" && h.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          (h.animal || "").toLowerCase().includes(q) ||
          (h.animalId || "").toLowerCase().includes(q) ||
          (h.diagnosis || "").toLowerCase().includes(q) ||
          (h.medicine || "").toLowerCase().includes(q) ||
          (h.veterinarian || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (dateFrom && h.date < dateFrom) return false;
      if (dateTo && h.date > dateTo) return false;
      return true;
    });
  }, [healthRecords, filterStatus, search, dateFrom, dateTo]);

  // Active Milk Withdrawal Warnings
  const activeWithdrawals = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return healthRecords.filter((h) => {
      if (h.withdrawalUntil && h.withdrawalUntil >= today) return true;
      if (h.status === "In Treatment" && h.withdrawalDays > 0) return true;
      return false;
    });
  }, [healthRecords]);

  // Handle Treatment Save
  const handleSaveTreatment = async (data: Partial<HealthRecord>) => {
    try {
      if (editRecord) {
        await updateHealthRecord(editRecord.id, data);
        showToast("Treatment record updated successfully!", "success");
      } else {
        await createHealthRecord(data);
        showToast(`Medical treatment for ${data.animal} saved to database!`, "success");
      }
      setTreatmentModalOpen(false);
      setEditRecord(null);
      loadData();
    } catch (err: any) {
      showToast(`Failed to save: ${err.message}`, "error");
    }
  };

  // Handle Mark Recovered
  const handleMarkRecovered = async (record: HealthRecord) => {
    try {
      await updateHealthRecord(record.id, { status: "Recovered" });
      showToast(`${record.animal} marked as Recovered! Animal status updated.`, "success");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Handle Delete Treatment
  const handleDeleteTreatment = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this medical record?")) return;
    try {
      await deleteHealthRecord(id);
      showToast("Treatment record deleted.", "info");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Handle Vaccination Complete
  const handleCompleteVaccine = async (id: string) => {
    try {
      await completeVaccination(id);
      showToast("Vaccination marked as Completed and logged to database!", "success");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Handle Delete Vaccine
  const handleDeleteVaccine = async (id: string) => {
    if (!window.confirm("Delete this vaccination schedule entry?")) return;
    try {
      await deleteVaccination(id);
      showToast("Vaccination schedule removed.", "info");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (activeTab === "treatments") {
      const headers = ["Date", "Animal ID", "Animal Name", "Diagnosis", "Medicine", "Dosage", "Duration", "Cost (Rs)", "Veterinarian", "Status", "Withdrawal Days", "Safe Date"];
      const rows = filteredRecords.map((h) => [
        h.date, h.animalId || "", h.animal || "", h.diagnosis, h.medicine, h.dose, h.duration, h.cost, h.veterinarian, h.status, h.withdrawalDays, h.withdrawalUntil
      ]);
      exportToCsv("veterinary_treatment_records", headers, rows);
      showToast("Medical records exported to CSV", "success");
    } else if (activeTab === "vaccines") {
      const headers = ["Vaccine", "Target Group / Animal", "Scheduled Date", "Batch #", "Manufacturer", "Next Due Date", "Veterinarian", "Status"];
      const rows = vaccinations.map((v) => [
        v.vaccine, v.targetGroup || v.animalId || "", v.date, v.batch, v.manufacturer, v.nextDueDate, v.veterinarian, v.status
      ]);
      exportToCsv("herd_vaccination_schedule", headers, rows);
      showToast("Vaccination schedule exported to CSV", "success");
    } else if (activeTab === "medicines") {
      const headers = ["Medicine Name", "Category", "Quantity", "Unit", "Unit Price (Rs)", "Withdrawal Days", "Expiry Date", "Supplier"];
      const rows = medicines.map((m) => [
        m.name, m.category, m.quantity, m.unit, m.unitPrice, m.withdrawalDays, m.expiry, m.supplier
      ]);
      exportToCsv("veterinary_medicine_stock", headers, rows);
      showToast("Medicine inventory exported to CSV", "success");
    }
  };

  return (
    <div className="content" id="health-page">
      <div className="page-header module-page-header">
        <div>
          <h2 className="module-page-title">Veterinary & Herd Health</h2>
          <p className="module-page-subtitle">Track diagnosis, clinical treatments, vaccination, and milk withdrawal safety</p>
        </div>
        <div className="page-actions module-header-actions">
          <button
            className="secondary"
            id="btn-return-dashboard-health"
            onClick={() => (onNavigate ? onNavigate("Dashboard") : (window.location.hash = "#Dashboard"))}
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={15} /> Return to Dashboard
          </button>
          <button
            className="secondary"
            id="btn-refresh-health"
            onClick={loadData}
            disabled={loading}
            title="Reload health and medical records from database"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="secondary" id="btn-export-health" onClick={handleExportCsv}>
            <Download size={15} /> Export CSV
          </button>
          <button
            className="primary"
            id="btn-add-health-record"
            onClick={() => {
              setEditRecord(null);
              setTreatmentModalOpen(true);
            }}
          >
            <Plus size={16} /> Record Treatment
          </button>
        </div>
      </div>

      {/* 4 Professional Live Health Summary Cards */}
      <div className="summary-grid" id="health-summary-grid">
        <SummaryCard
          id="card-health-total-records"
          icon={<Stethoscope size={19} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          label="Total Medical Records"
          value={`${healthRecords.length} ${healthRecords.length === 1 ? "Case" : "Cases"}`}
          meta="All logged medical diagnoses"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("treatments");
            setFilterStatus("All");
            setSearch("");
          }}
        />
        <SummaryCard
          id="card-health-active-treatment"
          icon={<AlertTriangle size={19} />}
          iconBg="#fef2f2"
          iconColor="#dc2626"
          label="Active Cases In Treatment"
          value={`${healthRecords.filter((h) => h.status === "In Treatment" || h.status === "Sick" || h.status === "Active").length} Active`}
          valueColor={
            healthRecords.filter((h) => h.status === "In Treatment" || h.status === "Sick" || h.status === "Active").length > 0
              ? "#dc2626"
              : undefined
          }
          meta="Currently under veterinary care"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("treatments");
            setFilterStatus("In Treatment");
            setSearch("");
          }}
        />
        <SummaryCard
          id="card-health-withdrawal-holds"
          icon={<ShieldCheck size={19} />}
          iconBg="#fffbeb"
          iconColor="#d97706"
          label="Milk Withdrawal Holds"
          value={`${activeWithdrawals.length} ${activeWithdrawals.length === 1 ? "Cow" : "Cows"} Withholding`}
          valueColor={activeWithdrawals.length > 0 ? "#dc2626" : undefined}
          meta={activeWithdrawals.length > 0 ? "Milk segregation active" : "No active milk holds"}
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("treatments");
            setFilterStatus("All");
            setTimeout(() => {
              const el = document.getElementById("health-withdrawal-warning-card");
              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 100);
          }}
        />
        <SummaryCard
          id="card-health-vaccination-programs"
          icon={<Syringe size={19} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Vaccination Programs"
          value={
            vaccinations.length > 0
              ? `${vaccinations.filter((v) => v.status === "Completed").length} / ${vaccinations.length} Done`
              : "No active programs"
          }
          valueColor={
            vaccinations.length > 0 &&
            vaccinations.filter((v) => v.status === "Completed").length === vaccinations.length
              ? "#16a34a"
              : undefined
          }
          meta={vaccinations.length > 0 ? "Herd immunization progress" : "No scheduled programs"}
          loading={loading}
          clickable
          onClick={() => setActiveTab("vaccines")}
        />
      </div>

      {/* Active Milk Withdrawal Warning Card */}
      {activeWithdrawals.length > 0 && (
        <div className="card" id="health-withdrawal-warning-card" style={{ borderLeft: "4px solid #dc2626", background: "#fef2f2" }}>
          <div className="section-head" style={{ marginBottom: "8px" }}>
            <h3 style={{ color: "#991b1b", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={18} color="#dc2626" /> Active Milk Withdrawal Safety Restrictions ({activeWithdrawals.length} Animals)
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px", marginTop: "10px" }}>
            {activeWithdrawals.map((w) => {
              const foundAnimal = animals.find((a) => a.id === w.animalId || w.animal.includes(a.id));
              return (
                <div key={w.id} style={{ background: "#ffffff", padding: "12px 14px", borderRadius: "8px", border: "1px solid #fecaca", fontSize: "13px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <b
                      style={{ color: "#2563eb", cursor: foundAnimal && onAnimal ? "pointer" : "default" }}
                      onClick={() => foundAnimal && onAnimal && onAnimal(foundAnimal)}
                    >
                      {w.animal}
                    </b>
                    <span style={{ color: "#dc2626", fontWeight: "700" }}>Hold: {w.withdrawalDays}d</span>
                  </div>
                  <div style={{ color: "#475569" }}>Medication: <b>{w.medicine}</b></div>
                  <div style={{ color: "#475569" }}>Diagnosis: {w.diagnosis}</div>
                  <div style={{ marginTop: "6px", fontSize: "12px", color: "#166534", background: "#dcfce7", padding: "4px 8px", borderRadius: "4px", display: "inline-block" }}>
                    Safe to Sell Milk: <b>{w.withdrawalUntil || "Pending Clearance"}</b>
                  </div>
                </div>
              );
            })}
          </div>
          <p style={{ fontSize: "12px", color: "#991b1b", marginTop: "10px", margin: "10px 0 0 0" }}>
            <strong>CRITICAL FOOD SAFETY RULE:</strong> Milk from the above animals contains active antibiotic or chemical residues. It must remain isolated and discarded until the respective clearance dates.
          </p>
        </div>
      )}

      {/* Sub-Navigation Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginTop: "8px" }}>
        <button
          className={activeTab === "treatments" ? "chip active" : "chip"}
          onClick={() => setActiveTab("treatments")}
        >
          <HeartPulse size={15} /> Treatment & Clinical Log ({healthRecords.length})
        </button>
        <button
          className={activeTab === "vaccines" ? "chip active" : "chip"}
          onClick={() => setActiveTab("vaccines")}
        >
          <Syringe size={15} /> Vaccination Schedule ({vaccinations.length})
        </button>
        <button
          className={activeTab === "medicines" ? "chip active" : "chip"}
          onClick={() => setActiveTab("medicines")}
        >
          <Pill size={15} /> Medicine Inventory ({medicines.length})
        </button>
        <button
          className={activeTab === "diseases" ? "chip active" : "chip"}
          onClick={() => setActiveTab("diseases")}
        >
          <Stethoscope size={15} /> Clinical Disease Guide ({diseases.length})
        </button>
      </div>

      {/* 1. TREATMENTS TAB */}
      {activeTab === "treatments" && (
        <div className="card" id="health-treatment-history-card">
          <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div className="search" style={{ minWidth: "220px" }}>
              <Search size={15} />
              <input
                placeholder="Search animal, diagnosis, medicine, vet..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-row">
              {["All", "In Treatment", "Recovered", "Observation", "Vaccination"].map((st) => (
                <button
                  key={st}
                  className={filterStatus === st ? "chip active" : "chip"}
                  onClick={() => setFilterStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginLeft: "auto" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>From:</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: "4px 8px", fontSize: "12px" }} />
              <span style={{ fontSize: "12px", color: "#64748b" }}>To:</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: "4px 8px", fontSize: "12px" }} />
              {(dateFrom || dateTo || search || filterStatus !== "All") && (
                <button
                  className="secondary"
                  style={{ padding: "4px 8px", fontSize: "12px" }}
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setSearch("");
                    setFilterStatus("All");
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading health records from database...</div>
            ) : filteredRecords.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>No medical records available.</p>
                <p style={{ fontSize: "13px" }}>Click "Record Treatment" to log an animal diagnosis and medication course.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Animal</th>
                    <th>Diagnosis / Problem</th>
                    <th>Medicine & Dosage</th>
                    <th>Duration</th>
                    <th>Cost (Rs)</th>
                    <th>Veterinarian</th>
                    <th>Withdrawal</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((h) => {
                    const foundAnimal = animals.find(
                      (a) => (h.animalId && a.id.toLowerCase() === h.animalId.toLowerCase()) || (h.animal && (h.animal.includes(a.id) || h.animal.includes(a.name)))
                    );

                    return (
                      <tr key={h.id}>
                        <td>{h.date}</td>
                        <td
                          className="blue-text"
                          style={{ cursor: onAnimal && foundAnimal ? "pointer" : "default" }}
                          onClick={() => {
                            if (foundAnimal && onAnimal) onAnimal(foundAnimal);
                          }}
                          title={foundAnimal ? `Open profile for ${foundAnimal.id}` : undefined}
                        >
                          <b>{h.animal}</b>
                        </td>
                        <td>
                          <b>{h.diagnosis}</b>
                          {h.problem && h.problem !== h.diagnosis && (
                            <div style={{ fontSize: "11px", color: "#64748b" }}>{h.problem}</div>
                          )}
                        </td>
                        <td>
                          <div><b>{h.medicine}</b></div>
                          <div style={{ fontSize: "11px", color: "#64748b" }}>{h.dose}</div>
                        </td>
                        <td>{h.duration}</td>
                        <td><b>Rs {h.cost?.toLocaleString() || 0}</b></td>
                        <td>{h.veterinarian || "Dr. Imran (DVM)"}</td>
                        <td>
                          {h.withdrawalDays > 0 ? (
                            <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: "700" }}>
                              {h.withdrawalDays}d (Until {h.withdrawalUntil || "N/A"})
                            </span>
                          ) : (
                            <span style={{ color: "#16a34a", fontSize: "11px" }}>None (0d)</span>
                          )}
                        </td>
                        <td><StatusBadge status={h.status} /></td>
                        <td>
                          <div style={{ display: "flex", gap: "4px" }}>
                            {h.status === "In Treatment" && (
                              <button
                                className="secondary"
                                style={{ padding: "3px 7px", fontSize: "11px", color: "#16a34a" }}
                                onClick={() => handleMarkRecovered(h)}
                                title="Mark as Recovered"
                              >
                                <CheckCircle2 size={13} />
                              </button>
                            )}
                            <button
                              className="icon-action-btn"
                              onClick={() => {
                                setEditRecord(h);
                                setTreatmentModalOpen(true);
                              }}
                              title="Edit Record"
                            >
                              <Edit3 size={13} />
                            </button>
                            <button
                              className="icon-action-btn"
                              onClick={() => handleDeleteTreatment(h.id)}
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 2. VACCINATIONS TAB */}
      {activeTab === "vaccines" && (
        <div className="card" id="health-vaccinations-card">
          <div className="section-head">
            <div>
              <h3>Herd Vaccination Protocols & Prevention Programs</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>FMD, Hemorrhagic Septicemia (HS), Blackquarter (BQ), Anthrax, and Brucellosis</p>
            </div>
            <button className="primary" onClick={() => setVaccineModalOpen(true)}>
              <Plus size={15} /> Schedule Vaccination
            </button>
          </div>

          <div className="table-wrap">
            {vaccinations.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600" }}>No vaccination schedules found.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Vaccine Name</th>
                    <th>Target Animal / Herd Group</th>
                    <th>Scheduled Date</th>
                    <th>Batch #</th>
                    <th>Manufacturer</th>
                    <th>Next Booster Due</th>
                    <th>Veterinarian</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vaccinations.map((v) => (
                    <tr key={v.id}>
                      <td className="blue-text"><b>{v.vaccine}</b></td>
                      <td><b>{v.targetGroup || v.animalId || "All Herd"}</b></td>
                      <td>{v.date}</td>
                      <td><code>{v.batch}</code></td>
                      <td>{v.manufacturer}</td>
                      <td><b>{v.nextDueDate}</b></td>
                      <td>{v.veterinarian}</td>
                      <td><StatusBadge status={v.status} /></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {v.status !== "Completed" && (
                            <button
                              className="secondary"
                              style={{ padding: "4px 8px", fontSize: "11px", color: "#16a34a" }}
                              onClick={() => handleCompleteVaccine(v.id)}
                            >
                              <CheckCircle2 size={13} /> Mark Done
                            </button>
                          )}
                          <button
                            className="icon-action-btn"
                            onClick={() => handleDeleteVaccine(v.id)}
                            title="Delete Schedule"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* 3. MEDICINE INVENTORY TAB */}
      {activeTab === "medicines" && (
        <div className="card" id="health-medicines-card">
          <div className="section-head">
            <div>
              <h3>Veterinary Pharmacy & Medication Stock</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Antibiotics, vaccines, intramammary infusions, hormones, and supportive therapeutics</p>
            </div>
            <button className="primary" onClick={() => setMedicineModalOpen(true)}>
              <Plus size={15} /> Add Medicine
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Medicine Name</th>
                  <th>Category</th>
                  <th>Current Stock</th>
                  <th>Unit Price (Rs)</th>
                  <th>Withdrawal Hold</th>
                  <th>Expiry Date</th>
                  <th>Batch / Manufacturer</th>
                  <th>Supplier</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {medicines.map((m) => (
                  <tr key={m.id}>
                    <td className="blue-text"><b>{m.name}</b></td>
                    <td>{m.category}</td>
                    <td><b>{m.quantity} {m.unit}</b></td>
                    <td>Rs {m.unitPrice}</td>
                    <td>
                      {m.withdrawalDays > 0 ? (
                        <b style={{ color: "#dc2626" }}>{m.withdrawalDays} Days</b>
                      ) : (
                        <span style={{ color: "#16a34a" }}>0 Days</span>
                      )}
                    </td>
                    <td>{m.expiry}</td>
                    <td><small>{m.batch} · {m.manufacturer}</small></td>
                    <td>{m.supplier}</td>
                    <td>
                      <StatusBadge status={m.quantity <= 5 ? "Low Stock" : "In Stock"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. DISEASE GUIDE TAB */}
      {activeTab === "diseases" && (
        <div className="card" id="health-diseases-guide-card">
          <div className="section-head">
            <div>
              <h3>Clinical Veterinary Diagnosis Directory & Standard Protocols</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Reference guide for diagnosis, clinical indicators, and recommended treatments</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {diseases.map((d) => (
              <div key={d.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <h4 style={{ margin: 0, color: "#0f172a", fontSize: "15px" }}>{d.name}</h4>
                  <span className="status default" style={{ fontSize: "11px" }}>{d.category}</span>
                </div>
                <div style={{ fontSize: "13px", color: "#475569", marginBottom: "8px" }}>
                  <strong style={{ color: "#334155" }}>Symptoms: </strong> {d.commonSymptoms}
                </div>
                <div style={{ fontSize: "13px", color: "#166534", background: "#f0fdf4", padding: "8px 10px", borderRadius: "6px" }}>
                  <strong>Protocol: </strong> {d.recommendedTreatments}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record / Edit Treatment Modal */}
      {treatmentModalOpen && (
        <TreatmentModal
          isOpen={treatmentModalOpen}
          onClose={() => {
            setTreatmentModalOpen(false);
            setEditRecord(null);
          }}
          animals={animals}
          medicines={medicines}
          diseases={diseases}
          initialData={editRecord}
          onSave={handleSaveTreatment}
        />
      )}

      {/* Add Vaccination Modal */}
      {vaccineModalOpen && (
        <AddVaccineModal
          isOpen={vaccineModalOpen}
          onClose={() => setVaccineModalOpen(false)}
          animals={animals}
          onSave={async (data) => {
            try {
              await createVaccination(data);
              showToast("Vaccination schedule added!", "success");
              setVaccineModalOpen(false);
              loadData();
            } catch (err: any) {
              showToast(`Error: ${err.message}`, "error");
            }
          }}
        />
      )}

      {/* Add Medicine Modal */}
      {medicineModalOpen && (
        <AddMedicineModal
          isOpen={medicineModalOpen}
          onClose={() => setMedicineModalOpen(false)}
          onSave={async (data) => {
            try {
              await createMedicine(data);
              showToast(`Medicine ${data.name} added to pharmacy inventory!`, "success");
              setMedicineModalOpen(false);
              loadData();
            } catch (err: any) {
              showToast(`Error: ${err.message}`, "error");
            }
          }}
        />
      )}
    </div>
  );
}

function TreatmentModal({
  isOpen,
  onClose,
  animals,
  medicines,
  diseases,
  initialData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  medicines: MedicineItem[];
  diseases: Disease[];
  initialData: HealthRecord | null;
  onSave: (data: Partial<HealthRecord>) => void;
}) {
  const [animalId, setAnimalId] = useState(initialData?.animalId || animals[0]?.id || "HF-027");
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split("T")[0]);
  const [diagnosis, setDiagnosis] = useState(initialData?.diagnosis || (diseases[0]?.name || "Mastitis"));
  const [problem, setProblem] = useState(initialData?.problem || (diseases[0]?.commonSymptoms || "Fever and drop in milk"));
  const [selectedMedId, setSelectedMedId] = useState(initialData?.medicineId || medicines[0]?.id || "");
  const [medicine, setMedicine] = useState(initialData?.medicine || medicines[0]?.name || "Intramast-DC");
  const [dose, setDose] = useState(initialData?.dose || "1 tube (10ml)");
  const [duration, setDuration] = useState(initialData?.duration || "3 Days");
  const [cost, setCost] = useState(String(initialData?.cost || "1200"));
  const [vet, setVet] = useState(initialData?.veterinarian || "Dr. Imran (DVM)");
  const [status, setStatus] = useState<any>(initialData?.status || "In Treatment");
  const [withdrawalDays, setWithdrawalDays] = useState(String(initialData?.withdrawalDays ?? medicines[0]?.withdrawalDays ?? 5));
  const [remarks, setRemarks] = useState(initialData?.remarks || "");

  const handleDiseaseSelect = (dName: string) => {
    setDiagnosis(dName);
    const d = diseases.find((x) => x.name === dName);
    if (d) setProblem(d.commonSymptoms);
  };

  const handleMedSelect = (mId: string) => {
    setSelectedMedId(mId);
    const m = medicines.find((x) => x.id === mId);
    if (m) {
      setMedicine(m.name);
      setWithdrawalDays(String(m.withdrawalDays));
      setCost(String(m.unitPrice));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cow = animals.find((a) => a.id === animalId);
    const animalName = cow ? `${cow.id} (${cow.name})` : animalId;

    let withdrawalUntil = "";
    const wDays = Number(withdrawalDays) || 0;
    if (wDays > 0 && date) {
      const d = new Date(date);
      d.setDate(d.getDate() + wDays);
      withdrawalUntil = d.toISOString().split("T")[0];
    }

    onSave({
      animal: animalName,
      animalId,
      date,
      diagnosis,
      problem,
      symptoms: problem,
      medicine,
      medicineId: selectedMedId,
      dose,
      doseQty: 1,
      duration,
      cost: Number(cost) || 0,
      veterinarian: vet,
      status,
      withdrawalDays: wDays,
      withdrawalUntil,
      remarks,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{initialData ? "Edit Medical Record" : "Record Medical Treatment"}</h3>
            <p>Deducts medicine stock, logs veterinary cost to finance, and flags milk withdrawal safety</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Target Animal *</span>
                <select value={animalId} onChange={(e) => setAnimalId(e.target.value)} required>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.name} ({a.status})
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-group">
                <span>Treatment Date *</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Condition / Disease *</span>
                <select value={diagnosis} onChange={(e) => handleDiseaseSelect(e.target.value)}>
                  {diseases.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.category})
                    </option>
                  ))}
                  <option value="General Infection">General Infection / Other</option>
                </select>
              </label>
              <label className="input-group">
                <span>Prescribed Medicine *</span>
                <select value={selectedMedId} onChange={(e) => handleMedSelect(e.target.value)}>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (Stock: {m.quantity} {m.unit}) - Withdrawal: {m.withdrawalDays}d
                    </option>
                  ))}
                </select>
              </label>
              <label className="input-group">
                <span>Dosage *</span>
                <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="e.g. 15 ml IV daily" required />
              </label>
              <label className="input-group">
                <span>Course Duration *</span>
                <input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 3 Days" required />
              </label>
              <label className="input-group">
                <span>Milk Withdrawal (Days) *</span>
                <input type="number" min="0" value={withdrawalDays} onChange={(e) => setWithdrawalDays(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Treatment Cost (Rs) *</span>
                <input type="number" min="0" value={cost} onChange={(e) => setCost(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Attending Veterinarian</span>
                <input value={vet} onChange={(e) => setVet(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Treatment Status</span>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="In Treatment">In Treatment (Active)</option>
                  <option value="Recovered">Recovered / Discharged</option>
                  <option value="Observation">Under Observation</option>
                  <option value="Vaccination">Vaccination</option>
                </select>
              </label>
            </div>

            <label className="input-group" style={{ marginTop: "12px" }}>
              <span>Symptoms & Clinical Notes</span>
              <textarea value={problem} onChange={(e) => setProblem(e.target.value)} rows={2} />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Save size={16} /> Save Medical Treatment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddVaccineModal({
  isOpen,
  onClose,
  animals,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  onSave: (data: Partial<VaccinationSchedule>) => void;
}) {
  const [vaccine, setVaccine] = useState("FMD Oil Adjuvant Vaccine");
  const [targetGroup, setTargetGroup] = useState("All Milking Cows");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [nextDueDate, setNextDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 6);
    return d.toISOString().split("T")[0];
  });
  const [batch, setBatch] = useState("FMD-2024-V9");
  const [manufacturer, setManufacturer] = useState("Veterinary Research Institute");
  const [vet, setVet] = useState("Dr. Imran (DVM)");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      vaccine,
      targetGroup,
      date,
      nextDueDate,
      batch,
      manufacturer,
      veterinarian: vet,
      status: "Scheduled",
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Schedule Herd Vaccination Program</h3>
            <p>Schedule prophylactic immunization for disease prevention</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Vaccine Name *</span>
                <select value={vaccine} onChange={(e) => setVaccine(e.target.value)}>
                  <option value="FMD Oil Adjuvant Vaccine">FMD (Foot & Mouth Disease)</option>
                  <option value="HS Alum Precipitated Vaccine">HS (Hemorrhagic Septicemia)</option>
                  <option value="BQ Vaccine">BQ (Blackquarter)</option>
                  <option value="Brucellosis S19 Strain">Brucellosis (Calfhood S19)</option>
                  <option value="Anthrax Spore Vaccine">Anthrax Spore Vaccine</option>
                  <option value="Mastitis J-5 Bacterin">Mastitis J-5 Bacterin</option>
                </select>
              </label>
              <label className="input-group">
                <span>Target Group / Shed *</span>
                <select value={targetGroup} onChange={(e) => setTargetGroup(e.target.value)}>
                  <option value="Entire Farm Herd">Entire Farm Herd</option>
                  <option value="All Milking Cows">All Milking Cows</option>
                  <option value="Dry Cows & Pregnant">Dry Cows & Pregnant</option>
                  <option value="Heifers (6-18m)">Heifers (6-18m)</option>
                  <option value="Calves (< 6m)">Calves (&lt; 6m)</option>
                </select>
              </label>
              <label className="input-group">
                <span>Administration Date *</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Next Booster Due Date *</span>
                <input type="date" value={nextDueDate} onChange={(e) => setNextDueDate(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Batch / Lot Number *</span>
                <input value={batch} onChange={(e) => setBatch(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Manufacturer</span>
                <input value={manufacturer} onChange={(e) => setManufacturer(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Administering Veterinarian</span>
                <input value={vet} onChange={(e) => setVet(e.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Plus size={16} /> Schedule Vaccine
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AddMedicineModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<MedicineItem>) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<any>("Antibiotic");
  const [quantity, setQuantity] = useState("10");
  const [unit, setUnit] = useState("vials");
  const [unitPrice, setUnitPrice] = useState("850");
  const [withdrawalDays, setWithdrawalDays] = useState("3");
  const [expiry, setExpiry] = useState("2026-12-31");
  const [batch, setBatch] = useState("MED-2024-B1");
  const [manufacturer, setManufacturer] = useState("VetPharma Ltd");
  const [supplier, setSupplier] = useState("AgriVet Supplies");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      category,
      quantity: Number(quantity) || 1,
      unit,
      unitPrice: Number(unitPrice) || 0,
      withdrawalDays: Number(withdrawalDays) || 0,
      expiry,
      batch,
      manufacturer,
      supplier,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Add Veterinary Medicine / Vaccine</h3>
            <p>Register new therapeutic or pharmaceutical formulation</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Medicine Name *</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oxytetracycline 20% LA" required />
              </label>
              <label className="input-group">
                <span>Category *</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Anti-inflammatory">Anti-inflammatory / Painkiller</option>
                  <option value="Vaccine">Vaccine</option>
                  <option value="Dewormer">Dewormer / Anthelmintic</option>
                  <option value="Hormone">Reproductive Hormone</option>
                  <option value="Supplement">Mineral & Vitamin Supplement</option>
                </select>
              </label>
              <label className="input-group">
                <span>Quantity in Stock *</span>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Unit *</span>
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="vials">Vials / Bottles (100ml)</option>
                  <option value="tubes">Intramammary Tubes</option>
                  <option value="tablets">Boluses / Tablets</option>
                  <option value="doses">Doses</option>
                  <option value="L">Litres (L)</option>
                </select>
              </label>
              <label className="input-group">
                <span>Unit Price (Rs) *</span>
                <input type="number" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Milk Withdrawal Period (Days) *</span>
                <input type="number" min="0" value={withdrawalDays} onChange={(e) => setWithdrawalDays(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Expiry Date *</span>
                <input type="date" value={expiry} onChange={(e) => setExpiry(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Supplier / Vendor</span>
                <input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Save size={16} /> Save Medicine
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
