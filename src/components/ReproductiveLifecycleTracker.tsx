import React from "react";
import {
  Activity,
  Flame,
  Syringe,
  HeartPulse,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  SlidersHorizontal,
  RefreshCw,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Eye,
  Check,
} from "lucide-react";
import { Animal } from "../types";

export interface ReproductiveLifecycleTrackerProps {
  selectedAnimalObj: Animal | null;
  eligibleBreedingAnimals: Animal[];
  selectedTrackerAnimalId: string;
  onSelectAnimalId: (id: string) => void;
  onViewAnimalProfile?: (animal: Animal) => void;
  trackerData: {
    hasHeat: boolean;
    heatDate: string | null;
    heatSigns: string;
    heatMethod: string;
    hasAi: boolean;
    aiDate: string | null;
    suggestedAiDate: string | null;
    semenBull: string;
    technician: string;
    servicesCount: number;
    calculatedPdDueDate: string | null;
    actualPdDate: string | null;
    pdResult: "Positive" | "Negative" | "Suspicious" | "Pending" | null;
    pdMethod: string;
    isPdOverdue: boolean;
    expectedCalvingDate: string | null;
    actualCalvingDate: string | null;
    isCalved: boolean;
    gestationDaysElapsed: number;
    daysRemaining: number;
    calvingStatusText: string;
    calvingBadge: string;
    currentStage: number;
  };
  settings: {
    gestationPeriodDays: number;
    pdCheckDays: number;
    heatToAiHours: number;
  };
  refreshing: boolean;
  loading: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
  onOpenNewBreeding: () => void;
  onOpenHeatModal: () => void;
  onOpenAiModal: () => void;
  onOpenPdModal: () => void;
  onOpenCalvingModal: () => void;
}

