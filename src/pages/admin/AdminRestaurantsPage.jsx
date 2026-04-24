import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faCheckCircle,
  faChevronLeft,
  faChevronRight,
  faClock,
  faEllipsisV,
  faEdit,
  faPlus,
  faPowerOff,
  faSearch,
  faSlidersH,
  faStar,
  faTrash,
  faTrendingUp,
  faUtensils,
  faTimesCircle,
} from "@/utils/icons";
import { DashboardLayout } from "@/layouts";
import { Badge, Button, Card, EmptyState, Modal } from "@/components";
import { useAppStore, useMarketplaceStore } from "@/store";
import adminMarketplaceApi from "@/services/adminMarketplaceApi";

const PAGE_SIZE = 8;

/* ─── Stat card ─────────────────────────────────────────── */
const StatCard = ({ icon, label, value, sub, color }) => (
  <Motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden rounded-2xl p-5 border ${color.border} ${color.bg}`}
  >
    <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full opacity-10 blur-2xl bg-current" />
    <div className={`inline-flex p-2 rounded-xl mb-3 ${color.icon}`}><FontAwesomeIcon icon={icon} /></div>
    <p className="text-2xl font-black text-[#1a0a0a] dark:text-white">{value}</p>
    <p className="text-xs font-semibold uppercase tracking-widest text-[#6b4040] dark:text-[#c9a97a] mt-0.5">{label}</p>
    {sub && <p className="text-xs text-[#9e7272] mt-1">{sub}</p>}
  </Motion.div>
);

/* ─── Row actions dropdown ───────────────────────────────── */
const RowActions = ({ restaurant, onEdit, onMenu, onToggle, onDelete }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]/50 transition-colors text-[#6b4040]"
      >
        <FontAwesomeIcon icon={faEllipsisV} className="text-sm" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <Motion.div
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.12 }}
              className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-[#E5D0AC] dark:border-[#3d1a1a] bg-white dark:bg-[#430000] shadow-2xl overflow-hidden"
            >
              {[
                { label: "Edit", icon: <FontAwesomeIcon icon={faEdit} className="text-[11px]" />, onClick: onEdit },
                { label: "Manage Menu", icon: <FontAwesomeIcon icon={faUtensils} className="text-[11px]" />, onClick: onMenu },
                {
                  label: restaurant.isActive ? "Deactivate" : "Activate",
                  icon: <FontAwesomeIcon icon={faPowerOff} className="text-[11px]" />,
                  onClick: onToggle,
                },
                { label: "Delete", icon: <FontAwesomeIcon icon={faTrash} className="text-[11px]" />, onClick: onDelete, danger: true },
              ].map(({ label, icon, onClick, danger }) => (
                <button
                  key={label}
                  onClick={() => { onClick(); setOpen(false); }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                    danger
                      ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                      : "text-[#1a0a0a] dark:text-[#f8f8f8] hover:bg-[#f8f8f8] dark:hover:bg-[#3d1a1a]"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </Motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ─── Main page ──────────────────────────────────────────── */
const AdminRestaurantsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useAppStore();
  const {
    restaurants,
    getProductsByRestaurant,
    deleteRestaurant,
    setRestaurantActive,
    bulkUpdateRestaurantsActive,
  } = useMarketplaceStore();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [restaurantToDelete, setRestaurantToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ── derived stats ── */
  const activeCount = restaurants.filter((r) => r.isActive).length;
  const inactiveCount = restaurants.length - activeCount;
  const avgRating =
    restaurants.length
      ? (restaurants.reduce((sum, r) => sum + (r.rating || 0), 0) / restaurants.length).toFixed(1)
      : "—";
  const totalMenuItems = restaurants.reduce(
    (sum, r) => sum + getProductsByRestaurant(r.id).length,
    0,
  );

  const categories = useMemo(() => {
    const unique = new Set(restaurants.map((r) => r.category).filter(Boolean));
    return ["all", ...Array.from(unique)];
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        const q = search.toLowerCase();
        const matchSearch =
          !search ||
          r.name.toLowerCase().includes(q) ||
          (r.description || "").toLowerCase().includes(q) ||
          (r.location || "").toLowerCase().includes(q);
        const matchStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "active"
            ? r.isActive
            : !r.isActive;
        const matchCat = categoryFilter === "all" || r.category === categoryFilter;
        return matchSearch && matchStatus && matchCat;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [restaurants, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRestaurants.length / PAGE_SIZE));
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleSelection = (id) =>
    setSelectedIds((cur) =>
      cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id],
    );

  const isAllCurrentPage =
    paginatedRestaurants.length > 0 &&
    paginatedRestaurants.every((r) => selectedIds.includes(r.id));

  const toggleSelectAll = () => {
    const ids = paginatedRestaurants.map((r) => r.id);
    if (isAllCurrentPage) {
      setSelectedIds((cur) => cur.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((cur) => Array.from(new Set([...cur, ...ids])));
    }
  };

  const runBulk = (active) => {
    if (!selectedIds.length) return;
    bulkUpdateRestaurantsActive(selectedIds, active);
    setSelectedIds([]);
    addToast({
      type: "success",
      title: "Bulk update done",
      message: `${selectedIds.length} restaurant(s) ${active ? "activated" : "deactivated"}.`,
    });
  };

  const handleToggleActive = (restaurant) => {
    const next = !restaurant.isActive;
    setRestaurantActive(restaurant.id, next);
    addToast({
      type: "success",
      title: "Status updated",
      message: `${restaurant.name} is now ${next ? "active" : "inactive"}.`,
    });
  };

  const handleDelete = async () => {
    if (!restaurantToDelete) return;
    setIsDeleting(true);
    deleteRestaurant(restaurantToDelete.id);
    await adminMarketplaceApi.deleteRestaurant(restaurantToDelete.id);
    setIsDeleting(false);
    setRestaurantToDelete(null);
    addToast({
      type: "success",
      title: "Restaurant deleted",
      message: "Restaurant and its menu items were removed.",
    });
  };

  return (
    <DashboardLayout role="admin">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-black text-[#1a0a0a] dark:text-white">
            Restaurants
          </h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-1">
            {restaurants.length} total · {activeCount} active
          </p>
        </div>
        <Link to="/admin/restaurants/create">
          <Button variant="primary" icon={<FontAwesomeIcon icon={faPlus} className="text-xs" />}>
            Add Restaurant
          </Button>
        </Link>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={faBuilding}
          label="Total"
          value={restaurants.length}
          sub="all restaurants"
          color={{
            border: "border-blue-200 dark:border-blue-900/40",
            bg: "bg-blue-50/60 dark:bg-blue-900/10",
            icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
          }}
        />
        <StatCard
          icon={faCheckCircle}
          label="Active"
          value={activeCount}
          sub="open for orders"
          color={{
            border: "border-emerald-200 dark:border-emerald-900/40",
            bg: "bg-emerald-50/60 dark:bg-emerald-900/10",
            icon: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
          }}
        />
        <StatCard
          icon={faTimesCircle}
          label="Inactive"
          value={inactiveCount}
          sub="closed / paused"
          color={{
            border: "border-gray-200 dark:border-gray-700",
            bg: "bg-gray-50/60 dark:bg-gray-900/10",
            icon: "bg-gray-100 dark:bg-gray-800 text-gray-500",
          }}
        />
        <StatCard
          icon={faUtensils}
          label="Menu Items"
          value={totalMenuItems}
          sub={<>avg {avgRating} <FontAwesomeIcon icon={faStar} className="text-amber-500" /> rating</>}
          color={{
            border: "border-primary/20",
            bg: "bg-primary/5",
            icon: "bg-primary/10 text-primary",
          }}
        />
      </div>

      {/* ── Filters ── */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <label className="input flex items-center gap-2 flex-1">
            <FontAwesomeIcon icon={faSearch} className="text-[#9e7272] flex-shrink-0 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              placeholder="Search by name, location or description…"
              className="w-full bg-transparent outline-none text-sm"
            />
          </label>

          <label className="input flex items-center gap-2 w-full md:w-44">
            <FontAwesomeIcon icon={faSlidersH} className="text-[#9e7272] flex-shrink-0 text-xs" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent outline-none text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>

          <label className="input flex items-center gap-2 w-full md:w-52">
            <FontAwesomeIcon icon={faBuilding} className="text-[#9e7272] flex-shrink-0 text-xs" />
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full bg-transparent outline-none text-sm"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Bulk actions */}
        <AnimatePresence>
          {selectedIds.length > 0 && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-[#E5D0AC] dark:border-[#3d1a1a]"
            >
              <span className="text-sm font-semibold text-[#6b4040] dark:text-[#c9a97a] mr-1">
                {selectedIds.length} selected
              </span>
              <Button variant="outline" size="sm" onClick={() => runBulk(true)}>
                <FontAwesomeIcon icon={faCheckCircle} className="text-[11px]" /> Set Active
              </Button>
              <Button variant="outline" size="sm" onClick={() => runBulk(false)}>
                <FontAwesomeIcon icon={faTimesCircle} className="text-[11px]" /> Set Inactive
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setSelectedIds([])}
              >
                Clear
              </Button>
            </Motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* ── Table / Empty ── */}
      {filteredRestaurants.length === 0 ? (
        <EmptyState
          icon={faBuilding}
          title="No restaurants found"
          description="Try adjusting your search or filters, or create your first restaurant."
          action={
            <Link to="/admin/restaurants/create">
              <Button variant="primary" icon={<FontAwesomeIcon icon={faPlus} className="text-xs" />}>
                Add Restaurant
              </Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={isAllCurrentPage}
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th>Restaurant</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faClock} className="text-xs" /> Delivery
                    </span>
                  </th>
                  <th>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faStar} className="text-xs" /> Rating
                    </span>
                  </th>
                  <th>
                    <span className="flex items-center gap-1">
                      <FontAwesomeIcon icon={faUtensils} className="text-xs" /> Menu
                    </span>
                  </th>
                  <th>Tags</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {paginatedRestaurants.map((restaurant, idx) => {
                    const menuCount = getProductsByRestaurant(restaurant.id).length;
                    return (
                      <Motion.tr
                        key={restaurant.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(restaurant.id)}
                            onChange={() => toggleSelection(restaurant.id)}
                            className="rounded"
                          />
                        </td>

                        {/* Name + image */}
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 ring-1 ring-[#E5D0AC] dark:ring-[#3d1a1a]">
                              {restaurant.image ? (
                                <img
                                  src={restaurant.image}
                                  alt={restaurant.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#9e7272]">
                                  <FontAwesomeIcon icon={faBuilding} className="text-lg" />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-[#1a0a0a] dark:text-white text-sm">
                                {restaurant.name}
                              </p>
                              <p className="text-xs text-[#9e7272] truncate max-w-[160px]">
                                {restaurant.location || "—"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#E5D0AC]/50 dark:bg-[#3d1a1a] text-[#6b4040] dark:text-[#c9a97a]">
                            {restaurant.category}
                          </span>
                        </td>

                        <td>
                          <button
                            onClick={() => handleToggleActive(restaurant)}
                            title="Click to toggle status"
                          >
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                                restaurant.isActive
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                  : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  restaurant.isActive ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                                }`}
                              />
                              {restaurant.isActive ? "Active" : "Inactive"}
                            </span>
                          </button>
                        </td>

                        <td>
                          <span className="flex items-center gap-1 text-sm text-[#1a0a0a] dark:text-white">
                            <FontAwesomeIcon icon={faClock} className="text-[#9e7272] text-[11px]" />
                            {restaurant.deliveryTime} min
                          </span>
                        </td>

                        <td>
                          <span className="flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400">
                            <FontAwesomeIcon icon={faStar} className="text-[11px]" />
                            {restaurant.rating || "—"}
                          </span>
                        </td>

                        <td>
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1a0a0a] dark:text-white">
                            <FontAwesomeIcon icon={faTrendingUp} className="text-[#9e7272] text-[11px]" />
                            {menuCount}
                          </span>
                        </td>

                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {(restaurant.tags || []).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td className="text-right">
                          <RowActions
                            restaurant={restaurant}
                            onEdit={() => navigate(`/admin/restaurants/${restaurant.id}/edit`)}
                            onMenu={() => navigate(`/admin/restaurants/${restaurant.id}/menu`)}
                            onToggle={() => handleToggleActive(restaurant)}
                            onDelete={() => setRestaurantToDelete(restaurant)}
                          />
                        </td>
                      </Motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* ── Pagination ── */}
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
              Showing{" "}
              <span className="font-semibold text-[#1a0a0a] dark:text-white">
                {Math.min((currentPage - 1) * PAGE_SIZE + 1, filteredRestaurants.length)}–
                {Math.min(currentPage * PAGE_SIZE, filteredRestaurants.length)}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-[#1a0a0a] dark:text-white">
                {filteredRestaurants.length}
              </span>
            </p>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                icon={<FontAwesomeIcon icon={faChevronLeft} className="text-xs" />}
              >
                Prev
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all ${
                    currentPage === i + 1
                      ? "bg-primary text-white shadow-md"
                      : "text-[#6b4040] hover:bg-[#E5D0AC]/50 dark:hover:bg-[#3d1a1a]"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                iconRight={<FontAwesomeIcon icon={faChevronRight} className="text-xs" />}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      {/* ── Delete confirmation modal ── */}
      <Modal
        isOpen={Boolean(restaurantToDelete)}
        onClose={() => setRestaurantToDelete(null)}
        title="Delete Restaurant"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setRestaurantToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button variant="danger" loading={isDeleting} onClick={handleDelete}>
              Yes, Delete
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faTrash} className="text-red-500 text-2xl" />
          </div>
          <div>
            <p className="font-semibold text-[#1a0a0a] dark:text-white text-lg">
              Delete "{restaurantToDelete?.name}"?
            </p>
            <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-1">
              This will permanently remove the restaurant and all its menu items. This
              action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminRestaurantsPage;
