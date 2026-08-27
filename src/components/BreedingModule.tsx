import React, { useState, useEffect, useMemo } from "react";
import {
  Activity,
  ArrowLeft,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Egg,
  Eye,
  FileText,
  Filter,
  Flame,
  HeartPulse,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Syringe,
  Trash2,
  X,
  AlertCircle,
  Check,
  ChevronRight
} from "lucide-react";
import { Animal, BreedingEvent } from "../types";
import {
  getBreedingEvents,
  createBreedingEvent,
  updateBreedingEvent,
  deleteBreedingEvent,
  getBreedingTimeline,
  recordHeatEvent,
  recordAiEvent,
  recordPdEvent,
  getBreedingSettings,
  updateBreedingSettings,
  createCalvingRecord
} from "../api";
import {
  AddBreedingModal,
  RecordHeatModal,
  RecordAiModal,
  RecordPdModal,
  BreedingSettingsModal,
  AddCalvingModal
} from "./Modals";
import { ReproductiveLifecycleTracker } from "./ReproductiveLifecycleTracker";
import { useToast } from "./Toast";
import { exportToCsv } from "../utils/exportCsv";

interface BreedingModuleProps {
  animals: Animal[];
  onAnimal?: (a: Animal) => void;
  onNavigate?: (page: string) => void;
}

type BreedingSubView =
  | "main"
  | "animal-details"
  | "lifecycle-tracker"
  | "timeline"
  | "event-details";