export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return "—";
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      if (months[monthIndex]) {
        return `${day} ${months[monthIndex]} ${year}`;
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function ReproductiveLifecycleTracker({
  selectedAnimalObj,
  eligibleBreedingAnimals,
  selectedTrackerAnimalId,
  onSelectAnimalId,
  onViewAnimalProfile,
  trackerData,
  settings,
  refreshing,
  loading,
  onRefresh,
  onOpenSettings,
  onOpenNewBreeding,
  onOpenHeatModal,
  onOpenAiModal,
  onOpenPdModal,
  onOpenCalvingModal,
}: ReproductiveLifecycleTrackerProps) {
  // Stage state determinations
  const isHeatDone = trackerData.hasHeat;
  const isAiDone = trackerData.hasAi;
  const isPdDone = Boolean(trackerData.actualPdDate || (trackerData.hasAi && trackerData.pdResult && trackerData.pdResult !== "Pending"));
  const isPdPositive = trackerData.pdResult === "Positive";
  const isPdNegative = trackerData.pdResult === "Negative";
  const isCalvedDone = trackerData.isCalved;

  // Stages configuration for horizontal flow
  const stageSteps = [
    {
      id: "heat",
      num: 1,
      title: "Heat Observed",
      shortTitle: "Heat",
      date: trackerData.heatDate ? formatDateDisplay(trackerData.heatDate) : "Not Logged",
      done: isHeatDone,
      active: !isHeatDone,
      icon: Flame,
      activeColor: "#b45309",
      activeBg: "#fef3c7",
    },
    {
      id: "ai",
      num: 2,
      title: "AI Performed",
      shortTitle: "AI",
      date: trackerData.aiDate
        ? formatDateDisplay(trackerData.aiDate)
        : trackerData.suggestedAiDate
        ? `Due ${formatDateDisplay(trackerData.suggestedAiDate)}`
        : "Pending",
      done: isAiDone,
      active: isHeatDone && !isAiDone,
      icon: Syringe,
      activeColor: "#0284c7",
      activeBg: "#e0f2fe",
    },
    {
      id: "pd",
      num: 3,
      title: "Pregnancy Diagnosis",
      shortTitle: "Pregnancy",
      date: trackerData.actualPdDate
        ? formatDateDisplay(trackerData.actualPdDate)
        : trackerData.calculatedPdDueDate
        ? `Due ${formatDateDisplay(trackerData.calculatedPdDueDate)}`
        : "Scheduled ~35d",
      done: isPdDone && isPdPositive,
      failed: isPdNegative,
      active: isAiDone && !isPdDone,
      icon: HeartPulse,
      activeColor: "#7e22ce",
      activeBg: "#f3e8ff",
    },
    {
      id: "calving",
      num: 4,
      title: "Calving & Delivery",
      shortTitle: "Calving",
      date: trackerData.actualCalvingDate
        ? formatDateDisplay(trackerData.actualCalvingDate)
        : trackerData.expectedCalvingDate
        ? `Exp ${formatDateDisplay(trackerData.expectedCalvingDate)}`
        : "Projected ~280d",
      done: isCalvedDone,
      active: isPdPositive && !isCalvedDone,
      icon: Calendar,
      activeColor: "#059669",
      activeBg: "#ecfdf5",
    },
  ];

  return (
    <div
      id="live-reproductive-lifecycle-tracker-widget"
      style={{
        background: "#ffffff",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "16px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* 1. COMPACT HEADER & CONTROL BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          paddingBottom: "14px",
          borderBottom: "1px solid #f1f5f9",
          marginBottom: "14px",
        }}
      >
        {/* Left: Simple Title, Indicator & Subtitle */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#1e293b" }}>
              Live Reproductive Lifecycle
            </h3>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontSize: "11px",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: "12px",
                background: "#f0fdf4",
                color: "#166534",
                border: "1px solid #bbf7d0",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#16a34a",
                  display: "inline-block",
                }}
              />
              Live Database Sync
            </span>
          </div>

          <p style={{ margin: "3px 0 0 0", fontSize: "12.5px", color: "#64748b" }}>
            Active reproductive progression for{" "}
            <b>
              {selectedAnimalObj ? `${selectedAnimalObj.id} · ${selectedAnimalObj.name}` : "Selected Dam"}
            </b>{" "}
            · {selectedAnimalObj?.breed || "Holstein Friesian"} ·{" "}
            <span style={{ fontWeight: 600, color: "#0284c7" }}>
              {selectedAnimalObj?.status || "Lactating"}
            </span>
          </p>
        </div>

        {/* Right: Animal Control Bar & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#475569" }}>Dam:</span>
            <select
              id="select-tracker-dam"
              value={selectedTrackerAnimalId}
              onChange={(e) => onSelectAnimalId(e.target.value)}
              style={{
                padding: "5px 10px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                background: "#f8fafc",
                fontSize: "12.5px",
                fontWeight: 600,
                color: "#1e293b",
                cursor: "pointer",
                minWidth: "180px",
                outline: "none",
              }}
            >
              {eligibleBreedingAnimals.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.id} - {a.name} ({a.status})
                </option>
              ))}
            </select>
          </div>

          {onViewAnimalProfile && selectedAnimalObj && (
            <button
              type="button"
              className="secondary sm"
              onClick={() => onViewAnimalProfile(selectedAnimalObj)}
              title="View Animal Profile"
              style={{ padding: "5px 9px", fontSize: "12px" }}
            >
              Profile →
            </button>
          )}

          <button
            type="button"
            className="secondary sm"
            onClick={onOpenSettings}
            title="Configure reproductive gestation and check protocols"
            style={{ padding: "5px 9px", fontSize: "12px" }}
          >
            <SlidersHorizontal size={13} /> {settings.gestationPeriodDays}d Gestation
          </button>

          <button
            type="button"
            className="secondary sm"
            onClick={onRefresh}
            disabled={refreshing || loading}
            title="Synchronize records with database"
            style={{ padding: "5px 9px", fontSize: "12px" }}
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Syncing..." : "Sync"}
          </button>

          <button
            type="button"
            className="primary sm"
            onClick={onOpenNewBreeding}
            style={{ padding: "5px 11px", fontSize: "12px" }}
          >
            <Plus size={13} /> New Record
          </button>
        </div>
      </div>

      {/* 2. HORIZONTAL 4-STAGE PROGRESSION FLOW */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "8px",
          marginBottom: "14px",
        }}
      >
        {stageSteps.map((step, idx) => {
          const IconComponent = step.icon;
          const isDone = step.done;
          const isFailed = step.failed;
          const isActive = step.active;

          return (
            <div
              key={step.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 12px",
                borderRadius: "8px",
                border: isDone
                  ? "1px solid #86efac"
                  : isFailed
                  ? "1px solid #fca5a5"
                  : isActive
                  ? `1px solid ${step.activeColor}`
                  : "1px solid #e2e8f0",
                background: isDone
                  ? "#f0fdf4"
                  : isFailed
                  ? "#fef2f2"
                  : isActive
                  ? step.activeBg
                  : "#f8fafc",
                position: "relative",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                {/* Step Circle Status */}
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    background: isDone
                      ? "#16a34a"
                      : isFailed
                      ? "#dc2626"
                      : isActive
                      ? step.activeColor
                      : "#cbd5e1",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 700,
                  }}
                >
                  {isDone ? <Check size={14} strokeWidth={3} /> : isFailed ? "✗" : step.num}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: isDone
                        ? "#15803d"
                        : isFailed
                        ? "#b91c1c"
                        : isActive
                        ? step.activeColor
                        : "#475569",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {step.title}
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      color: isDone ? "#166534" : "#64748b",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {step.date}
                  </div>
                </div>
              </div>

              {idx < stageSteps.length - 1 && (
                <ChevronRight
                  size={14}
                  style={{
                    color: isDone ? "#16a34a" : "#cbd5e1",
                    flexShrink: 0,
                    marginLeft: "4px",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* 3. CURRENT STATUS SUMMARY STRIP */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          padding: "10px 14px",
          background:
            isCalvedDone
              ? "#ecfdf5"
              : isPdPositive
              ? "#f5f3ff"
              : isAiDone
              ? "#eff6ff"
              : isHeatDone
              ? "#fffbeb"
              : "#f8fafc",
          border:
            isCalvedDone
              ? "1px solid #a7f3d0"
              : isPdPositive
              ? "1px solid #ddd6fe"
              : isAiDone
              ? "1px solid #bfdbfe"
              : isHeatDone
              ? "1px solid #fde68a"
              : "1px solid #e2e8f0",
          borderRadius: "8px",
          marginBottom: "14px",
          fontSize: "12.5px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Status Badge & Label */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontWeight: 600, color: "#475569" }}>Current Status:</span>
            <span
              style={{
                fontWeight: 700,
                padding: "2px 10px",
                borderRadius: "12px",
                fontSize: "11.5px",
                background:
                  isCalvedDone
                    ? "#d1fae5"
                    : isPdPositive
                    ? "#ede9fe"
                    : isPdNegative
                    ? "#fee2e2"
                    : trackerData.isPdOverdue
                    ? "#ffedd5"
                    : isAiDone
                    ? "#e0f2fe"
                    : isHeatDone
                    ? "#fef3c7"
                    : "#f1f5f9",
                color:
                  isCalvedDone
                    ? "#065f46"
                    : isPdPositive
                    ? "#5b21b6"
                    : isPdNegative
                    ? "#991b1b"
                    : trackerData.isPdOverdue
                    ? "#c2410c"
                    : isAiDone
                    ? "#0369a1"
                    : isHeatDone
                    ? "#92400e"
                    : "#475569",
              }}
            >
              {isCalvedDone
                ? "✓ Calved & Delivered"
                : isPdPositive
                ? "✓ Confirmed Pregnant"
                : isPdNegative
                ? "✗ Open / Negative"
                : trackerData.isPdOverdue
                ? "⚠️ PD Ultrasound Overdue"
                : isAiDone
                ? "⏳ Inseminated (PD Scheduled)"
                : isHeatDone
                ? "🔥 Standing Heat (AI Window)"
                : "Open / Monitoring Estrus"}
            </span>
          </div>

          {/* Gestation Countdown or Details */}
          {trackerData.hasAi && (
            <div style={{ color: "#334155" }}>
              <span style={{ color: "#64748b" }}>Gestation:</span>{" "}
              <b>{trackerData.gestationDaysElapsed}d elapsed</b>{" "}
              <span style={{ color: "#475569" }}>
                · {isCalvedDone ? `Calved on ${formatDateDisplay(trackerData.actualCalvingDate)}` : trackerData.calvingStatusText}
              </span>
            </div>
          )}

          {/* AI Bull Straw info */}
          {trackerData.hasAi && trackerData.semenBull && trackerData.semenBull !== "—" && (
            <div style={{ color: "#334155" }}>
              <span style={{ color: "#64748b" }}>Straw:</span>{" "}
              <b>{trackerData.semenBull}</b>
            </div>
          )}
        </div>

        {/* Quick Action Button based on state */}
        <div>
          {isCalvedDone ? (
            <button
              type="button"
              className="secondary sm"
              onClick={onOpenCalvingModal}
              style={{ padding: "4px 10px", fontSize: "11.5px", background: "#ffffff" }}
            >
              + Record Next Calving
            </button>
          ) : isPdPositive ? (
            <button
              type="button"
              className="primary sm"
              onClick={onOpenCalvingModal}
              style={{ padding: "4px 10px", fontSize: "11.5px" }}
            >
              <Calendar size={13} /> Log Calving Event
            </button>
          ) : isAiDone ? (
            <button
              type="button"
              className="secondary sm"
              onClick={onOpenPdModal}
              style={{ padding: "4px 10px", fontSize: "11.5px", background: "#ffffff", borderColor: "#c4b5fd", color: "#6d28d9" }}
            >
              <HeartPulse size={13} /> Record PD Result
            </button>
          ) : isHeatDone ? (
            <button
              type="button"
              className="primary sm"
              onClick={onOpenAiModal}
              style={{ padding: "4px 10px", fontSize: "11.5px" }}
            >
              <Syringe size={13} /> Record AI Service
            </button>
          ) : (
            <button
              type="button"
              className="secondary sm"
              onClick={onOpenHeatModal}
              style={{ padding: "4px 10px", fontSize: "11.5px", background: "#ffffff" }}
            >
              <Flame size={13} /> Log Estrus / Heat
            </button>
          )}
        </div>
      </div>

      {/* 4. CLEAN 4-STAGE DETAIL CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
        }}
      >
        {/* STAGE 1: HEAT OBSERVED */}
        <div
          id="stage-card-heat"
          style={{
            background: isHeatDone ? "#fffdf5" : "#f8fafc",
            border: isHeatDone ? "1px solid #fde68a" : "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#b45309" }}>STAGE 1</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "1px 7px",
                  borderRadius: "10px",
                  background: isHeatDone ? "#fef3c7" : "#f1f5f9",
                  color: isHeatDone ? "#92400e" : "#64748b",
                }}
              >
                {isHeatDone ? "✓ Observed" : "Not Logged"}
              </span>
            </div>

            <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
              Heat Observed
            </h4>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
              Day 0 Estrus Baseline
            </div>

            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Observed Date:</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: isHeatDone ? "#92400e" : "#475569" }}>
                {trackerData.heatDate ? formatDateDisplay(trackerData.heatDate) : "—"}
              </div>
            </div>

            <div style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.4, marginBottom: "10px" }}>
              <div>Signs: <b>{trackerData.heatSigns}</b></div>
              <div style={{ color: "#64748b", marginTop: "2px" }}>Method: {trackerData.heatMethod}</div>
            </div>
          </div>

          <button
            type="button"
            className="secondary sm"
            id="btn-update-heat-stage"
            onClick={onOpenHeatModal}
            style={{
              width: "100%",
              justifyContent: "center",
              fontSize: "12px",
              padding: "5px 10px",
              background: "#ffffff",
              borderColor: isHeatDone ? "#fcd34d" : "#cbd5e1",
            }}
          >
            <Flame size={13} /> {isHeatDone ? "Update Heat" : "+ Log Heat"}
          </button>
        </div>

        {/* STAGE 2: AI PERFORMED */}
        <div
          id="stage-card-ai"
          style={{
            background: isAiDone ? "#f0f9ff" : isHeatDone ? "#f8fafc" : "#f8fafc",
            border: isAiDone ? "1px solid #7dd3fc" : isHeatDone ? "1px dashed #93c5fd" : "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0284c7" }}>STAGE 2</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "1px 7px",
                  borderRadius: "10px",
                  background: isAiDone ? "#e0f2fe" : isHeatDone ? "#dbeafe" : "#f1f5f9",
                  color: isAiDone ? "#0369a1" : isHeatDone ? "#1d4ed8" : "#64748b",
                }}
              >
                {isAiDone ? "✓ Performed" : isHeatDone ? `Due ~${settings.heatToAiHours}h` : "Not Performed"}
              </span>
            </div>

            <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
              AI Performed
            </h4>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
              {settings.heatToAiHours}h Insemination Window
            </div>

            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#64748b" }}>AI Date:</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: isAiDone ? "#0369a1" : "#475569" }}>
                {trackerData.aiDate
                  ? formatDateDisplay(trackerData.aiDate)
                  : trackerData.suggestedAiDate
                  ? `Due ~${formatDateDisplay(trackerData.suggestedAiDate)}`
                  : "Awaiting Heat Log"}
              </div>
            </div>

            <div style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.4, marginBottom: "10px" }}>
              <div>Straw: <b>{trackerData.semenBull}</b></div>
              <div style={{ color: "#64748b", marginTop: "2px" }}>
                Tech: {trackerData.technician} {trackerData.servicesCount > 0 ? `(#${trackerData.servicesCount})` : ""}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="secondary sm"
            id="btn-update-ai-stage"
            onClick={onOpenAiModal}
            style={{
              width: "100%",
              justifyContent: "center",
              fontSize: "12px",
              padding: "5px 10px",
              background: "#ffffff",
              borderColor: isAiDone ? "#7dd3fc" : "#cbd5e1",
            }}
          >
            <Syringe size={13} /> {isAiDone ? "Update AI" : "+ Record AI"}
          </button>
        </div>

        {/* STAGE 3: PREGNANCY DIAGNOSIS */}
        <div
          id="stage-card-pd"
          style={{
            background: isPdPositive ? "#f5f3ff" : isPdNegative ? "#fef2f2" : "#f8fafc",
            border: isPdPositive
              ? "1px solid #c4b5fd"
              : isPdNegative
              ? "1px solid #fca5a5"
              : trackerData.isPdOverdue
              ? "1px solid #fdba74"
              : "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#7e22ce" }}>STAGE 3</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "1px 7px",
                  borderRadius: "10px",
                  background: isPdPositive
                    ? "#dcfce7"
                    : isPdNegative
                    ? "#fee2e2"
                    : trackerData.isPdOverdue
                    ? "#ffedd5"
                    : isAiDone
                    ? "#e0e7ff"
                    : "#f1f5f9",
                  color: isPdPositive
                    ? "#15803d"
                    : isPdNegative
                    ? "#b91c1c"
                    : trackerData.isPdOverdue
                    ? "#c2410c"
                    : isAiDone
                    ? "#4338ca"
                    : "#64748b",
                }}
              >
                {isPdPositive
                  ? "✓ Confirmed"
                  : isPdNegative
                  ? "✗ Negative"
                  : trackerData.isPdOverdue
                  ? "⚠️ Overdue"
                  : isAiDone
                  ? "⏳ Scheduled"
                  : "Not Logged"}
              </span>
            </div>

            <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
              Pregnancy Diagnosis
            </h4>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
              ~{settings.pdCheckDays}-Day Ultrasound / Palpation
            </div>

            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                {trackerData.actualPdDate ? "Diagnosis Date:" : "Target Check Date:"}
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  color: isPdPositive ? "#15803d" : isPdNegative ? "#b91c1c" : "#475569",
                }}
              >
                {trackerData.actualPdDate
                  ? formatDateDisplay(trackerData.actualPdDate)
                  : trackerData.calculatedPdDueDate
                  ? `Due ${formatDateDisplay(trackerData.calculatedPdDueDate)}`
                  : "Awaiting AI Log"}
              </div>
            </div>

            <div style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.4, marginBottom: "10px" }}>
              <div>Method: <b>{trackerData.pdMethod}</b></div>
              <div style={{ color: isPdPositive ? "#15803d" : "#64748b", marginTop: "2px" }}>
                Status: {trackerData.pdResult ? trackerData.pdResult : "Pending Examination"}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="secondary sm"
            id="btn-update-pd-stage"
            onClick={onOpenPdModal}
            style={{
              width: "100%",
              justifyContent: "center",
              fontSize: "12px",
              padding: "5px 10px",
              background: "#ffffff",
              borderColor: isPdPositive ? "#86efac" : "#cbd5e1",
            }}
          >
            <HeartPulse size={13} /> {trackerData.actualPdDate ? "Update Diagnosis" : "+ Record PD"}
          </button>
        </div>

        {/* STAGE 4: EXPECTED CALVING */}
        <div
          id="stage-card-calving"
          style={{
            background: isCalvedDone ? "#ecfdf5" : isPdPositive ? "#f5f3ff" : "#f8fafc",
            border: isCalvedDone
              ? "1px solid #6ee7b7"
              : isPdPositive
              ? "1px solid #c4b5fd"
              : "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "14px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#059669" }}>STAGE 4</span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "1px 7px",
                  borderRadius: "10px",
                  background: isCalvedDone
                    ? "#d1fae5"
                    : isPdPositive
                    ? "#ede9fe"
                    : "#f1f5f9",
                  color: isCalvedDone
                    ? "#065f46"
                    : isPdPositive
                    ? "#5b21b6"
                    : "#64748b",
                }}
              >
                {isCalvedDone
                  ? "✓ Delivered"
                  : isPdPositive
                  ? "⏳ Gestating"
                  : isAiDone
                  ? "Projected"
                  : "Not Scheduled"}
              </span>
            </div>

            <h4 style={{ margin: "0 0 2px 0", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
              Expected Calving
            </h4>
            <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>
              ~{settings.gestationPeriodDays}-Day Gestation Protocol
            </div>

            <div style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Expected Date:</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#4c1d95" }}>
                {trackerData.expectedCalvingDate
                  ? formatDateDisplay(trackerData.expectedCalvingDate)
                  : isAiDone
                  ? "Calculating..."
                  : "Awaiting AI Record"}
              </div>
            </div>

            <div style={{ fontSize: "11.5px", color: "#475569", lineHeight: 1.4, marginBottom: "10px" }}>
              {isCalvedDone ? (
                <div style={{ color: "#065f46", fontWeight: 600 }}>
                  Delivered on: {formatDateDisplay(trackerData.actualCalvingDate)}
                </div>
              ) : isPdPositive ? (
                <div>
                  Status: <b>{trackerData.calvingStatusText}</b>
                </div>
              ) : (
                <div style={{ color: "#64748b" }}>
                  {trackerData.hasAi ? trackerData.calvingStatusText : "Computed upon AI recording"}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            className="secondary sm"
            id="btn-update-calving-stage"
            onClick={onOpenCalvingModal}
            style={{
              width: "100%",
              justifyContent: "center",
              fontSize: "12px",
              padding: "5px 10px",
              background: "#ffffff",
              borderColor: isCalvedDone ? "#6ee7b7" : "#cbd5e1",
            }}
          >
            <Plus size={13} /> {isCalvedDone ? "Record Next Calving" : "+ Record Calving"}
          </button>
        </div>
      </div>
    </div>
  );
}
