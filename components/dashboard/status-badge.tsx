"use client";

type StatusBadgeProps = {
  status: "active" | "pending" | "free" | "paid";
  label?: string;
};

const STYLES: Record<StatusBadgeProps["status"], string> = {
  active: "db-badge db-badge--active",
  pending: "db-badge db-badge--pending",
  free: "db-badge db-badge--free",
  paid: "db-badge db-badge--paid",
};

const DEFAULT_LABELS: Record<StatusBadgeProps["status"], string> = {
  active: "Active",
  pending: "Pending",
  free: "Free",
  paid: "Paid",
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <span className={STYLES[status]}>{label ?? DEFAULT_LABELS[status]}</span>
  );
}
