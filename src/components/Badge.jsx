import clsx from "clsx";
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_ICONS,
} from "@/constants/orderStatus";

const Badge = ({ status, label, icon, className = "", dot = false }) => {
  // If it's an order status badge
  if (status) {
    const statusClass = STATUS_COLORS[status] || "status-pending";
    const statusLabel = STATUS_LABELS[status] || status;
    const statusIcon = STATUS_ICONS[status] || "•";

    return (
      <span className={clsx("status-badge", statusClass, className)}>
        {dot ? (
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
        ) : (
          <span>{statusIcon}</span>
        )}
        {statusLabel}
      </span>
    );
  }

  // Generic badge
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold",
        className
      )}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
};

export default Badge;
