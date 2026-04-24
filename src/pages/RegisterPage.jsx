import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, useAppStore } from "@/store";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRocket,
  faUser,
  faMotorcycle,
  faUserTie,
  faEnvelope,
  faLock,
  faChevronDown,
} from "@/utils/icons";

const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useAppStore();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError("");

    if (form.password !== form.confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setLocalError("Password must be at least 6 characters");
      return;
    }

    const result = await register(form);
    if (result.success) {
      addToast({
        type: "success",
        title: "Account created!",
        message: "Welcome to QuickBite",
      });
      const role = result.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "driver") navigate("/driver");
      else navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0505] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-brand relative overflow-hidden px-12">
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="relative z-10 text-center text-white">
          <div className="text-8xl mb-6 text-white/20"><FontAwesomeIcon icon={faRocket} /></div>
          <h1 className="font-display text-4xl font-black mb-4">Join QuickBite</h1>
          <p className="text-xl opacity-90 font-light max-w-sm">
            Start ordering your favorite food in seconds
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { icon: faUser, role: "Customer", desc: "Order food" },
              { icon: faMotorcycle, role: "Driver", desc: "Deliver orders" },
              { icon: faUserTie, role: "Admin", desc: "Manage all" },
            ].map((r) => (
              <div
                key={r.role}
                className="bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm border border-white/20"
              >
                <div className="text-3xl mb-1"><FontAwesomeIcon icon={r.icon} /></div>
                <div className="font-bold text-sm">{r.role}</div>
                <div className="text-xs opacity-70">{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
              <img src="/src/assets/img/logo/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
            </div>
            <span className="font-display font-black text-2xl text-gradient">
              QuickBite
            </span>
          </div>

          <h2 className="font-display text-3xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-2">
            Create account
          </h2>
          <p className="text-[#6b4040] dark:text-[#c9a97a] mb-8">
            Join thousands of happy customers
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              icon={<FontAwesomeIcon icon={faUser} />}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              icon={<FontAwesomeIcon icon={faEnvelope} />}
              required
            />

            {/* Role selector */}
            <div>
              <label className="input-label">Account Type</label>
              <div className="relative">
                <select
                  className="w-full p-3 rounded-xl border border-[#E5D0AC] dark:border-[#3d1a1a] bg-transparent"
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="customer">Customer — Order food</option>
                  <option value="driver">Driver — Deliver orders</option>
                  <option value="admin">Admin — Manage all</option>
                </select>
                <FontAwesomeIcon icon={faChevronDown} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e7272] pointer-events-none" />
              </div>
            </div>

            <Input
              label="Password"
              type="password"
              placeholder="Min 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              icon={<FontAwesomeIcon icon={faLock} />}
              required
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Repeat password"
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
              icon={<FontAwesomeIcon icon={faLock} />}
              required
            />

            {(error || localError) && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                {error || localError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full"
              size="lg"
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-[#6b4040] dark:text-[#c9a97a]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-primary hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
