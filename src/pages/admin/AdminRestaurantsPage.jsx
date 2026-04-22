import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Pencil, Plus, Trash2, Utensils } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { Badge, Button, Card, EmptyState, Modal } from "@/components";
import { useAppStore, useMarketplaceStore } from "@/store";
import adminMarketplaceApi from "@/services/adminMarketplaceApi";

const PAGE_SIZE = 6;

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

  const categories = useMemo(() => {
    const unique = new Set(
      restaurants.map((restaurant) => restaurant.category),
    );
    return ["all", ...Array.from(unique)];
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((restaurant) => {
        const normalizedSearch = search.toLowerCase();
        const matchesSearch =
          !search ||
          restaurant.name.toLowerCase().includes(normalizedSearch) ||
          (restaurant.description || "")
            .toLowerCase()
            .includes(normalizedSearch) ||
          (restaurant.location || "").toLowerCase().includes(normalizedSearch);

        const matchesStatus =
          statusFilter === "all"
            ? true
            : statusFilter === "active"
            ? restaurant.isActive
            : !restaurant.isActive;

        const matchesCategory =
          categoryFilter === "all" || restaurant.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [restaurants, search, statusFilter, categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRestaurants.length / PAGE_SIZE),
  );
  const paginatedRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleSelection = (restaurantId) => {
    setSelectedIds((current) =>
      current.includes(restaurantId)
        ? current.filter((id) => id !== restaurantId)
        : [...current, restaurantId],
    );
  };

  const toggleSelectAllCurrentPage = () => {
    const currentIds = paginatedRestaurants.map((restaurant) => restaurant.id);
    const isAllSelected = currentIds.every((id) => selectedIds.includes(id));

    if (isAllSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !currentIds.includes(id)),
      );
      return;
    }

    setSelectedIds((current) =>
      Array.from(new Set([...current, ...currentIds])),
    );
  };

  const runBulkStatusAction = (nextStatus) => {
    if (!selectedIds.length) return;

    bulkUpdateRestaurantsActive(selectedIds, nextStatus);
    setSelectedIds([]);
    addToast({
      type: "success",
      title: "Bulk update completed",
      message: `Updated ${selectedIds.length} restaurant(s).`,
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
      message: "Restaurant and linked menu items were removed.",
    });
  };

  const isAllCurrentPageSelected =
    paginatedRestaurants.length > 0 &&
    paginatedRestaurants.every((restaurant) =>
      selectedIds.includes(restaurant.id),
    );

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
            Restaurants Management
          </h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-1">
            {filteredRestaurants.length} of {restaurants.length} restaurants
          </p>
        </div>

        <Link to="/admin/restaurants/create">
          <Button variant="primary" icon={<Plus size={16} />}>
            Add Restaurant
          </Button>
        </Link>
      </div>

      <Card className="mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          <input
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search restaurants..."
            className="input flex-1"
          />

          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="input w-full lg:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setCurrentPage(1);
            }}
            className="input w-full lg:w-56"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => runBulkStatusAction(true)}
            disabled={!selectedIds.length}
          >
            Set Active ({selectedIds.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => runBulkStatusAction(false)}
            disabled={!selectedIds.length}
          >
            Set Inactive ({selectedIds.length})
          </Button>
        </div>
      </Card>

      {filteredRestaurants.length === 0 ? (
        <EmptyState
          icon="🏪"
          title="No restaurants found"
          description="Try changing search/filter or create your first restaurant."
          action={
            <Link to="/admin/restaurants/create">
              <Button variant="primary">Create Restaurant</Button>
            </Link>
          }
        />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={isAllCurrentPageSelected}
                      onChange={toggleSelectAllCurrentPage}
                    />
                  </th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Delivery</th>
                  <th>Menu Items</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRestaurants.map((restaurant) => {
                  const menuCount = getProductsByRestaurant(restaurant.id)
                    .length;

                  return (
                    <tr key={restaurant.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(restaurant.id)}
                          onChange={() => toggleSelection(restaurant.id)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {restaurant.image ? (
                              <img
                                src={restaurant.image}
                                alt={restaurant.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#9e7272]">
                                <Building2 size={16} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold">{restaurant.name}</p>
                            <p className="text-xs text-[#6b4040] dark:text-[#c9a97a]">
                              {restaurant.location || "Unknown location"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>{restaurant.category}</td>
                      <td>
                        <button
                          onClick={() => {
                            const nextActive = !restaurant.isActive;
                            setRestaurantActive(restaurant.id, nextActive);
                            addToast({
                              type: "success",
                              title: "Status updated",
                              message: `${restaurant.name} is now ${
                                nextActive ? "active" : "inactive"
                              }.`,
                            });
                          }}
                        >
                          <Badge
                            label={restaurant.isActive ? "Active" : "Inactive"}
                            className={
                              restaurant.isActive
                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }
                          />
                        </button>
                      </td>
                      <td>{restaurant.deliveryTime} min</td>
                      <td>
                        <span className="text-sm font-semibold">
                          {menuCount}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/admin/restaurants/${restaurant.id}/menu`,
                              )
                            }
                            icon={<Utensils size={14} />}
                          >
                            Menu
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/admin/restaurants/${restaurant.id}/edit`,
                              )
                            }
                            icon={<Pencil size={14} />}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setRestaurantToDelete(restaurant)}
                            icon={<Trash2 size={14} />}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

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
            <Button
              variant="danger"
              loading={isDeleting}
              onClick={handleDelete}
            >
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
          Are you sure you want to delete
          <span className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
            {" "}
            {restaurantToDelete?.name}
          </span>
          ? This will also remove its menu items.
        </p>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminRestaurantsPage;
