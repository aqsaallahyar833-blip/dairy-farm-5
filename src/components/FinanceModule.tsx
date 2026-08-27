import React, { useState, useEffect, useMemo } from "react";
import {
  Wallet, Plus, Download, TrendingUp, TrendingDown, CircleDollarSign,
  Search, Filter, Calendar, X, Save, Trash2, Edit3, CheckCircle2,
  FileText, ArrowUpRight, ArrowDownLeft, Droplets, Wheat, Stethoscope, Users,
  ArrowLeft, RefreshCw
} from "lucide-react";
import { FinancialTransaction } from "../types";
import {
  getFinance, getFinanceSummary, createTransaction,
  updateTransaction, deleteTransaction
} from "../api";
import { useToast } from "./Toast";
import { useSettings } from "../context/SettingsContext";
import { SummaryCard } from "./SummaryCard";
import { exportToCsv } from "../utils/exportCsv";

export function FinanceModule({
  onNavigate,
}: {
  onNavigate?: (page: string) => void;
} = {}) {
  const [activeTab, setActiveTab] = useState<"all" | "income" | "expense" | "unit-economics">("all");
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const { currencySymbol } = useSettings();

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Modals
  const [addTxOpen, setAddTxOpen] = useState(false);
  const [editTx, setEditTx] = useState<FinancialTransaction | null>(null);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [txData, sumData] = await Promise.all([
        getFinance(),
        getFinanceSummary(),
      ]);
      setTransactions(Array.isArray(txData) ? txData : []);
      setSummary(sumData);
    } catch (err: any) {
      showToast(`Error loading finance: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (activeTab === "income" && t.type !== "Income") return false;
      if (activeTab === "expense" && t.type !== "Expense") return false;
      if (categoryFilter !== "All" && t.category !== categoryFilter) return false;
      if (paymentMethodFilter !== "All" && t.paymentMethod !== paymentMethodFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const match =
          (t.description || "").toLowerCase().includes(q) ||
          (t.category || "").toLowerCase().includes(q) ||
          (t.entityName || "").toLowerCase().includes(q);
        if (!match) return false;
      }
      if (dateFrom && t.date < dateFrom) return false;
      if (dateTo && t.date > dateTo) return false;
      return true;
    });
  }, [transactions, activeTab, categoryFilter, paymentMethodFilter, search, dateFrom, dateTo]);

  // Real-time calculations
  const totalIncome = useMemo(() => {
    return transactions.filter((t) => t.type === "Income").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const totalExpense = useMemo(() => {
    return transactions.filter((t) => t.type === "Expense").reduce((sum, t) => sum + Number(t.amount || 0), 0);
  }, [transactions]);

  const netProfit = totalIncome - totalExpense;
  const marginPct = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : null;

  // Expense breakdown categories
  const expenseByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === "Expense").forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount || 0);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  // Handle Save Transaction
  const handleSaveTransaction = async (data: Partial<FinancialTransaction>) => {
    try {
      if (editTx) {
        await updateTransaction(editTx.id, data);
        showToast("Financial voucher updated successfully!", "success");
      } else {
        await createTransaction(data);
        showToast(`${data.type} voucher for Rs ${Number(data.amount).toLocaleString()} recorded!`, "success");
      }
      setAddTxOpen(false);
      setEditTx(null);
      loadData();
    } catch (err: any) {
      showToast(`Error saving transaction: ${err.message}`, "error");
    }
  };

  // Handle Delete Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!window.confirm("Delete this financial voucher?")) return;
    try {
      await deleteTransaction(id);
      showToast("Transaction deleted from financial ledger.", "info");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["Voucher ID", "Date", "Type", "Category", "Amount (Rs)", "Entity / Customer / Vendor", "Payment Method", "Description", "Receipt Ref"];
    const rows = filteredTransactions.map((t) => [
      t.id, t.date, t.type, t.category, t.amount, t.entityName, t.paymentMethod, t.description, t.receiptRef || ""
    ]);
    exportToCsv("farm_financial_ledger", headers, rows);
    showToast("Financial records exported to CSV", "success");
  };

  return (
    <div className="content" id="finance-page">
      <div className="page-header module-page-header">
        <div>
          <h2 className="module-page-title">Farm Finance & Economics</h2>
          <p className="module-page-subtitle">Manage income, expenses, milk revenue, costs, and farm profitability</p>
        </div>
        <div className="page-actions module-header-actions">
          <button
            className="secondary"
            id="btn-return-dashboard-finance"
            onClick={() => (onNavigate ? onNavigate("Dashboard") : (window.location.hash = "#Dashboard"))}
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={15} /> Return to Dashboard
          </button>
          <button
            className="secondary"
            id="btn-refresh-finance"
            onClick={loadData}
            disabled={loading}
            title="Fetch latest financial data from database"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="secondary" id="btn-export-finance" onClick={handleExportCsv}>
            <Download size={15} /> Export CSV
          </button>
          <button
            className="primary"
            id="btn-add-transaction"
            onClick={() => {
              setEditTx(null);
              setAddTxOpen(true);
            }}
          >
            <Plus size={16} /> Record Transaction
          </button>
        </div>
      </div>

      {/* 4 Professional Summary Cards */}
      <div className="summary-grid" id="finance-summary-grid">
        <SummaryCard
          id="card-finance-revenue"
          icon={<ArrowUpRight size={19} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Total Gross Revenue"
          value={`${currencySymbol} ${totalIncome.toLocaleString()}`}
          valueColor="#16a34a"
          meta="All recorded sales & inflows"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("income");
            setCategoryFilter("All");
          }}
        />
        <SummaryCard
          id="card-finance-expense"
          icon={<ArrowDownLeft size={19} />}
          iconBg="#fef2f2"
          iconColor="#dc2626"
          label="Total Operating Expenses"
          value={`${currencySymbol} ${totalExpense.toLocaleString()}`}
          valueColor="#dc2626"
          meta="Feed, vet & labor outflows"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("expense");
            setCategoryFilter("All");
          }}
        />
        <SummaryCard
          id="card-finance-profit"
          icon={<CircleDollarSign size={19} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          label="Net Operating Farm Profit"
          value={`${currencySymbol} ${netProfit.toLocaleString()}`}
          valueColor={netProfit >= 0 ? "#16a34a" : "#dc2626"}
          meta="Gross revenue less expenses"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("all");
            setCategoryFilter("All");
          }}
        />
        <SummaryCard
          id="card-finance-margin"
          icon={<TrendingUp size={19} />}
          iconBg="#fffbeb"
          iconColor="#d97706"
          label="Operating Margin"
          value={marginPct !== null ? `${marginPct}%` : "N/A"}
          valueColor={marginPct !== null && Number(marginPct) >= 0 ? "#16a34a" : "#dc2626"}
          meta={marginPct !== null ? "Net return on revenue" : "Zero revenue recorded"}
          loading={loading}
          clickable
          onClick={() => setActiveTab("unit-economics")}
        />
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginTop: "8px" }}>
        <button
          className={activeTab === "all" ? "chip active" : "chip"}
          onClick={() => setActiveTab("all")}
        >
          <FileText size={15} /> All Ledger Transactions ({transactions.length})
        </button>
        <button
          className={activeTab === "income" ? "chip active" : "chip"}
          onClick={() => setActiveTab("income")}
        >
          <ArrowUpRight size={15} /> Income Vouchers ({transactions.filter((t) => t.type === "Income").length})
        </button>
        <button
          className={activeTab === "expense" ? "chip active" : "chip"}
          onClick={() => setActiveTab("expense")}
        >
          <ArrowDownLeft size={15} /> Expense Vouchers ({transactions.filter((t) => t.type === "Expense").length})
        </button>
        <button
          className={activeTab === "unit-economics" ? "chip active" : "chip"}
          onClick={() => setActiveTab("unit-economics")}
        >
          <TrendingUp size={15} /> Unit Economics & Cost Breakdown
        </button>
      </div>

      {/* 1. TRANSACTIONS LEDGER (All, Income, Expense) */}
      {activeTab !== "unit-economics" && (
        <div className="card" id="finance-ledger-card">
          <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div className="search" style={{ minWidth: "220px" }}>
              <Search size={15} />
              <input
                placeholder="Search description, entity, category..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-row">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ padding: "6px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                <option value="All">All Categories</option>
                <option value="Milk Sales">Milk Sales</option>
                <option value="Cattle Sales">Cattle Sales</option>
                <option value="Feed & Fodder">Feed & Fodder</option>
                <option value="Veterinary & Medicine">Veterinary & Medicine</option>
                <option value="Labor & Salaries">Labor & Salaries</option>
                <option value="Utilities">Electricity & Diesel</option>
                <option value="Farm Maintenance">Repairs & Maintenance</option>
              </select>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                style={{ padding: "6px 10px", fontSize: "13px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              >
                <option value="All">All Payment Modes</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: "6px", alignItems: "center", marginLeft: "auto" }}>
              <span style={{ fontSize: "12px", color: "#64748b" }}>From:</span>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ padding: "4px 8px", fontSize: "12px" }} />
              <span style={{ fontSize: "12px", color: "#64748b" }}>To:</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ padding: "4px 8px", fontSize: "12px" }} />
              {(dateFrom || dateTo || search || categoryFilter !== "All" || paymentMethodFilter !== "All") && (
                <button
                  className="secondary"
                  style={{ padding: "4px 8px", fontSize: "12px" }}
                  onClick={() => {
                    setDateFrom("");
                    setDateTo("");
                    setSearch("");
                    setCategoryFilter("All");
                    setPaymentMethodFilter("All");
                  }}
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading transactions from database...</div>
            ) : filteredTransactions.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>No transactions available.</p>
                <p style={{ fontSize: "13px" }}>Click "Record Transaction" to enter milk sales or farm operational expenses.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Party / Vendor / Customer</th>
                    <th>Payment Mode</th>
                    <th>Amount (Rs)</th>
                    <th>Receipt Ref</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((t) => (
                    <tr key={t.id}>
                      <td>{t.date}</td>
                      <td>
                        <span className={`status ${t.type === "Income" ? "pregnant" : "sick"}`}>
                          {t.type}
                        </span>
                      </td>
                      <td><b>{t.category}</b></td>
                      <td>{t.description}</td>
                      <td className="blue-text"><b>{t.entityName}</b></td>
                      <td>{t.paymentMethod}</td>
                      <td>
                        <b style={{ color: t.type === "Income" ? "#16a34a" : "#dc2626", fontSize: "14px" }}>
                          {t.type === "Income" ? "+" : "-"}Rs {Number(t.amount).toLocaleString()}
                        </b>
                      </td>
                      <td><small>{t.receiptRef || "—"}</small></td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            className="icon-action-btn"
                            onClick={() => {
                              setEditTx(t);
                              setAddTxOpen(true);
                            }}
                            title="Edit Transaction"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="icon-action-btn"
                            onClick={() => handleDeleteTransaction(t.id)}
                            title="Delete Transaction"
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

      {/* 2. UNIT ECONOMICS TAB */}
      {activeTab === "unit-economics" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div className="card" id="expense-breakdown-card">
            <div className="section-head">
              <h3>Operating Expense Distribution</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "10px" }}>
              {expenseByCategory.map(([cat, amt]) => {
                const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : "0.0";
                return (
                  <div key={cat} style={{ background: "#f8fafc", padding: "12px 14px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <b>{cat}</b>
                      <span style={{ fontWeight: "700", color: "#dc2626" }}>Rs {amt.toLocaleString()} ({pct}%)</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: "#2563eb" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card" id="unit-cost-metrics-card">
            <div className="section-head">
              <h3>Dairy Unit Economics & Benchmarks</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "10px" }}>
              <div style={{ background: "#f0fdf4", padding: "14px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <span style={{ fontSize: "12px", color: "#166534" }}>Average Realized Milk Selling Price:</span>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#166534" }}>Rs 165.0 / Litre</div>
              </div>
              <div style={{ background: "#eff6ff", padding: "14px", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <span style={{ fontSize: "12px", color: "#1e40af" }}>Average Feed Cost per Litre of Milk:</span>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#1e40af" }}>Rs 68.5 / Litre</div>
              </div>
              <div style={{ background: "#fef3c7", padding: "14px", borderRadius: "8px", border: "1px solid #fde68a" }}>
                <span style={{ fontSize: "12px", color: "#92400e" }}>Average Total Operating Cost per Litre:</span>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#92400e" }}>Rs 98.0 / Litre</div>
              </div>
              <div style={{ background: "#faf5ff", padding: "14px", borderRadius: "8px", border: "1px solid #e9d5ff" }}>
                <span style={{ fontSize: "12px", color: "#6b21a8" }}>Net Profit Contribution per Litre:</span>
                <div style={{ fontSize: "20px", fontWeight: "800", color: "#16a34a" }}>Rs 67.0 / Litre (40.6%)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      {addTxOpen && (
        <TransactionFormModal
          isOpen={addTxOpen}
          onClose={() => {
            setAddTxOpen(false);
            setEditTx(null);
          }}
          initialData={editTx}
          onSave={handleSaveTransaction}
        />
      )}
    </div>
  );
}

function TransactionFormModal({
  isOpen,
  onClose,
  initialData,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialData: FinancialTransaction | null;
  onSave: (data: Partial<FinancialTransaction>) => void;
}) {
  const [type, setType] = useState<"Income" | "Expense">(initialData?.type || "Expense");
  const [category, setCategory] = useState(initialData?.category || "Feed & Fodder");
  const [amount, setAmount] = useState(String(initialData?.amount || "15000"));
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split("T")[0]);
  const [entityName, setEntityName] = useState(initialData?.entityName || "Punjab Silage Mills");
  const [paymentMethod, setPaymentMethod] = useState<any>(initialData?.paymentMethod || "Bank Transfer");
  const [description, setDescription] = useState(initialData?.description || "Silage & feed supplies");
  const [receiptRef, setReceiptRef] = useState(initialData?.receiptRef || "INV-9021");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      type,
      category,
      amount: Number(amount) || 0,
      date,
      entityName,
      paymentMethod,
      description,
      receiptRef,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{initialData ? "Edit Financial Voucher" : "Record Financial Transaction"}</h3>
            <p>Log incoming revenue or operating expense voucher</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Transaction Type *</span>
                <select
                  value={type}
                  onChange={(e) => {
                    const newType = e.target.value as any;
                    setType(newType);
                    setCategory(newType === "Income" ? "Milk Sales" : "Feed & Fodder");
                  }}
                >
                  <option value="Income">Income / Inflow (+)</option>
                  <option value="Expense">Expense / Outflow (-)</option>
                </select>
              </label>

              <label className="input-group">
                <span>Category *</span>
                {type === "Income" ? (
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Milk Sales">Daily Milk Sales & Processing</option>
                    <option value="Cattle Sales">Cattle / Calf Sales</option>
                    <option value="Manure & Fertilizer">Organic Manure & Fertilizer</option>
                    <option value="Government Subsidy">Government Subsidy / Grant</option>
                    <option value="Other Income">Other Sundry Income</option>
                  </select>
                ) : (
                  <select value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option value="Feed & Fodder">Feed, Silage & Concentrates</option>
                    <option value="Veterinary & Medicine">Veterinary Medicine & Vaccines</option>
                    <option value="Breeding & Semen">AI Semen Straws & Tech Fees</option>
                    <option value="Labor & Salaries">Labor, Salaries & Overtime</option>
                    <option value="Utilities">Electricity, Water & Diesel Generator</option>
                    <option value="Farm Maintenance">Machinery & Shed Maintenance</option>
                    <option value="Transport">Milk & Cattle Transport</option>
                    <option value="General Admin">General Admin & Supplies</option>
                  </select>
                )}
              </label>

              <label className="input-group">
                <span>Amount (Rs) *</span>
                <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </label>

              <label className="input-group">
                <span>Transaction Date *</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>

              <label className="input-group">
                <span>Customer / Vendor / Party *</span>
                <input value={entityName} onChange={(e) => setEntityName(e.target.value)} required />
              </label>

              <label className="input-group">
                <span>Payment Mode *</span>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as any)}>
                  <option value="Bank Transfer">Bank Transfer / Online</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </label>

              <label className="input-group">
                <span>Invoice / Receipt Reference</span>
                <input value={receiptRef} onChange={(e) => setReceiptRef(e.target.value)} />
              </label>
            </div>

            <label className="input-group" style={{ marginTop: "12px" }}>
              <span>Transaction Narration / Description *</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} required />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Save size={16} /> Save Transaction Voucher
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
