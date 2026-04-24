import { useCallback, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { motion as Motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faBuilding,
  faCheck,
  faClock,
  faImage,
  faMapMarkerAlt,
  faStar,
  faTag,
  faUpload,
  faFire,
  faSparkles,
  faChartLine,
  faStore,
  faCircle,
  faExclamationTriangle,
} from "@/utils/icons";
import { DashboardLayout } from "@/layouts";
import { Button, Card, EmptyState, Input } from "@/components";
import { useAppStore, useMarketplaceStore } from "@/store";
import adminMarketplaceApi from "@/services/adminMarketplaceApi";

/* ─── Constants ────────────────────────────────────────── */
const RESTAURANT_CATEGORIES = [
  "Grill",
  "Fast Food",
  "Seafood",
  "Pizza",
  "Healthy",
  "Desserts",
  "Drinks",
  "Asian",
  "Mediterranean",
  "Bakery",
];

const TAGS = [
  { value: "Popular", icon: faFire },
  { value: "New", icon: faSparkles },
  { value: "Top Rated", icon: faStar },
  { value: "Trending", icon: faChartLine },
];

/* ─── Validation schema ─────────────────────────────────── */
const schema = yup.object({
  name: yup.string().trim().required("Restaurant name is required"),
  description: yup.string().max(280, "Max 280 characters"),
  category: yup.string().required("Category is required"),
  image: yup
    .string()
    .url("Must be a valid URL (https://…)")
    .nullable()
    .transform((v) => v || null),
  deliveryTime: yup
    .number()
    .typeError("Must be a number")
    .min(5, "Minimum 5 minutes")
    .max(120, "Maximum 120 minutes")
    .required("Delivery time is required"),
  location: yup.string().required("Location is required"),
  rating: yup
    .number()
    .typeError("Must be a number")
    .min(0, "Min 0")
    .max(5, "Max 5")
    .nullable()
    .transform((v) => (isNaN(v) ? 0 : v)),
  isActive: yup.boolean().required(),
});

/* ─── Field wrapper with label + error ─────────────────── */
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
    {error && (
      <Motion.p
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-red-500 flex items-center gap-1"
      >
        <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
      </Motion.p>
    )}
  </div>
);

