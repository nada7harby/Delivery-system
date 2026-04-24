import { useState } from "react";
import { motion as Motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBell,
  faEnvelope,
  faMapMarkerAlt,
  faPhone,
  faShieldAlt,
  faUser,
} from "@/utils/icons";
import { useAuthStore, useAppStore } from "@/store";
import { CustomerLayout } from "@/layouts";
import { Button, Card, Input } from "@/components";

const PreferenceRow = ({ icon, title, subtitle, enabled = false }) => {
  const RowIcon = icon;

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/70 dark:bg-[#1a3440] border border-[#d9e7ee] dark:border-[#2d4d5b]">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#edf4f8] dark:bg-[#22414d] flex items-center justify-center text-[#3a5b69] dark:text-[#bcd4df]">
          <FontAwesomeIcon icon={icon} className="text-sm" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[#163643] dark:text-[#f2fbff]">
            {title}
          </p>
          <p className="text-xs text-[#6b8794] dark:text-[#9cb6c3]">
            {subtitle}
          </p>
        </div>
      </div>
      <div
        className={`w-10 h-6 rounded-full p-1 transition-colors ${
          enabled ? "bg-[#19a9bf]" : "bg-[#d6e3ea] dark:bg-[#2a4654]"
        }`}
      >
        <div
          className={`w-4 h-4 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </div>
    </div>
  );
};

const ProfilePage = () => {
  const { user } = useAuthStore();
  const { addToast } = useAppStore();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });

  const [isSaving, setIsSaving] = useState(false);

  const profileInitials = !user?.name
    ? "U"
    : user.name
        .split(" ")
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 800));

    addToast({
      type: "success",
      title: "Profile updated",
      message: "Your account changes were saved successfully.",
    });

    setIsSaving(false);
  };

  return (
    <CustomerLayout>
      <section className="max-w-5xl mx-auto px-4 py-8">
        <Motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] p-6 bg-gradient-to-r from-[#0f3442] via-[#165066] to-[#1d6f8a] text-white shadow-2xl"
        >
          <p className="text-xs uppercase tracking-[0.24em] text-white/70">
            Account
          </p>
          <h1 className="font-display text-3xl font-black mt-2">
            Profile & Preferences
          </h1>
          <p className="text-sm text-white/80 mt-2">
            Manage personal details, delivery defaults, and notification
            preferences.
          </p>
        </Motion.div>

        <div className="mt-6 grid lg:grid-cols-[1fr_300px] gap-6 items-start">
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="rounded-3xl border-white/60 bg-white/85 shadow-lg backdrop-blur-sm dark:border-[#284754] dark:bg-[#17303b]/80">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-r from-[#19a9bf] to-[#0f8ea6] text-white flex items-center justify-center text-2xl font-black">
                  {profileInitials}
                </div>
                <div>
                  <h2 className="font-display font-bold text-2xl text-[#13313e] dark:text-[#f3fbff]">
                    {user?.name || "Guest User"}
                  </h2>
                  <p className="text-sm text-[#65818e] dark:text-[#9db7c4]">
                    {user?.email || "No email"}
                  </p>
                  <span className="mt-2 inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-[#ddf7fb] text-[#0b8ca3]">
                    Customer account
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={form.name}
                  onChange={(event) =>
                    setForm({ ...form, name: event.target.value })
                  }
                  icon={<FontAwesomeIcon icon={faUser} className="text-xs" />}
                />

                <Input
                  label="Email Address"
                  type="email"
                  value={form.email}
                  disabled
                   icon={<FontAwesomeIcon icon={faEnvelope} className="text-xs" />}
                  hint="Contact support to change email"
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    setForm({ ...form, phone: event.target.value })
                  }
                  icon={<FontAwesomeIcon icon={faPhone} className="text-xs" />}
                />

                <div>
                  <label className="input-label inline-flex items-center gap-1">
                    <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs" /> Default Delivery Address
                  </label>
                  <textarea
                    className="input min-h-[110px] py-3"
                    value={form.address}
                    onChange={(event) =>
                      setForm({ ...form, address: event.target.value })
                    }
                    placeholder="Street, district, city..."
                  />
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  loading={isSaving}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() =>
                    setForm({
                      name: user?.name || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                      address: user?.address || "",
                    })
                  }
                >
                  Reset
                </Button>
              </div>
            </Card>
          </Motion.div>

          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="space-y-4"
          >
            <Card className="rounded-3xl border-white/60 bg-white/85 shadow-lg backdrop-blur-sm dark:border-[#284754] dark:bg-[#17303b]/80">
              <h3 className="font-display font-bold text-lg text-[#13313e] dark:text-[#f3fbff] mb-3 inline-flex items-center gap-2">
                <FontAwesomeIcon icon={faBell} className="text-base" /> Preferences
              </h3>
              <div className="space-y-3">
                <PreferenceRow
                  icon={faBell}
                  title="Push Notifications"
                  subtitle="Get real-time delivery updates"
                  enabled
                />
                <PreferenceRow
                  icon={faShieldAlt}
                  title="Order Security Alerts"
                  subtitle="Notify on suspicious login/activity"
                  enabled
                />
                <PreferenceRow
                  icon={faEnvelope}
                  title="Marketing Emails"
                  subtitle="Offers and weekly recommendations"
                  enabled={false}
                />
              </div>
            </Card>

            <Card className="rounded-3xl border-dashed border-[#d5e6ee] bg-white/70 dark:border-[#35525f] dark:bg-[#17303b]/60">
              <p className="text-sm font-semibold text-[#284b59] dark:text-[#d1e8f2]">
                Security note
              </p>
              <p className="text-xs mt-1 text-[#65818e] dark:text-[#9db7c4]">
                Your payment details are tokenized and never stored as raw card
                data.
              </p>
            </Card>
          </Motion.div>
        </div>
      </section>
    </CustomerLayout>
  );
};

export default ProfilePage;
