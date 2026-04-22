import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import * as yup from "yup";
import { ArrowLeft, Image as ImageIcon, Upload } from "lucide-react";
import { DashboardLayout } from "@/layouts";
import { Button, Card, EmptyState, Input } from "@/components";
import { useAppStore, useMarketplaceStore } from "@/store";
import adminMarketplaceApi from "@/services/adminMarketplaceApi";

const RESTAURANT_CATEGORIES = [
  "Grill",
  "Fast Food",
  "Seafood",
  "Pizza",
  "Healthy",
  "Desserts",
  "Drinks",
];

const validationSchema = yup.object({
  name: yup.string().trim().required("Restaurant name is required"),
  description: yup.string().max(240, "Description is too long"),
  category: yup.string().required("Category is required"),
  image: yup.string().url("Image must be a valid URL").nullable(),
  deliveryTime: yup
    .number()
    .typeError("Delivery time must be a number")
    .min(5, "Delivery time must be at least 5 minutes")
    .max(120, "Delivery time is too high")
    .required("Delivery time is required"),
  location: yup.string().required("Location is required"),
  rating: yup.number().typeError("Rating must be a number").min(0).max(5),
  isActive: yup.boolean().required(),
});

const initialFormState = {
  name: "",
  description: "",
  category: "Fast Food",
  image: "",
  deliveryTime: 30,
  location: "City Center",
  rating: 0,
  isActive: true,
  tags: [],
};

const mapRestaurantToForm = (restaurant) => ({
  name: restaurant?.name || "",
  description: restaurant?.description || "",
  category: restaurant?.category || "Fast Food",
  image: restaurant?.image || "",
  deliveryTime: restaurant?.deliveryTime || 30,
  location: restaurant?.location || "City Center",
  rating: restaurant?.rating || 0,
  isActive: restaurant?.isActive ?? restaurant?.isOpen ?? true,
  tags: restaurant?.tags || [],
});

const TAGS = ["Popular", "New"];

const AdminRestaurantFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const { addToast } = useAppStore();
  const {
    getRestaurantById,
    addRestaurant,
    updateRestaurant,
  } = useMarketplaceStore();

  const currentRestaurant = useMemo(() => {
    if (!isEditMode) return null;
    return getRestaurantById(id);
  }, [getRestaurantById, id, isEditMode]);

  const [form, setForm] = useState(() =>
    isEditMode && currentRestaurant
      ? mapRestaurantToForm(currentRestaurant)
      : initialFormState,
  );
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((state) => ({ ...state, image: String(reader.result || "") }));
    };
    reader.onerror = () => {
      addToast({
        type: "error",
        title: "Image upload failed",
        message: "Could not load image preview.",
      });
    };
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag) => {
    setForm((state) => ({
      ...state,
      tags: state.tags.includes(tag)
        ? state.tags.filter((entry) => entry !== tag)
        : [...state.tags, tag],
    }));
  };

  const validate = async () => {
    try {
      const validated = await validationSchema.validate(form, {
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
    if (!validated) return;

    setIsSubmitting(true);

    if (isEditMode && currentRestaurant) {
      updateRestaurant(currentRestaurant.id, validated);
      const { synced } = await adminMarketplaceApi.updateRestaurant(
        currentRestaurant.id,
        validated,
      );
      addToast({
        type: "success",
        title: "Restaurant updated",
        message: synced
          ? "Changes were synced successfully."
          : "Changes saved locally (offline mode).",
      });
    } else {
      const created = addRestaurant(validated);
      const { synced } = await adminMarketplaceApi.createRestaurant(created);
      addToast({
        type: "success",
        title: "Restaurant created",
        message: synced
          ? "Restaurant created and synced."
          : "Restaurant created locally (offline mode).",
      });
    }

    setIsSubmitting(false);
    navigate("/admin/restaurants");
  };

  if (isEditMode && !currentRestaurant) {
    return (
      <DashboardLayout role="admin">
        <EmptyState
          icon="🏪"
          title="Restaurant not found"
          description="The selected restaurant does not exist anymore."
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
            {isEditMode ? "Edit Restaurant" : "Add Restaurant"}
          </h1>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mt-1">
            {isEditMode
              ? "Update restaurant details and status."
              : "Create a new restaurant and publish it to customers."}
          </p>
        </div>

        <Link to="/admin/restaurants">
          <Button variant="outline" icon={<ArrowLeft size={16} />}>
            Back
          </Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="Name"
              value={form.name}
              onChange={(event) =>
                setForm((state) => ({ ...state, name: event.target.value }))
              }
              error={errors.name}
              required
            />

            <div>
              <label className="input-label">Category</label>
              <select
                value={form.category}
                onChange={(event) =>
                  setForm((state) => ({
                    ...state,
                    category: event.target.value,
                  }))
                }
                className="input"
              >
                {RESTAURANT_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
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
              icon={<ImageIcon size={14} />}
            />

            <div>
              <label className="input-label">Upload Image</label>
              <label className="input flex items-center gap-2 cursor-pointer">
                <Upload size={14} />
                <span className="text-sm">Choose file</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
            </div>

            <Input
              label="Delivery Time (minutes)"
              type="number"
              value={form.deliveryTime}
              onChange={(event) =>
                setForm((state) => ({
                  ...state,
                  deliveryTime: event.target.value,
                }))
              }
              error={errors.deliveryTime}
              required
            />

            <Input
              label="Location"
              value={form.location}
              onChange={(event) =>
                setForm((state) => ({ ...state, location: event.target.value }))
              }
              error={errors.location}
              required
            />

            <Input
              label="Rating"
              type="number"
              value={form.rating}
              onChange={(event) =>
                setForm((state) => ({ ...state, rating: event.target.value }))
              }
              error={errors.rating}
              hint="Default 0 for new restaurants"
            />

            <div>
              <label className="input-label">Status</label>
              <select
                value={String(form.isActive)}
                onChange={(event) =>
                  setForm((state) => ({
                    ...state,
                    isActive: event.target.value === "true",
                  }))
                }
                className="input"
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

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
              className="input min-h-[110px]"
              placeholder="Restaurant short description"
            />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="input-label">Tags</label>
            <div className="flex gap-2">
              {TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${
                    form.tags.includes(tag)
                      ? "bg-primary text-white border-primary"
                      : "border-[#E5D0AC] dark:border-[#3d1a1a]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Preview</label>
            <div className="w-full max-w-sm h-40 rounded-xl border border-[#E5D0AC] dark:border-[#3d1a1a] overflow-hidden bg-gray-100 dark:bg-gray-900">
              {form.image ? (
                <img
                  src={form.image}
                  alt="Restaurant preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#9e7272]">
                  No image selected
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Link to="/admin/restaurants">
              <Button variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" loading={isSubmitting}>
              {isEditMode ? "Save Changes" : "Create Restaurant"}
            </Button>
          </div>
        </Card>
      </form>
    </DashboardLayout>
  );
};

export default AdminRestaurantFormPage;
