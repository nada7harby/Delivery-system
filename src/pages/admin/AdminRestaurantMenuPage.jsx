import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as yup from "yup";
import { ArrowLeft, Pencil, Plus, Trash2 } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { Button, Card, EmptyState, Input, Modal } from "@/components";
import { useAppStore, useMarketplaceStore } from "@/store";
import adminMarketplaceApi from "@/services/adminMarketplaceApi";

const menuItemSchema = yup.object({
  name: yup.string().trim().required("Item name is required"),
  description: yup.string().max(240, "Description is too long"),
  price: yup
    .number()
    .typeError("Price must be a number")
    .min(0.1, "Price must be greater than 0")
    .required("Price is required"),
  category: yup.string().required("Category is required"),
  image: yup.string().url("Image must be a valid URL").nullable(),
  isAvailable: yup.boolean().required(),
});

const initialItemForm = {
  name: "",
  description: "",
  price: "",
  category: "General",
  image: "",
  isAvailable: true,
};

const AdminRestaurantMenuPage = () => {
  const { id } = useParams();
  const { addToast } = useAppStore();
  const {
    getRestaurantById,
    getProductsByRestaurant,
    getMenuGroupedByCategory,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
  } = useMarketplaceStore();

  const restaurant = getRestaurantById(id);
  const menuItems = getProductsByRestaurant(id);
  const groupedMenu = getMenuGroupedByCategory(id);

  const categoryOptions = useMemo(() => {
    const categories = new Set(menuItems.map((item) => item.category));
    return ["General", ...Array.from(categories)];
  }, [menuItems]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [form, setForm] = useState(initialItemForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingItem(null);
    setForm(initialItemForm);
    setErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category || "General",
      image: item.image || "",
      isAvailable: item.isAvailable ?? true,
    });
    setErrors({});
    setIsModalOpen(true);
  };

  const validate = async () => {
    try {
      const validated = await menuItemSchema.validate(form, {
        abortEarly: false,
      });
      setErrors({});
      return validated;
    } catch (error) {
      const fieldErrors = {};
      error.inner?.forEach((entry) => {
        if (!entry.path) return;
        fieldErrors[entry.path] = entry.message;
      });
      setErrors(fieldErrors);
      return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validated = await validate();
    if (!validated || !restaurant) return;

    setIsSubmitting(true);

    if (editingItem) {
      updateMenuItem(editingItem.id, validated);
      const { synced } = await adminMarketplaceApi.updateMenuItem(
        editingItem.id,
        validated,
      );

      addToast({
        type: "success",
        title: "Menu item updated",
        message: synced
          ? "Changes synced successfully."
          : "Changes saved locally (offline mode).",
      });
    } else {
      addMenuItem(restaurant.id, validated);
      const { synced } = await adminMarketplaceApi.createMenuItem(
        restaurant.id,
        validated,
      );

      addToast({
        type: "success",
        title: "Menu item added",
        message: synced
          ? "Item synced successfully."
          : "Item saved locally (offline mode).",
      });
    }

    setIsSubmitting(false);
    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    deleteMenuItem(itemToDelete.id);
    await adminMarketplaceApi.deleteMenuItem(itemToDelete.id);

    setItemToDelete(null);
    addToast({
      type: "success",
      title: "Menu item deleted",
      message: "Item removed from restaurant menu.",
    });
  };

  if (!restaurant) {
    return (
      <DashboardLayout role="admin">
        <EmptyState
          icon="🍽️"
          title="Restaurant not found"
          description="Please go back and select an existing restaurant."
          action={
            <Link to="/admin/restaurants">
              <Button variant="primary">Back to Restaurants</Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8]">
            Manage Menu · {restaurant.name}
          </h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-1">
            {menuItems.length} item(s) in this restaurant menu
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/restaurants">
            <Button variant="outline" icon={<ArrowLeft size={16} />}>
              Back
            </Button>
          </Link>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={openAddModal}
          >
            Add Item
          </Button>
        </div>
      </div>

      {menuItems.length === 0 ? (
        <EmptyState
          icon="📭"
          title="Restaurant has no menu"
          description="Add the first menu item to make this restaurant order-ready."
          action={
            <Button variant="primary" onClick={openAddModal}>
              Add First Item
            </Button>
          }
        />
      ) : (
        <div className="space-y-5">
          {Object.entries(groupedMenu).map(([category, items]) => (
            <Card key={category}>
              <h2 className="font-display text-lg font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-3">
                {category}
              </h2>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#E5D0AC] dark:border-[#3d1a1a] p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
                          {item.name}
                        </p>
                        <p className="text-xs text-[#6b4040] dark:text-[#c9a97a] mt-1 line-clamp-2">
                          {item.description || "No description"}
                        </p>
                        <p className="font-bold text-primary mt-2">
                          ${Number(item.price).toFixed(2)}
                        </p>
                      </div>

                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={`text-[11px] px-2 py-1 rounded-full font-semibold ${
                          item.isAvailable ?? true
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {item.isAvailable ?? true ? "Available" : "Unavailable"}
                      </span>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Pencil size={13} />}
                        onClick={() => openEditModal(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={13} />}
                        onClick={() => setItemToDelete(item)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? "Edit Menu Item" : "Add Menu Item"}
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isSubmitting}
              onClick={handleSubmit}
            >
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) =>
              setForm((state) => ({ ...state, name: event.target.value }))
            }
            error={errors.name}
            required
          />

          <Input
            label="Price"
            type="number"
            value={form.price}
            onChange={(event) =>
              setForm((state) => ({ ...state, price: event.target.value }))
            }
            error={errors.price}
            required
          />

          <div>
            <label className="input-label">Category</label>
            <input
              type="text"
              list="menu-category-options"
              value={form.category}
              onChange={(event) =>
                setForm((state) => ({ ...state, category: event.target.value }))
              }
              className="input"
            />
            <datalist id="menu-category-options">
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
            {errors.category && (
              <p className="text-xs text-red-500 mt-1">{errors.category}</p>
            )}
          </div>

          <Input
            label="Image URL"
            value={form.image}
            onChange={(event) =>
              setForm((state) => ({ ...state, image: event.target.value }))
            }
            error={errors.image}
            placeholder="https://..."
          />

          <div>
            <label className="input-label">Description</label>
            <textarea
              value={form.description}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  description: event.target.value,
                }))
              }
              className="input min-h-[90px]"
              placeholder="Menu item description"
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="input-label">Availability</label>
            <select
              value={String(form.isAvailable)}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  isAvailable: event.target.value === "true",
                }))
              }
              className="input"
            >
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(itemToDelete)}
        onClose={() => setItemToDelete(null)}
        title="Delete Menu Item"
        footer={
          <>
            <Button variant="ghost" onClick={() => setItemToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Confirm Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-[#6b4040] dark:text-[#c9a97a]">
          Are you sure you want to delete
          <span className="font-semibold text-[#1a0a0a] dark:text-[#f8f8f8]">
            {" "}
            {itemToDelete?.name}
          </span>
          ?
        </p>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminRestaurantMenuPage;