/* ─── Section heading ───────────────────────────────────── */
const SectionTitle = ({ icon, title, sub }) => (
  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-[#E5D0AC] dark:border-[#3d1a1a]">
    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <p className="font-bold text-[#1a0a0a] dark:text-white text-sm">{title}</p>
      {sub && <p className="text-xs text-[#9e7272]">{sub}</p>}
    </div>
  </div>
);

/* ─── Main component ────────────────────────────────────── */
const AdminRestaurantFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { addToast } = useAppStore();
  const { getRestaurantById, addRestaurant, updateRestaurant } = useMarketplaceStore();

  const currentRestaurant = useMemo(
    () => (isEditMode ? getRestaurantById(id) : null),
    [getRestaurantById, id, isEditMode],
  );

  /* ── Selected tags (not part of RHF to keep it simple) ── */
  const [selectedTags, setSelectedTags] = useState(
    () => currentRestaurant?.tags || [],
  );

  /* ── Image preview (can come from URL field or file upload) ── */
  const [previewSrc, setPreviewSrc] = useState(
    () => currentRestaurant?.image || "",
  );

  /* ── React Hook Form ── */
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: currentRestaurant?.name || "",
      description: currentRestaurant?.description || "",
      category: currentRestaurant?.category || "Fast Food",
      image: currentRestaurant?.image || "",
      deliveryTime: currentRestaurant?.deliveryTime || 30,
      location: currentRestaurant?.location || "City Center",
      rating: currentRestaurant?.rating || 0,
      isActive:
        currentRestaurant?.isActive ?? currentRestaurant?.isOpen ?? true,
    },
  });

  /* Sync image URL field → preview */
  const imageUrl = watch("image");
  useMemo(() => {
    if (imageUrl && !imageUrl.startsWith("data:")) setPreviewSrc(imageUrl);
  }, [imageUrl]);

  /* ── File upload handler ── */
  const handleFileUpload = useCallback(
    (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || "");
        setPreviewSrc(dataUrl);
        setValue("image", dataUrl, { shouldValidate: false });
      };
      reader.onerror = () =>
        addToast({ type: "error", title: "Image upload failed", message: "Could not load file." });
      reader.readAsDataURL(file);
    },
    [addToast, setValue],
  );

  const toggleTag = (tag) =>
    setSelectedTags((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
    );

  /* ── Submit ── */
  const onSubmit = async (data) => {
    const payload = { ...data, tags: selectedTags };

    if (isEditMode && currentRestaurant) {
      updateRestaurant(currentRestaurant.id, payload);
      const { synced } = await adminMarketplaceApi.updateRestaurant(currentRestaurant.id, payload);
      addToast({
        type: "success",
        title: "Restaurant updated",
        message: synced ? "Changes synced." : "Saved locally (offline mode).",
      });
    } else {
      const created = addRestaurant(payload);
      const { synced } = await adminMarketplaceApi.createRestaurant(created);
      addToast({
        type: "success",
        title: "Restaurant created",
        message: synced ? "Restaurant is now live." : "Saved locally (offline mode).",
      });
    }

    navigate("/admin/restaurants");
  };

  /* ── Not found guard ── */
  if (isEditMode && !currentRestaurant) {
    return (
      <DashboardLayout role="admin">
        <EmptyState
          icon={faStore}
          title="Restaurant not found"
          description="The restaurant you're trying to edit no longer exists."
          action={
            <Link to="/admin/restaurants">
              <Button variant="primary">Back to Restaurants</Button>
            </Link>
          }
        />
      </DashboardLayout>
    );
  }

  /* ─── Render ─────────────────────────────────────────── */
  return (
    <DashboardLayout role="admin">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-black text-[#1a0a0a] dark:text-white">
            {isEditMode ? "Edit Restaurant" : "New Restaurant"}
          </h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-1">
            {isEditMode
              ? `Updating ${currentRestaurant?.name}`
              : "Fill in the details to publish a new restaurant."}
          </p>
        </div>
        <Link to="/admin/restaurants">
          <Button variant="outline" icon={<FontAwesomeIcon icon={faArrowLeft} className="text-xs" />}>
            Back
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid lg:grid-cols-3 gap-6">
          {/* ─── Left column (2/3) ─── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic info */}
            <Card className="p-6">
              <SectionTitle
                icon={<FontAwesomeIcon icon={faBuilding} className="text-xs" />}
                title="Basic Information"
                sub="Core details visible to customers"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Restaurant Name"
                  required
                  error={errors.name?.message}
                  {...register("name")}
                  placeholder="e.g. Flame House Grill"
                />

                <Field label="Category" required error={errors.category?.message}>
                  <select className="input" {...register("category")}>
                    {RESTAURANT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </Field>

                <Input
                  label="Location"
                  required
                  error={errors.location?.message}
                  icon={<FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" />}
                  {...register("location")}
                  placeholder="e.g. Downtown, City Center"
                />

                <Input
                  label="Delivery Time (minutes)"
                  type="number"
                  required
                  error={errors.deliveryTime?.message}
                  icon={<FontAwesomeIcon icon={faClock} className="text-xs" />}
                  {...register("deliveryTime")}
                  min={5}
                  max={120}
                />

                <Input
                  label="Rating"
                  type="number"
                  error={errors.rating?.message}
                  icon={<FontAwesomeIcon icon={faStar} className="text-xs" />}
                  hint="0–5 (leave 0 for new restaurants)"
                  {...register("rating")}
                  min={0}
                  max={5}
                  step={0.1}
                />

                <Field label="Status" required>
                  <Controller
                    name="isActive"
                    control={control}
                    render={({ field }) => (
                      <select
                        className="input"
                        value={String(field.value)}
                        onChange={(e) => field.onChange(e.target.value === "true")}
                      >
                        <option value="true">Active — visible to customers</option>
                        <option value="false">Inactive — hidden from marketplace</option>
                      </select>
                    )}
                  />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Description" error={errors.description?.message} hint={`${(watch("description") || "").length}/280`}>
                  <textarea
                    className="input min-h-[110px] resize-none"
                    placeholder="A short description visible to customers…"
                    {...register("description")}
                  />
                </Field>
              </div>
            </Card>

            {/* Image */}
            <Card className="p-6">
              <SectionTitle
                icon={<FontAwesomeIcon icon={faImage} className="text-xs" />}
                title="Restaurant Image"
                sub="Use a URL or upload a file from your device"
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Image URL"
                  error={errors.image?.message}
                  icon={<FontAwesomeIcon icon={faImage} className="text-xs" />}
                  {...register("image")}
                  placeholder="https://images.unsplash.com/…"
                />

                <div>
                  <label className="input-label">Upload from Device</label>
                  <label className="input flex items-center gap-2 cursor-pointer hover:border-primary/60 transition-colors">
                    <FontAwesomeIcon icon={faUpload} className="text-[#9e7272] text-xs" />
                    <span className="text-sm text-[#9e7272]">Choose image file</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            </Card>

            {/* Tags */}
            <Card className="p-6">
              <SectionTitle
                icon={<FontAwesomeIcon icon={faTag} className="text-xs" />}
                title="Tags"
                sub="Highlight the restaurant for discovery"
              />
              <div className="flex flex-wrap gap-2">
                {TAGS.map(({ value, icon: tIcon }) => {
                  const active = selectedTags.includes(value);
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleTag(value)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold border-2 transition-all duration-200 ${
                        active
                          ? "bg-primary text-white border-primary shadow-md scale-[1.03]"
                          : "border-[#E5D0AC] dark:border-[#3d1a1a] text-[#6b4040] dark:text-[#c9a97a] hover:border-primary/50"
                      }`}
                    >
                      <FontAwesomeIcon icon={tIcon} /> {value}
                      {active && <FontAwesomeIcon icon={faCheck} className="ml-1 text-[10px]" />}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ─── Right column (1/3) ─── */}
          <div className="space-y-6">
            {/* Image preview */}
            <Card className="p-6 overflow-hidden">
              <p className="input-label mb-3">Image Preview</p>
              <div className="w-full aspect-video rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-900 border border-[#E5D0AC] dark:border-[#3d1a1a]">
                {previewSrc ? (
                  <img
                    src={previewSrc}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={() => setPreviewSrc("")}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-[#9e7272] gap-2">
                    <FontAwesomeIcon icon={faImage} className="text-3xl opacity-40" />
                    <p className="text-xs">No image selected</p>
                  </div>
                )}
              </div>

              {previewSrc && (
                <button
                  type="button"
                  onClick={() => { setPreviewSrc(""); setValue("image", ""); }}
                  className="mt-2 text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  ✕ Remove image
                </button>
              )}
            </Card>

            {/* Live summary card */}
            <Card className="p-6">
              <p className="input-label mb-3">Customer Preview</p>
              <div className="rounded-xl overflow-hidden border border-[#E5D0AC] dark:border-[#3d1a1a]">
                <div className="h-24 bg-gray-100 dark:bg-gray-900 relative overflow-hidden">
                  {previewSrc && (
                    <img src={previewSrc} alt="" className="w-full h-full object-cover" onError={() => {}} />
                  )}
                  {!previewSrc && (
                    <div className="w-full h-full flex items-center justify-center text-[#9e7272]">
                      <FontAwesomeIcon icon={faBuilding} className="text-xl" />
                    </div>
                  )}
                  {selectedTags.length > 0 && (
                    <div className="absolute top-2 left-2 flex gap-1">
                      {selectedTags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-white">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="p-3 bg-white dark:bg-[#430000]">
                  <p className="font-bold text-sm text-[#1a0a0a] dark:text-white truncate">
                    {watch("name") || "Restaurant Name"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#9e7272]">
                    <span>{watch("category") || "Category"}</span>
                    <span>·</span>
                    <span>{watch("deliveryTime") || 30} min</span>
                    {watch("rating") > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-amber-500"><FontAwesomeIcon icon={faStar} className="text-[10px] mr-1" /> {watch("rating")}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Submit */}
            <div className="flex flex-col gap-3">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="w-full"
              >
                {isEditMode ? "Save Changes" : "Create Restaurant"}
              </Button>
              <Link to="/admin/restaurants" className="block">
                <Button variant="ghost" className="w-full" disabled={isSubmitting}>
                  Cancel
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
};

export default AdminRestaurantFormPage;
