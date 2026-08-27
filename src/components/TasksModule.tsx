import React, { useState, useEffect, useMemo } from "react";
import {
  ClipboardList, Plus, Download, CheckSquare, Clock, AlertTriangle,
  Calendar, Search, Filter, Trash2, Edit3, CheckCircle2, User,
  Bell, ArrowRight, ShieldAlert, HeartPulse, Egg, Wheat, Boxes, X, Save,
  ArrowLeft, RefreshCw
} from "lucide-react";
import { TaskItem, NotificationItem, Animal } from "../types";
import {
  getTasks, createTask, updateTask, deleteTask,
  getReminders, createReminder, deleteReminder
} from "../api";
import { useToast } from "./Toast";
import { SummaryCard } from "./SummaryCard";
import { exportToCsv } from "../utils/exportCsv";

function PriorityBadge({ priority }: { priority: string }) {
  const p = (priority || "").toLowerCase();
  if (p === "high") {
    return <span className="status sick" style={{ fontWeight: "700" }}>High</span>;
  }
  if (p === "medium") {
    return <span className="status pending">Medium</span>;
  }
  return <span className="status default">Low</span>;
}

export function TasksModule({
  animals = [],
  onAnimal,
  onNavigate,
}: {
  animals?: Animal[];
  onAnimal?: (a: Animal) => void;
  onNavigate?: (page: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"tasks" | "reminders">("tasks");
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");

  // Modals
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [addReminderOpen, setAddReminderOpen] = useState(false);

  const { showToast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      const [taskData, remData] = await Promise.all([
        getTasks(),
        getReminders(),
      ]);
      setTasks(Array.isArray(taskData) ? taskData : []);
      setReminders(Array.isArray(remData) ? remData : []);
    } catch (err: any) {
      showToast(`Error loading tasks: ${err.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterStatus === "Pending" && (t.status === "Completed")) return false;
      if (filterStatus === "Completed" && t.status !== "Completed") return false;
      if (filterStatus === "High" && t.priority !== "High") return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.target.toLowerCase().includes(q) ||
          t.assignedTo.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, filterStatus, search]);

  // Toggle task complete
  const handleToggleTask = async (task: TaskItem) => {
    const isCompleted = task.status === "Completed";
    const newStatus = isCompleted ? "Pending" : "Completed";
    const completionDate = isCompleted ? undefined : new Date().toISOString().split("T")[0];

    try {
      await updateTask(task.id, { status: newStatus as any, completionDate });
      showToast(`Task marked as ${newStatus}!`, "success");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Delete Task
  const handleDeleteTask = async (id: string) => {
    if (!window.confirm("Delete this scheduled task?")) return;
    try {
      await deleteTask(id);
      showToast("Task deleted.", "info");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Delete Reminder
  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteReminder(id);
      showToast("Reminder dismissed / resolved.", "info");
      loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`, "error");
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    if (activeTab === "tasks") {
      const headers = ["Task ID", "Title", "Target", "Due Date", "Priority", "Assigned Staff", "Status", "Completed Date"];
      const rows = tasks.map((t) => [
        t.id, t.title, t.target, t.dueDate, t.priority, t.assignedTo, t.status, t.completionDate || ""
      ]);
      exportToCsv("farm_tasks_schedule", headers, rows);
      showToast("Tasks schedule exported to CSV", "success");
    } else {
      const headers = ["Reminder ID", "Title", "Message", "Date", "Priority", "Target Animal / Module"];
      const rows = reminders.map((r) => [
        r.id, r.title, r.message, r.date, r.tone || "normal", r.targetPage || r.animalId || ""
      ]);
      exportToCsv("farm_automated_reminders", headers, rows);
      showToast("Reminders exported to CSV", "success");
    }
  };

  const pendingCount = tasks.filter((t) => t.status !== "Completed").length;
  const completedCount = tasks.filter((t) => t.status === "Completed").length;
  const highPriorityCount = tasks.filter((t) => t.priority === "High" && t.status !== "Completed").length;

  return (
    <div className="content" id="tasks-page">
      <div className="page-header module-page-header">
        <div>
          <h2 className="module-page-title">Farm Tasks & Reminders</h2>
          <p className="module-page-subtitle">Manage daily work, assignments, due dates, and important farm alerts</p>
        </div>
        <div className="page-actions module-header-actions">
          <button
            className="secondary"
            id="btn-return-dashboard-tasks"
            onClick={() => (onNavigate ? onNavigate("Dashboard") : (window.location.hash = "#Dashboard"))}
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={15} /> Return to Dashboard
          </button>
          <button
            className="secondary"
            id="btn-refresh-tasks"
            onClick={loadData}
            disabled={loading}
            title="Fetch latest tasks and alerts from database"
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button className="secondary" id="btn-export-tasks" onClick={handleExportCsv}>
            <Download size={15} /> Export CSV
          </button>
          <button className="secondary" id="btn-add-reminder" onClick={() => setAddReminderOpen(true)}>
            <Bell size={15} /> Add Custom Reminder
          </button>
          <button className="primary" id="btn-add-task" onClick={() => setAddTaskOpen(true)}>
            <Plus size={16} /> Schedule New Task
          </button>
        </div>
      </div>

      {/* 4 Professional Summary Cards */}
      <div className="summary-grid" id="tasks-summary-grid">
        <SummaryCard
          id="card-tasks-total"
          icon={<ClipboardList size={19} />}
          iconBg="#eff6ff"
          iconColor="#2563eb"
          label="Total Assigned Duties"
          value={`${tasks.length} Task${tasks.length === 1 ? "" : "s"}`}
          meta="All logged duty allocations"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("tasks");
            setFilterStatus("All");
          }}
        />
        <SummaryCard
          id="card-tasks-pending"
          icon={<Clock size={19} />}
          iconBg="#fffbeb"
          iconColor="#d97706"
          label="Pending Execution"
          value={`${pendingCount} Pending`}
          valueColor={pendingCount > 0 ? "#d97706" : undefined}
          meta="Awaiting staff execution"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("tasks");
            setFilterStatus("Pending");
          }}
        />
        <SummaryCard
          id="card-tasks-urgent"
          icon={<AlertTriangle size={19} />}
          iconBg="#fef2f2"
          iconColor="#dc2626"
          label="High Priority Urgent"
          value={`${highPriorityCount} Urgent`}
          valueColor={highPriorityCount > 0 ? "#dc2626" : undefined}
          meta="Critical priority items"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("tasks");
            setFilterStatus("High");
          }}
        />
        <SummaryCard
          id="card-tasks-completed"
          icon={<CheckCircle2 size={19} />}
          iconBg="#f0fdf4"
          iconColor="#16a34a"
          label="Completed Duties"
          value={`${completedCount} Done`}
          valueColor="#16a34a"
          meta="Executed & verified"
          loading={loading}
          clickable
          onClick={() => {
            setActiveTab("tasks");
            setFilterStatus("Completed");
          }}
        />
      </div>

      {/* Sub Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #e2e8f0", paddingBottom: "8px", marginTop: "8px" }}>
        <button
          className={activeTab === "tasks" ? "chip active" : "chip"}
          onClick={() => setActiveTab("tasks")}
        >
          <ClipboardList size={15} /> Farm Duties & Tasks ({tasks.length})
        </button>
        <button
          className={activeTab === "reminders" ? "chip active" : "chip"}
          onClick={() => setActiveTab("reminders")}
        >
          <Bell size={15} /> Automated Alerts & Reminders ({reminders.length})
        </button>
      </div>

      {/* 1. TASKS TAB */}
      {activeTab === "tasks" && (
        <div className="card" id="tasks-table-card">
          <div className="toolbar" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div className="search" style={{ minWidth: "220px" }}>
              <Search size={15} />
              <input
                placeholder="Search tasks, animal, staff..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="filter-row">
              {["All", "Pending", "High", "Completed"].map((st) => (
                <button
                  key={st}
                  className={filterStatus === st ? "chip active" : "chip"}
                  onClick={() => setFilterStatus(st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="table-wrap">
            {loading ? (
              <div style={{ padding: "30px", textAlign: "center", color: "#64748b" }}>Loading tasks from database...</div>
            ) : filteredTasks.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600", marginBottom: "6px" }}>No tasks available.</p>
                <p style={{ fontSize: "13px" }}>Click "Schedule New Task" to assign farm duties to personnel.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th style={{ width: "40px" }}>Done</th>
                    <th>Task Description</th>
                    <th>Target / Animal / Shed</th>
                    <th>Due Date</th>
                    <th>Priority</th>
                    <th>Assigned Staff</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((t) => {
                    const isDone = t.status === "Completed";
                    const foundAnimal = (animals || []).find((a) => a && t.target && (t.target.includes(a.id) || t.target.includes(a.name)));

                    return (
                      <tr key={t.id} style={{ opacity: isDone ? 0.65 : 1 }}>
                        <td>
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={() => handleToggleTask(t)}
                            style={{ cursor: "pointer", width: "16px", height: "16px" }}
                          />
                        </td>
                        <td>
                          <b style={{ textDecoration: isDone ? "line-through" : "none" }}>{t.title}</b>
                          {t.notes && <div style={{ fontSize: "11px", color: "#64748b" }}>{t.notes}</div>}
                        </td>
                        <td
                          className={foundAnimal ? "blue-text" : ""}
                          style={{ cursor: foundAnimal && onAnimal ? "pointer" : "default" }}
                          onClick={() => foundAnimal && onAnimal && onAnimal(foundAnimal)}
                        >
                          <b>{t.target}</b>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <Calendar size={13} color="#64748b" /> {t.dueDate}
                          </div>
                        </td>
                        <td><PriorityBadge priority={t.priority} /></td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <User size={13} color="#64748b" /> {t.assignedTo}
                          </div>
                        </td>
                        <td>
                          <span className={`status ${isDone ? "pregnant" : t.priority === "High" ? "sick" : "pending"}`}>
                            {t.status}
                          </span>
                        </td>
                        <td>
                          <button
                            className="icon-action-btn"
                            onClick={() => handleDeleteTask(t.id)}
                            title="Delete Task"
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* 2. REMINDERS & ALERTS TAB */}
      {activeTab === "reminders" && (
        <div className="card" id="reminders-feed-card">
          <div className="section-head">
            <div>
              <h3>Automated Herd Alerts & Smart Notifications</h3>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Auto-generated triggers for Pregnancy Diagnosis (PD), expected calvings, vaccination boosters, and milk withholding holds</p>
            </div>
            <button className="primary" onClick={() => setAddReminderOpen(true)}>
              <Plus size={15} /> Add Custom Reminder
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
            {reminders.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                <p style={{ fontSize: "15px", fontWeight: "600" }}>No active alerts or reminders.</p>
                <p style={{ fontSize: "13px" }}>All farm operations and animal schedules are up to date.</p>
              </div>
            ) : (
              reminders.map((r) => {
                const borderTone =
                  r.tone === "red" ? "#ef4444" : r.tone === "orange" ? "#f59e0b" : r.tone === "green" ? "#10b981" : "#3b82f6";
                const bgTone =
                  r.tone === "red" ? "#fef2f2" : r.tone === "orange" ? "#fffbeb" : r.tone === "green" ? "#f0fdf4" : "#eff6ff";

                const foundAnimal = (animals || []).find((a) => a && r.animalId && a.id.toLowerCase() === r.animalId.toLowerCase());

                return (
                  <div
                    key={r.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "14px 18px",
                      background: bgTone,
                      borderLeft: `4px solid ${borderTone}`,
                      borderRadius: "8px",
                      border: `1px solid ${borderTone}40`,
                    }}
                  >
                    <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
                      <div style={{ color: borderTone }}>
                        <Bell size={20} />
                      </div>
                      <div>
                        <div style={{ fontWeight: "700", color: "#0f172a", fontSize: "14px" }}>{r.title}</div>
                        <div style={{ fontSize: "13px", color: "#475569", marginTop: "2px" }}>{r.message}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>Date: {r.date}</div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      {foundAnimal && onAnimal && (
                        <button
                          className="secondary"
                          style={{ padding: "5px 10px", fontSize: "12px" }}
                          onClick={() => onAnimal(foundAnimal)}
                        >
                          View Animal <ArrowRight size={12} />
                        </button>
                      )}
                      <button
                        className="secondary"
                        style={{ padding: "5px 10px", fontSize: "12px", color: "#16a34a" }}
                        onClick={() => handleDeleteReminder(r.id)}
                        title="Dismiss Reminder"
                      >
                        <CheckCircle2 size={13} /> Dismiss
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {addTaskOpen && (
        <TaskFormModal
          isOpen={addTaskOpen}
          onClose={() => setAddTaskOpen(false)}
          animals={animals}
          onSave={async (data) => {
            try {
              await createTask(data);
              showToast(`Task "${data.title}" scheduled!`, "success");
              setAddTaskOpen(false);
              loadData();
            } catch (err: any) {
              showToast(`Error: ${err.message}`, "error");
            }
          }}
        />
      )}

      {/* Add Custom Reminder Modal */}
      {addReminderOpen && (
        <ReminderFormModal
          isOpen={addReminderOpen}
          onClose={() => setAddReminderOpen(false)}
          animals={animals}
          onSave={async (data) => {
            try {
              await createReminder(data);
              showToast(`Reminder "${data.title}" set!`, "success");
              setAddReminderOpen(false);
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

function TaskFormModal({
  isOpen,
  onClose,
  animals = [],
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals?: Animal[];
  onSave: (data: Partial<TaskItem>) => void;
}) {
  const [title, setTitle] = useState("");
  const [taskType, setTaskType] = useState<any>("Vaccination");
  const [target, setTarget] = useState(animals?.[0]?.id || "HF-027 (Bella)");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [priority, setPriority] = useState<any>("High");
  const [assignedTo, setAssignedTo] = useState("Dr. Imran (DVM)");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title: title || `${taskType} for ${target}`,
      taskType,
      target,
      dueDate,
      priority,
      assignedTo,
      notes,
      status: "Pending",
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Schedule Farm Task / Duty</h3>
            <p>Assign responsibilities for health treatments, breeding, or maintenance</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Task Title *</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Administer FMD booster shot"
                  required
                />
              </label>
              <label className="input-group">
                <span>Task Category *</span>
                <select value={taskType} onChange={(e) => setTaskType(e.target.value as any)}>
                  <option value="Vaccination">Vaccination Protocol</option>
                  <option value="AI">AI / Breeding Service</option>
                  <option value="Pregnancy Diagnosis">Pregnancy Diagnosis (PD)</option>
                  <option value="Dry-off">Dry-off Administration</option>
                  <option value="Expected Calving">Calving Watch</option>
                  <option value="Medicine">Medicine Course</option>
                  <option value="Deworming">Herd Deworming</option>
                  <option value="Hoof Trimming">Hoof Trimming</option>
                  <option value="Health Check">Routine Health Check</option>
                  <option value="General">General Maintenance / Cleaning</option>
                </select>
              </label>
              <label className="input-group">
                <span>Target Animal / Shed *</span>
                <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. HF-027 (Bella) or Shed A" required />
              </label>
              <label className="input-group">
                <span>Due Date *</span>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Priority Level *</span>
                <select value={priority} onChange={(e) => setPriority(e.target.value as any)}>
                  <option value="High">High / Urgent</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </label>
              <label className="input-group">
                <span>Assigned Staff / Veterinarian *</span>
                <input value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} required />
              </label>
            </div>

            <label className="input-group" style={{ marginTop: "12px" }}>
              <span>Additional Notes / Instructions</span>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Save size={16} /> Schedule Task
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReminderFormModal({
  isOpen,
  onClose,
  animals = [],
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  animals?: Animal[];
  onSave: (data: any) => void;
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [tone, setTone] = useState<any>("orange");
  const [animalId, setAnimalId] = useState(animals?.[0]?.id || "");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      message,
      date,
      tone,
      animalId,
    });
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Create Farm Reminder & Alert</h3>
            <p>Set a custom notification for management follow-ups</p>
          </div>
          <button className="modal-close" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="input-group">
                <span>Reminder Title *</span>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Check ultrasound PD" required />
              </label>
              <label className="input-group">
                <span>Target Date *</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </label>
              <label className="input-group">
                <span>Alert Severity</span>
                <select value={tone} onChange={(e) => setTone(e.target.value)}>
                  <option value="red">High Alert (Red)</option>
                  <option value="orange">Warning / Attention (Orange)</option>
                  <option value="blue">Information (Blue)</option>
                  <option value="green">Routine Check (Green)</option>
                </select>
              </label>
              <label className="input-group">
                <span>Related Animal (Optional)</span>
                <select value={animalId} onChange={(e) => setAnimalId(e.target.value)}>
                  <option value="">None / General Farm</option>
                  {animals.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.id} - {a.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="input-group" style={{ marginTop: "12px" }}>
              <span>Alert Message / Description *</span>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} required />
            </label>

            <div className="form-actions">
              <button type="button" className="secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary">
                <Save size={16} /> Save Reminder
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
