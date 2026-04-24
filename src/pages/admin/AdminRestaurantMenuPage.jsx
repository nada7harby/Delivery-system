import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faChevronDown,
  faDollarSign,
  faImage,
  faEdit,
  faPlus,
  faSearch,
  faTag,
  faTrash,
  faUpload,
  faUtensils,
  faInbox,
  faExclamationTriangle,
} from "@/utils/icons";
import { DashboardLayout } from "@/layouts";
import { Button, Card, EmptyState, Input, Modal } from "@/components";
import { useAppStore, useMarketplaceStore } from "@/store";
import adminMarketplaceApi from "@/services/adminMarketplaceApi";

/* ─── Validation ────────────────────────────────────────── */
const menuSchema = yup.object({
  name: yup.string().trim().required("Item name is required"),
  description: yup.string().max(240, "Max 240 characters"),
  price: yup
    .number()
    .typeError("Must be a number")
    .min(0.01, "Price must be greater than 0")
    .required("Price is required"),
  category: yup.string().required("Category is required"),
  image: yup
    .string()
    .url("Must be a valid URL")
    .nullable()
    .transform((v) => v || null),
  isAvailable: yup.boolean().required(),
});

const DEFAULT_FORM = {
  name: "",
  description: "",
  price: "",
  category: "General",
  image: "",
  isAvailable: true,
};

