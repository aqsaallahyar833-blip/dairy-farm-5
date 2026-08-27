import React, { useState, useEffect, useMemo } from "react";
import {
  Boxes, Plus, Download, AlertCircle, CalendarDays, Search,
  Filter, Layers, X, Save, Trash2, Edit3, CheckCircle2, History,
  TrendingDown, TrendingUp, RefreshCw, ArrowLeft
} from "lucide-react";
import { InventoryItem } from "../types";
import {
  getInventory, purchaseInventoryStock, consumeInventoryStock,
  adjustInventoryStock, getInventoryLogs
} from "../api";
import { useToast } from "./Toast";
import { useSettings } from "../context/SettingsContext";
import { SummaryCard } from "./SummaryCard";
import { exportToCsv } from "../utils/exportCsv";

function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  if (s.includes("in stock") || s.includes("available")) {
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

export function InventoryModule({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [activeTab, setActiveTab] = useState<"all" | "logs">("all");
  const [items, setItems] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { currencySymbol } = useSettings();

  // Search & Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modals
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [consumeOpen, setConsumeOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [invData, logData] = await Promise.all([
        getInventory(),
        getInventoryLogs(),
      ]);
      setItems(Array.isArray(invData) ? invData : []);
      setLogs(Array.isArray(logData) ? logData : []);
    } catch (err: any) {
      showToast(`Error loading inventory: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered inventory items
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      if (categoryFilter !== "All" && i.category !== categoryFilter) return false;
      if (statusFilter !== "All" && i.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (i.name || "").toLowerCase().includes(q) ||
          (i.category || "").toLowerCase().includes(q) ||
          (i.supplier || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [items, categoryFilter, statusFilter, search]);

  // Overall metrics
  const totalValuation = useMemo(() => {
    return items.reduce((sum, i) => sum + (Number(i.quantity ?? i.stock ?? 0) * Number(i.unitPrice ?? 0)), 0);
  }, [items]);

  const lowStockCount = useMemo(() => {
    return items.filter((i) => i.status === "Low Stock" || Number(i.quantity ?? i.stock ?? 0) <= Number(i.minLevel ?? i.minStock ?? 0)).length;
  }, [items]);

  // Handle Purchase Stock
  const handlePurchaseStock = async (data: any) => {
    try {
      await purchaseInventoryStock(data);
      showToast(`Purchased ${data.quantity} ${data.unit} of ${data.name || data.itemName}. Stock added & expense voucher logged!`, "success");
      setPurchaseOpen(false);
      loadData();
    } catch (err: any) {
      showToast(`Purchase error: ${err.message}`, "error");
    }
  };

  // Handle Consume Stock
  const handleConsumeStock = async (itemId: string, quantity: number, reason: string) => {
    try {
      await consumeInventoryStock({ itemId, quantity, reason, performedBy: "Farm Staff" });
      showToast(`Recorded consumption of ${quantity} units. Stock deducted!`, "success");
      setConsumeOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Handle Adjust Stock
  const handleAdjustStock = async (itemId: string, newCount: number, reason: string) => {
    try {
      await adjustInventoryStock({ itemId, newCount, reason });
      showToast(`Stock count adjusted to ${newCount}. Audit entry saved.`, "success");
      setAdjustOpen(false);
      setSelectedItem(null);
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (activeTab === "all") {
      const headers = ["Item ID", "Item Name", "Category", "Quantity / Stock", "Unit", "Unit Price (Rs)", "Total Value (Rs)", "Min Threshold", "Supplier", "Status"];
      const rows = filteredItems.map((i) => [
        i.id, i.name, i.category, i.quantity ?? i.stock, i.unit, i.unitPrice, (i.quantity ?? i.stock) * i.unitPrice, i.minLevel ?? i.minStock, i.supplier, i.status
      ]);
      exportToCsv("farm_inventory_stock_valuation", headers, rows);
      showToast("Inventory stock exported to CSV", "success");
    } else {
      const headers = ["Timestamp", "Item Name", "Action Type", "Quantity Change", "Previous Stock", "New Stock", "Performed By", "Reason"];
      const rows = logs.map((l) => [
        l.timestamp, l.itemName, l.action, l.quantity, l.previousStock, l.newStock, l.performedBy, l.reason
      ]);
      exportToCsv("inventory_audit_transaction_logs", headers, rows);
      showToast("Audit logs exported to CSV", "success");
    }
  };

  return (
    <div className="content" id="inventory-page">
      <div className="page-header module-page-header">
        <div>
          <h2 className="module-page-title">Farm Inventory Management</h2>
          <p className="module-page-subtitle">Track stock levels, purchases, usage, suppliers, and inventory movement</p>
        </div>
        <div className="page-actions module-header-actions">
          <button
            className="secondary"
            id="btn-return-dashboard-inventory"
            onClick={() => (onNavigate ? onNavigate("Dashboard") : (window.location.hash = "#Dashboard"))}
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={15} /> Return to Dashboard
          </button>
          <button
            className="secondary"
            id="btn-refresh-inventory"
            onClick={loadData}
            disabled={loading}
            title="Reload inventory stock and movement logs from database"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="secondary" id="btn-export-inventory" onClick={handleExportCsv}>
            <Download size={15} /> Export CSV
          </button>
          <button className="primary" id="btn-purchase-stock" onClick={() => setPurchaseOpen(true)}>
            <Plus size={16} /> Purchase Stock
          </button>
        </div>
      </div>

      {/* 4 Professional Summary Cards */}
      <div className="summary-grid" id="inventory-summary-grid">
        <SummaryCard
          id="card-inventory-valuation"
          icon={<Boxes size={19} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Total Inventory Valuation"
          value={`${currencySymbol} ${totalValuation.toLocaleString()}`}
          meta="Combined farm stock assets"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("all");
            setCategoryFilter("All");
            setStatusFilter("All");
          }}
        />
        <SummaryCard
          id="card-inventory-skus"
          icon={<Layers size={19} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          label="Unique Inventory SKUs"
          value={`${items.length} Line${items.length === 1 ? "" : "s"}`}
          meta="Catalogued active items"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("all");
            setCategoryFilter("All");
            setStatusFilter("All");
          }}
        />
        <SummaryCard
          id="card-inventory-low-stock"
          icon={<AlertCircle size={19} />}
          iconBg="#fef2f2"
          iconColor="#dc2626"
          label="Low Stock Alerts"
          value={`${lowStockCount} ${lowStockCount === 1 ? "Item" : "Items"}`}
          valueColor={lowStockCount > 0 ? "#dc2626" : undefined}
          meta="Below minimum threshold"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("all");
            setStatusFilter("Low Stock");
          }}
        />
        <SummaryCard
          id="card-inventory-audit-logs"
          icon={<CalendarDays size={19} />}
          iconBg="#fffbeb"
          iconColor="#d97706"
          label="Audit Logs Recorded"
          value={`${logs.length} Event${logs.length === 1 ? "" : "s"}`}
          meta="Stock movement & ledger"
          loading={loading}
          clickable
          onClick={() => setActiveTab("logs")}
        />
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginTop: "8px" }}>
        <button
          className={activeTab === "all" ? "chip active" : "chip"}
          onClick={() => setActiveTab("all")}
        >
          <Boxes size={15} /> All Stock Lines ({items.length})
        </button>
        <button
          className={activeTab === "logs" ? "chip active" : "chip"}
          onClick={() => setActiveTab("logs")}
        >
          <History size={15} /> Stock Movement & Audit Logs ({logs.length})
        </button>
      </div>

      {/* 1. ALL INVENTORY STOCK TAB */}
      {activeTab === "all" && (
        <div className="card" id="inventory-table-card">
          <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div className="search" style={{ minWidth: "220px" }}>
              <Search size={15} />
              <input
                placeholder="Search inventory items, category, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-row">
              {["All", "Feed & Forage", "Veterinary Medicine", "Supplies & Equipment", "Breeding Semen"].map((cat) => (
                <button
                  key={cat}
                  className={categoryFilter === cat ? "chip active" : "chip"}
                  onClick={() => setCategoryFilter(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="filter-row" style={{ marginLeft: "auto" }}>
              {["All", "In Stock", "Low Stock", "Out of Stock"].map((st) => (
                <button
                  key={st}
                  className={statusFilter === st ? "chip active" : "chip"}
                  onClick={() => setStatusFilter(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading inventory data from database...</div>
            ) : filteredItems.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>No inventory records found.</p>
                <p style={{ fontSize: "13px" }}>Click "Purchase Stock" to record incoming feeds, medicines, or equipment supplies.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Category</th>
                    <th>Available Stock</th>
                    <th>Min Threshold</th>
                    <th>Unit Price (Rs)</th>
                    <th>Total Valuation (Rs)</th>
                    <th>Supplier / Vendor</th>
                    <th>Stock Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map((item) => {
                    const qty = Number(item.quantity ?? item.stock ?? 0);
                    const min = Number(item.minLevel ?? item.minStock ?? 0);
                    const val = qty * Number(item.unitPrice ?? 0);

                    return (
                      <tr key={item.id}>
                        <td className="blue-text"><b>{item.name}</b></td>
                        <td>{item.category}</td>
                        <td><b>{qty.toLocaleString()} {item.unit}</b></td>
                        <td>{min} {item.unit}</td>
                        <td>Rs {item.unitPrice}</td>
                        <td><b>Rs {val.toLocaleString()}</b></td>
                        <td>{item.supplier}</td>
                        <td><StatusBadge status={item.status} /></td>
                        <td>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              className="secondary"
                              style={{ padding: "3px 7px", fontSize: "11px" }}
                              onClick={() => {
                                setSelectedItem(item);
                                setConsumeOpen(true);
                              }}
                              title="Record Consumption / Usage"
                            >
                              <TrendingDown size={13} /> Use
                            </button>
                            <button
                              className="secondary"
                              style={{ padding: "3px 7px", fontSize: "11px" }}
                              onClick={() => {
                                setSelectedItem(item);
                                setAdjustOpen(true);
                              }}
                              title="Adjust Physical Count"
                            >
                              <Edit3 size={13} /> Audit
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

      {/* 2. AUDIT LOGS TAB */}
      {activeTab === "logs" && (
        <div className="card" id="inventory-logs-card">
          <div className="section-head">
            <div>
              <h3>Stock Movement, Purchases & Adjustment History</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Automated immutable audit trail of stock additions, daily feedings, medical courses, and physical inventory reconciliations</p>
            </div>
          </div>

          <div className="table-wrap">
            {logs.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600" }}>No inventory logs recorded yet.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Item Name</th>
                    <th>Action</th>
                    <th>Qty Change</th>
                    <th>Previous Stock</th>
                    <th>New Stock</th>
                    <th>Performed By</th>
                    <th>Reason / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l) => (
                    <tr key={l.id}>
                      <td>{l.timestamp}</td>
                      <td className="blue-text"><b>{l.itemName}</b></td>
                      <td><span className="status pregnant">{l.action}</span></td>
                      <td>
                        <b style={{ color: l.quantity > 0 ? "#16a34a" : "#dc2626" }}>
                          {l.quantity > 0 ? `+${l.quantity}` : l.quantity}
                        </b>
                      </td>
                      <td>{l.previousStock}</td>
                      <td><b>{l.newStock}</b></td>
                      <td>{l.performedBy}</td>
                      <td><small>{l.reason}</small></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Purchase Stock Modal */}
      {purchaseOpen && (
        <PurchaseStockModal
          isOpen={purchaseOpen}
          onClose={() => setPurchaseOpen(false)}
          onSave={handlePurchaseStock}
        />
      )}

      {/* Consume Stock Modal */}
      {consumeOpen && selectedItem && (
        <ConsumeStockModal
          isOpen={consumeOpen}
          onClose={() => {
            setConsumeOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onConfirm={(qty, reason) => handleConsumeStock(selectedItem.id, qty, reason)}
        />
      )}

      {/* Adjust Stock Modal */}
      {adjustOpen && selectedItem && (
        <AdjustStockModal
          isOpen={adjustOpen}
          onClose={() => {
            setAdjustOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          onConfirm={(newCount, reason) => handleAdjustStock(selectedItem.id, newCount, reason)}
        />
      )}
    </div>
  );
}

function PurchaseStockModal({
  isOpen,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stock: any) => void;
}) {
  const [name, setName] = useState("Corn Silage (Premium 32% DM)");
  const [category, setCategory] = useState("Feed & Forage");
  const [quantity, setQuantity] = useState("5000");
  const [unit, setUnit] = useState("kg");
  const [unitPrice, setUnitPrice] = useState("18.5");
  const [supplier, setSupplier] = useState("Punjab Agri Silage Ltd");
  const [paymentMethod, setPaymentMethod] = useState("Bank Transfer");

  if (!isOpen) return null;

  const total = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      itemName: name,
      category,
      quantity: Number(quantity) || 0,
      unit,
      unitPrice: Number(unitPrice) || 0,
      totalCost: total,
      supplier,
      paymentMethod,
      date: new Date().toISOString().split("T")[0],
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Purchase Feed / Medicine Stock</h3>
            <p>Replenish inventory and automatically generate expense voucher in finance ledger</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Item Name *</span>
                <input value={name} onChange={(e) => setName(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Inventory Category *</span>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="Feed & Forage">Feed & Forage</option>
                  <option value="Veterinary Medicine">Veterinary Medicine</option>
                  <option value="Supplies & Equipment">Supplies & Spare Parts</option>
                  <option value="Breeding Semen">Breeding Semen Straws</option>
                </select>
              </label>
              <label className="input-group">
                <span>Quantity Purchased *</span>
                <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Unit *</span>
                <select value={unit} onChange={(e) => setUnit(e.target.value)}>
                  <option value="kg">kg</option>
                  <option value="bags">50kg Bags</option>
                  <option value="L">Litres (L)</option>
                  <option value="vials">Vials / Bottles</option>
                  <option value="straws">Straws</option>
                </select>
              </label>
              <label className="input-group">
                <span>Unit Price (Rs) *</span>
                <input type="number" step="0.1" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Supplier / Vendor *</span>
                <input value={supplier} onChange={(e) => setSupplier(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Payment Method</span>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash on Delivery</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </label>
            </div>

            <div style={{ background: "#f0fdf4", padding: "12px 16px", borderRadius: "8px", marginTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#166534" }}>Total Purchase Expenditure:</span>
                <div style={{ fontWeight: "800", fontSize: "18px", color: "#166534" }}>Rs {total.toLocaleString()}</div>
              </div>
              <small style={{ color: "#15803d" }}>Will be recorded in Financial Expenses</small>
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
        </div>
      </div>
    </div>
  );
}

function ConsumeStockModal({
  isOpen,
  onClose,
  item,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onConfirm: (qty: number, reason: string) => void;
}) {
  const currentStock = Number(item.quantity ?? item.stock ?? 0);
  const [quantity, setQuantity] = useState("50");
  const [reason, setReason] = useState("Daily shed allocation / routine usage");

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Record Usage / Consumption ({item.name})</h3>
            <p>Current stock: {currentStock} {item.unit}</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm(Number(quantity) || 1, reason);
            }}
          >
            <label className="input-group">
              <span>Quantity to Deduct ({item.unit}) *</span>
              <input type="number" min="1" max={currentStock} value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </label>
            <label className="input-group" style={{ marginTop: "10px" }}>
              <span>Purpose / Usage Reason *</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} required />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <TrendingDown size={16} /> Deduct Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdjustStockModal({
  isOpen,
  onClose,
  item,
  onConfirm,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onConfirm: (newCount: number, reason: string) => void;
}) {
  const currentStock = Number(item.quantity ?? item.stock ?? 0);
  const [newCount, setNewCount] = useState(String(currentStock));
  const [reason, setReason] = useState("Physical stock count audit reconciliation");

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Physical Stock Count Audit ({item.name})</h3>
            <p>System stock: {currentStock} {item.unit}</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onConfirm(Number(newCount) || 0, reason);
            }}
          >
            <label className="input-group">
              <span>Actual Verified Physical Count ({item.unit}) *</span>
              <input type="number" min="0" value={newCount} onChange={(e) => setNewCount(e.target.value)} required />
            </label>
            <label className="input-group" style={{ marginTop: "10px" }}>
              <span>Reconciliation Reason *</span>
              <input value={reason} onChange={(e) => setReason(e.target.value)} required />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Save size={16} /> Save Audit Count
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
