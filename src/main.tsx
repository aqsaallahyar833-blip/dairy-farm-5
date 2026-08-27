import React, { useEffect, useMemo, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity, AlertCircle, AlertTriangle, ArrowLeft, ArrowUpDown, BarChart3, Bell, Boxes,
  CalendarDays, CheckCircle2, ChevronDown, CircleDollarSign,
  ClipboardList, CircleDot, CreditCard, Download, Droplets,
  Egg, Eye, FileDown, FileText, Filter, Flame, HeartPulse, ImageIcon, LayoutDashboard, ListChecks,
  Menu, Pencil, Plus, Printer, QrCode, RefreshCw, Search, Settings,
  Share2, SlidersHorizontal, Syringe, Trash2, Upload, Wallet, Wheat, X, Check, Clock,
  Calendar, Layers, CheckSquare
} from "lucide-react";
import { Animal, AnimalStatus, MilkRecord, BreedingEvent, HealthRecord, FeedItem, InventoryItem, FinancialTransaction, TaskItem, NotificationItem, AnimalAnalytics, FarmEventNote } from "./types";
import {
  getAnimals, getAnimalById, createAnimal, updateAnimal, deleteAnimal,
  uploadAnimalPhoto, deleteAnimalPhoto, getAnimalQrData, getAnimalDownloadData,
  getAnimalAnalytics, createAnimalEvent, getAnimalEvents,
  getMilkRecords, getLocalMilkRecords, createMilkRecord, updateMilkRecord, deleteMilkRecord, bulkSaveMilkRecords,
  getBreedingEvents, getBreedingEventById, createBreedingEvent, updateBreedingEvent, deleteBreedingEvent, getBreedingTimeline, getAnimalBreedingHistory,
  recordHeatEvent, recordAiEvent, recordPdEvent, getBreedingSettings, updateBreedingSettings, getCalvingRecords, createCalvingRecord,
  getHealthRecords, createHealthRecord,
  getFeeds, createFeed,
  getInventory, purchaseInventoryStock,
  getFinance, createTransaction,
  getTasks, createTask, updateTask, deleteTask,
  getSettings, saveSettings,
  getDashboard, isLoggedIn, login, logout
} from "./api";
import {
  AddAnimalModal, EditAnimalModal, DeleteAnimalModal, AnimalQrModal, AddEventModal, AddMilkModal,
  AddBreedingModal, RecordHeatModal, RecordAiModal, RecordPdModal, BreedingSettingsModal, AddCalvingModal,
  AddHealthModal, PurchaseStockModal, AddTransactionModal,
  AddTaskModal, RationPlannerModal, SellAnimalModal, RecordMortalityModal
} from "./components/Modals";
import { ReproductiveLifecycleTracker } from "./components/ReproductiveLifecycleTracker";
import { BreedingModule } from "./components/BreedingModule";
import { HealthModule } from "./components/HealthModule";
import { FeedModule } from "./components/FeedModule";
import { InventoryModule } from "./components/InventoryModule";
import { FinanceModule } from "./components/FinanceModule";
import { ReportsModule } from "./components/ReportsModule";
import { TasksModule } from "./components/TasksModule";
import { SettingsModule } from "./components/SettingsModule";
import { SettingsProvider, useSettings } from "./context/SettingsContext";
import { ToastProvider, useToast } from "./components/Toast";
import {
  initialBreedingEvents,
  initialAnimals,
  initialMilkRecords,
  initialHealthRecords,
  initialFeeds,
  initialMedicines,
  initialTransactions,
  initialTasks,
  initialSettings,
  getLocalDateString
} from "./data";
import { exportToCsv } from "./utils/exportCsv";
import { generateAnimalPassportPdf } from "./utils/animalPdf";
import "./styles.css";

type Page =
  | "Dashboard" | "Animals" | "Animal Profile" | "Milk Management" | "Breeding"
  | "Health" | "Feed" | "Inventory" | "Finance" | "Reports"
  | "Tasks & Reminders" | "Settings";

const nav = [
  ["Dashboard", LayoutDashboard], ["Animals", CircleDot], ["Milk Management", Droplets],
  ["Breeding", Egg], ["Health", HeartPulse], ["Feed", Wheat],
  ["Inventory", Boxes], ["Finance", Wallet], ["Reports", BarChart3],
  ["Tasks & Reminders", ClipboardList], ["Settings", Settings]
] as const;

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("admin@dairyfarm.local");
  const [password, setPassword] = useState("Admin@12345");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
      onLogin();
    } catch (err: any) {
      setError(err?.message || "Unable to connect to backend server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page" id="login-page">
      <div className="login-card" id="login-card">
        <div className="brand-mark login-mark"><CircleDot size={30}/></div>
        <h1>Dairy Farm</h1>
        <p>Live Management System</p>
        <form onSubmit={submit} id="login-form">
          <label>
            <span>Email</span>
            <input value={email} onChange={e=>setEmail(e.target.value)} type="email" id="login-email" required />
          </label>
          <label>
            <span>Password</span>
            <input value={password} onChange={e=>setPassword(e.target.value)} type="password" id="login-password" required />
          </label>
          {error && <div className="login-error" id="login-error">{error}</div>}
          <button className="primary login-submit" id="btn-login-submit" disabled={busy}>
            {busy ? "Signing in..." : "Sign In to Farm Portal"}
          </button>
        </form>
        <small>Demo Account: admin@dairyfarm.local / Admin@12345</small>
      </div>
    </div>
  );
}

function App() {
  const [authenticated, setAuthenticated] = useState(isLoggedIn());
  const [page, setPage] = useState<Page>("Dashboard");
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [animalsList, setAnimalsList] = useState<Animal[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", title: "Pregnancy Diagnosis due", message: "Check HF-052 Zara 35 days post AI", date: "16 May 2024", tone: "orange", read: false, targetPage: "Breeding" },
    { id: "2", title: "Vaccination Booster scheduled", message: "Administer HS & BQ for HF-031 Daisy", date: "21 May 2024", tone: "blue", read: false, targetPage: "Health" },
    { id: "3", title: "Medicine withdrawal active", message: "HF-027 Bella on Intramast-DC (Hold milk until 21 May)", date: "17 May 2024", tone: "red", read: false, targetPage: "Health" },
    { id: "4", title: "Calving expected soon", message: "HF-027 Bella expected calving on 25 Sep", date: "24 May 2024", tone: "orange", read: false, targetPage: "Breeding" },
  ]);

  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const { showToast } = useToast();
  const { activeUser, activeRole } = useSettings();

  const loadAnimals = async () => {
    try {
      const data = await getAnimals();
      const mapped: Animal[] = data.map((a: any) => ({
        ...a,
        id: a.animalCode || a.id,
        dbId: a.dbId || a.animalId || 1,
        earTag: a.earTag || `ET-${a.dbId || a.animalId || 1000}`,
        name: a.name || "Cattle",
        breed: a.breed?.name || a.breed || "HF (Holstein Friesian)",
        status: (a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1).toLowerCase() : "Lactating") as AnimalStatus,
        lactation: a.lactation !== undefined && a.lactation !== null ? Number(a.lactation) : 2,
        dim: a.dim !== undefined && a.dim !== null ? Number(a.dim) : 180,
        milk: a.milk !== undefined && a.milk !== null ? Number(a.milk) : 25.0,
        sex: a.sex || "Female",
        dob: a.dob || "2022-01-01",
        age: a.age || "2y",
        location: a.location || "Shed 1",
        dam: a.dam || (a.damId ? `HF-0${a.damId}` : "—"),
        sire: a.sire || (a.sireId ? `Bull-0${a.sireId}` : "—"),
        rfid: a.rfid || "RF-9206100027",
        group: a.group || "High Milking Group",
      }));
      setAnimalsList(mapped);
      if (!selectedAnimal && mapped.length > 0) {
        setSelectedAnimal(mapped[0]);
      } else if (selectedAnimal) {
        const found = mapped.find(a => a.id === selectedAnimal.id);
        if (found) setSelectedAnimal(found);
      }
    } catch (e: any) {
      console.warn(`Failed to load animals from API: ${e.message}`);
    }
  };

  useEffect(() => {
    if (authenticated) {
      loadAnimals();
    }
  }, [authenticated]);

  const handleAddAnimalSave = async (data: Partial<Animal>) => {
    try {
      const created = await createAnimal(data);
      showToast(`Animal ${created?.id || data.id || data.name} registered successfully!`, "success");
      await loadAnimals();
    } catch (e: any) {
      showToast(`Error saving animal: ${e.message}`, "error");
    }
  };

  const [previousPage, setPreviousPage] = useState<Page>("Animals");

  const openAnimal = (animal: Animal, fromPage?: Page) => {
    setSelectedAnimal(animal);
    setPreviousPage(fromPage || page);
    setPage("Animal Profile");
    setMobileOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!authenticated) {
    return <LoginScreen onLogin={() => setAuthenticated(true)} />;
  }

  return (
    <div className="app" id="app-root">
      <Sidebar
        page={page}
        setPage={(p) => { setPage(p); setMobileOpen(false); }}
        open={mobileOpen}
        close={() => setMobileOpen(false)}
      />

      <main className="main" id="main-view">
        <header className="topbar" id="topbar">
          <button className="menu-btn" id="btn-mobile-menu" onClick={() => setMobileOpen(true)}>
            <Menu size={20}/>
          </button>
          <div>
            <h1 id="page-heading">{page === "Animal Profile" ? (selectedAnimal ? `${selectedAnimal.name} (${selectedAnimal.id})` : "Animal Profile") : page}</h1>
            <span className="breadcrumb module-breadcrumb">Farm / {page === "Animal Profile" ? "Animals" : page}</span>
          </div>

          <div className="top-actions">
            <div className="date-pill" id="today-pill">
              <CalendarDays size={14}/> {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </div>

            <button
              className="icon-btn"
              id="btn-bell-notif"
              onClick={() => setNotifOpen(!notifOpen)}
              title="Notifications"
            >
              <Bell size={17}/>
              {unreadCount > 0 && <i>{unreadCount}</i>}
            </button>

            {notifOpen && (
              <div className="notif-dropdown" id="notif-dropdown">
                <div className="notif-header">
                  <h4>Farm Notifications</h4>
                  <button
                    className="link"
                    id="btn-mark-all-read"
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                      showToast("All notifications marked as read", "info");
                    }}
                  >
                    Mark read
                  </button>
                </div>
                <div className="notif-body">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className="notif-item"
                      onClick={() => {
                        if (n.targetPage) setPage(n.targetPage as Page);
                        setNotifOpen(false);
                      }}
                    >
                      <span className={`dot ${n.tone}`}></span>
                      <div>
                        <b>{n.title}</b>
                        <p>{n.message}</p>
                        <small>{n.date}</small>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="notif-footer">
                  <button className="link" onClick={() => { setPage("Tasks & Reminders"); setNotifOpen(false); }}>
                    View All Reminders
                  </button>
                </div>
              </div>
            )}

            <div className="user-pill" id="user-profile-pill" onClick={() => setPage("Settings")} title="Open Farm Master Settings & RBAC">
              <div className="avatar">
                {activeUser?.name ? activeUser.name.split(" ").map(n => n[0]).slice(0, 2).join("") : "MA"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "left", lineHeight: 1.1 }}>
                <span style={{ fontWeight: 600, fontSize: "12px" }}>{activeUser?.name || "Muhammad Ali"}</span>
                <span style={{ fontSize: "10px", color: "#10b981", fontWeight: 500 }}>{activeRole || activeUser?.roleName || "Manager"}</span>
              </div>
              <ChevronDown size={14}/>
            </div>

            <button
              className="logout-btn"
              id="btn-logout"
              onClick={async () => {
                await logout();
                setAuthenticated(false);
                showToast("You have been signed out.", "info");
              }}
            >
              Logout
            </button>
          </div>
        </header>

        {page === "Dashboard" && (
          <Dashboard
            onAnimal={(a) => openAnimal(a, "Dashboard")}
            onOpenAddAnimal={() => setAddAnimalOpen(true)}
            onNavigate={(p) => setPage(p)}
          />
        )}
        {page === "Animals" && (
          <Animals
            animals={animalsList}
            onAnimal={(a) => openAnimal(a, "Animals")}
            onRefresh={loadAnimals}
            onOpenAddAnimal={() => setAddAnimalOpen(true)}
            onUpdateAnimal={(updated) => {
              setAnimalsList(prev => prev.map(a => a.id === updated.id ? updated : a));
              if (selectedAnimal && selectedAnimal.id === updated.id) {
                setSelectedAnimal(updated);
              }
            }}
            onDeleteAnimal={(id) => {
              setAnimalsList(prev => prev.filter(a => a.id !== id));
              if (selectedAnimal && selectedAnimal.id === id) {
                setSelectedAnimal(null);
              }
            }}
          />
        )}
        {page === "Animal Profile" && (
          <AnimalProfile
            animal={selectedAnimal || (animalsList.length > 0 ? animalsList[0] : null)}
            fromPageTitle={previousPage}
            onUpdateAnimal={(updated) => {
              setSelectedAnimal(updated);
              setAnimalsList(prev => prev.map(a => a.id === updated.id ? updated : a));
            }}
            onDeleteAnimal={(id) => {
              setAnimalsList(prev => prev.filter(a => a.id !== id));
              setSelectedAnimal(null);
              setPage(previousPage || "Animals");
            }}
            back={() => setPage(previousPage || "Animals")}
            allAnimals={animalsList}
            onAnimal={(a) => openAnimal(a, previousPage)}
          />
        )}
        {page === "Milk Management" && (
          <MilkManagement animals={animalsList} onOpenAddAnimal={() => setAddAnimalOpen(true)} onAnimal={(a) => openAnimal(a, "Milk Management")} />
        )}
        {page === "Breeding" && (
          <Breeding animals={animalsList} onAnimal={(a) => openAnimal(a, "Breeding")} onNavigate={(p) => setPage(p as Page)} />
        )}
        {page === "Health" && (
          <Health animals={animalsList} onAnimal={(a) => openAnimal(a, "Health")} onNavigate={(p) => setPage(p as Page)} />
        )}
        {page === "Feed" && (
          <Feed onNavigate={(p) => setPage(p as Page)} />
        )}
        {page === "Inventory" && (
          <Inventory onNavigate={(p) => setPage(p as Page)} />
        )}
        {page === "Finance" && (
          <Finance onNavigate={(p) => setPage(p as Page)} />
        )}
        {page === "Reports" && (
          <ReportsModule animals={animalsList} onNavigate={(p) => setPage(p as Page)} />
        )}
        {page === "Tasks & Reminders" && (
          <TasksModule animals={animalsList} onAnimal={(a) => openAnimal(a, "Tasks & Reminders")} onNavigate={(p) => setPage(p as Page)} />
        )}
        {page === "Settings" && (
          <SettingsModule onNavigate={(p) => setPage(p as Page)} />
        )}
      </main>

      <AddAnimalModal
        isOpen={addAnimalOpen}
        onClose={() => setAddAnimalOpen(false)}
        onSave={handleAddAnimalSave}
      />
    </div>
  );
}

