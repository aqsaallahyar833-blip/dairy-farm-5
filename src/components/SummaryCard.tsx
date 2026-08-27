import React, { ReactNode } from "react";

export interface SummaryCardProps {
  id?: string;
  icon: ReactNode;
  iconBg?: string;
  iconColor?: string;
  label: string;
  value: ReactNode;
  meta?: ReactNode;
  valueColor?: string;
  loading?: boolean;
  onClick?: () => void;
  clickable?: boolean;
}

export function SummaryCard({
  id,
  icon,
  iconBg = "#f0fdf4",
  iconColor = "#16a34a",
  label,
  value,
  meta,
  valueColor,
  loading = false,
  onClick,
  clickable = !!onClick,
}: SummaryCardProps) {
  return (
    <div
      id={id}
      className={`summary-card ${clickable ? "clickable" : ""} ${loading ? "loading" : ""}`}
      onClick={clickable ? onClick : undefined}
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={
        clickable && onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="summary-card-header">
        <div
          className="summary-card-icon"
          style={{ background: iconBg, color: iconColor }}
        >
          {icon}
        </div>
      </div>
      <div className="summary-card-body">
        <div className="summary-card-label">{label}</div>
        <div
          className="summary-card-value"
          style={valueColor ? { color: valueColor } : undefined}
        >
          {value}
        </div>
        {meta && <div className="summary-card-meta">{meta}</div>}
      </div>
    </div>
  );
}
