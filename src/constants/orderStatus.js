// Order status constants and transitions
export const ORDER_STATUS = {
  PENDING: "pending",
  CONFIRMED: "confirmed",
  PREPARING: "preparing",
  READY: "ready",
  PICKED_UP: "picked_up",
  ON_THE_WAY: "on_the_way",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
};

export const STATUS_LABELS = {
  [ORDER_STATUS.PENDING]: "Pending",
  [ORDER_STATUS.CONFIRMED]: "Confirmed",
  [ORDER_STATUS.PREPARING]: "Preparing",
  [ORDER_STATUS.READY]: "Ready for Pickup",
  [ORDER_STATUS.PICKED_UP]: "Picked Up",
  [ORDER_STATUS.ON_THE_WAY]: "On the Way",
  [ORDER_STATUS.DELIVERED]: "Delivered",
  [ORDER_STATUS.CANCELLED]: "Cancelled",
};

export const STATUS_COLORS = {
  [ORDER_STATUS.PENDING]: "status-pending",
  [ORDER_STATUS.CONFIRMED]: "status-confirmed",
  [ORDER_STATUS.PREPARING]: "status-preparing",
  [ORDER_STATUS.READY]: "status-ready",
  [ORDER_STATUS.PICKED_UP]: "status-pickedup",
  [ORDER_STATUS.ON_THE_WAY]: "status-ontheway",
  [ORDER_STATUS.DELIVERED]: "status-delivered",
  [ORDER_STATUS.CANCELLED]: "status-cancelled",
};

export const STATUS_ICONS = {
  [ORDER_STATUS.PENDING]: "⏳",
  [ORDER_STATUS.CONFIRMED]: "✅",
  [ORDER_STATUS.PREPARING]: "👨‍🍳",
  [ORDER_STATUS.READY]: "📦",
  [ORDER_STATUS.PICKED_UP]: "🛵",
  [ORDER_STATUS.ON_THE_WAY]: "🚴",
  [ORDER_STATUS.DELIVERED]: "🎉",
  [ORDER_STATUS.CANCELLED]: "❌",
};

// Valid status transitions: key -> allowed next statuses
export const STATUS_TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.PICKED_UP, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PICKED_UP]: [ORDER_STATUS.ON_THE_WAY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ON_THE_WAY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

// Order lifecycle steps for stepper
export const ORDER_LIFECYCLE = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PREPARING,
  ORDER_STATUS.READY,
  ORDER_STATUS.PICKED_UP,
  ORDER_STATUS.ON_THE_WAY,
  ORDER_STATUS.DELIVERED,
];

export const canTransition = (from, to) => {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};

export const getStatusIndex = (status) => ORDER_LIFECYCLE.indexOf(status);

export const isStatusCompleted = (status, targetStatus) => {
  const statusIdx = ORDER_LIFECYCLE.indexOf(status);
  const targetIdx = ORDER_LIFECYCLE.indexOf(targetStatus);
  return statusIdx > targetIdx;
};
