import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  BarChart3, Download, Calendar, Filter, Droplets, Wallet, CircleDollarSign,
  Egg, HeartPulse, Wheat, Boxes, Users, ArrowUpRight, ArrowDownLeft, FileText, CheckCircle2,
  ArrowLeft, RefreshCw
} from "lucide-react";
import { Animal, MilkRecord, BreedingEvent, HealthRecord, FinancialTransaction, FeedItem } from "../types";
import {
  getMilkRecords, getBreedingEvents, getHealthRecords, getFinance, getFeeds, getAnimals
} from "../api";
import { useToast } from "./Toast";
import { exportToCsv } from "../utils/exportCsv";

type ReportType =
  | "milk"
  | "pnl"
  | "herd"
  | "breeding"
  | "health"
  | "feed";

export function ReportsModule({
  animals = [],
  onNavigate,
}: {
  animals?: Animal[];
  onNavigate?: (page: string) => void;
}) {
  const [selectedReport, setSelectedReport] = useState<ReportType>("milk");
  const [dateRange, setDateRange] = useState<"7d" | "30d" | "month" | "all" | "custom">("30d");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Live datasets
  const [milkRecords, setMilkRecords] = useState<MilkRecord[]>([]);
  const [breedingEvents, setBreedingEvents] = useState<BreedingEvent[]>([]);
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { showToast } = useToast();

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [milk, breed, health, fin, fd] = await Promise.all([
        getMilkRecords(),
        getBreedingEvents(),
        getHealthRecords(),
        getFinance(),
        getFeeds(),
      ]);
      setMilkRecords(Array.isArray(milk) ? milk : []);
      setBreedingEvents(Array.isArray(breed) ? breed : []);
      setHealthRecords(Array.isArray(health) ? health : []);
      setTransactions(Array.isArray(fin) ? fin : []);
      setFeeds(Array.isArray(fd) ? fd : []);
    } catch (err: any) {
      showToast(`Error fetching report data: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Preset Date Handlers
  const handleSetPreset = (preset: "7d" | "30d" | "month" | "all") => {
    setDateRange(preset);
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    setEndDate(todayStr);

    if (preset === "7d") {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      setStartDate(d.toISOString().split("T")[0]);
    } else if (preset === "30d") {
      const d = new Date();
      d.setDate(d.getDate() - 30);
      setStartDate(d.toISOString().split("T")[0]);
    } else if (preset === "month") {
      const d = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(d.toISOString().split("T")[0]);
    } else if (preset === "all") {
      setStartDate("2020-01-01");
    }
  };

  // Filtered sub-datasets based on date
  const filteredMilk = useMemo(() => {
    return milkRecords.filter((m) => m.date >= startDate && m.date <= endDate);
  }, [milkRecords, startDate, endDate]);

  const filteredFinance = useMemo(() => {
    return transactions.filter((t) => t.date >= startDate && t.date <= endDate);
  }, [transactions, startDate, endDate]);

  const filteredBreeding = useMemo(() => {
    return breedingEvents.filter((b) => (b.aiDate || b.heatDate) >= startDate && (b.aiDate || b.heatDate) <= endDate);
  }, [breedingEvents, startDate, endDate]);

  const filteredHealth = useMemo(() => {
    return healthRecords.filter((h) => h.date >= startDate && h.date <= endDate);
  }, [healthRecords, startDate, endDate]);

  // Export Current Report
  const handleExportCsv = () => {
    if (selectedReport === "milk") {
      const headers = ["Date", "Animal ID", "Animal Name", "Morning (L)", "Evening (L)", "3rd Milking (L)", "Total Litres", "Fat %", "SNF %", "Quality Status"];
      const rows = filteredMilk.map((m) => [
        m.date, m.animalId, m.name, m.morningLitres, m.eveningLitres, m.thirdMilkingLitres || 0, m.totalLitres, m.fatPercent, m.snfPercent, m.quality
      ]);
      exportToCsv(`milk_production_audit_${startDate}_to_${endDate}`, headers, rows);
    } else if (selectedReport === "pnl") {
      const headers = ["Date", "Type", "Category", "Amount (Rs)", "Party / Vendor", "Payment Mode", "Description"];
      const rows = filteredFinance.map((t) => [
        t.date, t.type, t.category, t.amount, t.entityName, t.paymentMethod, t.description
      ]);
      exportToCsv(`pnl_financial_statement_${startDate}_to_${endDate}`, headers, rows);
    } else if (selectedReport === "herd") {
      const headers = ["Animal Code", "Name", "Breed", "Status", "Lactation #", "DIM", "Daily Milk (L)", "Weight (kg)", "Group", "Location"];
      const rows = animals.map((a) => [
        a.id, a.name, a.breed, a.status, a.lactation || "—", a.dim || "—", a.milk || "—", a.weightKg || "—", a.group, a.location
      ]);
      exportToCsv(`herd_demographics_register`, headers, rows);
    } else if (selectedReport === "breeding") {
      const headers = ["Animal", "Heat Date", "AI Date", "Sire / Bull", "Technician", "PD Date", "PD Result", "Expected Calving", "Services Count"];
      const rows = filteredBreeding.map((b) => [
        b.animal, b.heatDate, b.aiDate, b.semenBull, b.technician, b.pdDate, b.result, b.expectedCalving, b.servicesCount
      ]);
      exportToCsv(`breeding_reproduction_audit_${startDate}_to_${endDate}`, headers, rows);
    } else if (selectedReport === "health") {
      const headers = ["Date", "Animal", "Diagnosis", "Medicine", "Dosage", "Cost (Rs)", "Veterinarian", "Withdrawal Days", "Status"];
      const rows = filteredHealth.map((h) => [
        h.date, h.animal, h.diagnosis, h.medicine, h.dose, h.cost, h.veterinarian, h.withdrawalDays, h.status
      ]);
      exportToCsv(`veterinary_health_audit_${startDate}_to_${endDate}`, headers, rows);
    } else if (selectedReport === "feed") {
      const headers = ["Feed Name", "Category", "Stock (kg)", "Unit Price (Rs)", "Valuation (Rs)", "Supplier", "Status"];
      const rows = feeds.map((f) => [
        f.name, f.category, f.stock, f.unitPrice, f.stock * f.unitPrice, f.supplier, f.status
      ]);
      exportToCsv(`feed_inventory_report`, headers, rows);
    }
    showToast("Report exported to CSV successfully!", "success");
  };

  return (
    <div className="content" id="reports-page">
      <div className="page-header module-page-header">
        <div>
          <h2 className="module-page-title">Farm Reports & Analytics</h2>
          <p className="module-page-subtitle">Analyze production, health, breeding, inventory, and financial performance</p>
        </div>
        <div className="page-actions module-header-actions">
          <button
            className="secondary"
            id="btn-return-dashboard-reports"
            onClick={() => (onNavigate ? onNavigate("Dashboard") : (window.location.hash = "#Dashboard"))}
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={15} /> Return to Dashboard
          </button>
          <button
            className="secondary"
            id="btn-refresh-reports"
            onClick={fetchAllData}
            disabled={loading}
            title="Fetch latest reports data from database"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="primary" id="btn-export-current-report" onClick={handleExportCsv}>
            <Download size={15} /> Export Report (CSV)
          </button>
        </div>
      </div>

      {/* Date Range Selector Toolbar */}
      <div className="card" style={{ marginBottom: "16px", padding: "12px 16px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155", marginRight: "6px" }}>Time Period:</span>
            <button className={dateRange === "7d" ? "chip active" : "chip"} onClick={() => handleSetPreset("7d")}>
              Last 7 Days
            </button>
            <button className={dateRange === "30d" ? "chip active" : "chip"} onClick={() => handleSetPreset("30d")}>
              Last 30 Days
            </button>
            <button className={dateRange === "month" ? "chip active" : "chip"} onClick={() => handleSetPreset("month")}>
              This Month
            </button>
            <button className={dateRange === "all" ? "chip active" : "chip"} onClick={() => handleSetPreset("all")}>
              All Time
            </button>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <span style={{ fontSize: "12px", color: "#64748b" }}>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateRange("custom");
              }}
              style={{ padding: "4px 8px", fontSize: "13px" }}
            />
            <span style={{ fontSize: "12px", color: "#64748b" }}>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateRange("custom");
              }}
              style={{ padding: "4px 8px", fontSize: "13px" }}
            />
          </div>
        </div>
      </div>

      {/* Layout Grid: Left Sidebar for Report Categories + Right Main Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "16px" }}>
        {/* Left Category Nav */}
        <div className="card" style={{ padding: "8px" }}>
          <div style={{ padding: "8px 12px", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "#64748b" }}>
            Report Catalogs
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {[
              { id: "milk", label: "Milk Production & Sales", icon: Droplets },
              { id: "pnl", label: "Financial Profit & Loss (P&L)", icon: CircleDollarSign },
              { id: "herd", label: "Herd Demographics & Census", icon: Users },
              { id: "breeding", label: "Breeding & AI Performance", icon: Egg },
              { id: "health", label: "Veterinary Health & Treatments", icon: HeartPulse },
              { id: "feed", label: "Feed Inventory & Nutrition", icon: Wheat },
            ].map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedReport === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedReport(cat.id as any)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px",
                    borderRadius: "6px",
                    border: "none",
                    background: isActive ? "#eff6ff" : "transparent",
                    color: isActive ? "#2563eb" : "#334155",
                    fontWeight: isActive ? "700" : "500",
                    fontSize: "13px",
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Icon size={16} />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Main Content */}
        <div>
          {loading ? (
            <div className="card" style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
              Computing live analytics from database...
            </div>
          ) : (
            <>
              {/* 1. MILK PRODUCTION REPORT */}
              {selectedReport === "milk" && (
                <MilkProductionReport milkRecords={filteredMilk} />
              )}

              {/* 2. P&L REPORT */}
              {selectedReport === "pnl" && (
                <PnlReport transactions={filteredFinance} />
              )}

              {/* 3. HERD DEMOGRAPHICS REPORT */}
              {selectedReport === "herd" && (
                <HerdReport animals={animals} />
              )}

              {/* 4. BREEDING REPORT */}
              {selectedReport === "breeding" && (
                <BreedingReport breedingEvents={filteredBreeding} />
              )}

              {/* 5. HEALTH REPORT */}
              {selectedReport === "health" && (
                <HealthReport healthRecords={filteredHealth} />
              )}

              {/* 6. FEED REPORT */}
              {selectedReport === "feed" && (
                <FeedReport feeds={feeds} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// 1. Milk Report View
function MilkProductionReport({ milkRecords }: { milkRecords: MilkRecord[] }) {
  const totalLitres = milkRecords.reduce((sum, m) => sum + Number(m.totalLitres || 0), 0);
  const morningLitres = milkRecords.reduce((sum, m) => sum + Number(m.morningLitres || 0), 0);
  const eveningLitres = milkRecords.reduce((sum, m) => sum + Number(m.eveningLitres || 0), 0);
  const thirdLitres = milkRecords.reduce((sum, m) => sum + Number(m.thirdMilkingLitres || 0), 0);
  const avgFat = milkRecords.length > 0 ? (milkRecords.reduce((sum, m) => sum + Number(m.fatPercent || 0), 0) / milkRecords.length).toFixed(2) : "0.00";
  const avgSnf = milkRecords.length > 0 ? (milkRecords.reduce((sum, m) => sum + Number(m.snfPercent || 0), 0) / milkRecords.length).toFixed(2) : "0.00";
  const estimatedRevenue = totalLitres * 165;

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>Milk Production & Yield Audit</h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Total volume, milking sessions, composition, and gross milk revenue</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "16px" }}>
        <div className="stat-card">
          <div className="stat-label">Total Milk Harvested</div>
          <div className="stat-value" style={{ color: "#2563eb" }}>{totalLitres.toLocaleString()} L</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Estimated Milk Value</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>Rs {estimatedRevenue.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average Fat Content</div>
          <div className="stat-value">{avgFat}% Fat</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Average SNF Content</div>
          <div className="stat-value">{avgSnf}% SNF</div>
        </div>
      </div>

      <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
        <div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>Morning Milking Total:</span>
          <div style={{ fontWeight: "700", fontSize: "15px" }}>{morningLitres.toLocaleString()} L</div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>Evening Milking Total:</span>
          <div style={{ fontWeight: "700", fontSize: "15px" }}>{eveningLitres.toLocaleString()} L</div>
        </div>
        <div>
          <span style={{ fontSize: "11px", color: "#64748b" }}>3rd Milking Total:</span>
          <div style={{ fontWeight: "700", fontSize: "15px" }}>{thirdLitres.toLocaleString()} L</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Animal</th>
              <th>Morning (L)</th>
              <th>Evening (L)</th>
              <th>3rd (L)</th>
              <th>Total Litres</th>
              <th>Fat %</th>
              <th>SNF %</th>
              <th>Quality</th>
            </tr>
          </thead>
          <tbody>
            {milkRecords.slice(0, 50).map((m) => (
              <tr key={m.id}>
                <td>{m.date}</td>
                <td className="blue-text"><b>{m.name || m.animalId}</b></td>
                <td>{m.morningLitres}</td>
                <td>{m.eveningLitres}</td>
                <td>{m.thirdMilkingLitres || 0}</td>
                <td><b>{m.totalLitres} L</b></td>
                <td>{m.fatPercent}%</td>
                <td>{m.snfPercent}%</td>
                <td><span className="status pregnant">{m.quality}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 2. P&L Report View
function PnlReport({ transactions }: { transactions: FinancialTransaction[] }) {
  const incomeList = transactions.filter((t) => t.type === "Income");
  const expenseList = transactions.filter((t) => t.type === "Expense");
  const totalIncome = incomeList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalExpense = expenseList.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>Financial Profit & Loss (P&L) Statement</h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Comprehensive income realizations versus operating farm expenditures</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "16px" }}>
        <div className="stat-card">
          <div className="stat-label">Gross Revenue</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>Rs {totalIncome.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Operating Expenses</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>Rs {totalExpense.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Net Farm Operating Profit</div>
          <div className="stat-value" style={{ color: netProfit >= 0 ? "#16a34a" : "#dc2626" }}>
            Rs {netProfit.toLocaleString()}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Operating Margin</div>
          <div className="stat-value">
            {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : 0}%
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <h4 style={{ color: "#166534", marginBottom: "8px" }}>Income Streams (+):</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {incomeList.map((inc) => (
              <div key={inc.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#f0fdf4", borderRadius: "6px", fontSize: "13px" }}>
                <span>{inc.category} ({inc.entityName})</span>
                <b style={{ color: "#16a34a" }}>+Rs {Number(inc.amount).toLocaleString()}</b>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ color: "#991b1b", marginBottom: "8px" }}>Expense Outflows (-):</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {expenseList.map((exp) => (
              <div key={exp.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 10px", background: "#fef2f2", borderRadius: "6px", fontSize: "13px" }}>
                <span>{exp.category} ({exp.entityName})</span>
                <b style={{ color: "#dc2626" }}>-Rs {Number(exp.amount).toLocaleString()}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Herd Report View
function HerdReport({ animals = [] }: { animals?: Animal[] }) {
  const statusCounts: Record<string, number> = {};
  const breedCounts: Record<string, number> = {};

  (animals || []).forEach((a) => {
    statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    breedCounts[a.breed] = (breedCounts[a.breed] || 0) + 1;
  });

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>Herd Demographics & Structure Register</h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Total cattle inventory, reproductive status distribution, and breed composition</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "16px" }}>
        <div className="stat-card">
          <div className="stat-label">Total Cattle in Herd</div>
          <div className="stat-value">{animals.length} Head</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Milking Cows</div>
          <div className="stat-value" style={{ color: "#2563eb" }}>{statusCounts["Lactating"] || 0} Milking</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed Pregnant</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{statusCounts["Pregnant"] || 0} Cows</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Dry / Transition Cows</div>
          <div className="stat-value">{statusCounts["Dry"] || 0} Cows</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px" }}>
        <div>
          <h4>Herd Status Distribution:</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            {Object.entries(statusCounts).map(([st, cnt]) => (
              <div key={st} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px" }}>
                <span>{st}</span>
                <b>{cnt} cows ({((cnt / animals.length) * 100).toFixed(1)}%)</b>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4>Breed Composition:</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
            {Object.entries(breedCounts).map(([br, cnt]) => (
              <div key={br} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#f8fafc", borderRadius: "6px", fontSize: "13px" }}>
                <span>{br}</span>
                <b>{cnt} head ({((cnt / animals.length) * 100).toFixed(1)}%)</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 4. Breeding Report View
function BreedingReport({ breedingEvents }: { breedingEvents: BreedingEvent[] }) {
  const positive = breedingEvents.filter((b) => b.result === "Positive").length;
  const negative = breedingEvents.filter((b) => b.result === "Negative").length;
  const pending = breedingEvents.filter((b) => b.result === "Pending").length;
  const totalChecks = positive + negative;
  const conceptionRate = totalChecks > 0 ? ((positive / totalChecks) * 100).toFixed(1) : "0.0";

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>Reproduction & Insemination Performance Audit</h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>AI services count, conception rate percentage, and PD diagnosis outcomes</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "16px" }}>
        <div className="stat-card">
          <div className="stat-label">Total AI Services Performed</div>
          <div className="stat-value">{breedingEvents.length} Services</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Herd Conception Rate</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{conceptionRate}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Confirmed Pregnant (PD+)</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{positive} Pregnant</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Pending Pregnancy Check</div>
          <div className="stat-value" style={{ color: "#d97706" }}>{pending} Pending</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Animal</th>
              <th>AI Date</th>
              <th>Semen / Bull</th>
              <th>Technician</th>
              <th>PD Check Date</th>
              <th>Result</th>
              <th>Expected Calving</th>
            </tr>
          </thead>
          <tbody>
            {breedingEvents.map((b) => (
              <tr key={b.id}>
                <td className="blue-text"><b>{b.animal}</b></td>
                <td>{b.aiDate}</td>
                <td><b>{b.semenBull}</b></td>
                <td>{b.technician}</td>
                <td>{b.pdDate}</td>
                <td>
                  <span className={`status ${b.result === "Positive" ? "pregnant" : b.result === "Negative" ? "sick" : "pending"}`}>
                    {b.result}
                  </span>
                </td>
                <td><b>{b.expectedCalving || "—"}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 5. Health Report View
function HealthReport({ healthRecords }: { healthRecords: HealthRecord[] }) {
  const totalCost = healthRecords.reduce((sum, h) => sum + Number(h.cost || 0), 0);
  const activeCases = healthRecords.filter((h) => h.status === "In Treatment").length;
  const recoveredCases = healthRecords.filter((h) => h.status === "Recovered").length;

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>Veterinary Healthcare & Disease Audit</h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Clinical disease incidence, medication expenses, and recovery rates</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "16px" }}>
        <div className="stat-card">
          <div className="stat-label">Total Clinical Treatments</div>
          <div className="stat-value">{healthRecords.length} Cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Healthcare Expenditure</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>Rs {totalCost.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Currently In Treatment</div>
          <div className="stat-value" style={{ color: "#dc2626" }}>{activeCases} Cases</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Successfully Recovered</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>{recoveredCases} Cases</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Animal</th>
              <th>Diagnosis</th>
              <th>Medication</th>
              <th>Cost (Rs)</th>
              <th>Veterinarian</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {healthRecords.map((h) => (
              <tr key={h.id}>
                <td>{h.date}</td>
                <td className="blue-text"><b>{h.animal}</b></td>
                <td><b>{h.diagnosis}</b></td>
                <td>{h.medicine} ({h.dose})</td>
                <td><b>Rs {Number(h.cost).toLocaleString()}</b></td>
                <td>{h.veterinarian}</td>
                <td><span className="status pregnant">{h.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 6. Feed Report View
function FeedReport({ feeds }: { feeds: FeedItem[] }) {
  const totalValuation = feeds.reduce((sum, f) => sum + (f.stock * f.unitPrice), 0);

  return (
    <div className="card">
      <div className="section-head">
        <div>
          <h3>Feed Nutrition & Inventory Valuation Audit</h3>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Forage reserves, concentrate stockpile value, and reorder levels</p>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: "16px" }}>
        <div className="stat-card">
          <div className="stat-label">Total Feed Stock Valuation</div>
          <div className="stat-value" style={{ color: "#16a34a" }}>Rs {totalValuation.toLocaleString()}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Feed SKU Lines</div>
          <div className="stat-value">{feeds.length} Items</div>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Feed Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Unit Price (Rs)</th>
              <th>Total Value (Rs)</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {feeds.map((f) => (
              <tr key={f.id}>
                <td className="blue-text"><b>{f.name}</b></td>
                <td>{f.category}</td>
                <td><b>{f.stock.toLocaleString()} {f.unit}</b></td>
                <td>Rs {f.unitPrice}</td>
                <td><b>Rs {(f.stock * f.unitPrice).toLocaleString()}</b></td>
                <td>{f.supplier}</td>
                <td><span className="status pregnant">{f.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
