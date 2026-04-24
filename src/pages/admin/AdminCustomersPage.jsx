import { useState, useMemo } from "react";
import { useOrderStore } from "@/store";
import { DashboardLayout } from "@/layouts";
import { Card, Badge, Button, Modal, EmptyState } from "@/components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPhone,
  faMapMarkerAlt,
  faClipboardList,
  faCheck,
  faDollarSign,
  faUsers,
  faCircle,
  faClock,
  faSearch,
} from "@/utils/icons";
import { ORDER_STATUS } from "@/constants";
import clsx from "clsx";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "Today";
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Date(iso).toLocaleDateString();
};

const getCustomerStatus = (orders) => {
  if (!orders.length) return "inactive";
  const active = orders.some((o) => !["delivered","cancelled"].includes(o.status));
  if (active) return "active";
  const lastOrder = new Date(Math.max(...orders.map((o) => new Date(o.updatedAt))));
  const daysSince = (Date.now() - lastOrder) / 86400000;
  if (daysSince < 7) return "recent";
  return "inactive";
};

const STATUS_BADGE = {
  active:   { label: "Active Order", cls: "bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300", dot: "bg-amber-500" },
  recent:   { label: "Recent",       cls: "bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300",   dot: "bg-blue-500" },
  inactive: { label: "Inactive",     cls: "bg-gray-100 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400",   dot: "bg-gray-400" },
};

// ─── Customer Detail Modal ────────────────────────────────────────────────────