export function BreedingModule({ animals, onAnimal, onNavigate }: BreedingModuleProps) {
  const [subView, setSubView] = useState<BreedingSubView>("main");
  const [events, setEvents] = useState<BreedingEvent[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Selected animal for dedicated detail page / tracker
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>("");
  const [selectedEventDetail, setSelectedEventDetail] = useState<{
    type: "Heat" | "AI" | "PD" | "Calving";
    data: any;
  } | null>(null);

  // Breeding Protocol Settings
  const [settings, setSettings] = useState({
    gestationPeriodDays: 280,
    pdCheckDays: 35,
    heatToAiHours: 12,
  });

  // Filters (preserved across navigation)
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [animalFilter, setAnimalFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<BreedingEvent | null>(null);
  const [modalAnimalId, setModalAnimalId] = useState<string | undefined>(undefined);

  const [heatModalOpen, setHeatModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [pdModalOpen, setPdModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [calvingModalOpen, setCalvingModalOpen] = useState(false);

  const { showToast } = useToast();

  const fetchBreedingData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [breedingData, timelineData, settingsData] = await Promise.all([
        getBreedingEvents(),
        getBreedingTimeline(),
        getBreedingSettings().catch(() => null),
      ]);

      if (Array.isArray(breedingData)) {
        setEvents(breedingData);
        if (breedingData.length > 0 && !selectedAnimalId) {
          setSelectedAnimalId(breedingData[0].animalId || animals[0]?.id || "");
        }
      } else {
        setEvents([]);
      }

      if (Array.isArray(timelineData)) {
        setTimelineEvents(timelineData);
      } else {
        setTimelineEvents([]);
      }

      if (settingsData) {
        setSettings({
          gestationPeriodDays: settingsData.gestationPeriodDays || 280,
          pdCheckDays: settingsData.pdCheckDays || 35,
          heatToAiHours: settingsData.heatToAiHours || 12,
        });
      }

      if (isManualRefresh) {
        showToast("Breeding records synchronized with database.", "success");
      }
    } catch (err: any) {
      console.error("Failed to load breeding records:", err);
      setError("Unable to load breeding records. Please try again.");
      showToast(`Database error: ${err.message || "Failed to load breeding records"}`, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBreedingData();
  }, []);

  // Save new or updated breeding record
  const handleSaveBreeding = async (data: Partial<BreedingEvent>) => {
    try {
      if (data.id) {
        await updateBreedingEvent(data.id, data);
        showToast(`Breeding record updated successfully!`, "success");
      } else {
        await createBreedingEvent(data);
        showToast(`New breeding record saved to database!`, "success");
      }
      await fetchBreedingData();
      setModalOpen(false);
      setEditingEvent(null);
    } catch (e: any) {
      showToast(`Failed to save breeding record: ${e.message}`, "error");
      throw e;
    }
  };

  const handleSaveHeat = async (data: any) => {
    try {
      await recordHeatEvent(data);
      showToast(`Heat observation recorded for ${data.animalId}.`, "success");
      await fetchBreedingData();
      setHeatModalOpen(false);
    } catch (e: any) {
      showToast(`Failed to log heat event: ${e.message}`, "error");
      throw e;
    }
  };

  const handleSaveAi = async (data: any) => {
    try {
      await recordAiEvent(data);
      showToast(`Artificial Insemination recorded for ${data.animalId}.`, "success");
      await fetchBreedingData();
      setAiModalOpen(false);
    } catch (e: any) {
      showToast(`Failed to record AI: ${e.message}`, "error");
      throw e;
    }
  };

  const handleSavePd = async (data: any) => {
    try {
      await recordPdEvent(data);
      showToast(`Pregnancy diagnosis (${data.result}) logged for ${data.animalId}.`, "success");
      await fetchBreedingData();
      setPdModalOpen(false);
    } catch (e: any) {
      showToast(`Failed to record PD: ${e.message}`, "error");
      throw e;
    }
  };

  const handleSaveCalving = async (data: any) => {
    try {
      await createCalvingRecord(data);
      showToast(`Calving event recorded successfully!`, "success");
      await fetchBreedingData();
      setCalvingModalOpen(false);
    } catch (e: any) {
      showToast(`Failed to record calving: ${e.message}`, "error");
      throw e;
    }
  };

  const handleSaveSettings = async (newSettings: any) => {
    try {
      const saved = await updateBreedingSettings(newSettings);
      setSettings(saved);
      showToast(`Reproductive protocols updated!`, "success");
      await fetchBreedingData();
      setSettingsModalOpen(false);
    } catch (e: any) {
      showToast(`Failed to save settings: ${e.message}`, "error");
      throw e;
    }
  };

  const handleDeleteBreeding = async (id: string, animalLabel: string) => {
    if (!confirm(`Are you sure you want to delete the breeding record for ${animalLabel}?`)) {
      return;
    }
    try {
      await deleteBreedingEvent(id);
      showToast(`Breeding record deleted successfully.`, "success");
      await fetchBreedingData();
    } catch (e: any) {
      showToast(`Error deleting breeding record: ${e.message}`, "error");
    }
  };

  // Filtered reproduction records
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (animalFilter !== "All" && (ev.animalId || "").toLowerCase() !== animalFilter.toLowerCase()) {
        return false;
      }
      if (statusFilter !== "All") {
        if (statusFilter === "Positive" && ev.result !== "Positive") return false;
        if (statusFilter === "Pending" && ev.result !== "Pending") return false;
        if (statusFilter === "Negative" && ev.result !== "Negative") return false;
        if (statusFilter === "Suspicious" && ev.result !== "Suspicious") return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const animalName = (ev.animal || "").toLowerCase();
        const animalId = (ev.animalId || "").toLowerCase();
        const bull = (ev.semenBull || "").toLowerCase();
        const tech = (ev.technician || "").toLowerCase();
        const notes = (ev.notes || "").toLowerCase();
        if (
          !animalName.includes(q) &&
          !animalId.includes(q) &&
          !bull.includes(q) &&
          !tech.includes(q) &&
          !notes.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [events, animalFilter, statusFilter, searchQuery]);

  // Export CSV of currently filtered active records
  const handleExportCsv = () => {
    const dataToExport = filteredEvents.length > 0 ? filteredEvents : events;
    const headers = [
      "Record ID",
      "Animal Code",
      "Animal Name",
      "Heat Observed",
      "AI Date",
      "Pregnancy Check (PD)",
      "Expected Calving",
      "Bull / Semen",
      "Technician",
      "PD Status",
      "Actual Calving",
      "Notes",
    ];

    const rows = dataToExport.map((ev) => {
      const found = animals.find(
        (a) =>
          (ev.animalId && a.id.toLowerCase() === ev.animalId.toLowerCase()) ||
          ev.animal.toLowerCase().includes(a.id.toLowerCase())
      );
      return [
        ev.id,
        ev.animalId || (found ? found.id : ""),
        found ? found.name : ev.animal,
        ev.heatDate || "—",
        ev.aiDate || "—",
        ev.pdDate || (ev.aiDate ? "Scheduled" : "—"),
        ev.expectedCalving || (ev.aiDate ? "Calculating" : "—"),
        ev.semenBull || "—",
        ev.technician || "—",
        ev.result || "Pending",
        ev.actualCalving || "—",
        ev.notes || "",
      ];
    });

    exportToCsv("active_reproduction_events", headers, rows);
    showToast(`Exported ${rows.length} records to CSV`, "success");
  };

  // Selected animal object for Detail page / Tracker
  const selectedAnimalObj = useMemo(() => {
    return (
      animals.find((a) => a.id.toLowerCase() === selectedAnimalId.toLowerCase()) ||
      animals[0] ||
      null
    );
  }, [animals, selectedAnimalId]);

  // Active breeding event for selected animal
  const currentAnimalBreedingEvent = useMemo(() => {
    if (!selectedAnimalObj) return null;
    const matches = events.filter(
      (e) =>
        (e.animalId && e.animalId.toLowerCase() === selectedAnimalObj.id.toLowerCase()) ||
        e.animal.toLowerCase().includes(selectedAnimalObj.id.toLowerCase()) ||
        e.animal.toLowerCase().includes(selectedAnimalObj.name.toLowerCase())
    );
    matches.sort((a, b) => {
      const dateA = a.aiDate || a.heatDate || "";
      const dateB = b.aiDate || b.heatDate || "";
      return dateB.localeCompare(dateA);
    });
    return matches[0] || null;
  }, [events, selectedAnimalObj]);

  // All events for selected animal
  const allEventsForSelectedAnimal = useMemo(() => {
    if (!selectedAnimalObj) return [];
    return events.filter(
      (e) =>
        (e.animalId && e.animalId.toLowerCase() === selectedAnimalObj.id.toLowerCase()) ||
        e.animal.toLowerCase().includes(selectedAnimalObj.id.toLowerCase()) ||
        e.animal.toLowerCase().includes(selectedAnimalObj.name.toLowerCase())
    );
  }, [events, selectedAnimalObj]);

  // Helper calculations for Gestation status
  const gestationStats = useMemo(() => {
    const ev = currentAnimalBreedingEvent;
    if (!ev || !ev.aiDate) {
      return {
        aiDate: ev?.aiDate || "—",
        gestationDays: 0,
        expectedCalvingDate: ev?.expectedCalving || "—",
        daysRemaining: 0,
        statusText: "Awaiting Insemination",
        isCalved: Boolean(ev?.actualCalving),
        actualCalving: ev?.actualCalving || null,
        badgeTone: "muted",
      };
    }

    const now = new Date();
    const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());

    const [aiY, aiM, aiD] = ev.aiDate.split("-").map(Number);
    const aiUtc = Date.UTC(aiY, aiM - 1, aiD);
    const gestationDays = Math.max(0, Math.floor((todayUtc - aiUtc) / (1000 * 60 * 60 * 24)));

    let expectedCalvingDate = ev.expectedCalving;
    if (!expectedCalvingDate) {
      const d = new Date(ev.aiDate);
      d.setDate(d.getDate() + (settings.gestationPeriodDays || 280));
      expectedCalvingDate = d.toISOString().split("T")[0];
    }

    const isCalved = Boolean(ev.actualCalving);
    let daysRemaining = 0;
    let statusText = "Calculating";
    let badgeTone = "blue";

    if (isCalved) {
      statusText = `Calved on ${ev.actualCalving}`;
      badgeTone = "green";
    } else if (expectedCalvingDate) {
      const [expY, expM, expD] = expectedCalvingDate.split("-").map(Number);
      const expUtc = Date.UTC(expY, expM - 1, expD);
      const diffRemaining = Math.floor((expUtc - todayUtc) / (1000 * 60 * 60 * 24));

      if (diffRemaining > 0) {
        daysRemaining = diffRemaining;
        statusText = `${diffRemaining} days remaining`;
        badgeTone = "blue";
      } else if (diffRemaining === 0) {
        daysRemaining = 0;
        statusText = "Due today";
        badgeTone = "orange";
      } else {
        const overdue = Math.abs(diffRemaining);
        daysRemaining = 0;
        statusText = `${overdue} days overdue`;
        badgeTone = "red";
      }
    }

    return {
      aiDate: ev.aiDate,
      gestationDays,
      expectedCalvingDate,
      daysRemaining,
      statusText,
      isCalved,
      actualCalving: ev.actualCalving || null,
      badgeTone,
    };
  }, [currentAnimalBreedingEvent, settings]);

  const openAnimalBreedingDetails = (animalId: string) => {
    setSelectedAnimalId(animalId);
    setSubView("animal-details");
  };

  /* =========================================================================
     SUBVIEW 2: DEDICATED ANIMAL BREEDING DETAILS PAGE
     ========================================================================= */
  if (subView === "animal-details" && selectedAnimalObj) {
    const ev = currentAnimalBreedingEvent;

    return (
      <div className="content" id="animal-breeding-details-page">
        <div style={{ marginBottom: "14px" }}>
          <button
            className="back-link"
            id="btn-back-to-breeding"
            onClick={() => setSubView("main")}
            style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} /> Back to Breeding
          </button>
        </div>

        {/* Page Header */}
        <div className="page-title" style={{ marginBottom: "20px" }}>
          <div>
            <span className="breadcrumb">Farm / Breeding</span>
            <h2 style={{ margin: "4px 0 2px 0" }}>Animal Breeding Details</h2>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--primary)" }}>
                {selectedAnimalObj.id} · {selectedAnimalObj.name}
              </span>
              <span style={{ color: "var(--muted)", fontSize: "13px" }}>
                Breed: <b>{selectedAnimalObj.breed}</b> · Status: <b>{selectedAnimalObj.status}</b> · Ear Tag: <b>{selectedAnimalObj.earTag}</b>
              </span>
            </div>
          </div>
          <div className="actions" style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              className="primary"
              id="btn-open-live-tracker"
              onClick={() => setSubView("lifecycle-tracker")}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Activity size={16} /> Live Reproductive Lifecycle Tracker
            </button>
            <button
              className="secondary"
              id="btn-record-event-from-details"
              onClick={() => {
                setEditingEvent(null);
                setModalAnimalId(selectedAnimalObj.id);
                setModalOpen(true);
              }}
            >
              <Plus size={15} /> New Record
            </button>
          </div>
        </div>

        {/* CURRENT REPRODUCTIVE STATUS SUMMARY CARD */}
        <section
          className="card"
          id="animal-current-reproductive-status"
          style={{
            marginBottom: "20px",
            padding: "20px",
            background: "#ffffff",
            border: "1px solid var(--border)",
            borderRadius: "12px",
          }}
        >
          <div className="section-head" style={{ marginBottom: "14px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700 }}>Current Reproductive Status</h3>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "12px",
                background:
                  gestationStats.isCalved
                    ? "#d1fae5"
                    : ev?.result === "Positive"
                    ? "#dcfce7"
                    : ev?.result === "Negative"
                    ? "#fee2e2"
                    : ev?.aiDate
                    ? "#e0f2fe"
                    : "#f1f5f9",
                color:
                  gestationStats.isCalved
                    ? "#065f46"
                    : ev?.result === "Positive"
                    ? "#15803d"
                    : ev?.result === "Negative"
                    ? "#b91c1c"
                    : ev?.aiDate
                    ? "#0369a1"
                    : "#64748b",
                border: "1px solid currentColor",
              }}
            >
              {gestationStats.isCalved
                ? "✓ Calved & Delivered"
                : ev?.result === "Positive"
                ? "✓ Confirmed Pregnant"
                : ev?.result === "Negative"
                ? "✗ Open / Negative"
                : ev?.result === "Suspicious"
                ? "⚠️ Suspicious"
                : ev?.aiDate
                ? "⏳ Inseminated / Pending PD"
                : ev?.heatDate
                ? "🔥 Heat Observed"
                : "No Active Record"}
            </span>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
              background: "#f8fafc",
              padding: "16px",
              borderRadius: "10px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Insemination Date
              </span>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>
                {ev?.aiDate || "—"}
              </div>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                {ev?.semenBull ? `Bull: ${ev.semenBull}` : "No straw logged"}
              </small>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Pregnancy Check (PD)
              </span>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>
                {ev?.pdDate || (ev?.aiDate ? "Scheduled" : "—")}
              </div>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                Status: <b>{ev?.result || (ev?.aiDate ? "Pending" : "—")}</b>
              </small>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Expected Calving
              </span>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "var(--primary)", marginTop: "2px" }}>
                {gestationStats.expectedCalvingDate || "—"}
              </div>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                Protocol: {settings.gestationPeriodDays} days gestation
              </small>
            </div>

            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", fontWeight: 600 }}>
                Gestation Progress / Status
              </span>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: gestationStats.badgeTone === "red" ? "#dc2626" : "#1e293b",
                  marginTop: "2px",
                }}
              >
                {gestationStats.statusText}
              </div>
              <small style={{ color: "var(--muted)", fontSize: "11px" }}>
                {gestationStats.gestationDays > 0 ? `${gestationStats.gestationDays} days elapsed` : "Not in gestation"}
              </small>
            </div>
          </div>
        </section>

        {/* 4 DETAILED REPRODUCTIVE SECTIONS GRID */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "18px",
            marginBottom: "20px",
          }}
        >
          {/* 1. HEAT / ESTRUS SECTION */}
          <section
            className="card"
            id="section-heat-details"
            style={{
              padding: "18px",
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "#fef3c7",
                      color: "#b45309",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Flame size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Heat / Estrus</h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: ev?.heatDate ? "#dcfce7" : "#f1f5f9",
                    color: ev?.heatDate ? "#15803d" : "#64748b",
                  }}
                >
                  {ev?.heatDate ? "Observed" : "None"}
                </span>
              </div>

              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", color: "#334155" }}>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Observation Date</span>
                  <b>{ev?.heatDate || "—"}</b>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Heat Sign</span>
                  <b>{ev?.heatSigns || (ev?.heatDate ? "Standing Heat" : "—")}</b>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Detection Method</span>
                  <span>{ev?.heatMethod || "Visual Inspection"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Recorded By</span>
                  <span>{ev?.technician || "Staff / Inseminator"}</span>
                </div>
                {ev?.notes && (
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Notes</span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{ev.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <button
                className="secondary sm"
                id="btn-record-heat-details"
                onClick={() => setHeatModalOpen(true)}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Flame size={14} /> {ev?.heatDate ? "Update Heat" : "Record Heat"}
              </button>
              {ev?.heatDate && (
                <button
                  className="secondary sm"
                  onClick={() => {
                    setSelectedEventDetail({ type: "Heat", data: ev });
                    setSubView("event-details");
                  }}
                  title="View full event log"
                >
                  <Eye size={14} />
                </button>
              )}
            </div>
          </section>

          {/* 2. ARTIFICIAL INSEMINATION SECTION */}
          <section
            className="card"
            id="section-ai-details"
            style={{
              padding: "18px",
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "#e0f2fe",
                      color: "#0369a1",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Syringe size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Artificial Insemination</h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: ev?.aiDate ? "#e0f2fe" : "#f1f5f9",
                    color: ev?.aiDate ? "#0369a1" : "#64748b",
                  }}
                >
                  {ev?.aiDate ? `Service #${ev.servicesCount || 1}` : "Pending"}
                </span>
              </div>

              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", color: "#334155" }}>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>AI Date</span>
                  <b>{ev?.aiDate || "—"}</b>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Bull / Semen Straw</span>
                  <b>{ev?.semenBull || "—"}</b>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Technician / Officer</span>
                  <span>{ev?.technician || "—"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Breeding Method</span>
                  <span>{ev?.breedingMethod || "Artificial Insemination (AI)"}</span>
                </div>
                {ev?.notes && (
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Straw / Batch Notes</span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>{ev.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <button
                className="secondary sm"
                id="btn-record-ai-details"
                onClick={() => setAiModalOpen(true)}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Syringe size={14} /> {ev?.aiDate ? "Update AI" : "Record AI"}
              </button>
              {ev?.aiDate && (
                <button
                  className="secondary sm"
                  onClick={() => {
                    setSelectedEventDetail({ type: "AI", data: ev });
                    setSubView("event-details");
                  }}
                  title="View full AI log"
                >
                  <Eye size={14} />
                </button>
              )}
            </div>
          </section>

          {/* 3. PREGNANCY DIAGNOSIS SECTION */}
          <section
            className="card"
            id="section-pd-details"
            style={{
              padding: "18px",
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "#f3e8ff",
                      color: "#7e22ce",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <HeartPulse size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Pregnancy Diagnosis</h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background:
                      ev?.result === "Positive"
                        ? "#dcfce7"
                        : ev?.result === "Negative"
                        ? "#fee2e2"
                        : "#f1f5f9",
                    color:
                      ev?.result === "Positive"
                        ? "#15803d"
                        : ev?.result === "Negative"
                        ? "#b91c1c"
                        : "#64748b",
                  }}
                >
                  {ev?.result || (ev?.aiDate ? "Pending Check" : "—")}
                </span>
              </div>

              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", color: "#334155" }}>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Diagnosis Date</span>
                  <b>{ev?.pdDate || (ev?.aiDate ? "Scheduled (~35d)" : "—")}</b>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Result</span>
                  <b>{ev?.result || "Pending Examination"}</b>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Method</span>
                  <span>{ev?.pdMethod || "Transrectal Ultrasound / Palpation"}</span>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Veterinarian</span>
                  <span>{ev?.technician || "Dr. Imran (Vet)"}</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <button
                className="secondary sm"
                id="btn-record-pd-details"
                onClick={() => setPdModalOpen(true)}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <HeartPulse size={14} /> {ev?.pdDate ? "Update Diagnosis" : "Record PD Result"}
              </button>
              {ev?.pdDate && (
                <button
                  className="secondary sm"
                  onClick={() => {
                    setSelectedEventDetail({ type: "PD", data: ev });
                    setSubView("event-details");
                  }}
                  title="View full PD log"
                >
                  <Eye size={14} />
                </button>
              )}
            </div>
          </section>

          {/* 4. EXPECTED CALVING SECTION */}
          <section
            className="card"
            id="section-calving-details"
            style={{
              padding: "18px",
              background: "#ffffff",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "#ede9fe",
                      color: "#6d28d9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 700 }}>Expected Calving</h3>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "10px",
                    background: gestationStats.isCalved ? "#d1fae5" : "#ede9fe",
                    color: gestationStats.isCalved ? "#065f46" : "#6d28d9",
                  }}
                >
                  {gestationStats.isCalved ? "✓ Calved" : `~${settings.gestationPeriodDays}d Gestation`}
                </span>
              </div>

              <div style={{ fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", color: "#334155" }}>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Expected Delivery</span>
                  <b>{gestationStats.expectedCalvingDate || "—"}</b>
                </div>
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Countdown / Status</span>
                  <b style={{ color: gestationStats.badgeTone === "red" ? "#dc2626" : "inherit" }}>
                    {gestationStats.statusText}
                  </b>
                </div>
                {gestationStats.actualCalving && (
                  <div>
                    <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Actual Calving Date</span>
                    <b style={{ color: "#166534" }}>{gestationStats.actualCalving}</b>
                  </div>
                )}
                <div>
                  <span style={{ color: "var(--muted)", display: "block", fontSize: "11px" }}>Gestation Protocol</span>
                  <span>Configured {settings.gestationPeriodDays} days bovine cycle</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
              <button
                className="secondary sm"
                id="btn-record-calving-details"
                onClick={() => setCalvingModalOpen(true)}
                style={{ flex: 1, justifyContent: "center" }}
              >
                <Plus size={14} /> {gestationStats.isCalved ? "Record Another Calving" : "Record Calving"}
              </button>
              {gestationStats.actualCalving && (
                <button
                  className="secondary sm"
                  onClick={() => {
                    setSelectedEventDetail({ type: "Calving", data: ev });
                    setSubView("event-details");
                  }}
                  title="View full Calving log"
                >
                  <Eye size={14} />
                </button>
              )}
            </div>
          </section>
        </div>

        {/* ANIMAL BREEDING HISTORY TABLE */}
        <section className="card" id="animal-breeding-history-table">
          <div className="section-head">
            <h3>Reproductive History & Past Services ({selectedAnimalObj.id})</h3>
            <span className="trend">{allEventsForSelectedAnimal.length} Recorded Cycles</span>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Cycle ID</th>
                  <th>Heat Date</th>
                  <th>AI Date</th>
                  <th>Semen / Bull</th>
                  <th>PD Date</th>
                  <th>PD Result</th>
                  <th>Expected Calving</th>
                  <th>Actual Calving</th>
                  <th>Technician</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {allEventsForSelectedAnimal.map((row) => (
                  <tr key={row.id}>
                    <td><b>{row.id}</b></td>
                    <td>{row.heatDate || "—"}</td>
                    <td>{row.aiDate || "—"}</td>
                    <td>{row.semenBull || "—"}</td>
                    <td>{row.pdDate || "—"}</td>
                    <td>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "10px",
                          background:
                            row.result === "Positive"
                              ? "#dcfce7"
                              : row.result === "Negative"
                              ? "#fee2e2"
                              : "#f1f5f9",
                          color:
                            row.result === "Positive"
                              ? "#15803d"
                              : row.result === "Negative"
                              ? "#b91c1c"
                              : "#64748b",
                        }}
                      >
                        {row.result || "Pending"}
                      </span>
                    </td>
                    <td>{row.expectedCalving || "—"}</td>
                    <td>{row.actualCalving ? <b style={{ color: "#166534" }}>{row.actualCalving}</b> : "—"}</td>
                    <td>{row.technician || "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="secondary sm"
                        onClick={() => {
                          setEditingEvent(row);
                          setModalOpen(true);
                        }}
                        style={{ padding: "4px 8px" }}
                      >
                        <Pencil size={13} />
                      </button>
                    </td>
                  </tr>
                ))}

                {allEventsForSelectedAnimal.length === 0 && (
                  <tr>
                    <td colSpan={10} style={{ textAlign: "center", padding: "30px", color: "var(--muted)" }}>
                      No prior breeding cycles logged for {selectedAnimalObj.name}.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================================
     SUBVIEW 3: DEDICATED LIVE REPRODUCTIVE LIFECYCLE TRACKER PAGE
     ========================================================================= */
  if (subView === "lifecycle-tracker" && selectedAnimalObj) {
    return (
      <div className="content" id="live-reproductive-lifecycle-tracker-page">
        <div style={{ marginBottom: "14px" }}>
          <button
            className="back-link"
            id="btn-back-from-tracker"
            onClick={() => setSubView("animal-details")}
            style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} /> Back to Animal Breeding Details
          </button>
        </div>

        <div className="page-title" style={{ marginBottom: "20px" }}>
          <div>
            <span className="breadcrumb">Farm / Breeding / Lifecycle Tracker</span>
            <h2 style={{ margin: "4px 0 2px 0" }}>Live Reproductive Lifecycle Tracker</h2>
            <p style={{ margin: "2px 0 0 0", color: "var(--muted)" }}>
              Active biological progression for <b>{selectedAnimalObj.id} · {selectedAnimalObj.name}</b> ({selectedAnimalObj.breed})
            </p>
          </div>
          <div className="actions" style={{ display: "flex", gap: "10px" }}>
            <button
              className="secondary"
              onClick={() => setSettingsModalOpen(true)}
              title="Configure protocols"
            >
              <SlidersHorizontal size={15} /> Protocols ({settings.gestationPeriodDays}d Gestation)
            </button>
            <button
              className="secondary"
              onClick={() => fetchBreedingData(true)}
              disabled={refreshing || loading}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} /> Sync
            </button>
          </div>
        </div>

        {/* FULL INTERACTIVE TRACKER COMPONENT */}
        <ReproductiveLifecycleTracker
          animals={animals}
          selectedAnimalId={selectedAnimalObj.id}
          onSelectAnimal={(id) => setSelectedAnimalId(id)}
        />
      </div>
    );
  }

  /* =========================================================================
     SUBVIEW 4: DEDICATED BREEDING TIMELINE PAGE
     ========================================================================= */
  if (subView === "timeline") {
    return (
      <div className="content" id="breeding-timeline-page">
        <div style={{ marginBottom: "14px" }}>
          <button
            className="back-link"
            id="btn-back-from-timeline"
            onClick={() => setSubView("main")}
            style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} /> Back to Breeding
          </button>
        </div>

        <div className="page-title" style={{ marginBottom: "20px" }}>
          <div>
            <span className="breadcrumb">Farm / Breeding / Timeline</span>
            <h2 style={{ margin: "4px 0 2px 0" }}>Breeding Timeline</h2>
            <p style={{ margin: "2px 0 0 0", color: "var(--muted)" }}>
              Chronological sequence of heat observations, inseminations, pregnancy checks & calving events
            </p>
          </div>
          <div className="actions" style={{ display: "flex", gap: "10px" }}>
            <button className="secondary" onClick={handleExportCsv}>
              <Download size={15} /> Export CSV
            </button>
            <button
              className="primary"
              onClick={() => {
                setEditingEvent(null);
                setModalAnimalId(undefined);
                setModalOpen(true);
              }}
            >
              <Plus size={16} /> New Breeding Record
            </button>
          </div>
        </div>

        <section className="card" id="timeline-feed-card" style={{ padding: "20px" }}>
          {timelineEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--muted)" }}>
              <CalendarDays size={36} style={{ color: "#94a3b8", margin: "0 auto 10px auto" }} />
              <h4 style={{ margin: "0 0 6px 0", color: "#334155" }}>No timeline events logged</h4>
              <p style={{ fontSize: "13px", color: "#64748b" }}>
                Add new heat observations or insemination records to build the interactive lifecycle timeline.
              </p>
            </div>
          ) : (
            <div className="timeline-feed" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {timelineEvents.map((item) => {
                const foundAnimal = animals.find(
                  (a) =>
                    (item.animalId && a.id.toLowerCase() === item.animalId.toLowerCase()) ||
                    (item.animalName && item.animalName.toLowerCase().includes(a.id.toLowerCase()))
                );

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#f8fafc",
                      padding: "14px 18px",
                      borderRadius: "10px",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: 700,
                            background:
                              item.type === "Heat Observed"
                                ? "#fef3c7"
                                : item.type === "AI Performed"
                                ? "#e0f2fe"
                                : item.type === "Pregnancy Diagnosis"
                                ? item.result === "Positive"
                                  ? "#dcfce7"
                                  : "#fee2e2"
                                : "#f3e8ff",
                            color:
                              item.type === "Heat Observed"
                                ? "#b45309"
                                : item.type === "AI Performed"
                                ? "#0369a1"
                                : item.type === "Pregnancy Diagnosis"
                                ? item.result === "Positive"
                                  ? "#15803d"
                                  : "#b91c1c"
                                : "#7e22ce",
                          }}
                        >
                          {item.stage || item.type}
                        </span>
                        <b style={{ fontSize: "14px", color: "#1e293b" }}>{item.title}</b>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--muted)", fontWeight: 600 }}>
                        <Clock size={13} style={{ display: "inline", marginRight: "4px", verticalAlign: "-2px" }} />
                        {item.date}
                      </span>
                    </div>

                    <p style={{ margin: 0, fontSize: "13px", color: "#475569" }}>{item.description}</p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px", fontSize: "12px" }}>
                      <span
                        className="blue-text"
                        style={{ cursor: foundAnimal ? "pointer" : "default", fontWeight: 600 }}
                        onClick={() => {
                          if (foundAnimal) openAnimalBreedingDetails(foundAnimal.id);
                        }}
                      >
                        {foundAnimal ? `View Animal Details (${foundAnimal.id} · ${foundAnimal.name}) →` : item.animalName}
                      </span>
                      <span style={{ color: "var(--muted)" }}>
                        Technician / Officer: <b>{item.technician || "Staff"}</b>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  }

  /* =========================================================================
     SUBVIEW 5: INDIVIDUAL EVENT DETAILS PAGE
     ========================================================================= */
  if (subView === "event-details" && selectedEventDetail && selectedAnimalObj) {
    const { type, data } = selectedEventDetail;

    return (
      <div className="content" id="breeding-event-detail-page">
        <div style={{ marginBottom: "14px" }}>
          <button
            className="back-link"
            id="btn-back-from-event-detail"
            onClick={() => setSubView("animal-details")}
            style={{ margin: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <ArrowLeft size={16} /> Back to Animal Breeding Details
          </button>
        </div>

        <div className="page-title" style={{ marginBottom: "20px" }}>
          <div>
            <span className="breadcrumb">Farm / Breeding / Event Details</span>
            <h2 style={{ margin: "4px 0 2px 0" }}>{type} Record Details</h2>
            <p style={{ margin: "2px 0 0 0", color: "var(--muted)" }}>
              Animal: <b>{selectedAnimalObj.id} · {selectedAnimalObj.name}</b> ({selectedAnimalObj.breed})
            </p>
          </div>
        </div>

        <section className="card" style={{ padding: "24px", maxWidth: "700px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", borderBottom: "1px solid var(--border)", paddingBottom: "10px" }}>
            {type} Event Summary
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Record ID</span>
              <b>{data.id || "N/A"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Animal Code & Name</span>
              <b>{selectedAnimalObj.id} ({selectedAnimalObj.name})</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="text-muted">Event Date</span>
              <b>
                {type === "Heat"
                  ? data.heatDate
                  : type === "AI"
                  ? data.aiDate
                  : type === "PD"
                  ? data.pdDate
                  : data.actualCalving || "—"}
              </b>
            </div>
            {type === "Heat" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Heat Signs</span>
                  <b>{data.heatSigns || "Standing Heat"}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Detection Method</span>
                  <b>{data.heatMethod || "Visual Inspection"}</b>
                </div>
              </>
            )}
            {type === "AI" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Bull / Semen Straw</span>
                  <b>{data.semenBull || "—"}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Inseminator / Tech</span>
                  <b>{data.technician || "—"}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Service Number</span>
                  <b>#{data.servicesCount || 1}</b>
                </div>
              </>
            )}
            {type === "PD" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Diagnosis Result</span>
                  <b style={{ color: data.result === "Positive" ? "#15803d" : "#b91c1c" }}>{data.result || "Pending"}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Examination Method</span>
                  <b>{data.pdMethod || "Transrectal Ultrasound"}</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Veterinarian</span>
                  <b>{data.technician || "Dr. Imran"}</b>
                </div>
              </>
            )}
            {type === "Calving" && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Calving Status</span>
                  <b style={{ color: "#166534" }}>Delivered</b>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span className="text-muted">Delivery Date</span>
                  <b>{data.actualCalving || "—"}</b>
                </div>
              </>
            )}
            {data.notes && (
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                <span className="text-muted" style={{ display: "block", marginBottom: "4px" }}>Clinical Remarks & Notes</span>
                <p style={{ margin: 0, color: "#334155" }}>{data.notes}</p>
              </div>
            )}
          </div>

          <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
            <button className="primary sm" onClick={() => setSubView("animal-details")}>
              Done / Return to Animal Details
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* =========================================================================
     SUBVIEW 1: MAIN BREEDING PAGE (PRECISE MATCH TO USER SPECIFICATION)
     ========================================================================= */
  return (
    <div className="content" id="breeding-page">
      {/* 1. Header & Subtitle */}
      <div className="page-title module-page-header" id="breeding-header">
        <div>
          <h2 className="module-page-title">Breeding, Heat & AI Lifecycle</h2>
          <p className="module-page-subtitle">Monitor estrus cycles, artificial insemination, pregnancy diagnosis, and calving</p>
        </div>
        <div className="actions module-header-actions">
          <button
            className="secondary"
            id="btn-return-dashboard-breeding"
            onClick={() => (onNavigate ? onNavigate("Dashboard") : (window.location.hash = "#Dashboard"))}
            title="Return to Main Dashboard"
          >
            <ArrowLeft size={15} /> Return to Dashboard
          </button>
          <button
            className="secondary"
            id="btn-refresh-breeding"
            onClick={loadData}
            disabled={loading || refreshing}
            title="Reload breeding records from database"
          >
            <RefreshCw size={15} className={loading || refreshing ? "spin" : ""} /> Refresh
          </button>
          <button
            className="secondary"
            id="btn-view-timeline"
            onClick={() => setSubView("timeline")}
            title="Open dedicated Breeding Timeline page"
          >
            <CalendarDays size={15} /> View Timeline
          </button>
          <button
            className="secondary"
            id="btn-export-breeding"
            onClick={handleExportCsv}
            title="Export filtered records as CSV"
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            className="primary"
            id="btn-new-breeding-record"
            onClick={() => {
              setEditingEvent(null);
              setModalAnimalId(undefined);
              setModalOpen(true);
            }}
            title="Open new breeding record form"
          >
            <Plus size={16} /> New Breeding Record
          </button>
        </div>
      </div>

      {/* 2. 4 Breeding Lifecycle Guidance Items (Clean Workflow Guide) */}
      <section
        className="card"
        id="breeding-lifecycle-guidance-card"
        style={{
          marginBottom: "20px",
          padding: "16px 20px",
          background: "#ffffff",
          border: "1px solid var(--border)",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "14px",
          }}
        >
          {/* Item 1: Heat Observed */}
          <div
            id="guidance-heat-observed"
            style={{
              padding: "12px 14px",
              background: "#fffbeb",
              borderRadius: "8px",
              border: "1px solid #fde68a",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Flame size={16} style={{ color: "#b45309" }} />
              <b style={{ fontSize: "14px", color: "#92400e" }}>Heat Observed</b>
            </div>
            <div style={{ fontSize: "12px", color: "#b45309", fontWeight: 500 }}>
              Day 0 (Standing Heat)
            </div>
          </div>

          {/* Item 2: AI Performed */}
          <div
            id="guidance-ai-performed"
            style={{
              padding: "12px 14px",
              background: "#f0f9ff",
              borderRadius: "8px",
              border: "1px solid #bae6fd",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Syringe size={16} style={{ color: "#0284c7" }} />
              <b style={{ fontSize: "14px", color: "#0369a1" }}>AI Performed</b>
            </div>
            <div style={{ fontSize: "12px", color: "#0284c7", fontWeight: 500 }}>
              12h Post Estrus
            </div>
          </div>

          {/* Item 3: Pregnancy Diagnosis */}
          <div
            id="guidance-pregnancy-diagnosis"
            style={{
              padding: "12px 14px",
              background: "#faf5ff",
              borderRadius: "8px",
              border: "1px solid #e9d5ff",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <HeartPulse size={16} style={{ color: "#7e22ce" }} />
              <b style={{ fontSize: "14px", color: "#6b21a8" }}>Pregnancy Diagnosis</b>
            </div>
            <div style={{ fontSize: "12px", color: "#7e22ce", fontWeight: 500 }}>
              Day 35 (Ultrasound)
            </div>
          </div>

          {/* Item 4: Expected Calving */}
          <div
            id="guidance-expected-calving"
            style={{
              padding: "12px 14px",
              background: "#f5f3ff",
              borderRadius: "8px",
              border: "1px solid #ddd6fe",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <Calendar size={16} style={{ color: "#6d28d9" }} />
              <b style={{ fontSize: "14px", color: "#5b21b6" }}>Expected Calving</b>
            </div>
            <div style={{ fontSize: "12px", color: "#6d28d9", fontWeight: 500 }}>
              ~280 Days Gestation
            </div>
          </div>
        </div>
      </section>

      {/* Error state if database unreachable */}
      {error && (
        <section className="card" style={{ background: "#fef2f2", borderColor: "#f87171", marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#b91c1c" }}>
              <AlertCircle size={20} />
              <div>
                <b>{error}</b>
                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#991b1b" }}>
                  Please check database connection and try again.
                </p>
              </div>
            </div>
            <button className="primary sm" onClick={() => fetchBreedingData(true)}>
              Retry Connection
            </button>
          </div>
        </section>
      )}

      {/* 3. Filters & Search Card */}
      <section className="card" id="breeding-filters-card" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Status Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#475569" }}>Status:</span>
            {[
              { label: "All Records", value: "All" },
              { label: "Confirmed (Positive)", value: "Positive" },
              { label: "Pending Check", value: "Pending" },
              { label: "Open (Negative)", value: "Negative" },
              { label: "Suspicious", value: "Suspicious" },
            ].map((st) => (
              <button
                key={st.value}
                type="button"
                className={`secondary sm ${statusFilter === st.value ? "active" : ""}`}
                onClick={() => setStatusFilter(st.value)}
                style={
                  statusFilter === st.value
                    ? { background: "#e0f2fe", borderColor: "#0284c7", color: "#0369a1", fontWeight: 600 }
                    : {}
                }
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Animal filter & search */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <select
              value={animalFilter}
              onChange={(e) => setAnimalFilter(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                background: "#ffffff",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <option value="All">All Animals ({animals.length})</option>
              {animals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.status})
                </option>
              ))}
            </select>

            <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "#f8fafc", padding: "4px 10px", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <Search size={15} className="text-muted" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: "none", background: "transparent", outline: "none", fontSize: "13px", width: "150px" }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "0 2px" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Active Reproduction Events Table */}
      <section className="card" id="active-reproduction-events-card">
        <div className="section-head">
          <h3>Active Reproduction Events</h3>
          <span className="trend">
            {filteredEvents.length > 0
              ? `${filteredEvents.length} Records · Click Animal to View Profile`
              : "No active reproduction events recorded."}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ margin: "0 auto 12px auto", color: "#0284c7" }} />
            <p style={{ margin: 0, fontWeight: 500 }}>Loading breeding records...</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Animal Code & Name</th>
                  <th>Heat Observed</th>
                  <th>AI Date</th>
                  <th>Pregnancy Check (PD)</th>
                  <th>Expected Calving</th>
                  <th>Bull / Semen</th>
                  <th>Technician</th>
                  <th>PD Status</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((ev) => {
                  const foundAnimal = animals.find(
                    (a) =>
                      (ev.animalId && a.id.toLowerCase() === ev.animalId.toLowerCase()) ||
                      ev.animal.toLowerCase().includes(a.id.toLowerCase()) ||
                      ev.animal.toLowerCase().includes(a.name.toLowerCase())
                  );

                  const targetId = foundAnimal ? foundAnimal.id : ev.animalId || "HF-027";
                  const displayName = foundAnimal ? `${foundAnimal.id} (${foundAnimal.name})` : ev.animal;

                  // Gestation / Expected calving calculation
                  let expectedCalvingVal = ev.expectedCalving;
                  if (!expectedCalvingVal && ev.aiDate) {
                    const d = new Date(ev.aiDate);
                    d.setDate(d.getDate() + (settings.gestationPeriodDays || 280));
                    expectedCalvingVal = d.toISOString().split("T")[0];
                  }

                  const isPdPositive = ev.result === "Positive";
                  const isPdNegative = ev.result === "Negative";
                  const isPdSuspicious = ev.result === "Suspicious";

                  return (
                    <tr key={ev.id}>
                      {/* Animal Code & Name (Clickable) */}
                      <td
                        className="blue-text"
                        style={{ cursor: "pointer" }}
                        onClick={() => openAnimalBreedingDetails(targetId)}
                        title={`Click to open Animal Breeding Details for ${displayName}`}
                      >
                        <b>{displayName}</b>
                        {foundAnimal && (
                          <span style={{ display: "block", fontSize: "11px", color: "var(--muted)", fontWeight: 400 }}>
                            {foundAnimal.breed} · {foundAnimal.status}
                          </span>
                        )}
                      </td>

                      {/* Heat Observed */}
                      <td>{ev.heatDate || "—"}</td>

                      {/* AI Date */}
                      <td>{ev.aiDate ? <b>{ev.aiDate}</b> : "—"}</td>

                      {/* Pregnancy Check (PD) */}
                      <td>
                        {ev.pdDate
                          ? ev.pdDate
                          : ev.aiDate
                          ? "Scheduled"
                          : "—"}
                      </td>

                      {/* Expected Calving */}
                      <td>
                        <b>{expectedCalvingVal || (ev.aiDate ? "Calculating" : "—")}</b>
                        {ev.actualCalving && (
                          <span style={{ display: "block", fontSize: "11px", color: "#166534", fontWeight: 600 }}>
                            ✓ Calved {ev.actualCalving}
                          </span>
                        )}
                      </td>

                      {/* Bull / Semen */}
                      <td>{ev.semenBull || "—"}</td>

                      {/* Technician */}
                      <td>{ev.technician || "—"}</td>

                      {/* PD Status Badge */}
                      <td>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "10px",
                            background: isPdPositive
                              ? "#dcfce7"
                              : isPdNegative
                              ? "#fee2e2"
                              : isPdSuspicious
                              ? "#fef3c7"
                              : "#e0f2fe",
                            color: isPdPositive
                              ? "#15803d"
                              : isPdNegative
                              ? "#b91c1c"
                              : isPdSuspicious
                              ? "#b45309"
                              : "#0369a1",
                            border: isPdPositive
                              ? "1px solid #86efac"
                              : isPdNegative
                              ? "1px solid #fca5a5"
                              : "1px solid #bae6fd",
                          }}
                        >
                          {ev.result || "Pending"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <button
                            className="secondary sm"
                            onClick={() => openAnimalBreedingDetails(targetId)}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              color: "#059669",
                              borderColor: "#a7f3d0",
                              background: "#f0fdf4",
                            }}
                            title="Open Animal Breeding Details"
                          >
                            <Eye size={12} /> View / Track
                          </button>
                          <button
                            className="secondary sm"
                            onClick={() => {
                              setEditingEvent(ev);
                              setModalOpen(true);
                            }}
                            style={{ padding: "4px 8px" }}
                            title="Edit breeding record"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="secondary sm"
                            onClick={() => handleDeleteBreeding(ev.id, displayName)}
                            style={{ padding: "4px 8px", color: "#dc2626", borderColor: "#fca5a5" }}
                            title="Delete breeding record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEvents.length === 0 && !loading && (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", color: "var(--muted)" }}>
                      <Egg size={36} style={{ color: "#94a3b8", margin: "0 auto 10px auto" }} />
                      <h4 style={{ margin: "0 0 6px 0", color: "#334155" }}>No active reproduction events recorded.</h4>
                      <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
                        {searchQuery || statusFilter !== "All" || animalFilter !== "All"
                          ? "No records matched your selected filters."
                          : "Click 'New Breeding Record' above to log an estrus cycle, AI, or pregnancy check."}
                      </p>
                      <button
                        className="primary sm"
                        onClick={() => {
                          setEditingEvent(null);
                          setModalAnimalId(undefined);
                          setModalOpen(true);
                        }}
                      >
                        <Plus size={14} /> New Breeding Record
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MODALS */}
      <AddBreedingModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingEvent(null);
          setModalAnimalId(undefined);
        }}
        animals={animals}
        initialEvent={editingEvent}
        initialAnimalId={modalAnimalId}
        onSave={handleSaveBreeding}
      />

      <RecordHeatModal
        isOpen={heatModalOpen}
        onClose={() => setHeatModalOpen(false)}
        animals={animals}
        initialAnimalId={selectedAnimalId || animals[0]?.id}
        onSave={handleSaveHeat}
      />

      <RecordAiModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        animals={animals}
        initialAnimalId={selectedAnimalId || animals[0]?.id}
        onSave={handleSaveAi}
      />

      <RecordPdModal
        isOpen={pdModalOpen}
        onClose={() => setPdModalOpen(false)}
        animals={animals}
        initialAnimalId={selectedAnimalId || animals[0]?.id}
        onSave={handleSavePd}
      />

      <BreedingSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      <AddCalvingModal
        isOpen={calvingModalOpen}
        onClose={() => setCalvingModalOpen(false)}
        animals={animals}
        onSave={handleSaveCalving}
      />
    </div>
  );
}
