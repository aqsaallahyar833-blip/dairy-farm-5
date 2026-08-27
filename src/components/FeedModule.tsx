import React, { useState, useEffect, useMemo } from "react";
import {
  Wheat, Plus, Download, CircleDollarSign, Activity, AlertCircle,
  X, Save, Trash2, Edit3, CheckCircle2, Search, Filter, Layers,
  Calendar, ArrowRight, Truck, Info, RefreshCw, ArrowLeft
} from "lucide-react";
import { FeedItem, RationPlan } from "../types";
import {
  getFeeds, createFeed, updateFeed, deleteFeed,
  getRations, createRation, updateRation, deleteRation,
  distributeRationFeed, getFeedConsumption
} from "../api";
import { useToast } from "./Toast";
import { useSettings } from "../context/SettingsContext";
import { SummaryCard } from "./SummaryCard";
import { exportToCsv } from "../utils/exportCsv";

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  if (s.includes("available") || s.includes("in stock")) {
    return <span className="status pregnant">{status}</span>;
  }
  if (s.includes("low stock")) {
    return <span className="status pending">{status}</span>;
  }
  if (s.includes("out of stock")) {
    return <span className="status sick">{status}</span>;
  }
  return <span className="status default">{status}</span>;
}

export function FeedModule({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState<"inventory" | "rations" | "logs">("inventory");
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [rations, setRations] = useState<RationPlan[]>([]);
  const [consumptionLogs, setConsumptionLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { currencySymbol } = useSettings();

  // Modals
  const [addFeedOpen, setAddFeedOpen] = useState(false);
  const [editFeed, setEditFeed] = useState<FeedItem | null>(null);
  const [rationModalOpen, setRationModalOpen] = useState(false);
  const [distributeModalOpen, setDistributeModalOpen] = useState(false);
  const [selectedRation, setSelectedRation] = useState<RationPlan | null>(null);

  // Search & Filter
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [feedData, rationData, logData] = await Promise.all([
        getFeeds(),
        getRations(),
        getFeedConsumption(),
      ]);
      setFeeds(Array.isArray(feedData) ? feedData : []);
      setRations(Array.isArray(rationData) ? rationData : []);
      setConsumptionLogs(Array.isArray(logData) ? logData : []);
    } catch (err: any) {
      showToast(`Error loading feeds: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered feeds
  const filteredFeeds = useMemo(() => {
    return feeds.filter((f) => {
      if (categoryFilter !== "All" && f.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          f.name.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          f.supplier.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [feeds, categoryFilter, search]);

  // Overall feed valuation
  const totalValuation = useMemo(() => {
    return feeds.reduce((sum, f) => sum + (f.stock * f.unitPrice), 0);
  }, [feeds]);

  const lowStockCount = useMemo(() => {
    return feeds.filter((f) => f.stock <= f.minStock).length;
  }, [feeds]);

  // Estimated Feed Cost / Cow / Day from active rations or consumption logs
  const estCostPerCow = useMemo(() => {
    if (rations.length > 0) {
      const totalCows = rations.reduce((sum, r) => sum + (r.targetCowCount || 0), 0);
      const totalDailyCost = rations.reduce(
        (sum, r) => sum + (r.dailyGroupCost || (r.totalCostPerCow * (r.targetCowCount || 1)) || 0),
        0
      );
      return totalCows > 0
        ? Math.round(totalDailyCost / totalCows)
        : Math.round(rations.reduce((s, r) => s + (r.totalCostPerCow || 0), 0) / rations.length);
    }
    if (consumptionLogs.length > 0) {
      const totalFedCost = consumptionLogs.reduce((sum, l) => sum + (l.totalCost || 0), 0);
      const totalFedAnimals = consumptionLogs.reduce((sum, l) => sum + (l.animalsFed || 0), 0);
      if (totalFedAnimals > 0) {
        return Math.round(totalFedCost / totalFedAnimals);
      }
    }
    return null;
  }, [rations, consumptionLogs]);

  // Handle Save Feed
  const handleSaveFeed = async (data: Partial<FeedItem>) => {
    try {
      if (editFeed) {
        await updateFeed(editFeed.id, data);
        showToast(`Feed item "${data.name}" updated!`, "success");
      } else {
        await createFeed(data);
        showToast(`Feed ingredient "${data.name}" added to inventory!`, "success");
      }
      setAddFeedOpen(false);
      setEditFeed(null);
      loadData();
    } catch (err: any) {
      showToast(`Error saving feed: ${err.message}`, "error");
    }
  };

  // Handle Delete Feed
  const handleDeleteFeed = async (id: string) => {
    if (!window.confirm("Delete this feed ingredient from inventory?")) return;
    try {
      await deleteFeed(id);
      showToast("Feed item deleted.", "info");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Handle Distribute Ration
  const handleDistributeRation = async (ration: RationPlan, customCows?: number, notes?: string) => {
    try {
      const res = await distributeRationFeed(ration.id, customCows, notes);
      showToast(`Distributed ${ration.name} (${customCows || ration.targetCowCount} cows). Stock deducted & expense logged!`, "success");
      setDistributeModalOpen(false);
      setSelectedRation(null);
      loadData();
    } catch (err: any) {
      showToast(`Distribution error: ${err.message}`, "error");
    }
  };

  // Handle Delete Ration
  const handleDeleteRation = async (id: string) => {
    if (!window.confirm("Delete this ration formulation plan?")) return;
    try {
      await deleteRation(id);
      showToast("Ration plan removed.", "info");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (activeTab === "inventory") {
      const headers = ["Feed ID", "Ingredient Name", "Category", "Stock", "Unit", "Price/Unit (Rs)", "Total Valuation (Rs)", "Supplier", "Status"];
      const rows = feeds.map((f) => [
        f.id, f.name, f.category, f.stock, f.unit, f.unitPrice, f.stock * f.unitPrice, f.supplier, f.status
      ]);
      exportToCsv("feed_inventory_master", headers, rows);
      showToast("Feed inventory exported to CSV", "success");
    } else if (activeTab === "rations") {
      const headers = ["Plan ID", "Ration Name", "Target Group", "Animals", "Kg/Cow/Day", "Cost/Cow/Day (Rs)", "Est. Cost/Litre (Rs)", "Daily Group Cost (Rs)"];
      const rows = rations.map((r) => [
        r.id, r.name, r.group, r.targetCowCount, r.totalKgPerCow, r.totalCostPerCow, r.costPerLiterExpected, r.dailyGroupCost
      ]);
      exportToCsv("herd_ration_formulations", headers, rows);
      showToast("Ration formulas exported to CSV", "success");
    } else {
      const headers = ["Date", "Ration Name", "Animals Fed", "Total Kg Fed", "Total Cost (Rs)", "Performed By", "Notes"];
      const rows = consumptionLogs.map((l) => [
        l.date, l.rationName, l.animalsFed, l.totalKg, l.totalCost, l.performedBy, l.notes
      ]);
      exportToCsv("feed_consumption_logs", headers, rows);
      showToast("Consumption logs exported to CSV", "success");
    }
  };

  return (
    <div className="content" id="feed-page">
      <div className="page-header module-page-header">
        <div>
          <h2 className="module-page-title">Feed & Ration Management</h2>
          <p className="module-page-subtitle">Manage feed stocks, daily rations, consumption, and feeding costs</p>
        </div>
        <div className="page-actions module-header-actions">
          <button
            className="secondary"
            id="btn-return-dashboard-feed"
            onClick={() => (onNavigate ? onNavigate("Dashboard") : (window.location.hash = "#Dashboard"))}
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={15} /> Return to Dashboard
          </button>
          <button
            className="secondary"
            id="btn-refresh-feed"
            onClick={loadData}
            disabled={loading}
            title="Reload feed inventory and ration formulations from database"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="secondary" id="btn-export-feeds" onClick={handleExportCsv}>
            <Download size={15} /> Export CSV
          </button>
          <button className="secondary" id="btn-open-ration-planner" onClick={() => setRationModalOpen(true)}>
            <Layers size={15} /> Formulate TMR Ration
          </button>
          <button
            className="primary"
            id="btn-add-feed"
            onClick={() => {
              setEditFeed(null);
              setAddFeedOpen(true);
            }}
          >
            <Plus size={16} /> Add Feed Ingredient
          </button>
        </div>
      </div>

      {/* 4 Professional Summary Cards */}
      <div className="summary-grid" id="feed-summary-grid">
        <SummaryCard
          id="card-feed-valuation"
          icon={<Wheat size={19} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Feed Stock Valuation"
          value={`${currencySymbol} ${totalValuation.toLocaleString()}`}
          meta="Live inventory valuation"
          loading={loading}
          clickable
          onClick={() => setActiveTab("inventory")}
        />
        <SummaryCard
          id="card-feed-cost-per-cow"
          icon={<CircleDollarSign size={19} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          label="Est. Feed Cost / Cow / Day"
          value={
            estCostPerCow !== null
              ? `${currencySymbol} ${estCostPerCow.toLocaleString()}`
              : "No cost data available"
          }
          meta={estCostPerCow !== null ? "Live ration formulation" : "Insufficient cost data"}
          loading={loading}
          clickable
          onClick={() => setActiveTab("rations")}
        />
        <SummaryCard
          id="card-feed-formulations"
          icon={<Layers size={19} />}
          iconBg="#faf5ff"
          iconColor="#9333ea"
          label="Daily Group Formulations"
          value={`${rations.length} Active Plan${rations.length === 1 ? "" : "s"}`}
          meta="Nutritional group allocations"
          loading={loading}
          clickable
          onClick={() => setActiveTab("rations")}
        />
        <SummaryCard
          id="card-feed-low-stock"
          icon={<AlertCircle size={19} />}
          iconBg="#fef2f2"
          iconColor="#dc2626"
          label="Low Stock Alerts"
          value={`${lowStockCount} ${lowStockCount === 1 ? "Item" : "Items"}`}
          valueColor={lowStockCount > 0 ? "#dc2626" : undefined}
          meta="Below minimum safety buffer"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("inventory");
            setCategoryFilter("All");
          }}
        />
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginTop: "8px" }}>
        <button
          className={activeTab === "inventory" ? "chip active" : "chip"}
          onClick={() => setActiveTab("inventory")}
        >
          <Wheat size={15} /> Feed Ingredients & Stock ({feeds.length})
        </button>
        <button
          className={activeTab === "rations" ? "chip active" : "chip"}
          onClick={() => setActiveTab("rations")}
        >
          <Layers size={15} /> Group Ration Formulations (TMR) ({rations.length})
        </button>
        <button
          className={activeTab === "logs" ? "chip active" : "chip"}
          onClick={() => setActiveTab("logs")}
        >
          <Activity size={15} /> Daily Feeding & Distribution Logs ({consumptionLogs.length})
        </button>
      </div>

      {/* 1. INVENTORY TAB */}
      {activeTab === "inventory" && (
        <div className="card" id="feed-master-card">
          <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div className="search" style={{ minWidth: "220px" }}>
              <Search size={15} />
              <input
                placeholder="Search feed, forage, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-row">
              {["All", "Forage / Silage", "Concentrate", "Supplements", "Additives"].map((cat) => (
                <button
                  key={cat}
                  className={categoryFilter === cat ? "chip active" : "chip"}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading feed inventory from database...</div>
            ) : filteredFeeds.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>No feed items found.</p>
                <p style={{ fontSize: "13px" }}>Click "Add Feed Ingredient" to register concentrate, silage, or mineral supplements.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Ingredient Name</th>
                    <th>Category</th>
                    <th>Available Stock</th>
                    <th>Unit Price (Rs)</th>
                    <th>Total Valuation (Rs)</th>
                    <th>Min. Reorder Threshold</th>
                    <th>Supplier / Vendor</th>
                    <th>Stock Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFeeds.map((f) => (
                    <tr key={f.id}>
                      <td className="blue-text"><b>{f.name}</b></td>
                      <td>{f.category}</td>
                      <td><b>{f.stock.toLocaleString()} {f.unit}</b></td>
                      <td>Rs {f.unitPrice} / {f.unit}</td>
                      <td><b>Rs {(f.stock * f.unitPrice).toLocaleString()}</b></td>
                      <td>{f.minStock} {f.unit}</td>
                      <td>{f.supplier}</td>
                      <td><StatusBadge status={f.status} /></td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="icon-action-btn"
                            onClick={() => {
                              setEditFeed(f);
                              setAddFeedOpen(true);
                            }}
                            title="Edit Feed"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="icon-action-btn"
                            onClick={() => handleDeleteFeed(f.id)}
                            title="Delete Feed"
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

      {/* 2. RATIONS TAB */}
      {activeTab === "rations" && (
        <div className="card" id="group-rations-card">
          <div className="section-head">
            <div>
              <h3>Standardized Total Mixed Ration (TMR) Plans</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Formulated for nutritional stages, lactating tiers, dry cows, and growing heifers</p>
            </div>
            <button className="primary" onClick={() => setRationModalOpen(true)}>
              <Plus size={15} /> Formulate New Ration
            </button>
          </div>

          <div className="table-wrap">
            {rations.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600" }}>No ration plans configured.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Ration Plan Name</th>
                    <th>Target Herd Group</th>
                    <th>Head Count</th>
                    <th>Total Formulation / Head</th>
                    <th>Est. Cost / Cow / Day</th>
                    <th>Est. Cost / Litre Milk</th>
                    <th>Daily Group Cost</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rations.map((r) => (
                    <tr key={r.id}>
                      <td className="blue-text">
                        <b>{r.name}</b>
                        {r.ingredients && r.ingredients.length > 0 && (
                          <div style={{ fontSize: "11px", color: "#64748b", marginTop: "3px" }}>
                            {r.ingredients.map((ing) => `${ing.feedName} (${ing.kgPerCow}kg)`).join(" + ")}
                          </div>
                        )}
                      </td>
                      <td><b>{r.group}</b></td>
                      <td>{r.targetCowCount} Cows</td>
                      <td><b>{r.totalKgPerCow || 28} kg</b></td>
                      <td><b style={{ color: "#0f172a" }}>Rs {r.totalCostPerCow}</b></td>
                      <td><b style={{ color: "#16a34a" }}>Rs {r.costPerLiterExpected || 18.5} / L</b></td>
                      <td><b>Rs {r.dailyGroupCost?.toLocaleString()}</b></td>
                      <td>
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            className="primary"
                            style={{ padding: "4px 8px", fontSize: "11px", background: "#16a34a" }}
                            onClick={() => {
                              setSelectedRation(r);
                              setDistributeModalOpen(true);
                            }}
                          >
                            <Truck size={13} /> Distribute Daily Feed
                          </button>
                          <button
                            className="icon-action-btn"
                            onClick={() => handleDeleteRation(r.id)}
                            title="Delete Plan"
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

      {/* 3. LOGS TAB */}
      {activeTab === "logs" && (
        <div className="card" id="feed-logs-card">
          <div className="section-head">
            <div>
              <h3>Daily Feeding & Consumption Audit History</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Records of daily feed distribution, quantities consumed, and financial expense vouchers</p>
            </div>
          </div>

          <div className="table-wrap">
            {consumptionLogs.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600" }}>No feed distribution logs recorded yet.</p>
                <p style={{ fontSize: "13px" }}>Go to "Group Ration Formulations" and click "Distribute Daily Feed" to deduct stock and record feeding.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Ration Plan</th>
                    <th>Animals Fed</th>
                    <th>Total Feed Used (kg)</th>
                    <th>Total Cost (Rs)</th>
                    <th>Performed By</th>
                    <th>Notes / Status</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptionLogs.map((l) => (
                    <tr key={l.id}>
                      <td>{l.date}</td>
                      <td className="blue-text"><b>{l.rationName}</b></td>
                      <td>{l.animalsFed} Cows</td>
                      <td><b>{l.totalKg?.toLocaleString()} kg</b></td>
                      <td><b style={{ color: "#dc2626" }}>Rs {l.totalCost?.toLocaleString()}</b></td>
                      <td>{l.performedBy || "Feed Manager"}</td>
                      <td><span className="status pregnant">{l.notes || "Deducted & Logged"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Feed Modal */}
      {addFeedOpen && (
        <FeedFormModal
          isOpen={addFeedOpen}
          onClose={() => {
            setAddFeedOpen(false);
            setEditFeed(null);
          }}
          initialData={editFeed}
          onSave={handleSaveFeed}
        />
      )}

      {/* Formulate Ration Modal */}
      {rationModalOpen && (
        <RationFormModal
          isOpen={rationModalOpen}
          onClose={() => setRationModalOpen(false)}
          feeds={feeds}
          onSave={async (data) => {
            try {
              await createRation(data);
              showToast(`Ration formulation "${data.name}" saved!`, "success");
              setRationModalOpen(false);
              loadData();
            } catch (err: any) {
              showToast(`Error: ${err.message}`, "error");
            }
          }}
        />
      )}

      {/* Distribute Ration Modal */}
      {distributeModalOpen && selectedRation && (
        <DistributeFeedModal
          isOpen={distributeModalOpen}
          onClose={() => {
            setDistributeModalOpen(false);
            setSelectedRation(null);
          }}
          ration={selectedRation}
          onConfirm={(customCows, notes) => handleDistributeRation(selectedRation, customCows, notes)}
        />
      )}
    </div>
  );
}

function FeedFormModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: FeedItem | null;
  onSave: (data: Partial<FeedItem>) => void;
}) {
  const [name, setName] = useState(initialData?.name || "");
  const [category, setCategory] = useState(initialData?.category || "Forage / Silage");
  const [unit, setUnit] = useState(initialData?.unit || "kg");
  const [unitPrice, setUnitPrice] = useState(String(initialData?.unitPrice || "18.5"));
  const [stock, setStock] = useState(String(initialData?.stock || "5000"));
  const [minStock, setMinStock] = useState(String(initialData?.minStock || "500"));
  const [supplier, setSupplier] = useState(initialData?.supplier || "Punjab Agri Silage Ltd");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      category,
      unit,
      unitPrice: Number(unitPrice) || 0,
      stock: Number(stock) || 0,
      minStock: Number(minStock) || 0,
      supplier,
      status: Number(stock) <= Number(minStock) ? "Low Stock" : "Available",
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{initialData ? "Edit Feed Ingredient" : "Add Feed Ingredient"}</h3>
            <p>Register forage, concentrate, silage, or premix stock</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Feed Name *</span>
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Corn Silage 32% DM" required />
              </label>
              <label className="input-group">
                <span>Category *</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Forage / Silage">Forage / Silage</option>
                  <option value="Concentrate">Dairy Concentrate / Wanda</option>
                  <option value="Hay & Straw">Rhodes Grass / Alfalfa Hay</option>
                  <option value="Supplements">Mineral Premix & Buffers</option>
                  <option value="Additives">Additives & Bypass Fats</option>
                </select>
              </label>
              <label className="input-group">
                <span>Unit *</span>
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="bags">50kg Bags</option>
                  <option value="ton">Metric Tons</option>
                  <option value="L">Litres (L)</option>
                </select>
              </label>
              <label className="input-group">
                <span>Price per Unit (Rs) *</span>
                <input type="number" step="0.1" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Available Stock *</span>
                <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Minimum Alert Threshold *</span>
                <input type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Supplier / Mill</span>
                <input value={supplier} onChange={(e) => setSupplier(e.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Save size={16} /> Save Ingredient
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function RationFormModal({
  isOpen,
  onClose,
  feeds,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  feeds: FeedItem[];
  onSave: (data: Partial<RationPlan>) => void;
}) {
  const [name, setName] = useState("High Lactation TMR Formulation");
  const [group, setGroup] = useState<any>("High Milking Group");
  const [cowCount, setCowCount] = useState("42");
  const [silageKg, setSilageKg] = useState("26");
  const [concentrateKg, setConcentrateKg] = useState("7.5");
  const [hayKg, setHayKg] = useState("3");
  const [mineralsGrams, setMineralsGrams] = useState("250");
  const [expectedYieldL, setExpectedYieldL] = useState("26");

  if (!isOpen) return null;

  const costSilage = Number(silageKg) * 18.5;
  const costConc = Number(concentrateKg) * 98.0;
  const costHay = Number(hayKg) * 35.0;
  const costMin = 120;
  const totalCostCow = Math.round(costSilage + costConc + costHay + costMin);
  const costPerLiter = Number(expectedYieldL) > 0 ? (totalCostCow / Number(expectedYieldL)).toFixed(1) : "18.0";
  const totalKg = Number(silageKg) + Number(concentrateKg) + Number(hayKg) + 0.25;
  const dailyGroupCost = totalCostCow * (Number(cowCount) || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      group,
      targetCowCount: Number(cowCount) || 1,
      totalKgPerCow: totalKg,
      totalCostPerCow: totalCostCow,
      costPerLiterExpected: Number(costPerLiter),
      dailyGroupConsumptionKg: Math.round(totalKg * (Number(cowCount) || 1)),
      dailyGroupCost,
      ingredients: [
        { feedId: "F-01", feedName: "Corn Silage", kgPerCow: Number(silageKg), unitPrice: 18.5, totalCostPerCow: costSilage },
        { feedId: "F-02", feedName: "Lactation WMC", kgPerCow: Number(concentrateKg), unitPrice: 98.0, totalCostPerCow: costConc },
        { feedId: "F-03", feedName: "Rhodes Grass Hay", kgPerCow: Number(hayKg), unitPrice: 35.0, totalCostPerCow: costHay },
      ],
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Formulate Total Mixed Ration (TMR) Plan</h3>
            <p>Optimize dry matter intake, daily nutrition, and feed cost per litre</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Ration Plan Name *</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Target Animal Group *</span>
                <select value={group} onChange={(e) => setGroup(e.target.value as any)}>
                  <option value="High Milking Group">High Milking Group (&gt;25 L/day)</option>
                  <option value="Medium Milking Group">Medium Milking Group (15-25 L/day)</option>
                  <option value="Dry Group">Dry Cows (Far-Off / Close-Up)</option>
                  <option value="Heifer Pen">Growing Heifers (12-24m)</option>
                  <option value="Calf Pen">Calf Weaning Pen</option>
                </select>
              </label>
              <label className="input-group">
                <span>Group Cow Count *</span>
                <input type="number" min="1" value={cowCount} onChange={(e) => setCowCount(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Expected Milk (L/cow/day)</span>
                <input type="number" step="0.5" value={expectedYieldL} onChange={(e) => setExpectedYieldL(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Silage (kg / cow / day)</span>
                <input type="number" step="0.5" value={silageKg} onChange={(e) => setSilageKg(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Concentrate / Wanda (kg / cow / day)</span>
                <input type="number" step="0.5" value={concentrateKg} onChange={(e) => setConcentrateKg(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Hay / Alfalfa (kg / cow / day)</span>
                <input type="number" step="0.5" value={hayKg} onChange={(e) => setHayKg(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Minerals & Buffer (grams / cow)</span>
                <input type="number" value={mineralsGrams} onChange={(e) => setMineralsGrams(e.target.value)} />
              </label>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px 16px", borderRadius: "8px", marginTop: "14px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Cost / Cow / Day:</span>
                <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>Rs {totalCostCow}</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Feed Cost / Litre Milk:</span>
                <div style={{ fontWeight: "700", fontSize: "16px", color: "#16a34a" }}>Rs {costPerLiter} / L</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#64748b" }}>Daily Group Total:</span>
                <div style={{ fontWeight: "700", fontSize: "16px", color: "#2563eb" }}>Rs {dailyGroupCost.toLocaleString()}</div>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Save size={16} /> Save Ration Plan
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function DistributeFeedModal({
  isOpen,
  onClose,
  ration,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  ration: RationPlan;
  onConfirm: (cows: number, notes: string) => void;
}) {
  const [cowCount, setCowCount] = useState(String(ration.targetCowCount || 40));
  const [notes, setNotes] = useState(`Routine morning TMR distribution for ${ration.group}`);

  if (!isOpen) return null;

  const totalKg = (ration.totalKgPerCow || 28) * (Number(cowCount) || 1);
  const totalCost = (ration.totalCostPerCow || 450) * (Number(cowCount) || 1);

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Distribute Daily Feed ({ration.name})</h3>
            <p>Deducts component inventory in real-time and logs operational feeding expense</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px", borderRadius: "8px", marginBottom: "16px" }}>
            <div style={{ fontWeight: "700", color: "#166534", marginBottom: "4px" }}>{ration.name}</div>
            <div style={{ fontSize: "13px", color: "#15803d" }}>Group: {ration.group} · Standard: {ration.totalKgPerCow} kg/head</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "10px" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#166534" }}>Total Feed to Deduct:</span>
                <div style={{ fontWeight: "800", fontSize: "16px", color: "#0f172a" }}>{totalKg.toLocaleString()} kg</div>
              </div>
              <div>
                <span style={{ fontSize: "11px", color: "#166534" }}>Total Feeding Cost:</span>
                <div style={{ fontWeight: "800", fontSize: "16px", color: "#dc2626" }}>Rs {totalCost.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm(Number(cowCount) || 1, notes);
            }}
          >
            <label className="input-group">
              <span>Number of Cows Fed *</span>
              <input type="number" min="1" value={cowCount} onChange={(e) => setCowCount(e.target.value)} required />
            </label>
            <label className="input-group" style={{ marginTop: "10px" }}>
              <span>Feeding Notes</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary" style={{ background: "#16a34a" }}>
                <Truck size={16} /> Confirm & Deduct Inventory
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
