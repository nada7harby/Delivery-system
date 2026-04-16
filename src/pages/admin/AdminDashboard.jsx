import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useOrderStore, useAuthStore, useDriverStore } from "@/store";
import { DashboardLayout } from "@/layouts";
import { Card, Badge } from "@/components";
import { ORDER_STATUS, STATUS_LABELS, STATUS_COLORS } from "@/constants";

// ─── Mini helpers ──────────────────────────────────────────────────────────────

const fmt = (n) => (n ?? 0).toLocaleString();
// Use fmt in the rendering to avoid lint warning

const STATUS_HEX = {
  [ORDER_STATUS.PENDING]: "#f59e0b",
  [ORDER_STATUS.CONFIRMED]: "#3b82f6",
  [ORDER_STATUS.PREPARING]: "#8b5cf6",
  [ORDER_STATUS.READY]: "#06b6d4",
  [ORDER_STATUS.PICKED_UP]: "#6366f1",
  [ORDER_STATUS.ON_THE_WAY]: "#f97316",
  [ORDER_STATUS.DELIVERED]: "#10b981",
  [ORDER_STATUS.CANCELLED]: "#ef4444",
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

const KpiCard = ({ label, value, icon, sub, gradient, animDelay = 0 }) => {
  const [counter, setCounter] = useState(0);
  const numVal = parseFloat(value);
  const isNum = !isNaN(numVal);

  useEffect(() => {
    let start = 0;
    const end = isNum ? numVal : 0;
    if (end === 0) return;
    const duration = 800;
    const step = (end / duration) * 16;
    const timer = setTimeout(() => {
      const anim = setInterval(() => {
        start = Math.min(start + step, end);
        setCounter(start);
        if (start >= end) clearInterval(anim);
      }, 16);
      return () => clearInterval(anim);
    }, animDelay);
    return () => clearTimeout(timer);
  }, [numVal, animDelay, isNum]);

  const display = isNum
    ? typeof value === "string" && value.startsWith("$")
      ? `$${Math.round(counter)}`
      : Math.round(counter)
    : value;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 ${gradient} text-white shadow-lg`}
      style={{ animation: `fadeUp 0.4s ease ${animDelay}ms both` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-white/70 text-xs font-semibold uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="text-3xl font-black">{display}</p>
          {sub && <p className="text-white/60 text-xs mt-1">{sub}</p>}
        </div>
        <span className="text-3xl opacity-80">{icon}</span>
      </div>
      {/* Decorative pulse */}
      <div className="absolute -bottom-4 -right-4 w-20 h-20 rounded-full bg-white/10" />
    </div>
  );
};

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────

const BarChart = ({ orders }) => {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const data = days.map((day) => ({
    label: day.toLocaleDateString("en-US", { weekday: "short" }),
    count: orders.filter((o) => {
      const od = new Date(o.createdAt);
      return od.toDateString() === day.toDateString();
    }).length,
  }));

  const max = Math.max(...data.map((d) => d.count), 1);
  const W = 320,
    H = 120,
    barW = 30,
    gap = 14;
  const totalBarWidth = data.length * barW + (data.length - 1) * gap;
  const startX = (W - totalBarWidth) / 2;

  return (
    <svg viewBox={`0 0 ${W} ${H + 30}`} className="w-full">
      {data.map((d, i) => {
        const h = Math.max((d.count / max) * H, 4);
        const x = startX + i * (barW + gap);
        const y = H - h;
        return (
          <g key={i}>
            {/* bg bar */}
            <rect
              x={x}
              y={0}
              width={barW}
              height={H}
              rx={6}
              fill="currentColor"
              className="text-[#E5D0AC]/30 dark:text-[#3d1a1a]/50"
            />
            {/* filled bar */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={6}
              fill="url(#barGrad)"
              style={{
                transformOrigin: `${x + barW / 2}px ${H}px`,
                animation: `scaleY 0.6s ease ${i * 80}ms both`,
              }}
            />
            {/* value */}
            {d.count > 0 && (
              <text
                x={x + barW / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#b04040"
                fontWeight="bold"
              >
                {d.count}
              </text>
            )}
            {/* label */}
            <text
              x={x + barW / 2}
              y={H + 18}
              textAnchor="middle"
              fontSize="10"
              fill="#9e7272"
            >
              {d.label}
            </text>
          </g>
        );
      })}
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e05c5c" />
          <stop offset="100%" stopColor="#b04040" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// ─── SVG Donut Chart ───────────────────────────────────────────────────────────

const DonutChart = ({ data, total }) => {
  const R = 50,
    cx = 70,
    cy = 70,
    stroke = 18;
  const circ = 2 * Math.PI * R;
  const [hovered, setHovered] = useState(null);

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-[#9e7272] text-sm">
        No data yet
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <svg
        width="140"
        height="140"
        viewBox="0 0 140 140"
        className="flex-shrink-0"
      >
        {data.map((seg, i) => {
          const pct = seg.count / total;
          const dash = pct * circ;
          // Calculate cumulative sum up to this index
          const cumulativeSoFar = data
            .slice(0, i)
            .reduce((sum, s) => sum + s.count / total, 0);
          const offset = circ - cumulativeSoFar * circ;
          const isHov = hovered === i;
          return (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={R}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHov ? stroke + 4 : stroke}
              strokeDasharray={`${dash} ${circ - dash}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                transform: "rotate(-90deg)",
                transition: "stroke-width 0.2s",
              }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* center text */}
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fontSize="18"
          fontWeight="bold"
          fill="#1a0a0a"
          className="dark:fill-[#f8f8f8]"
        >
          {total}
        </text>
        <text
          x={cx}
          y={cy + 12}
          textAnchor="middle"
          fontSize="9"
          fill="#9e7272"
        >
          orders
        </text>
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-[#6b4040] dark:text-[#c9a97a] truncate flex-1">
              {STATUS_LABELS[seg.status]}
            </span>
            <span className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              {seg.count}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Peak Hours Heatmap ───────────────────────────────────────────────────────

const PeakHours = ({ orders }) => {
  const hours = Array.from({ length: 24 }, (_, h) => ({
    h,
    label:
      h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`,
    count: orders.filter((o) => new Date(o.createdAt).getHours() === h).length,
  }));

  const max = Math.max(...hours.map((h) => h.count), 1);

  return (
    <div>
      <div className="flex gap-1 flex-wrap">
        {hours.map(({ h, label, count }) => {
          const intensity = count / max;
          return (
            <div key={h} className="group relative">
              <div
                className="w-7 h-7 rounded-md transition-transform hover:scale-125 cursor-default"
                style={{
                  backgroundColor: `rgba(176, 64, 64, ${
                    0.08 + intensity * 0.9
                  })`,
                  border: `1px solid rgba(176,64,64,${0.1 + intensity * 0.3})`,
                }}
              />
              {/* tooltip */}
              <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 bg-[#1a0a0a] text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {label}: {count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between mt-1 text-[10px] text-[#9e7272]">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>
    </div>
  );
};

// ─── Live Activity Feed ───────────────────────────────────────────────────────

const timeAgo = (iso) => {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
};

const EVENT_ICONS = {
  created: {
    icon: "📋",
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  assigned: {
    icon: "🚴",
    color:
      "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
  },
  delivered: {
    icon: "🎉",
    color:
      "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  cancelled: {
    icon: "❌",
    color: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
  },
  status: {
    icon: "🔄",
    color:
      "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  },
};

const buildFeed = (orders) => {
  const events = [];
  orders.forEach((o) => {
    events.push({
      id: `${o.id}-created`,
      type: "created",
      orderId: o.id,
      text: `Order ${o.id} created`,
      ts: o.createdAt,
    });
    if (o.driverId && o.driver)
      events.push({
        id: `${o.id}-assigned`,
        type: "assigned",
        orderId: o.id,
        text: `Driver ${o.driver.name} assigned to ${o.id}`,
        ts: o.updatedAt,
      });
    if (o.status === ORDER_STATUS.DELIVERED)
      events.push({
        id: `${o.id}-delivered`,
        type: "delivered",
        orderId: o.id,
        text: `Order ${o.id} delivered`,
        ts: o.timeline?.at(-1)?.timestamp || o.updatedAt,
      });
    if (o.status === ORDER_STATUS.CANCELLED)
      events.push({
        id: `${o.id}-cancelled`,
        type: "cancelled",
        orderId: o.id,
        text: `Order ${o.id} cancelled`,
        ts: o.timeline?.at(-1)?.timestamp || o.updatedAt,
      });
  });
  return events.sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 12);
};

// ─── Main ──────────────────────────────────────────────────────────────────────

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const { orders, seedOrders, getAnalytics } = useOrderStore();
  const { getStats: driverStats } = useDriverStore();

  useEffect(() => {
    seedOrders(user?.id);
  }, [seedOrders, user?.id]);

  const analytics = getAnalytics();
  const dStats = driverStats();
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);
  const feed = buildFeed(orders);

  const donutData = Object.values(ORDER_STATUS)
    .map((s) => ({
      status: s,
      count: orders.filter((o) => o.status === s).length,
      color: STATUS_HEX[s],
    }))
    .filter((d) => d.count > 0);

  const deliveryRate =
    analytics.total > 0
      ? Math.round((analytics.delivered / analytics.total) * 100)
      : 0;

  return (
    <DashboardLayout role="admin">
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(16px) } to { opacity:1; transform:none } }
        @keyframes scaleY { from { transform:scaleY(0) } to { transform:scaleY(1) } }
      `}</style>

      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
            Admin Dashboard 📊
          </h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-0.5 text-sm">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-full font-semibold">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          System Live
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total Orders"
          value={analytics.total}
          icon="📋"
          sub="All time"
          gradient="bg-gradient-to-br from-blue-500 to-blue-700"
          animDelay={0}
        />
        <KpiCard
          label="Active"
          value={analytics.active}
          icon="🔄"
          sub="Right now"
          gradient="bg-gradient-to-br from-amber-500 to-orange-600"
          animDelay={80}
        />
        <KpiCard
          label="Delivered"
          value={analytics.delivered}
          icon="✅"
          sub={`${deliveryRate}% success rate`}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
          animDelay={160}
        />
        <KpiCard
          label="Revenue"
          value={`$${fmt(analytics.revenue.toFixed(0))}`}
          icon="💰"
          sub={`Avg $${
            analytics.delivered > 0
              ? (analytics.revenue / analytics.delivered).toFixed(2)
              : "0"
          }`}
          gradient="bg-gradient-to-br from-purple-500 to-purple-700"
          animDelay={240}
        />
      </div>

      {/* Driver KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: "Total Drivers",
            value: dStats.total,
            icon: "🚴",
            color:
              "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40",
          },
          {
            label: "Available",
            value: dStats.available,
            icon: "🟢",
            color:
              "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/40",
          },
          {
            label: "Busy",
            value: dStats.busy,
            icon: "🟡",
            color:
              "bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-100 dark:border-amber-900/40",
          },
          {
            label: "Cancelled",
            value: analytics.cancelled,
            icon: "❌",
            color:
              "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 border border-red-100 dark:border-red-900/40",
          },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl p-4 ${s.color}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold opacity-70 uppercase tracking-wide">
                  {s.label}
                </p>
                <p className="text-2xl font-black mt-1">{s.value}</p>
              </div>
              <span className="text-2xl">{s.icon}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Bar chart */}
        <Card padding="p-5" className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
              Orders – Last 7 Days
            </h2>
            <span className="text-xs text-[#6b4040] dark:text-[#c9a97a] bg-[#E5D0AC]/40 dark:bg-[#3d1a1a]/40 px-2 py-0.5 rounded-full">
              Weekly
            </span>
          </div>
          {orders.length === 0 ? (
            <div className="h-36 flex items-center justify-center text-[#9e7272] text-sm">
              No data yet
            </div>
          ) : (
            <BarChart orders={orders} />
          )}
        </Card>

        {/* Donut chart */}
        <Card padding="p-5">
          <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-4">
            Status Breakdown
          </h2>
          <DonutChart data={donutData} total={analytics.total} />
        </Card>
      </div>

      {/* Peak hours + recent orders + feed */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: Peak hours + recent orders */}
        <div className="lg:col-span-2 space-y-5">
          {/* Peak hours */}
          <Card padding="p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                Peak Hours Heatmap ⏰
              </h2>
              <span className="text-[10px] text-[#9e7272] flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[rgba(176,64,64,0.15)]" />
                Low
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-[rgba(176,64,64,0.9)] ml-1" />
                High
              </span>
            </div>
            <PeakHours orders={orders} />
          </Card>

          {/* Recent orders table */}
          <Card padding="p-0">
            <div className="px-5 py-4 border-b border-[#E5D0AC] dark:border-[#3d1a1a] flex items-center justify-between">
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                Recent Orders
              </h2>
              <Link
                to="/admin/orders"
                className="text-sm text-primary hover:underline font-medium"
              >
                View all →
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-10 text-center text-[#6b4040] dark:text-[#c9a97a] text-sm">
                No orders yet
              </div>
            ) : (
              <div className="divide-y divide-[#E5D0AC]/50 dark:divide-[#3d1a1a]/50">
                {recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    to={`/admin/order/${order.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-[#f8f8f8]/60 dark:hover:bg-[#430000]/60 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-[#e05c5c] to-[#b04040] rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {order.items?.length || 0}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-[#1a0a0a] dark:text-[#f8f8f8] group-hover:text-primary transition-colors">
                        {order.id}
                      </p>
                      <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] truncate">
                        {order.customerName} ·{" "}
                        {order.driver ? order.driver.name : "No driver"}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge status={order.status} />
                      <p className="text-xs text-primary font-bold mt-1">
                        ${order.total?.toFixed(2)}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: Live feed */}
        <div className="space-y-5">
          <Card padding="p-0" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E5D0AC] dark:border-[#3d1a1a] flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
                Live Activity
              </h2>
            </div>
            {feed.length === 0 ? (
              <div className="py-10 text-center text-[#9e7272] text-sm">
                No activity yet
              </div>
            ) : (
              <div className="divide-y divide-[#E5D0AC]/40 dark:divide-[#3d1a1a]/40 max-h-[480px] overflow-y-auto">
                {feed.map((ev) => {
                  const meta = EVENT_ICONS[ev.type] || EVENT_ICONS.status;
                  return (
                    <div
                      key={ev.id}
                      className="flex items-start gap-3 px-4 py-3"
                    >
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${meta.color}`}
                      >
                        {meta.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1a0a0a] dark:text-[#f8f8f8] leading-snug">
                          {ev.text}
                        </p>
                        <p className="text-[10px] text-[#9e7272] mt-0.5">
                          {timeAgo(ev.ts)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick links */}
          <Card padding="p-4">
            <h2 className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3 text-sm">
              Quick Actions
            </h2>
            <div className="space-y-2">
              {[
                { label: "Manage Orders", to: "/admin/orders", icon: "📋" },
                { label: "Manage Drivers", to: "/admin/drivers", icon: "🚴" },
                {
                  label: "Manage Customers",
                  to: "/admin/customers",
                  icon: "👥",
                },
              ].map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#E5D0AC]/40 dark:hover:bg-[#3d1a1a]/40 transition-colors text-sm text-[#1a0a0a] dark:text-[#f8f8f8] font-medium group"
                >
                  <span className="text-lg">{l.icon}</span>
                  <span className="flex-1">{l.label}</span>
                  <span className="text-[#9e7272] group-hover:translate-x-1 transition-transform">
                    →
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