/* ─── Menu item card ────────────────────────────────────── */
const MenuItemCard = ({ item, onEdit, onDelete }) => (
  <Motion.div
    layout
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.96 }}
    className="group relative rounded-2xl border border-[#E5D0AC] dark:border-[#3d1a1a] bg-white dark:bg-[#430000]/60 overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all duration-300"
  >
    {/* Image */}
    <div className="h-36 bg-gray-100 dark:bg-gray-900 overflow-hidden relative">
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[#9e7272] opacity-40">
          <FontAwesomeIcon icon={faUtensils} className="text-2xl opacity-40" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Availability badge */}
      <span
        className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
          item.isAvailable ?? true
            ? "bg-emerald-100/90 text-emerald-700"
            : "bg-gray-200/90 text-gray-600"
        }`}
      >
        {item.isAvailable ?? true ? "Available" : "Unavailable"}
      </span>
    </div>

    <div className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[#1a0a0a] dark:text-white text-sm truncate">{item.name}</p>
          {item.description && (
            <p className="text-xs text-[#9e7272] mt-0.5 line-clamp-2">{item.description}</p>
          )}
        </div>
        <p className="font-black text-primary text-base flex-shrink-0">
          ${Number(item.price).toFixed(2)}
        </p>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          icon={<FontAwesomeIcon icon={faEdit} className="text-xs" />}
          onClick={() => onEdit(item)}
          className="flex-1"
        >
          Edit
        </Button>
        <Button
          variant="danger"
          size="sm"
          icon={<FontAwesomeIcon icon={faTrash} className="text-xs" />}
          onClick={() => onDelete(item)}
        >
          Delete
        </Button>
      </div>
    </div>
  </Motion.div>
);

/* ─── Category section ───────────────────────────────────── */
const CategorySection = ({ category, items, onEdit, onDelete }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f8f8f8] dark:hover:bg-[#3d1a1a]/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#1a0a0a] dark:text-white">{category}</span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {items.length}
          </span>
        </div>
        <Motion.div animate={{ rotate: collapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
          <FontAwesomeIcon icon={faChevronDown} className="text-[#9e7272] text-sm" />
        </Motion.div>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <Motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {items.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};

/* ─── Field wrapper ─────────────────────────────────────── */
const Field = ({ label, error, required, children, hint }) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label className="input-label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    )}
    {children}
    {hint && !error && <p className="text-xs text-[#9e7272]">{hint}</p>}
    {error && <p className="text-xs text-red-500"><FontAwesomeIcon icon={faExclamationTriangle} className="mr-1" /> {error}</p>}
  </div>
);

/* ─── Main component ────────────────────────────────────── */
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [previewSrc, setPreviewSrc] = useState("");
  const [search, setSearch] = useState("");
  const fileRef = useRef(null);

  const categoryOptions = useMemo(() => {
    const cats = new Set(menuItems.map((i) => i.category).filter(Boolean));
    return ["General", "Burgers", "Pizza", "Drinks", "Starters", "Salads", "Desserts", ...Array.from(cats)];
  }, [menuItems]);

  /* ── React Hook Form ── */
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(menuSchema),
    defaultValues: DEFAULT_FORM,
  });

  const imageUrl = watch("image");

  const openAddModal = () => {
    setEditingItem(null);
    reset(DEFAULT_FORM);
    setPreviewSrc("");
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    reset({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category || "General",
      image: item.image || "",
      isAvailable: item.isAvailable ?? true,
    });
    setPreviewSrc(item.image || "");
    setIsModalOpen(true);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      setPreviewSrc(dataUrl);
      setValue("image", dataUrl, { shouldValidate: false });
    };
    reader.onerror = () =>
      addToast({ type: "error", title: "Upload failed", message: "Could not load image." });
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data) => {
    if (!restaurant) return;

    if (editingItem) {
      updateMenuItem(editingItem.id, data);
      const { synced } = await adminMarketplaceApi.updateMenuItem(editingItem.id, data);
      addToast({
        type: "success",
        title: "Item updated",
        message: synced ? "Synced." : "Saved locally.",
      });
    } else {
      addMenuItem(restaurant.id, data);
      const { synced } = await adminMarketplaceApi.createMenuItem(restaurant.id, data);
      addToast({
        type: "success",
        title: "Item added",
        message: synced ? "Item is live." : "Saved locally.",
      });
    }

    setIsModalOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    deleteMenuItem(itemToDelete.id);
    await adminMarketplaceApi.deleteMenuItem(itemToDelete.id);
    setItemToDelete(null);
    addToast({ type: "success", title: "Item deleted", message: "Menu item removed." });
  };

  /* Filtered grouped menu for search */
  const filteredGrouped = useMemo(() => {
    if (!search) return groupedMenu;
    const q = search.toLowerCase();
    const result = {};
    Object.entries(groupedMenu).forEach(([cat, items]) => {
      const filtered = items.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description || "").toLowerCase().includes(q),
      );
      if (filtered.length) result[cat] = filtered;
    });
    return result;
  }, [groupedMenu, search]);

  /* ── Not found ── */
  if (!restaurant) {
    return (
      <DashboardLayout role="admin">
        <EmptyState
          icon={faUtensils}
          title="Restaurant not found"
          description="The restaurant you're looking for no longer exists."
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
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          {restaurant.image && (
            <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-[#E5D0AC] dark:ring-[#3d1a1a] flex-shrink-0">
              <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
            </div>
          )}
          <div>
            <h1 className="font-display text-2xl font-black text-[#1a0a0a] dark:text-white">
              {restaurant.name}
            </h1>
            <p className="text-[#6b4040] dark:text-[#c9a97a] mt-0.5">
              {menuItems.length} menu item{menuItems.length !== 1 && "s"} ·{" "}
              {restaurant.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/admin/restaurants">
            <Button variant="outline" icon={<FontAwesomeIcon icon={faArrowLeft} className="text-xs" />}>
              Back
            </Button>
          </Link>
          <Button variant="primary" icon={<FontAwesomeIcon icon={faPlus} className="text-xs" />} onClick={openAddModal}>
            Add Item
          </Button>
        </div>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          {
            label: "Total Items",
            value: menuItems.length,
            color: "text-blue-600 dark:text-blue-400",
          },
          {
            label: "Available",
            value: menuItems.filter((i) => i.isAvailable ?? true).length,
            color: "text-emerald-600 dark:text-emerald-400",
          },
          {
            label: "Categories",
            value: Object.keys(groupedMenu).length,
            color: "text-primary",
          },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-[#E5D0AC] dark:border-[#3d1a1a] bg-white dark:bg-[#430000]/50 p-4 text-center"
          >
            <p className={`text-2xl font-black ${color}`}>{value}</p>
            <p className="text-xs text-[#9e7272] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Search ── */}
      {menuItems.length > 0 && (
        <div className="mb-5">
          <label className="input flex items-center gap-2 max-w-xs">
            <FontAwesomeIcon icon={faSearch} className="text-[#9e7272] text-xs" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items…"
              className="bg-transparent outline-none text-sm w-full"
            />
          </label>
        </div>
      )}

      {/* ── Menu grouped ── */}
      {menuItems.length === 0 ? (
        <EmptyState
          icon={faInbox}
          title="No menu items yet"
          description="Add the first item to make this restaurant order-ready."
          action={
            <Button variant="primary" icon={<FontAwesomeIcon icon={faPlus} className="text-xs" />} onClick={openAddModal}>
              Add First Item
            </Button>
          }
        />
      ) : Object.keys(filteredGrouped).length === 0 ? (
        <EmptyState
          icon={faSearch}
          title="No results"
          description={`No menu items match "${search}"`}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(filteredGrouped).map(([category, items]) => (
            <CategorySection
              key={category}
              category={category}
              items={items}
              onEdit={openEditModal}
              onDelete={setItemToDelete}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
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
              onClick={handleSubmit(onSubmit)}
            >
              {editingItem ? "Save Changes" : "Add Item"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Item Name"
              required
              error={errors.name?.message}
              {...register("name")}
              placeholder="e.g. Smoked Double Burger"
            />

            <Input
              label="Price ($)"
              type="number"
              required
              error={errors.price?.message}
              icon={<FontAwesomeIcon icon={faDollarSign} className="text-xs" />}
              {...register("price")}
              min={0.01}
              step={0.01}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Category" required error={errors.category?.message}>
              <input
                type="text"
                list="menu-category-list"
                className="input"
                {...register("category")}
                placeholder="e.g. Burgers, Pizza…"
              />
              <datalist id="menu-category-list">
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </Field>

            <Field label="Availability">
              <select
                className="input"
                {...register("isAvailable")}
                onChange={(e) =>
                  setValue("isAvailable", e.target.value === "true")
                }
                value={String(watch("isAvailable"))}
              >
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </Field>
          </div>

          <Field label="Description" error={errors.description?.message}>
            <textarea
              className="input min-h-[80px] resize-none"
              {...register("description")}
              placeholder="Short description of this item…"
            />
          </Field>

          {/* Image */}
          <div className="grid sm:grid-cols-2 gap-4 items-end">
            <Input
              label="Image URL"
              error={errors.image?.message}
              icon={<FontAwesomeIcon icon={faImage} className="text-xs" />}
              {...register("image")}
              placeholder="https://…"
              onChange={(e) => {
                register("image").onChange(e);
                setPreviewSrc(e.target.value);
              }}
            />

            <Field label="Upload Image">
              <label className="input flex items-center gap-2 cursor-pointer">
                <FontAwesomeIcon icon={faUpload} className="text-[#9e7272] text-xs" />
                <span className="text-sm text-[#9e7272]">Choose file</span>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </Field>
          </div>

          {/* Image preview */}
          {previewSrc && (
            <Motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
            >
              <p className="input-label mb-1">Preview</p>
              <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-[#E5D0AC] dark:border-[#3d1a1a]">
                <img
                  src={previewSrc}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setPreviewSrc("")}
                />
              </div>
            </Motion.div>
          )}
        </div>
      </Modal>

      {/* ── Delete confirmation ── */}
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
              Yes, Delete
            </Button>
          </>
        }
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faTrash} className="text-red-500 text-xl" />
          </div>
          <div>
            <p className="font-semibold text-[#1a0a0a] dark:text-white">
              Delete "{itemToDelete?.name}"?
            </p>
            <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] mt-1">
              This item will be permanently removed from the menu.
            </p>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
};

export default AdminRestaurantMenuPage;