const CustomerDetailModal = ({ customer, onClose }) => {
  if (!customer) return null;
  const { orders, name, customerId } = customer;
  const sorted = [...orders].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
  const delivered = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length;
  const totalSpend = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).reduce((s,o) => s+(o.total||0), 0);
  const avgOrder = delivered > 0 ? totalSpend / delivered : 0;

  return (
    <Modal isOpen={!!customer} onClose={onClose} title={`${name} — Customer Profile`} footer={<Button variant="ghost" onClick={onClose}>Close</Button>}>
      {/* Profile */}
      <div className="flex items-center gap-4 p-4 bg-[#f8f8f8] dark:bg-[#430000] rounded-xl mb-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
          {name?.[0] || "?"}
        </div>
        <div>
          <p className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">{name}</p>
          <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] font-mono">ID: {customerId}</p>
          {orders[0]?.customerPhone && <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]"><FontAwesomeIcon icon={faPhone} className="text-[10px] mr-1" /> {orders[0].customerPhone}</p>}
          {orders[0]?.customerAddress && <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] truncate"><FontAwesomeIcon icon={faMapMarkerAlt} className="text-[10px] mr-1" /> {orders[0].customerAddress}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Orders", value: orders.length, icon: faClipboardList },
          { label: "Delivered", value: delivered, icon: faCheck },
          { label: "Total Spent", value: `$${totalSpend.toFixed(0)}`, icon: faDollarSign },
        ].map((s) => (
          <div key={s.label} className="text-center p-3 bg-[#f8f8f8] dark:bg-[#430000] rounded-xl">
            <div className="text-xl"><FontAwesomeIcon icon={s.icon} /></div>
            <div className="text-lg font-black text-[#1a0a0a] dark:text-[#f8f8f8]">{s.value}</div>
            <div className="text-[10px] text-[#9e7272]">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Avg order */}
      {avgOrder > 0 && (
        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-between">
          <span className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">Average Order Value</span>
          <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">${avgOrder.toFixed(2)}</span>
        </div>
      )}

      {/* Order history */}
      <div>
        <p className="text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a] uppercase tracking-wide mb-2">Order History</p>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {sorted.map((o) => (
            <div key={o.id} className="flex items-center justify-between text-sm p-2.5 bg-[#f8f8f8]/50 dark:bg-[#430000]/50 rounded-lg">
              <div>
                <span className="font-mono font-bold text-primary text-xs">{o.id}</span>
                <p className="text-xs text-[#9e7272]">{timeAgo(o.createdAt)} · {o.items?.length || 0} items</p>
              </div>
              <div className="text-right">
                <Badge status={o.status} />
                <p className="text-xs font-bold text-primary mt-0.5">${o.total?.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Favorite items */}
      {(() => {
        const itemMap = {};
        orders.forEach((o) => o.items?.forEach((item) => { itemMap[item.name] = (itemMap[item.name] || 0) + item.quantity; }));
        const favs = Object.entries(itemMap).sort((a,b) => b[1]-a[1]).slice(0,3);
        if (!favs.length) return null;
        return (
          <div className="mt-4">
            <p className="text-xs font-semibold text-[#6b4040] dark:text-[#c9a97a] uppercase tracking-wide mb-2">Top Ordered Items</p>
            <div className="flex flex-wrap gap-2">
              {favs.map(([name, count]) => (
                <span key={name} className="px-2.5 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  {name} ×{count}
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </Modal>
  );
};

// ─── Main ──────────────────────────────────────────────────────────────────────

const AdminCustomersPage = () => {
  const { orders } = useOrderStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("orders");
  const [detailCustomer, setDetailCustomer] = useState(null);

  // Build customer list from orders
  const customers = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const cid = o.customerId || "unknown";
      if (!map[cid]) {
        map[cid] = { customerId: cid, name: o.customerName || "Unknown", orders: [] };
      }
      map[cid].orders.push(o);
    });
    return Object.values(map);
  }, [orders]);

  const enriched = useMemo(() => {
    return customers.map((c) => {
      const sortedOrders = [...c.orders].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt));
      const lastOrder = sortedOrders[0];
      const totalSpend = c.orders.filter((o) => o.status===ORDER_STATUS.DELIVERED).reduce((s,o) => s+(o.total||0),0);
      const status = getCustomerStatus(c.orders);
      return { ...c, lastOrder, totalSpend, status };
    });
  }, [customers]);

  const filtered = enriched
    .filter((c) => {
      const q = search.toLowerCase();
      const matchQ = !q || c.name.toLowerCase().includes(q) || c.customerId.toLowerCase().includes(q);
      const matchS = statusFilter === "all" || c.status === statusFilter;
      return matchQ && matchS;
    })
    .sort((a,b) => {
      if (sortBy === "orders") return b.orders.length - a.orders.length;
      if (sortBy === "spend") return b.totalSpend - a.totalSpend;
      if (sortBy === "recent") return new Date(b.lastOrder?.createdAt||0) - new Date(a.lastOrder?.createdAt||0);
      return 0;
    });

  const totalRevenue = enriched.reduce((s,c) => s+c.totalSpend, 0);

  return (
    <DashboardLayout role="admin">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">Customers <FontAwesomeIcon icon={faUsers} className="text-primary" /></h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-0.5 text-sm">{customers.length} registered customers</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total",    value: customers.length, icon: faUsers, cls: "from-blue-500 to-blue-700" },
          { label: "Active Now", value: enriched.filter((c) => c.status==="active").length,   icon: faCircle, iconCls: "text-emerald-500", cls: "from-amber-500 to-orange-600" },
          { label: "Recent",   value: enriched.filter((c) => c.status==="recent").length,   icon: faClock, cls: "from-purple-500 to-purple-700" },
          { label: "Revenue",  value: `$${totalRevenue.toFixed(0)}`, icon: faDollarSign, cls: "from-emerald-500 to-teal-600" },
        ].map((k) => (
          <div key={k.label} className={`bg-gradient-to-br ${k.cls} rounded-2xl p-4 text-white shadow-lg`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest">{k.label}</p>
                <p className="text-2xl font-black mt-0.5">{k.value}</p>
              </div>
              <span className={`text-2xl opacity-80 ${k.iconCls || ""}`}><FontAwesomeIcon icon={k.icon} /></span>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card className="mb-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9e7272]"><FontAwesomeIcon icon={faSearch} /></span>
            <input type="text" placeholder="Search by name or ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input w-full sm:w-40">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="recent">Recent</option>
            <option value="inactive">Inactive</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input w-full sm:w-44">
            <option value="orders">Sort: Most Orders</option>
            <option value="spend">Sort: Highest Spend</option>
            <option value="recent">Sort: Most Recent</option>
          </select>
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={faUsers} title="No customers found" description="Try adjusting your search or filter"
          action={<Button variant="secondary" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Clear Filters</Button>} />
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Status</th>
                <th>Total Orders</th>
                <th>Total Spent</th>
                <th>Last Order</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const sb = STATUS_BADGE[c.status];
                return (
                  <tr key={c.customerId}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {c.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">{c.name}</p>
                          <p className="text-xs text-[#9e7272] font-mono">{c.customerId?.slice(0,12)}…</p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={clsx("inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full", sb.cls)}>
                        <span className={clsx("w-1.5 h-1.5 rounded-full", sb.dot)} />
                        {sb.label}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">{c.orders.length}</span>
                      <span className="text-xs text-[#9e7272] ml-1">orders</span>
                    </td>
                    <td>
                      <span className="font-bold text-primary">${c.totalSpend.toFixed(2)}</span>
                    </td>
                    <td>
                      <div>
                        <p className="text-sm text-[#1a0a0a] dark:text-[#f8f8f8]">{timeAgo(c.lastOrder?.createdAt)}</p>
                        {c.lastOrder && <Badge status={c.lastOrder.status} />}
                      </div>
                    </td>
                    <td>
                      <Button variant="outline" size="sm" onClick={() => setDetailCustomer(c)}>
                        View History
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Detail */}
      <CustomerDetailModal customer={detailCustomer} onClose={() => setDetailCustomer(null)} />
    </DashboardLayout>
  );
};

export default AdminCustomersPage;