function Sidebar({page, setPage, open, close}: {page: Page; setPage: (p: Page) => void; open: boolean; close: () => void}) {
  const { settings, activeUser, activeRole } = useSettings();
  return (
    <aside className={`sidebar ${open ? "mobile-show" : ""}`} id="app-sidebar">
      <div className="brand">
        <div className="brand-mark"><CircleDot size={24}/></div>
        <div>
          <strong>DAIRY FARM</strong>
          <span>MANAGEMENT</span>
        </div>
        <button className="close-mobile" id="btn-close-sidebar" onClick={close} aria-label="Close sidebar"><X size={18}/></button>
      </div>

      <nav id="sidebar-nav">
        {nav.map(([label, Icon]) => {
          const isActive = page === label || (label === "Animals" && page === "Animal Profile");
          return (
            <button
              key={label}
              id={`nav-${label.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
              className={isActive ? "active" : ""}
              onClick={() => { setPage(label); close(); }}
              title={label}
            >
              <Icon size={16}/>
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="farm-card" id="sidebar-farm-card">
        <small>Farm: <b>{settings.farmName || "Green Dairy Farm"}</b></small>
        <div className="profile-mini">
          <div className="avatar">
            {activeUser?.name ? activeUser.name.split(" ").map(n => n[0]).slice(0, 2).join("") : "MA"}
          </div>
          <div>
            <b>{activeUser?.name || "Muhammad Ali"}</b>
            <span>{activeRole || activeUser?.roleName || "Farm Manager"}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

function PageTitle({title, subtitle, children}: {title: string; subtitle?: string; children?: React.ReactNode}) {
  return (
    <div className="page-title module-page-header">
      <div>
        <h2 className="module-page-title">{title}</h2>
        {subtitle && <p className="module-page-subtitle">{subtitle}</p>}
      </div>
      <div className="actions module-header-actions">{children}</div>
    </div>
  );
}

function Card({children, className = "", id}: {children: React.ReactNode; className?: string; id?: string}) {
  return <section className={`card ${className}`} id={id}>{children}</section>;
}

function Stat({label, value, icon: Icon, tone = "blue", sub, onClick, id}: {label: string; value: string; icon: any; tone?: string; sub?: string; onClick?: () => void; id?: string}) {
  return (
    <div
      className={`stat ${tone}`}
      id={id}
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default" }}
    >
      <div className="stat-icon"><Icon size={17}/></div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

function PanelHead({title, action, onAction}: {title: string; action?: string; onAction?: () => void}) {
  return (
    <div className="section-head">
      <h3>{title}</h3>
      {action && (
        <button className="link" onClick={onAction}>
          {action}
        </button>
      )}
    </div>
  );
}

function MetricList({items}: {items: [string, string][]}) {
  return (
    <div className="metric-list">
      {items.map(([a, b]) => (
        <div key={a}>
          <span>{a}</span>
          <b>{b}</b>
        </div>
      ))}
    </div>
  );
}

function StatusBadge({status}: {status: AnimalStatus | string}) {
  const norm = String(status).toLowerCase().replace(/ /g, "-");
  return <span className={`status ${norm}`}>{status}</span>;
}

// 1. DASHBOARD COMPONENT
function Dashboard({
  onAnimal,
  onOpenAddAnimal,
  onNavigate,
}: {
  onAnimal: (a: Animal) => void;
  onOpenAddAnimal: () => void;
  onNavigate: (p: Page) => void;
}) {
  const [summary, setSummary] = useState<any>(null);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [sumRes, animRes] = await Promise.allSettled([getDashboard(), getAnimals()]);
      if (sumRes.status === "fulfilled" && sumRes.value) {
        setSummary(sumRes.value);
      }
      if (animRes.status === "fulfilled" && Array.isArray(animRes.value) && animRes.value.length > 0) {
        setAnimals(animRes.value.map((a: any) => ({
          id: a.animalCode || a.id,
          name: a.name || "Cow",
          breed: a.breed?.name || a.breed || "HF",
          status: (a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1).toLowerCase() : "Lactating") as AnimalStatus,
          lactation: a.lactation || 2,
          dim: a.dim || 180,
          milk: a.milk || 26.0,
          sex: a.sex || "Female",
          dob: a.dob || "2022-01-01",
          age: a.age || "2y",
          location: a.location || "Shed 1",
          dam: a.dam || "HF-011",
          sire: a.sire || "Bull-04",
          earTag: a.earTag || "ET-1027",
        })));
      } else {
        setAnimals(initialAnimals);
      }
    } catch {
      setAnimals(initialAnimals);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="content" id="dashboard-content">
      <PageTitle title="Farm Dashboard" subtitle="Monitor herd performance, milk production, health, breeding, and farm activity">
        <button className="secondary" id="btn-refresh-dashboard" onClick={fetchDashboardData}>
          <Activity size={15}/> Refresh Live Data
        </button>
        <button className="primary" id="btn-dashboard-add-animal" onClick={onOpenAddAnimal}>
          <Plus size={16}/> Register Animal
        </button>
      </PageTitle>

      <div className="stats-grid">
        <Stat
          id="stat-total-animals"
          label="Total Herd Animals"
          value={summary ? String(summary.totalAnimals) : "10"}
          icon={CircleDot}
          onClick={() => onNavigate("Animals")}
        />
        <Stat
          id="stat-active-milking"
          label="Lactating Cattle"
          value={summary ? String(summary.activeAnimals) : "7"}
          icon={Droplets}
          tone="gold"
          onClick={() => onNavigate("Milk Management")}
        />
        <Stat
          id="stat-active-pregnancies"
          label="Confirmed Pregnant"
          value={summary ? String(summary.activePregnancies) : "2"}
          icon={Egg}
          tone="purple"
          onClick={() => onNavigate("Breeding")}
        />
        <Stat
          id="stat-open-health-cases"
          label="In Treatment / Sick"
          value={summary ? String(summary.openHealthCases) : "1"}
          icon={HeartPulse}
          tone="red"
          onClick={() => onNavigate("Health")}
        />
      </div>

      <Card id="live-db-summary">
        <div className="section-head">
          <h3>Production & Revenue Overview</h3>
          <span className="trend">Live REST API Connected</span>
        </div>
        <div className="milk-stats">
          <div>
            <span>Today's Total Milk</span>
            <b>{summary ? `${Number(summary.todayMilkLitres).toFixed(1)} L` : "1,980.5 L"}</b>
          </div>
          <div>
            <span>Month-to-Date Milk</span>
            <b>{summary ? `${Number(summary.monthlyMilkLitres).toLocaleString()} L` : "26,540 L"}</b>
          </div>
          <div>
            <span>Monthly Gross Revenue</span>
            <b>{summary ? `Rs ${Number(summary.monthRevenue).toLocaleString()}` : "Rs 394,500"}</b>
          </div>
        </div>
      </Card>

      <div className="three-grid">
        <Card id="panel-reproduction">
          <PanelHead title="Reproduction & AI" action="View Breeding" onAction={() => onNavigate("Breeding")}/>
          <MetricList items={[
            ["Pregnancies This Month", summary ? String(summary.pregnancyPositiveThisMonth) : "2"],
            ["Total Breeding Events", summary ? String(summary.breedingEventsThisMonth) : "3"],
            ["Calvings Anticipated", summary ? String(summary.calvingsThisMonth) : "1"],
          ]}/>
        </Card>
        <Card id="panel-health">
          <PanelHead title="Veterinary & Health" action="Health Logs" onAction={() => onNavigate("Health")}/>
          <MetricList items={[
            ["Total Medical Records", summary ? `${summary.totalMedicalRecords ?? summary.openHealthCases ?? 4} ${(summary.totalMedicalRecords ?? 4) === 1 ? "Case" : "Cases"}` : "4 Cases"],
            ["Active Cases In Treatment", summary ? `${summary.activeCasesInTreatment ?? summary.underTreatmentHealthCases ?? 1} Active` : "1 Active"],
            ["Milk Withdrawal Holds", summary ? `${summary.milkWithdrawalHolds ?? 1} ${(summary.milkWithdrawalHolds ?? 1) === 1 ? "Cow" : "Cows"} Withholding` : "1 Cow Withholding"],
            ["Vaccination Programs", summary ? (summary.vaccinationProgramsTotal > 0 ? `${summary.vaccinationProgramsCompleted ?? 1} / ${summary.vaccinationProgramsTotal} Done` : "No active programs") : "1 / 3 Done"],
          ]}/>
        </Card>
        <Card id="panel-finance">
          <PanelHead title="Financial Summary" action="Open Finance" onAction={() => onNavigate("Finance")}/>
          <MetricList items={[
            ["Total Revenue", summary ? `Rs ${Number(summary.monthRevenue).toLocaleString()}` : "Rs 394,500"],
            ["Total Operational Cost", summary ? `Rs ${Number(summary.monthExpenses).toLocaleString()}` : "Rs 185,000"],
          ]}/>
        </Card>
      </div>

      <div className="two-grid">
        <Card id="panel-top-producers">
          <PanelHead title="Top Milk Producers" action="View All" onAction={() => onNavigate("Animals")}/>
          <div className="rank-list">
            {animals.slice(0, 5).map((a, i) => (
              <div key={a.id} onClick={() => onAnimal(a)} title={`Open profile for ${a.id}`}>
                <span><b>#{i + 1}</b> {a.id} ({a.name})</span>
                <strong>{a.milk ? `${a.milk} L` : "26.5 L"}</strong>
              </div>
            ))}
          </div>
        </Card>
        <Card id="panel-recent-alerts">
          <PanelHead title="Actionable Farm Reminders" action="Task Board" onAction={() => onNavigate("Tasks & Reminders")}/>
          <div className="alert-list">
            <div onClick={() => onNavigate("Breeding")}>
              <span className="dot orange"></span>
              <div>
                <b>Pregnancy Diagnosis due for HF-052</b>
                <small>16 May 2024 · Ultrasound verification</small>
              </div>
            </div>
            <div onClick={() => onNavigate("Health")}>
              <span className="dot orange"></span>
              <div>
                <b>Vaccination Booster for HF-031</b>
                <small>21 May 2024 · HS & BQ vaccine scheduled</small>
              </div>
            </div>
            <div onClick={() => onNavigate("Health")}>
              <span className="dot red"></span>
              <div>
                <b>Medicine withdrawal active (HF-027)</b>
                <small>17 May 2024 · Hold milk until clear</small>
              </div>
            </div>
            <div onClick={() => onNavigate("Breeding")}>
              <span className="dot orange"></span>
              <div>
                <b>Calving due in maternity pen</b>
                <small>24 May 2024 · Prepare bedding</small>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// 2. ANIMALS COMPONENT (LIST VIEW)
function Animals({
  animals,
  onAnimal,
  onRefresh,
  onOpenAddAnimal,
  onUpdateAnimal,
  onDeleteAnimal,
}: {
  animals: Animal[];
  onAnimal: (a: Animal) => void;
  onRefresh: () => void;
  onOpenAddAnimal: () => void;
  onUpdateAnimal?: (a: Animal) => void;
  onDeleteAnimal?: (id: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [sortBy, setSortBy] = useState<"id" | "name" | "milk" | "lactation" | "status" | "earTag">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const { showToast } = useToast();

  const filteredAndSorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = animals.filter((a) => {
      const matchQuery =
        !q ||
        a.id.toLowerCase().includes(q) ||
        a.name.toLowerCase().includes(q) ||
        a.breed.toLowerCase().includes(q) ||
        a.earTag.toLowerCase().includes(q) ||
        (a.rfid && a.rfid.toLowerCase().includes(q)) ||
        (a.location && a.location.toLowerCase().includes(q)) ||
        (a.group && a.group.toLowerCase().includes(q));
      const matchStatus = selectedStatus === "All" || a.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchQuery && matchStatus;
    });

    return result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "id") {
        comparison = a.id.localeCompare(b.id, undefined, { numeric: true });
      } else if (sortBy === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === "earTag") {
        comparison = a.earTag.localeCompare(b.earTag, undefined, { numeric: true });
      } else if (sortBy === "milk") {
        comparison = (a.milk || 0) - (b.milk || 0);
      } else if (sortBy === "lactation") {
        comparison = (a.lactation || 0) - (b.lactation || 0);
      } else if (sortBy === "status") {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [animals, search, selectedStatus, sortBy, sortOrder]);

  const handleExportCsv = () => {
    const headers = ["Animal ID", "Ear Tag", "RFID", "Name", "Breed", "Sex", "Status", "Lactation", "DIM", "Daily Milk (L)", "DOB", "Location", "Group", "Dam", "Sire"];
    const rows = filteredAndSorted.map((a) => [
      a.id, a.earTag, a.rfid || "—", a.name, a.breed, a.sex, a.status, a.lactation ?? "—", a.dim ?? "—", a.milk ?? "—", a.dob, a.location, a.group || "—", a.dam, a.sire
    ]);
    exportToCsv("animals_master_list", headers, rows);
    showToast(`Exported ${filteredAndSorted.length} animal records to CSV`, "success");
  };

  return (
    <div className="content" id="animals-page">
      <PageTitle title="Animal Management & Herd Records" subtitle="Manage animal profiles, identification, health, production, and herd information">
        <button className="secondary" id="btn-export-animals" onClick={handleExportCsv}>
          <Download size={15}/> Export CSV
        </button>
        <button className="secondary" id="btn-refresh-animals" onClick={onRefresh}>
          <RefreshCw size={15}/> Refresh
        </button>
        <button className="primary" id="btn-add-animal-top" onClick={onOpenAddAnimal}>
          <Plus size={16}/> Register New Animal
        </button>
      </PageTitle>

      <Card id="animals-card">
        <div className="toolbar" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div className="search" id="animals-search-bar" style={{ minWidth: "260px" }}>
            <Search size={16}/>
            <input
              id="input-animal-search"
              placeholder="Search by ID, name, ear tag, breed, group, shed..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch("")} style={{ color: "#888" }}>
                <X size={14}/>
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--muted)" }}>
              <ArrowUpDown size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: "6px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border)",
                fontSize: "12px",
                background: "#fff"
              }}
            >
              <option value="id">Animal No. (Ascending)</option>
              <option value="name">Animal Name</option>
              <option value="earTag">Ear Tag Number</option>
              <option value="milk">Daily Milk Yield</option>
              <option value="lactation">Lactation No.</option>
              <option value="status">Status</option>
            </select>
            <button
              className="secondary"
              style={{ padding: "6px 10px", fontSize: "12px" }}
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              title="Toggle Sort Direction"
            >
              {sortOrder === "asc" ? "Asc ↑" : "Desc ↓"}
            </button>
          </div>

          <div className="filter-row" id="animals-status-filters">
            {["All", "Lactating", "Dry", "Pregnant", "Heifer", "Calf", "Sick", "Quarantine", "Bull"].map((s) => (
              <button
                key={s}
                id={`filter-status-${s.toLowerCase()}`}
                className={selectedStatus === s ? "chip active" : "chip"}
                onClick={() => setSelectedStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="table-wrap">
          <table id="animals-table">
            <thead>
              <tr>
                <th style={{ width: "52px" }}>Image</th>
                <th>Animal No.</th>
                <th>Tag / RFID</th>
                <th>Name</th>
                <th>Breed</th>
                <th>Gender</th>
                <th>DOB / Age</th>
                <th>Group</th>
                <th>Shed / Housing</th>
                <th>Daily Milk</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
                    <CircleDot size={32} style={{ margin: "0 auto 10px", display: "block", color: "#cbd5e1" }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>No animal records matched your criteria.</p>
                    <p style={{ margin: "4px 0 12px 0", fontSize: "13px" }}>Try clearing your search or status filter.</p>
                    <button className="secondary" onClick={() => { setSearch(""); setSelectedStatus("All"); }}>
                      Reset Search Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((a) => (
                  <tr
                    key={a.id}
                    id={`animal-row-${a.id}`}
                    className="clickable-row"
                    onClick={() => onAnimal(a)}
                    title={`Click to open full profile for Animal ${a.id} (${a.name})`}
                  >
                    <td>
                      <div style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "#f1f5f9",
                        border: "1px solid #e2e8f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        {a.photo ? (
                          <img src={a.photo} alt={a.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                          <CircleDot size={20} color="#0284c7" />
                        )}
                      </div>
                    </td>
                    <td className="blue-text">
                      <b>{a.id}</b>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1e293b", display: "block" }}>{a.earTag}</span>
                      {a.rfid && <small style={{ color: "#64748b", fontSize: "10px" }}>{a.rfid}</small>}
                    </td>
                    <td>
                      <b>{a.name}</b>
                    </td>
                    <td>{a.breed}</td>
                    <td>{a.sex}</td>
                    <td>
                      <span>{a.dob}</span>
                      {a.age && <small style={{ display: "block", color: "#64748b", fontSize: "10px" }}>({a.age})</small>}
                    </td>
                    <td>
                      <span style={{ fontSize: "11px", color: "#334155" }}>{a.group || "Milking Group"}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: "11px" }}>{a.location || "Shed 1"}</span>
                    </td>
                    <td>
                      <b>{a.milk ? `${a.milk} L` : "—"}</b>
                    </td>
                    <td>
                      <StatusBadge status={a.status}/>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-foot">
          <span>Showing {filteredAndSorted.length} of {animals.length} registered animals · Click any animal row to open its profile & actions</span>
          <div>
            <button className="active">1</button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// 3. ANIMAL PROFILE COMPONENT (LIVE SINGLE ANIMAL DATA)
function AnimalProfile({
  animal: initialAnimal,
  animalId: passedAnimalId,
  fromPageTitle = "Animals",
  onUpdateAnimal,
  onDeleteAnimal,
  back,
  allAnimals = [],
  onAnimal,
}: {
  animal?: Animal | null;
  animalId?: string;
  fromPageTitle?: string;
  onUpdateAnimal: (a: Animal) => void;
  onDeleteAnimal: (id: string) => void;
  back: () => void;
  allAnimals?: Animal[];
  onAnimal?: (a: Animal) => void;
}) {
  const targetId = initialAnimal?.id || passedAnimalId || (allAnimals.length > 0 ? allAnimals[0].id : "");
  const [currentAnimal, setCurrentAnimal] = useState<Animal | null>(initialAnimal || null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState("Overview");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [milkModalOpen, setMilkModalOpen] = useState(false);
  const [breedingModalOpen, setBreedingModalOpen] = useState(false);
  const [healthModalOpen, setHealthModalOpen] = useState(false);
  const [sellModalOpen, setSellModalOpen] = useState(false);

  const [cowMilk, setCowMilk] = useState<MilkRecord[]>([]);
  const [cowBreeding, setCowBreeding] = useState<BreedingEvent[]>([]);
  const [cowHealth, setCowHealth] = useState<HealthRecord[]>([]);
  const [analytics, setAnalytics] = useState<AnimalAnalytics | null>(null);

  const fileUploadRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  // Load fresh single animal details and related records
  const loadProfileData = async (animalId: string) => {
    if (!animalId) {
      setFetchError("No animal identifier specified.");
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      // 1. Fetch fresh animal details and calculated analytics from API in parallel
      const [freshAnimalRes, analyticsRes, allMilkRes, allBreedingRes, allHealthRes] = await Promise.allSettled([
        getAnimalById(animalId),
        getAnimalAnalytics(animalId),
        getMilkRecords(),
        getBreedingEvents(),
        getHealthRecords()
      ]);

      let activeAnimalObj = initialAnimal;
      if (freshAnimalRes.status === "fulfilled" && freshAnimalRes.value) {
        activeAnimalObj = freshAnimalRes.value;
        setCurrentAnimal(freshAnimalRes.value);
      } else {
        const found = allAnimals.find(a => a.id === animalId || a.earTag === animalId);
        if (found) {
          activeAnimalObj = found;
          setCurrentAnimal(found);
        }
      }

      if (!activeAnimalObj && !currentAnimal) {
        setFetchError(`Animal record for "${animalId}" was not found.`);
        setLoading(false);
        return;
      }

      const active = activeAnimalObj || currentAnimal!;

      if (analyticsRes.status === "fulfilled" && analyticsRes.value) {
        setAnalytics(analyticsRes.value);
      }

      const allMilk = allMilkRes.status === "fulfilled" ? allMilkRes.value : initialMilkRecords;
      const allBreeding = allBreedingRes.status === "fulfilled" ? allBreedingRes.value : initialBreedingEvents;
      const allHealth = allHealthRes.status === "fulfilled" ? allHealthRes.value : initialHealthRecords;

      const matchedMilk = (allMilk || []).filter(
        (m) => m.animalId === active.id || (m.name && m.name.toLowerCase() === active.name.toLowerCase())
      );
      const matchedBreeding = (allBreeding || []).filter(
        (b) => b.animalId === active.id || (b.animal && (b.animal.includes(active.id) || b.animal.includes(active.name)))
      );
      const matchedHealth = (allHealth || []).filter(
        (h) => h.animalId === active.id || (h.animal && (h.animal.includes(active.id) || h.animal.includes(active.name)))
      );

      setCowMilk(matchedMilk);
      setCowBreeding(matchedBreeding);
      setCowHealth(matchedHealth);
    } catch (err: any) {
      console.error("Failed to load animal specific data", err);
      setFetchError(err?.message || "Failed to load animal profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialAnimal) {
      setCurrentAnimal(initialAnimal);
      loadProfileData(initialAnimal.id);
    } else if (targetId) {
      loadProfileData(targetId);
    }
  }, [initialAnimal?.id, passedAnimalId]);

  // Loading state
  if (loading && !currentAnimal) {
    return (
      <div className="content" id="animal-profile-loading">
        <button className="back-link" onClick={back}>
          <ArrowLeft size={15}/> Back to {fromPageTitle || "Animals"}
        </button>
        <Card>
          <div className="loading-container">
            <div className="spinner"></div>
            <h3 style={{ margin: "0 0 8px 0", color: "#0f172a" }}>Loading Animal Profile...</h3>
            <p style={{ margin: 0, fontSize: "14px", color: "#64748b" }}>Retrieving livestock passport, calculated analytics, and ledger records from database.</p>
          </div>
        </Card>
      </div>
    );
  }

  // Not found / error state
  if (!currentAnimal || fetchError) {
    return (
      <div className="content" id="animal-profile-not-found">
        <button className="back-link" onClick={back}>
          <ArrowLeft size={15}/> Back to {fromPageTitle || "Animals"}
        </button>
        <Card style={{ borderLeft: "4px solid #ef4444" }}>
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <AlertCircle size={48} color="#ef4444" style={{ margin: "0 auto 12px" }} />
            <h3 style={{ margin: "0 0 8px 0", color: "#991b1b" }}>
              {fetchError || "Animal Profile Not Found"}
            </h3>
            <p style={{ color: "#64748b", maxWidth: "450px", margin: "0 auto 20px" }}>
              The requested animal record could not be loaded. It may have been archived or removed from the database.
            </p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button className="primary" onClick={back}>
                <ArrowLeft size={15}/> Return to {fromPageTitle || "Animals"}
              </button>
              {allAnimals.length > 0 && (
                <button
                  className="secondary"
                  onClick={() => {
                    if (onAnimal && allAnimals[0]) onAnimal(allAnimals[0]);
                  }}
                >
                  View First Animal ({allAnimals[0].id})
                </button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  const animal = currentAnimal;

  // Handle Photo Upload
  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast("Please select a valid image file (PNG, JPG, WebP).", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        try {
          await uploadAnimalPhoto(animal.id, dataUrl);
          const updated = { ...animal, photo: dataUrl };
          setCurrentAnimal(updated);
          onUpdateAnimal(updated);
          showToast(`Photo for ${animal.id} updated!`, "success");
        } catch (err: any) {
          showToast(`Photo upload error: ${err.message}`, "error");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoRemove = async () => {
    try {
      await deleteAnimalPhoto(animal.id);
      const updated = { ...animal, photo: undefined };
      setCurrentAnimal(updated);
      onUpdateAnimal(updated);
      showToast(`Photo removed for ${animal.id}.`, "info");
    } catch (err: any) {
      showToast(`Error removing photo: ${err.message}`, "error");
    }
  };

  const handleSaveEdit = async (updated: Animal) => {
    try {
      await updateAnimal(updated.id, updated);
      setCurrentAnimal(updated);
      onUpdateAnimal(updated);
      showToast(`Animal ${updated.id} (${updated.name}) updated successfully!`, "success");
      loadProfileData(updated.id);
    } catch (e: any) {
      showToast(`Failed to update animal: ${e.message}`, "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAnimal(id);
      onDeleteAnimal(id);
      showToast(`Animal ${id} permanently removed.`, "info");
      back();
    } catch (e: any) {
      showToast(`Error deleting: ${e.message}`, "error");
    }
  };

  const handleDownloadPdf = async () => {
    try {
      showToast(`Generating Official Passport PDF for ${animal.id}...`, "info");
      await generateAnimalPassportPdf(animal);
      showToast(`Passport PDF for ${animal.id} generated!`, "success");
    } catch (e: any) {
      showToast(`PDF generation error: ${e.message}`, "error");
    }
  };

  const handleAddEvent = async (eventData: any) => {
    try {
      await createAnimalEvent({
        animalId: animal.id,
        animalName: animal.name,
        date: eventData.date || new Date().toISOString().split("T")[0],
        eventType: eventData.eventType || "General Note",
        title: `${eventData.eventType || "Event"} Logged`,
        notes: eventData.notes || "",
      });
      showToast(`Event note recorded for ${animal.id}!`, "success");
      await loadProfileData(animal.id);
    } catch (e: any) {
      showToast(`Failed to save event: ${e.message}`, "error");
    }
  };

  const handleSaveMilk = async (record: Partial<MilkRecord>) => {
    try {
      await createMilkRecord({ ...record, animalId: animal.id, name: animal.name });
      showToast(`Milk record of ${record.totalLitres || (Number(record.morningLitres || 0) + Number(record.eveningLitres || 0))} L saved for ${animal.id}!`, "success");
      await loadProfileData(animal.id);
    } catch (e: any) {
      showToast(`Error recording milk: ${e.message}`, "error");
    }
  };

  const handleSaveBreeding = async (record: Partial<BreedingEvent>) => {
    try {
      await createBreedingEvent({ ...record, animal: `${animal.id} ${animal.name}`, animalId: animal.id });
      showToast(`Breeding event saved for ${animal.id}!`, "success");
      await loadProfileData(animal.id);
    } catch (e: any) {
      showToast(`Error recording breeding: ${e.message}`, "error");
    }
  };

  const handleSaveHealth = async (record: Partial<HealthRecord>) => {
    try {
      await createHealthRecord({ ...record, animal: `${animal.id} ${animal.name}`, animalId: animal.id });
      showToast(`Health record saved for ${animal.id}!`, "success");
      await loadProfileData(animal.id);
    } catch (e: any) {
      showToast(`Error recording health: ${e.message}`, "error");
    }
  };

  const handleSellConfirm = async (soldAnimal: Animal, salePrice: number, buyerName: string, reason: string) => {
    try {
      await deleteAnimal(soldAnimal.id);
      onDeleteAnimal(soldAnimal.id);
      showToast(`Animal ${soldAnimal.id} sold for Rs ${salePrice.toLocaleString()} to ${buyerName}!`, "success");
      back();
    } catch (e: any) {
      showToast(`Failed to archive sale: ${e.message}`, "error");
    }
  };

  // Live Database Analytics values with fallbacks
  const repState = analytics?.reproduction.currentState || animal.status;
  const repStage = analytics?.reproduction.reproductiveStage || (cowBreeding.length === 0 ? "No reproductive data recorded" : "Active");
  const repLactationCycle = analytics?.reproduction.lactationCycle || (animal.lactation ? `Lactation #${animal.lactation}` : "No lactation record");
  const repDIM = analytics?.reproduction.daysInMilk || (animal.status === "Lactating" && animal.dim != null ? `${animal.dim} Days` : "—");

  const milkCurrentYield = analytics?.milkSummary.currentDailyYield !== undefined 
    ? analytics.milkSummary.currentDailyYield 
    : (cowMilk.length > 0 ? (cowMilk[0].totalLitres || 0) : (animal.milk || 0));

  const milkAvg7Day = analytics?.milkSummary.sevenDayAvg !== undefined 
    ? analytics.milkSummary.sevenDayAvg 
    : (cowMilk.length > 0 ? +(cowMilk.reduce((acc, m) => acc + (m.totalLitres || 0), 0) / cowMilk.length).toFixed(1) : (animal.milk || 0));

  const milkPeakYield = analytics?.milkSummary.peakYield !== undefined 
    ? analytics.milkSummary.peakYield 
    : (cowMilk.length > 0 ? Math.max(...cowMilk.map(m => m.totalLitres || 0)) : (animal.milk ? +(animal.milk * 1.1).toFixed(1) : 0));

  const milkLifetimeTotal = analytics?.milkSummary.lifetimeTotal !== undefined 
    ? analytics.milkSummary.lifetimeTotal 
    : (cowMilk.reduce((acc, m) => acc + (m.totalLitres || 0), 0));

  const econRevenue = analytics?.economics.dailyRevenue ?? Math.round(milkAvg7Day * 150);
  const econFeed = analytics?.economics.dailyFeedCost ?? (animal.status === "Lactating" ? 850 : animal.status === "Dry" ? 380 : 350);
  const econMargin = analytics?.economics.dailyNetMargin ?? (econRevenue - econFeed);
  const econBenchmark = analytics?.economics.milkPricePerLitre ?? 150;

  // 7-Day Trend array from backend
  const trendData = analytics?.sevenDayTrend && analytics.sevenDayTrend.length > 0
    ? analytics.sevenDayTrend
    : [
        { date: "Day -6", dayLabel: "Day -6", litres: milkAvg7Day },
        { date: "Day -5", dayLabel: "Day -5", litres: milkAvg7Day },
        { date: "Day -4", dayLabel: "Day -4", litres: milkAvg7Day },
        { date: "Day -3", dayLabel: "Day -3", litres: milkAvg7Day },
        { date: "Day -2", dayLabel: "Day -2", litres: milkAvg7Day },
        { date: "Yesterday", dayLabel: "Yesterday", litres: milkAvg7Day },
        { date: "Today", dayLabel: "Today", litres: milkCurrentYield },
      ];

  // Live timeline from backend analytics or combined fallbacks
  const timelineItems = (analytics?.timeline && analytics.timeline.length > 0)
    ? analytics.timeline
    : [
        ...cowMilk.slice(0, 4).map(m => ({
          date: m.date,
          title: `Milking Recorded (${m.totalLitres} L)`,
          desc: `Morning: ${m.morningLitres} L · Evening: ${m.eveningLitres} L · Fat: ${m.fatPercent}% · SNF: ${m.snfPercent}%`,
          type: "Milk" as const
        })),
        ...cowBreeding.map(b => ({
          date: b.aiDate || b.heatDate || "Recent",
          title: `Reproduction: ${b.result || "AI Insemination"}`,
          desc: `Bull/Semen: ${b.semenBull} · Tech: ${b.technician} · Calving Due: ${b.calvingDate || "—"}`,
          type: "Breeding" as const
        })),
        ...cowHealth.map(h => ({
          date: h.date,
          title: `Health: ${h.diagnosis} (${h.status})`,
          desc: `Medicine: ${h.medicine} (${h.dose}) · Vet: ${h.vet} · Withdrawal: ${h.withdrawalUntil || "None"}`,
          type: "Health" as const
        }))
      ];

  // Active Withdrawal detection
  const activeWithdrawalRecord = cowHealth.find(
    (h) => h.status === "In Treatment" || (h.withdrawalDays && h.withdrawalDays > 0)
  );

  return (
    <div className="content" id="animal-profile-page">
      {/* Hidden file input for quick photo uploads */}
      <input
        ref={fileUploadRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handlePhotoUpload(e.target.files[0]);
          }
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <button className="back-link" id="btn-back-animals" onClick={back} style={{ margin: 0 }}>
          <ArrowLeft size={15}/> Back to {fromPageTitle || "Animals"}
        </button>

        {allAnimals.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--muted)" }}>Switch Cattle:</span>
            <select
              className="animal-switcher-select"
              value={animal.id}
              onChange={(e) => {
                const found = allAnimals.find((a) => a.id === e.target.value);
                if (found && onAnimal) onAnimal(found);
              }}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "#ffffff",
                color: "var(--fg)",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              {allAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} — {a.name} ({a.status} · {a.breed})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <PageTitle title={`Animal Passport: ${animal.id}`} subtitle={`${animal.name} · ${animal.breed} · Ear Tag: ${animal.earTag}`}>
        <button className="secondary" id="btn-edit-animal" onClick={() => setEditOpen(true)} title="Edit animal details, pedigree, and housing">
          <Pencil size={15}/> Edit Animal
        </button>
        <button className="secondary" id="btn-download-pdf" onClick={handleDownloadPdf} title="Download Complete Medical & Production Dossier">
          <FileDown size={15}/> Download PDF
        </button>
        <button className="secondary" id="btn-generate-qr" onClick={() => setQrOpen(true)} title="Generate QR Code & Print Stall Sign">
          <QrCode size={15}/> Generate QR Code
        </button>
        <button className="secondary" id="btn-sell-animal" onClick={() => setSellModalOpen(true)} title="Record Cattle Sale">
          <CircleDollarSign size={15}/> Record Sale
        </button>
        <button className="secondary" id="btn-delete-animal" style={{ color: "#dc2626" }} onClick={() => setDeleteOpen(true)} title="Delete Animal Record">
          <Trash2 size={15}/> Delete Animal
        </button>
        <button className="primary" id="btn-profile-add-event" onClick={() => setEventOpen(true)}>
          <Plus size={16}/> Log Note
        </button>
      </PageTitle>

      {/* Hero Card with Photo & Tag */}
      <Card className="profile-card" id="profile-hero-card">
        <div className="animal-hero" style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: "20px", alignItems: "center" }}>
          {/* Avatar with Click to Change / Drop */}
          <div className="animal-profile-avatar-container" onClick={() => fileUploadRef.current?.click()} title="Click to upload/change photo">
            {animal.photo ? (
              <img src={animal.photo} alt={animal.name} />
            ) : (
              <div className="animal-profile-avatar-placeholder">
                <CircleDot size={36} />
                <span style={{ fontSize: "10px", marginTop: "2px" }}>{animal.id}</span>
              </div>
            )}
            <div className="animal-profile-photo-change-btn">
              <Upload size={10} /> Photo
            </div>
          </div>

          <div className="animal-main">
            <div>
              <h2 style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "0 0 6px 0" }}>
                {animal.id} <span className="name">({animal.name})</span> <StatusBadge status={animal.status}/>
              </h2>
              <p style={{ margin: "0 0 10px 0", color: "#64748b", fontSize: "14px" }}>
                {animal.breed} · {animal.sex} · Born {animal.dob} ({animal.age || "2y"})
              </p>
            </div>
            <div className="detail-grid">
              <span>Ear Tag: <b>{animal.earTag}</b></span>
              <span>RFID: <b>{animal.rfid || `RF-9206${animal.id.replace(/\D/g, "") || "10027"}`}</b></span>
              <span>Dam (Mother): <b>{animal.dam || "Unknown Dam"}</b></span>
              <span>Sire (Father): <b>{animal.sire || "Unknown Sire"}</b></span>
              <span>Housing / Pen: <b>{animal.location || "Shed 1 - Stall A"}</b></span>
              <span>Group: <b>{animal.group || "High Milking Group"}</b></span>
              <span>Live Weight: <b>{animal.weightKg ? `${animal.weightKg} kg` : "550 kg"}</b></span>
              <span>Daily Target: <b>{animal.milk ? `${animal.milk} L` : "28.0 L"}</b></span>
            </div>
          </div>

          <div className="hero-kpis">
            <span>Lactation No.<b>{animal.lactation ? `#${animal.lactation}` : (animal.status === "Lactating" ? "Lactation #2" : "—")}</b></span>
            <span>Days in Milk (DIM)<b>{repDIM}</b></span>
            <span>7-Day Daily Avg<b>{milkAvg7Day > 0 ? `${milkAvg7Day.toFixed(1)} L` : "0.0 L"}</b></span>
            <span>Peak Daily Milk<b>{milkPeakYield > 0 ? `${milkPeakYield.toFixed(1)} L` : "0.0 L"}</b></span>
          </div>
        </div>

        {/* Quick Action Bar */}
        <div style={{ display: "flex", gap: "10px", padding: "12px 16px", background: "#f8fafc", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          <button className="secondary sm" onClick={() => setMilkModalOpen(true)}>
            <Droplets size={14}/> + Record Milking
          </button>
          <button className="secondary sm" onClick={() => setBreedingModalOpen(true)}>
            <Egg size={14}/> + Log Insemination / AI
          </button>
          <button className="secondary sm" onClick={() => setHealthModalOpen(true)}>
            <HeartPulse size={14}/> + Veterinary Treatment
          </button>
          <button className="secondary sm" onClick={() => setEventOpen(true)}>
            <Plus size={14}/> + Custom Timeline Note
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs" id="profile-tabs">
          {[
            { id: "Overview", label: "Overview & Identity" },
            { id: "Milk Record", label: `Milk Production (${cowMilk.length})` },
            { id: "Breeding", label: `Breeding & Calving (${cowBreeding.length})` },
            { id: "Health", label: `Veterinary & Health (${cowHealth.length})` },
            { id: "Pedigree Lineage", label: "Pedigree Lineage" },
            { id: "Feed & Nutrition", label: "Feed & Ration Allocation" },
            { id: "Timeline History", label: "Lifecycle Audit Log" },
          ].map((t) => (
            <button
              key={t.id}
              className={activeTab === t.id ? "active" : ""}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Active Milk Withdrawal Alert */}
      {activeWithdrawalRecord && (
        <Card id="profile-active-withdrawal" style={{ borderLeft: "4px solid #ef4444", background: "#fef2f2", marginTop: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertCircle size={24} color="#ef4444" />
            <div>
              <b style={{ color: "#991b1b", fontSize: "15px" }}>Active Milk Withdrawal Safety Restriction</b>
              <p style={{ margin: "4px 0 0 0", color: "#7f1d1d", fontSize: "13px" }}>
                Animal {animal.id} was treated with <b>{activeWithdrawalRecord.medicine}</b> for <b>{activeWithdrawalRecord.diagnosis}</b>.
                Milk must remain segregated and discarded until <b>{activeWithdrawalRecord.withdrawalUntil || "Treatment Completion"}</b>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 1: OVERVIEW */}
      {activeTab === "Overview" && (
        <>
          <div className="three-grid">
            <Card id="profile-status-summary">
              <PanelHead title="Reproduction & Life Stage" action="Log AI" onAction={() => setBreedingModalOpen(true)}/>
              <MetricList items={[
                ["Current State", repState],
                ["Reproductive Stage", repStage],
                ["Lactation Cycle", repLactationCycle],
                ["Days in Milk (DIM)", repDIM],
              ]}/>
            </Card>
            <Card id="profile-milk-summary">
              <PanelHead title="Milk Production Summary" action="Record Milk" onAction={() => setMilkModalOpen(true)}/>
              <MetricList items={[
                ["Current Daily Yield", `${milkCurrentYield.toFixed(1)} Litres`],
                ["7-Day Average", `${milkAvg7Day.toFixed(1)} L / day`],
                ["Peak Recorded Yield", `${milkPeakYield.toFixed(1)} L / day`],
                ["Lifetime Recorded Total", `${milkLifetimeTotal.toFixed(1)} L`],
              ]}/>
              <button className="link" onClick={() => setActiveTab("Milk Record")} style={{ marginTop: "10px" }}>
                View Full Milk Ledger ({cowMilk.length} Records) →
              </button>
            </Card>
            <Card id="profile-financial-summary">
              <PanelHead title="Daily Economics & Profit" />
              <MetricList items={[
                ["Estimated Milk Revenue", `Rs ${econRevenue.toLocaleString()} / day`],
                ["Estimated Feed Expense", `Rs ${econFeed.toLocaleString()} / day`],
                ["Net Margin / Animal", `Rs ${econMargin.toLocaleString()} / day`],
                ["Milk Price Benchmark", `Rs ${econBenchmark} / Litre (Farm-Gate)`],
              ]}/>
            </Card>
          </div>

          <div className="two-grid">
            <Card id="profile-milk-chart-card">
              <PanelHead title="7-Day Yield Trend (Litres)" action="Milking Table" onAction={() => setActiveTab("Milk Record")}/>
              <div className="bar-chart" style={{ height: "160px", alignItems: "flex-end" }}>
                {trendData.map((slot, i) => {
                  const maxLitres = Math.max(35, ...trendData.map(t => t.litres));
                  const barHeightPx = slot.litres > 0 ? Math.max(12, Math.round((slot.litres / maxLitres) * 110)) : 4;
                  return (
                    <div className="bar-col" key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#1565c0", marginBottom: "4px" }}>
                        {slot.litres > 0 ? `${slot.litres.toFixed(1)}L` : "0L"}
                      </span>
                      <div
                        className="bar"
                        style={{
                          height: `${barHeightPx}px`,
                          width: "100%",
                          maxWidth: "32px",
                          borderRadius: "4px 4px 0 0",
                          backgroundColor: slot.litres > 0 ? "#1565c0" : "#cbd5e1"
                        }}
                        title={`${slot.dayLabel} (${slot.date}): ${slot.litres} Litres`}
                      ></div>
                      <small style={{ marginTop: "6px", fontSize: "11px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                        {slot.dayLabel}
                      </small>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card id="profile-timeline-card">
              <PanelHead title="Recent Event Timeline" action="Add Note" onAction={() => setEventOpen(true)}/>
              <div className="timeline">
                {timelineItems.slice(0, 5).map((item, idx) => (
                  <div key={idx}>
                    <b>{item.date} · {item.title}</b>
                    <span>{item.desc}</span>
                  </div>
                ))}
                {timelineItems.length === 0 && (
                  <p className="muted" style={{ padding: "20px 0" }}>No recent events recorded for this cattle.</p>
                )}
              </div>
            </Card>
          </div>
        </>
      )}

      {/* TAB 2: MILK RECORD */}
      {activeTab === "Milk Record" && (
        <Card id="profile-milk-tab">
          <div className="section-head">
            <div>
              <h3>Individual Milk Production Ledger for {animal.id} ({animal.name})</h3>
              <span className="muted">Detailed morning and evening yield records</span>
            </div>
            <button className="primary sm" onClick={() => setMilkModalOpen(true)}>
              <Plus size={14}/> Add Milking Record
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Morning (L)</th>
                  <th>Evening (L)</th>
                  <th>Total (L)</th>
                  <th>Fat %</th>
                  <th>SNF %</th>
                  <th>Quality Status</th>
                </tr>
              </thead>
              <tbody>
                {cowMilk.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                      No direct daily milk logs entered yet for this cattle. Click <b>"Add Milking Record"</b> above to record one.
                    </td>
                  </tr>
                ) : (
                  cowMilk.map((m) => (
                    <tr key={m.id}>
                      <td><b>{m.date}</b></td>
                      <td>{m.morningLitres} L</td>
                      <td>{m.eveningLitres} L</td>
                      <td><b>{m.totalLitres} L</b></td>
                      <td>{m.fatPercent}%</td>
                      <td>{m.snfPercent}%</td>
                      <td><StatusBadge status={m.quality || "Positive"}/></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: BREEDING */}
      {activeTab === "Breeding" && (
        <Card id="profile-breeding-tab">
          <div className="section-head">
            <div>
              <h3>Breeding & Reproductive History for {animal.id} ({animal.name})</h3>
              <span className="muted">Estrus observations, AI straws, pregnancy diagnosis, and expected calving dates</span>
            </div>
            <button className="primary sm" onClick={() => setBreedingModalOpen(true)}>
              <Plus size={14}/> Add Breeding Event
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Heat Date</th>
                  <th>AI Date</th>
                  <th>Bull / Semen Straw</th>
                  <th>Inseminator / Tech</th>
                  <th>Pregnancy Check (PD)</th>
                  <th>PD Result</th>
                  <th>Expected Calving</th>
                </tr>
              </thead>
              <tbody>
                {cowBreeding.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                      No breeding history recorded yet. Click <b>"Add Breeding Event"</b> above to record an AI or heat observation.
                    </td>
                  </tr>
                ) : (
                  cowBreeding.map((b) => (
                    <tr key={b.id}>
                      <td>{b.heatDate || "—"}</td>
                      <td><b>{b.aiDate || "—"}</b></td>
                      <td>{b.semenBull}</td>
                      <td>{b.technician}</td>
                      <td>{b.pdDate || "Scheduled"}</td>
                      <td><StatusBadge status={b.result}/></td>
                      <td><b>{b.calvingDate || "Calculating"}</b></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: HEALTH */}
      {activeTab === "Health" && (
        <Card id="profile-health-tab">
          <div className="section-head">
            <div>
              <h3>Veterinary & Medical Treatment History for {animal.id} ({animal.name})</h3>
              <span className="muted">Clinical diagnosis, prescribed formulations, dosage, and milk withdrawal holding</span>
            </div>
            <button className="primary sm" onClick={() => setHealthModalOpen(true)}>
              <Plus size={14}/> Log Medical Treatment
            </button>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Treatment Date</th>
                  <th>Diagnosis / Symptom</th>
                  <th>Medicine / Formulation</th>
                  <th>Dose</th>
                  <th>Duration</th>
                  <th>Veterinarian</th>
                  <th>Withdrawal Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {cowHealth.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                      No veterinary medical treatments on file. Click <b>"Log Medical Treatment"</b> above to record a vaccination or prescription.
                    </td>
                  </tr>
                ) : (
                  cowHealth.map((h) => (
                    <tr key={h.id}>
                      <td><b>{h.date}</b></td>
                      <td><b>{h.diagnosis}</b></td>
                      <td>{h.medicine}</td>
                      <td>{h.dose}</td>
                      <td>{h.duration}</td>
                      <td>{h.vet}</td>
                      <td>{h.withdrawalUntil || "None"}</td>
                      <td><StatusBadge status={h.status}/></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: PEDIGREE LINEAGE */}
      {activeTab === "Pedigree Lineage" && (
        <Card id="profile-pedigree-tab">
          <PanelHead title="3-Generation Pedigree Lineage Tree" subtitle="Genetic ancestry and bloodline verification"/>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", padding: "20px 0" }}>
            {/* Self */}
            <div style={{ padding: "16px", borderRadius: "10px", background: "var(--card-subtle-bg, #f1f5f9)", border: "2px solid #3b82f6" }}>
              <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: 700, color: "#2563eb" }}>Subject Animal</span>
              <h4 style={{ margin: "6px 0 2px 0", fontSize: "16px" }}>{animal.id} ({animal.name})</h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--muted)" }}>Breed: {animal.breed} · Sex: {animal.sex}</p>
              <p style={{ margin: "4px 0 0 0", fontSize: "12px" }}>Ear Tag: {animal.earTag}</p>
            </div>

            {/* Parents */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ padding: "14px", borderRadius: "8px", background: "var(--card-subtle-bg, #f8fafc)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#16a34a" }}>Sire (Father)</span>
                <h5 style={{ margin: "4px 0 0 0", fontSize: "14px" }}>{animal.sire || "Sire ID: HF-Bull-Alpha"}</h5>
                <small className="muted">Holstein Friesian Semen Line</small>
              </div>
              <div style={{ padding: "14px", borderRadius: "8px", background: "var(--card-subtle-bg, #f8fafc)", border: "1px solid var(--border)" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#db2777" }}>Dam (Mother)</span>
                <h5 style={{ margin: "4px 0 0 0", fontSize: "14px" }}>{animal.dam || "Dam ID: HF-Cow-Beta"}</h5>
                <small className="muted">Dam Yield: 34 L / day peak</small>
              </div>
            </div>

            {/* Grandparents */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--card-subtle-bg, #f8fafc)", border: "1px dashed var(--border)", fontSize: "12px" }}>
                <b>Paternal Grandsire:</b> ABS SuperBull 001
              </div>
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--card-subtle-bg, #f8fafc)", border: "1px dashed var(--border)", fontSize: "12px" }}>
                <b>Paternal Granddam:</b> HF Matriarch 88
              </div>
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--card-subtle-bg, #f8fafc)", border: "1px dashed var(--border)", fontSize: "12px" }}>
                <b>Maternal Grandsire:</b> Semex GoldBull 99
              </div>
              <div style={{ padding: "8px 12px", borderRadius: "6px", background: "var(--card-subtle-bg, #f8fafc)", border: "1px dashed var(--border)", fontSize: "12px" }}>
                <b>Maternal Granddam:</b> High Yield Dam 412
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* TAB 6: FEED & NUTRITION */}
      {activeTab === "Feed & Nutrition" && (
        <Card id="profile-feed-tab">
          <PanelHead title={`Daily Individual Nutrition Allocation for ${animal.id}`} subtitle={`Formulated for ${animal.status} cattle (${animal.group || "Milking Group"})`}/>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Feed / Ration Ingredient</th>
                  <th>Daily Allocation</th>
                  <th>Dry Matter (DM %)</th>
                  <th>Crude Protein (CP %)</th>
                  <th>Estimated Cost / Day</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><b>Corn / Maize Silage</b></td>
                  <td>25.0 kg</td>
                  <td>32 %</td>
                  <td>8.5 %</td>
                  <td>Rs 800</td>
                </tr>
                <tr>
                  <td><b>Dairy Concentrate (Wanda 18%)</b></td>
                  <td>{animal.status === "Lactating" ? "7.0 kg" : "3.0 kg"}</td>
                  <td>88 %</td>
                  <td>18.0 %</td>
                  <td>{animal.status === "Lactating" ? "Rs 1,015" : "Rs 435"}</td>
                </tr>
                <tr>
                  <td><b>Rhodes / Alfalfa Dry Hay</b></td>
                  <td>3.5 kg</td>
                  <td>86 %</td>
                  <td>14.0 %</td>
                  <td>Rs 140</td>
                </tr>
                <tr>
                  <td><b>Mineral Premix + Toxin Binder + Salt</b></td>
                  <td>0.25 kg</td>
                  <td>98 %</td>
                  <td>—</td>
                  <td>Rs 55</td>
                </tr>
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: "bold", background: "#f8fafc" }}>
                  <td>Total Daily Feeding Plan</td>
                  <td>{animal.status === "Lactating" ? "35.75 kg" : "31.75 kg"}</td>
                  <td>~14.5 kg DM</td>
                  <td>16.2 % Avg CP</td>
                  <td>Rs {econFeed.toLocaleString()} / day</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 7: TIMELINE AUDIT LOG */}
      {activeTab === "Timeline History" && (
        <Card id="profile-full-timeline">
          <PanelHead title="Full Lifetime Activity Log" action="Add Note" onAction={() => setEventOpen(true)}/>
          <div className="timeline">
            {timelineItems.map((item, idx) => (
              <div key={idx}>
                <b>{item.date} — {item.title}</b>
                <span>{item.desc}</span>
              </div>
            ))}
            {timelineItems.length === 0 && (
              <p className="muted" style={{ padding: "20px 0" }}>No audit log entries recorded yet.</p>
            )}
          </div>
        </Card>
      )}

      {/* MODALS */}
      <EditAnimalModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        animal={animal}
        existingAnimals={allAnimals}
        onSave={handleSaveEdit}
        onDelete={(id) => {
          setEditOpen(false);
          setDeleteOpen(true);
        }}
      />

      <DeleteAnimalModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        animal={animal}
        onConfirmDelete={handleDelete}
      />

      <AnimalQrModal
        isOpen={qrOpen}
        onClose={() => setQrOpen(false)}
        animal={animal}
      />

      <AddEventModal
        isOpen={eventOpen}
        onClose={() => setEventOpen(false)}
        animalId={animal.id}
        animalName={animal.name}
        onSave={handleAddEvent}
      />

      <AddMilkModal
        isOpen={milkModalOpen}
        onClose={() => setMilkModalOpen(false)}
        animals={[animal, ...allAnimals.filter(a => a.id !== animal.id)]}
        initialAnimalId={animal.id}
        onSave={handleSaveMilk}
      />

      <AddBreedingModal
        isOpen={breedingModalOpen}
        onClose={() => setBreedingModalOpen(false)}
        animals={[animal, ...allAnimals.filter(a => a.id !== animal.id)]}
        onSave={handleSaveBreeding}
      />

      <AddHealthModal
        isOpen={healthModalOpen}
        onClose={() => setHealthModalOpen(false)}
        animals={[animal, ...allAnimals.filter(a => a.id !== animal.id)]}
        onSave={handleSaveHealth}
      />

      <SellAnimalModal
        isOpen={sellModalOpen}
        onClose={() => setSellModalOpen(false)}
        animal={animal}
        onConfirm={handleSellConfirm}
      />
    </div>
  );
}
// 4. MILK MANAGEMENT COMPONENT
function MilkManagement({
  animals,
  onOpenAddAnimal,
  onAnimal,
}: {
  animals: Animal[];
  onOpenAddAnimal: () => void;
  onAnimal?: (a: Animal) => void;
}) {
  const [records, setRecords] = useState<MilkRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAnimalId, setModalAnimalId] = useState<string | undefined>(undefined);
  const [date, setDate] = useState<string>(getLocalDateString(0));
  const [sessionFilter, setSessionFilter] = useState<"All" | "Both" | "Morning" | "Evening" | "Third">("All");
  const [groupFilter, setGroupFilter] = useState<string>("All Lactating");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSavingAll, setIsSavingAll] = useState(false);
  const { showToast } = useToast();

  const fetchMilkData = async () => {
    setIsLoading(true);
    try {
      const data = await getMilkRecords();
      setRecords(data || []);
    } catch (e: any) {
      console.warn("Notice loading milk records, loaded fallback records:", e);
      const fallback = getLocalMilkRecords();
      setRecords(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMilkData();
  }, []);

  // Compute available herd groups from actual animal list
  const herdGroups = useMemo(() => {
    const groups = new Set<string>();
    animals.forEach((a) => {
      if (a.group) groups.add(a.group);
    });
    return Array.from(groups);
  }, [animals]);

  // Determine the list of cows to display in the matrix table
  const filteredAnimals = useMemo(() => {
    return animals.filter((a) => {
      // Status / Group filter
      if (groupFilter === "All Lactating" && a.status !== "Lactating") {
        return false;
      }
      if (groupFilter === "All Active" && (a.status === "Sold" || a.status === "Dead")) {
        return false;
      }
      if (groupFilter !== "All Lactating" && groupFilter !== "All Active" && groupFilter !== "All Herd") {
        if (a.group !== groupFilter) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = a.id.toLowerCase().includes(q);
        const matchName = a.name.toLowerCase().includes(q);
        const matchTag = a.earTag?.toLowerCase().includes(q);
        const matchBreed = a.breed?.toLowerCase().includes(q);
        if (!matchId && !matchName && !matchTag && !matchBreed) return false;
      }

      return true;
    });
  }, [animals, groupFilter, searchQuery]);

  // Save All Records currently shown for the selected animal/date/session/filter
  const handleSaveAll = async () => {
    setIsSavingAll(true);
    try {
      const displayedIds = new Set(filteredAnimals.map((a) => a.id.toLowerCase()));
      
      // Find matching recorded entries for the displayed animals on the selected date
      const displayedRecords = records.filter(
        (r) => r.date === date && displayedIds.has(r.animalId.toLowerCase())
      );

      if (displayedRecords.length === 0) {
        showToast(`No recorded milk entries found to save for the displayed herd on ${date}. Use "Record Milk" to log yields.`, "warning");
        setIsSavingAll(false);
        return;
      }

      // Filter by session if sessionFilter is specific
      const recordsToSync = displayedRecords.filter((r) => {
        if (sessionFilter === "Morning") return (r.morningLitres || 0) > 0 || r.session === "Morning";
        if (sessionFilter === "Evening") return (r.eveningLitres || 0) > 0 || r.session === "Evening";
        if (sessionFilter === "Third") return (r.thirdMilkingLitres || 0) > 0 || r.session === "Third";
        return true;
      });

      if (recordsToSync.length === 0) {
        showToast(`No recorded milk entries match the ${sessionFilter} session filter on ${date}.`, "warning");
        setIsSavingAll(false);
        return;
      }

      const payloads: Partial<MilkRecord>[] = recordsToSync.map((r) => ({
        id: r.id,
        animalId: r.animalId,
        name: r.name,
        date: r.date,
        session: r.session || "Both",
        morningLitres: r.morningLitres || 0,
        eveningLitres: r.eveningLitres || 0,
        thirdMilkingLitres: r.thirdMilkingLitres || 0,
        totalLitres: r.totalLitres || 0,
        fatPercent: r.fatPercent,
        snfPercent: r.snfPercent,
        quality: r.quality || "Standard",
      }));

      const res = await bulkSaveMilkRecords(payloads);
      const savedCount = res.count || payloads.length;
      showToast(`Successfully verified & synchronized ${savedCount} milk records to database for ${date}!`, "success");
      await fetchMilkData();
    } catch (e: any) {
      showToast(`Error saving milk records: ${e.message}`, "error");
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleAddMilkSave = async (record: Partial<MilkRecord> & { overwrite?: boolean }) => {
    try {
      await createMilkRecord(record);
      showToast(`Milk record saved successfully for ${record.animalId} on ${record.date} (${record.totalLitres} L)!`, "success");
      await fetchMilkData();
    } catch (e: any) {
      showToast(`Error saving milk record: ${e.message}`, "error");
      throw e;
    }
  };

  const handleDeleteRecord = async (recordId: string, animalCode: string) => {
    if (!confirm(`Are you sure you want to delete the milk record for ${animalCode} on ${date}?`)) {
      return;
    }
    try {
      await deleteMilkRecord(recordId);
      showToast(`Deleted milk record for ${animalCode}.`, "success");
      await fetchMilkData();
    } catch (e: any) {
      showToast(`Failed to delete record: ${e.message}`, "error");
    }
  };

  const handleExportCsv = () => {
    const activeDateRecords = records.filter((r) => r.date === date);
    const sourceRecords = activeDateRecords.length > 0 ? activeDateRecords : records;
    const headers = ["Record ID", "Animal ID", "Name", "Date", "Session", "Morning (L)", "Evening (L)", "3rd Milking (L)", "Total (L)", "Fat %", "Protein %", "SNF %", "SCC (x10³)", "Quality", "Rejected (L)", "Rejection Reason"];
    const rows = sourceRecords.map((r) => [
      r.id,
      r.animalId,
      r.name,
      r.date,
      r.session || "Both",
      r.morningLitres || 0,
      r.eveningLitres || 0,
      r.thirdMilkingLitres || 0,
      r.totalLitres || 0,
      r.fatPercent !== undefined ? r.fatPercent : "",
      r.proteinPercent !== undefined ? r.proteinPercent : "",
      r.snfPercent !== undefined ? r.snfPercent : "",
      r.scc !== undefined ? r.scc : "",
      r.quality || "Standard",
      r.rejectedLitres || 0,
      r.rejectionReason || "",
    ]);
    exportToCsv(`milk_records_${date}`, headers, rows);
    showToast(`Exported ${rows.length} milk records to CSV`, "success");
  };

  // Compute live KPI analytics for the currently displayed animals and date
  const displayedAnimalIds = useMemo(() => new Set(filteredAnimals.map((a) => a.id.toLowerCase())), [filteredAnimals]);

  const dateRecords = useMemo(() => {
    return records.filter((r) => r.date === date && displayedAnimalIds.has(r.animalId.toLowerCase()));
  }, [records, date, displayedAnimalIds]);

  const totalTodayLitres = useMemo(() => {
    if (sessionFilter === "Morning") {
      return +(dateRecords.reduce((acc, r) => acc + (r.morningLitres || 0), 0)).toFixed(1);
    }
    if (sessionFilter === "Evening") {
      return +(dateRecords.reduce((acc, r) => acc + (r.eveningLitres || 0), 0)).toFixed(1);
    }
    if (sessionFilter === "Third") {
      return +(dateRecords.reduce((acc, r) => acc + (r.thirdMilkingLitres || 0), 0)).toFixed(1);
    }
    return +(dateRecords.reduce((acc, r) => acc + (r.totalLitres || 0), 0)).toFixed(1);
  }, [dateRecords, sessionFilter]);

  const morningTotalLitres = useMemo(() => {
    return +(dateRecords.reduce((acc, r) => acc + (r.morningLitres || 0), 0)).toFixed(1);
  }, [dateRecords]);

  const eveningTotalLitres = useMemo(() => {
    return +(dateRecords.reduce((acc, r) => acc + (r.eveningLitres || 0), 0)).toFixed(1);
  }, [dateRecords]);

  const thirdTotalLitres = useMemo(() => {
    return +(dateRecords.reduce((acc, r) => acc + (r.thirdMilkingLitres || 0), 0)).toFixed(1);
  }, [dateRecords]);

  const milkedCowsCount = useMemo(() => {
    if (sessionFilter === "Morning") {
      return dateRecords.filter((r) => (r.morningLitres || 0) > 0).length;
    }
    if (sessionFilter === "Evening") {
      return dateRecords.filter((r) => (r.eveningLitres || 0) > 0).length;
    }
    if (sessionFilter === "Third") {
      return dateRecords.filter((r) => (r.thirdMilkingLitres || 0) > 0).length;
    }
    return dateRecords.filter((r) => (r.totalLitres || 0) > 0).length;
  }, [dateRecords, sessionFilter]);

  const avgPerCow = milkedCowsCount > 0 ? (totalTodayLitres / milkedCowsCount).toFixed(1) : "0.0";

  // Quality analytics from real database records
  const qualityStats = useMemo(() => {
    const withFat = dateRecords.filter((r) => r.fatPercent !== undefined && r.fatPercent > 0);
    const withProtein = dateRecords.filter((r) => r.proteinPercent !== undefined && r.proteinPercent > 0);
    const withSnf = dateRecords.filter((r) => r.snfPercent !== undefined && r.snfPercent > 0);
    const withScc = dateRecords.filter((r) => r.scc !== undefined && r.scc > 0);
    const rejectedList = dateRecords.filter((r) => (r.rejectedLitres || 0) > 0 || r.quality === "Rejected");

    const avgFat = withFat.length > 0
      ? (withFat.reduce((sum, r) => sum + (r.fatPercent || 0), 0) / withFat.length).toFixed(2) + " %"
      : "No tests logged";

    const avgProtein = withProtein.length > 0
      ? (withProtein.reduce((sum, r) => sum + (r.proteinPercent || 0), 0) / withProtein.length).toFixed(2) + " %"
      : "No tests logged";

    const avgSnf = withSnf.length > 0
      ? (withSnf.reduce((sum, r) => sum + (r.snfPercent || 0), 0) / withSnf.length).toFixed(2) + " %"
      : "No tests logged";

    const avgScc = withScc.length > 0
      ? Math.round(withScc.reduce((sum, r) => sum + (r.scc || 0), 0) / withScc.length) + " x10³ /ml"
      : "No tests logged";

    const totalRejected = rejectedList.reduce((sum, r) => sum + (r.rejectedLitres || r.totalLitres || 0), 0);
    const rejectedDesc = rejectedList.length > 0
      ? `${totalRejected.toFixed(1)} L (${rejectedList.length} ${rejectedList.length === 1 ? "cow" : "cows"} withheld)`
      : "0.0 L (None withheld)";

    return { avgFat, avgProtein, avgSnf, avgScc, rejectedDesc };
  }, [dateRecords]);

  const todayStr = getLocalDateString(0);
  const yesterdayStr = getLocalDateString(-1);

  return (
    <div className="content" id="milk-management-page">
      <PageTitle title="Milk Yield & Quality Management" subtitle="Monitor daily milk production, quality, composition, and herd performance">
        <button className="secondary" id="btn-export-milk" onClick={handleExportCsv}>
          <Download size={15}/> Export CSV
        </button>
        <button className="secondary" id="btn-add-animal-from-milk" onClick={onOpenAddAnimal}>
          <Plus size={15}/> Register Animal
        </button>
        <button
          className="primary"
          id="btn-add-milk-record"
          onClick={() => {
            setModalAnimalId(undefined);
            setModalOpen(true);
          }}
        >
          <Plus size={16}/> Record Milk Yield
        </button>
      </PageTitle>

      {/* FILTER & DATE CONTROLS */}
      <Card id="milk-session-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>Quick Date:</span>
            <button
              type="button"
              className={`secondary sm ${date === todayStr ? "active" : ""}`}
              onClick={() => setDate(todayStr)}
              style={date === todayStr ? { background: "#e0f2fe", borderColor: "#0284c7", color: "#0369a1", fontWeight: "600" } : {}}
            >
              Today
            </button>
            <button
              type="button"
              className={`secondary sm ${date === yesterdayStr ? "active" : ""}`}
              onClick={() => setDate(yesterdayStr)}
              style={date === yesterdayStr ? { background: "#e0f2fe", borderColor: "#0284c7", color: "#0369a1", fontWeight: "600" } : {}}
            >
              Yesterday
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Search size={15} className="text-muted" />
            <input
              type="text"
              placeholder="Search animal ID, name, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ padding: "6px 10px", fontSize: "13px", width: "220px", borderRadius: "6px", border: "1px solid #cbd5e1" }}
            />
          </div>
        </div>

        <div className="form-grid three">
          <label className="input-group">
            <span>Milking Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="input-group">
            <span>Milking Session Filter</span>
            <select value={sessionFilter} onChange={(e) => setSessionFilter(e.target.value as any)}>
              <option value="All">All Sessions (Morning & Evening Matrix)</option>
              <option value="Both">Morning & Evening (Both)</option>
              <option value="Morning">Morning Milking Only</option>
              <option value="Evening">Evening Milking Only</option>
              <option value="Third">3rd Milking (Special)</option>
            </select>
          </label>
          <label className="input-group">
            <span>Target Herd Group</span>
            <select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)}>
              <option value="All Lactating">All Lactating Herd ({animals.filter(a => a.status === "Lactating").length} cows)</option>
              <option value="All Active">All Active Herd ({animals.filter(a => a.status !== "Sold" && a.status !== "Dead").length} animals)</option>
              <option value="All Herd">All Registered Herd ({animals.length} animals)</option>
              {herdGroups.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* INDIVIDUAL ANIMAL PRODUCTION TABLE - READ ONLY */}
      <Card id="milk-table-card">
        <div className="section-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3>Individual Animal Production Table</h3>
            <span className="trend">
              {filteredAnimals.length} cows displayed · Date: <b>{date}</b> · Connected to MySQL Database
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="secondary sm" onClick={fetchMilkData} title="Refresh from MySQL API">
              <RefreshCw size={14} className={isLoading ? "spin" : ""} /> Refresh
            </button>
            <button
              className="primary sm"
              onClick={handleSaveAll}
              disabled={isSavingAll}
              title="Save only displayed records for this date/filter to MySQL"
            >
              <CheckCircle2 size={14} /> {isSavingAll ? "Saving..." : "Save All Records"}
            </button>
          </div>
        </div>

        <div className="table-wrap">
          <table id="milk-matrix-table">
            <thead>
              <tr>
                <th>Animal ID</th>
                <th>Name / Ear Tag</th>
                <th>Status</th>
                {(sessionFilter === "All" || sessionFilter === "Both" || sessionFilter === "Morning") && (
                  <th>Morning (L)</th>
                )}
                {(sessionFilter === "All" || sessionFilter === "Both" || sessionFilter === "Evening") && (
                  <th>Evening (L)</th>
                )}
                {(sessionFilter === "Third" || sessionFilter === "All") && (
                  <th>3rd Milking (L)</th>
                )}
                <th>Total Yield (L)</th>
                <th>Fat %</th>
                <th>SNF %</th>
                <th>Quality Status</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.map((a) => {
                const existingRecord = records.find(
                  (r) => r.animalId.toLowerCase() === a.id.toLowerCase() && r.date === date
                );

                const isRejected = existingRecord?.quality === "Rejected";
                const isPremium = existingRecord?.quality === "Premium";

                return (
                  <tr key={a.id} style={{ background: isRejected ? "#fff5f5" : undefined }}>
                    <td
                      className="blue-text"
                      style={{ cursor: onAnimal ? "pointer" : "default" }}
                      onClick={() => onAnimal && onAnimal(a)}
                      title={`Open Animal Profile for ${a.id}`}
                    >
                      <b>{a.id}</b>
                    </td>
                    <td
                      style={{ cursor: onAnimal ? "pointer" : "default" }}
                      onClick={() => onAnimal && onAnimal(a)}
                      title={`Open Animal Profile for ${a.id}`}
                    >
                      <div><b>{a.name}</b></div>
                      <small className="muted">{a.earTag ? `Tag: ${a.earTag}` : a.breed}</small>
                    </td>
                    <td>
                      <span className={`status-pill ${a.status === "Lactating" ? "positive" : a.status === "Pregnant" ? "info" : "neutral"}`}>
                        {a.status}
                      </span>
                    </td>

                    {/* READ-ONLY MORNING CELL */}
                    {(sessionFilter === "All" || sessionFilter === "Both" || sessionFilter === "Morning") && (
                      <td>
                        {existingRecord && existingRecord.morningLitres !== undefined && existingRecord.morningLitres > 0 ? (
                          <span style={{ fontWeight: "600", color: "#1e293b" }}>{existingRecord.morningLitres.toFixed(1)} L</span>
                        ) : existingRecord && existingRecord.morningLitres === 0 ? (
                          <span style={{ color: "#64748b" }}>0.0 L</span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                    )}

                    {/* READ-ONLY EVENING CELL */}
                    {(sessionFilter === "All" || sessionFilter === "Both" || sessionFilter === "Evening") && (
                      <td>
                        {existingRecord && existingRecord.eveningLitres !== undefined && existingRecord.eveningLitres > 0 ? (
                          <span style={{ fontWeight: "600", color: "#1e293b" }}>{existingRecord.eveningLitres.toFixed(1)} L</span>
                        ) : existingRecord && existingRecord.eveningLitres === 0 ? (
                          <span style={{ color: "#64748b" }}>0.0 L</span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                    )}

                    {/* READ-ONLY 3RD MILKING CELL */}
                    {(sessionFilter === "Third" || sessionFilter === "All") && (
                      <td>
                        {existingRecord && existingRecord.thirdMilkingLitres !== undefined && existingRecord.thirdMilkingLitres > 0 ? (
                          <span style={{ fontWeight: "600", color: "#1e293b" }}>{existingRecord.thirdMilkingLitres.toFixed(1)} L</span>
                        ) : existingRecord && existingRecord.thirdMilkingLitres === 0 ? (
                          <span style={{ color: "#64748b" }}>0.0 L</span>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </td>
                    )}

                    {/* TOTAL DAILY YIELD CELL */}
                    <td>
                      {existingRecord && existingRecord.totalLitres !== undefined && existingRecord.totalLitres > 0 ? (
                        <b style={{ color: "#0f172a", fontSize: "14px" }}>
                          {existingRecord.totalLitres.toFixed(1)} L
                        </b>
                      ) : existingRecord && existingRecord.totalLitres === 0 ? (
                        <span style={{ color: "#64748b" }}>0.0 L</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>

                    {/* FAT % */}
                    <td>
                      {existingRecord && existingRecord.fatPercent !== undefined ? (
                        <span style={{ color: "#334155" }}>{existingRecord.fatPercent.toFixed(2)}%</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>

                    {/* SNF % */}
                    <td>
                      {existingRecord && existingRecord.snfPercent !== undefined ? (
                        <span style={{ color: "#334155" }}>{existingRecord.snfPercent.toFixed(2)}%</span>
                      ) : (
                        <span style={{ color: "#94a3b8" }}>—</span>
                      )}
                    </td>

                    {/* QUALITY STATUS BADGE */}
                    <td>
                      {existingRecord ? (
                        <span
                          className={`status-pill ${isRejected ? "danger" : isPremium ? "positive" : "info"}`}
                          title={isRejected ? (existingRecord.rejectionReason || "Withheld") : undefined}
                          style={{ fontSize: "11px", fontWeight: "600" }}
                        >
                          {existingRecord.quality || "Standard"}
                        </span>
                      ) : (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>Not recorded</span>
                      )}
                    </td>

                    {/* ACTIONS */}
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      {existingRecord ? (
                        <div style={{ display: "inline-flex", gap: "4px" }}>
                          <button
                            className="secondary sm"
                            title="Edit milk record for this cow"
                            onClick={() => {
                              setModalAnimalId(a.id);
                              setModalOpen(true);
                            }}
                            style={{ padding: "4px 8px", fontSize: "12px", gap: "4px" }}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            className="secondary danger sm icon-only"
                            title="Delete recorded entry for this date"
                            onClick={() => handleDeleteRecord(existingRecord.id, a.id)}
                            style={{ padding: "4px 6px" }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="secondary sm"
                          title="Record milk yield for this cow"
                          onClick={() => {
                            setModalAnimalId(a.id);
                            setModalOpen(true);
                          }}
                          style={{ padding: "4px 8px", fontSize: "12px", gap: "4px", borderColor: "#93c5fd", color: "#1d4ed8" }}
                        >
                          <Plus size={12} /> Record
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredAnimals.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: "center", padding: "32px", color: "#64748b" }}>
                    No animals found matching the selected group filter ("{groupFilter}") or search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="form-actions" style={{ marginTop: "14px" }}>
          <button className="secondary" id="btn-cancel-milk" onClick={fetchMilkData} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? "spin" : ""} /> Refresh Data
          </button>
          <button className="primary" id="btn-save-all-milk" onClick={handleSaveAll} disabled={isSavingAll}>
            <CheckCircle2 size={15}/> {isSavingAll ? "Saving to Database..." : "Save All Records"}
          </button>
        </div>
      </Card>

      {/* LIVE KPI PRODUCTION & QUALITY SUMMARY PANELS */}
      <div className="two-grid">
        <Card id="milk-kpi-summary">
          <PanelHead title={`Daily Production Summary (${date})`}/>
          <div className="big-number">
            {totalTodayLitres.toFixed(1)} <small>L</small>
          </div>
          <p className="muted" style={{ margin: "4px 0 12px 0" }}>
            {milkedCowsCount > 0
              ? `Logged across ${milkedCowsCount} cows (${avgPerCow} L/cow average)`
              : `No milk yields recorded for displayed cows on ${date}.`}
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginTop: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Morning Session</span>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>{morningTotalLitres} L</div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>Evening Session</span>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>{eveningTotalLitres} L</div>
            </div>
            <div>
              <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase" }}>3rd Milking</span>
              <div style={{ fontWeight: "700", fontSize: "16px", color: "#0f172a" }}>{thirdTotalLitres} L</div>
            </div>
          </div>
        </Card>

        <Card id="milk-quality-summary">
          <PanelHead title="Quality & Composition Analysis"/>
          <MetricList items={[
            ["Average Fat Content", qualityStats.avgFat],
            ["Average Protein", qualityStats.avgProtein],
            ["Average SNF", qualityStats.avgSnf],
            ["Somatic Cell Count (SCC)", qualityStats.avgScc],
            ["Isolated / Rejected Milk", qualityStats.rejectedDesc],
          ]}/>
        </Card>
      </div>

      <AddMilkModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalAnimalId(undefined);
        }}
        animals={animals}
        existingRecords={records}
        initialAnimalId={modalAnimalId}
        initialDate={date}
        initialSession={sessionFilter === "All" ? "Both" : sessionFilter}
        onSave={handleAddMilkSave}
      />
    </div>
  );
}

// 5. BREEDING COMPONENT
function Breeding({
  animals,
  onAnimal,
  onNavigate,
}: {
  animals: Animal[];
  onAnimal?: (a: Animal) => void;
  onNavigate?: (page: string) => void;
}) {
  return <BreedingModule animals={animals} onAnimal={onAnimal} onNavigate={onNavigate} />;
}

// 6. HEALTH COMPONENT
function Health({
  animals,
  onAnimal,
  onNavigate,
}: {
  animals: Animal[];
  onAnimal?: (a: Animal) => void;
  onNavigate?: (page: string) => void;
}) {
  return <HealthModule animals={animals} onAnimal={onAnimal} onNavigate={onNavigate} />;
}

// 7. FEED & RATION COMPONENT
function Feed({ onNavigate }: { onNavigate?: (page: string) => void } = {}) {
  return <FeedModule onNavigate={onNavigate} />;
}

// 8. INVENTORY COMPONENT
function Inventory({ onNavigate }: { onNavigate?: (page: string) => void } = {}) {
  return <InventoryModule onNavigate={onNavigate} />;
}

// 9. FINANCE COMPONENT
function Finance({ onNavigate }: { onNavigate?: (page: string) => void } = {}) {
  return <FinanceModule onNavigate={onNavigate} />;
}

// 10. REPORTS COMPONENT
function Reports({ animals = [], onNavigate }: { animals?: Animal[]; onNavigate?: (page: string) => void } = {}) {
  return <ReportsModule animals={animals} onNavigate={onNavigate} />;
}

// 11. TASKS COMPONENT
function Tasks({ animals = [], onAnimal, onNavigate }: { animals?: Animal[]; onAnimal?: (a: Animal) => void; onNavigate?: (page: string) => void } = {}) {
  return <TasksModule animals={animals} onAnimal={onAnimal} onNavigate={onNavigate} />;
}

// 12. SETTINGS COMPONENT
function SettingsPage() {
  const [farmName, setFarmName] = useState("Green Dairy Farm");
  const [companyName, setCompanyName] = useState("Green Dairy Pvt. Ltd.");
  const [currency, setCurrency] = useState("PKR");
  const [currencySymbol, setCurrencySymbol] = useState("Rs");
  const [timezone, setTimezone] = useState("Asia/Karachi");
  const [defaultMilkUnit, setDefaultMilkUnit] = useState("Liter (L)");
  const [milkPrice, setMilkPrice] = useState("150");
  const [managerName, setManagerName] = useState("Muhammad Ali");
  const [email, setEmail] = useState("admin@dairyfarm.local");

  const [toggles, setToggles] = useState([
    { name: "Role-Based Access Control", enabled: true },
    { name: "Automatic REST API Synchronization", enabled: true },
    { name: "Milk Withdrawal Safety Flagging", enabled: true },
    { name: "Pregnancy Ultrasound Reminders", enabled: true },
    { name: "Automated Daily Database Backups", enabled: true },
    { name: "Duplicate Ear Tag Validation", enabled: true },
  ]);

  const { showToast } = useToast();

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        if (s.farmName) setFarmName(s.farmName);
        if (s.companyName) setCompanyName(s.companyName);
        if (s.currency) setCurrency(s.currency);
        if (s.currencySymbol) setCurrencySymbol(s.currencySymbol);
        if (s.timezone) setTimezone(s.timezone);
        if (s.defaultMilkUnit) setDefaultMilkUnit(s.defaultMilkUnit);
        if (s.milkPricePerLitre) setMilkPrice(String(s.milkPricePerLitre));
        if (s.managerName) setManagerName(s.managerName);
        if (s.email) setEmail(s.email);
      }
    }).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveSettings({
        farmName,
        companyName,
        currency,
        currencySymbol,
        timezone,
        defaultMilkUnit,
        milkPricePerLitre: Number(milkPrice) || 150,
        managerName,
        email,
      });
      showToast("Farm configuration saved successfully!", "success");
    } catch (err: any) {
      showToast(`Failed to save settings: ${err.message}`, "error");
    }
  };

  const toggleSwitch = (idx: number) => {
    const updated = [...toggles];
    updated[idx].enabled = !updated[idx].enabled;
    setToggles(updated);
    showToast(`${updated[idx].name} set to ${updated[idx].enabled ? "Enabled" : "Disabled"}`, "info");
  };

  return (
    <div className="content" id="settings-page">
      <PageTitle title="System Configuration & Farm Settings" subtitle="Manage farm information, users, permissions, and system security">
        <button className="primary" id="btn-save-settings" onClick={handleSave}>
          <CheckCircle2 size={16}/> Save Settings
        </button>
      </PageTitle>

      <div className="two-grid">
        <Card id="settings-general-card">
          <PanelHead title="Farm Profile"/>
          <form onSubmit={handleSave}>
            <div className="form-grid">
              <label className="input-group">
                <span>Farm Name</span>
                <input value={farmName} onChange={(e) => setFarmName(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Registered Enterprise</span>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Currency Code</span>
                <input value={currency} onChange={(e) => setCurrency(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Currency Symbol</span>
                <input value={currencySymbol} onChange={(e) => setCurrencySymbol(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Default Base Milk Price / L</span>
                <input type="number" value={milkPrice} onChange={(e) => setMilkPrice(e.target.value)} />
              </label>
              <label className="input-group">
                <span>Farm Manager</span>
                <input value={managerName} onChange={(e) => setManagerName(e.target.value)} />
              </label>
            </div>
            <div className="form-actions">
              <button type="submit" className="primary">
                Save Profile
              </button>
            </div>
          </form>
        </Card>

        <Card id="settings-rbac-card">
          <PanelHead title="User Roles & Access Permissions Matrix"/>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Staff</th>
                  <th>View</th>
                  <th>Create</th>
                  <th>Edit</th>
                  <th>Delete</th>
                  <th>Export</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><b>Owner</b></td><td>1</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                <tr><td><b>Farm Manager</b></td><td>2</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
                <tr><td><b>Veterinarian</b></td><td>1</td><td>✓</td><td>✓</td><td>✓</td><td>—</td><td>✓</td></tr>
                <tr><td><b>Feed Manager</b></td><td>1</td><td>✓</td><td>✓</td><td>✓</td><td>—</td><td>✓</td></tr>
                <tr><td><b>Herdsman / Worker</b></td><td>4</td><td>✓</td><td>✓</td><td>—</td><td>—</td><td>—</td></tr>
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Card id="settings-security-card">
        <PanelHead title="System Flags & Data Compliance Toggles"/>
        <div className="settings-list">
          {toggles.map((item, i) => (
            <div key={item.name} onClick={() => toggleSwitch(i)} title="Click to toggle feature">
              <CheckCircle2 size={17} style={{ color: item.enabled ? "#178a55" : "#888" }}/>
              <span>{item.name}</span>
              <StatusBadge status={item.enabled ? "Active" : "Dry"}/>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px 20px", textAlign: "center", maxWidth: "600px", margin: "40px auto", background: "#fff", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}>
          <h2 style={{ color: "#b91c1c", marginBottom: "12px" }}>Something went wrong</h2>
          <p style={{ color: "#64748b", marginBottom: "24px" }}>{this.state.error?.message || "An unexpected error occurred."}</p>
          <button
            style={{ padding: "10px 20px", background: "#1565c0", color: "#fff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
  <ErrorBoundary>
    <ToastProvider>
      <SettingsProvider>
        <App/>
      </SettingsProvider>
    </ToastProvider>
  </ErrorBoundary>
</React.StrictMode>
);
