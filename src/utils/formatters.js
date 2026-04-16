// Format currency
export const formatCurrency = (amount, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount || 0);

// Format date
export const formatDate = (dateStr, opts = {}) =>
  new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });

export const formatTime = (dateStr) =>
  new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

export const formatRelativeTime = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Generate unique ID
export const generateId = (prefix = "ID") =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

// Truncate text
export const truncate = (str, length = 60) =>
  str?.length > length ? `${str.substring(0, length)}...` : str;

// Capitalize
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
