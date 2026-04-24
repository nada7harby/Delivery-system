import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore, useAppStore } from "@/store";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faUser,
  faMotorcycle,
  faUserTie,
  faExclamationTriangle,
} from "@/utils/icons";
import clsx from "clsx";

const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useAppStore();

  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    const result = await login(form.email, form.password);
    if (result.success) {
      addToast({
        type: "success",
        title: "Welcome back!",
        message: `Logged in as ${result.user.name}`,
      });
      const role = result.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "driver") navigate("/driver");
      else navigate("/");
    }
  };

  const handleDemoLogin = async (email) => {
    setForm({ email, password: "demo123" });
    clearError();
    const result = await login(email, "demo123");
    if (result.success) {
      addToast({
        type: "success",
        title: "Demo Login",
        message: `Logged in as ${result.user.role}`,
      });
      const role = result.user.role;
      if (role === "admin") navigate("/admin");
      else if (role === "driver") navigate("/driver");
      else navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] dark:bg-[#0f0505] flex selection:bg-primary selection:text-white">
      {/* Left Decorative Banner (Hidden on mobile) */}
      <div className="hidden lg:flex w-[40%] bg-[#430000] relative overflow-hidden flex-col justify-between p-12">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-64 h-64 bg-amber-500/10 rounded-full blur-[80px]" />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 mb-16 group">
             <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                <img src="/src/assets/img/logo/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
             </div>
             <span className="font-display font-black text-2xl text-white tracking-tight">QuickBite</span>
          </Link>

          <div className="space-y-6">
             <h1 className="text-6xl font-display font-black text-white leading-[1.1]">
                Savor the <br />
                <span className="text-[#ffdda6] italic">Best Flavors</span> <br />
                at Home.
             </h1>
             <p className="text-white/60 text-lg max-w-sm leading-relaxed">
                Connect with the city's finest restaurants and enjoy premium food tracking.
             </p>
          </div>
        </div>

        <div className="relative z-10">
           <div className="flex -space-x-3 mb-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-[#430000] bg-gray-600 overflow-hidden shadow-xl">
                   <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                </div>
              ))}
              <div className="w-10 h-10 rounded-full border-2 border-[#430000] bg-primary flex items-center justify-center text-[10px] font-black text-white">+2k</div>
           </div>
           <p className="text-white/40 text-xs font-bold uppercase tracking-widest">Joined by 2000+ happy foodies</p>
        </div>
      </div>

      {/* Right Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-pattern">
        <div className="w-full max-w-[440px]">
          {/* Logo Mobile Only */}
          <div className="lg:hidden flex justify-center mb-10">
             <Link to="/" className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-[2rem] flex items-center justify-center shadow-xl border border-gray-100 dark:border-gray-800">
                    <img src="/src/assets/img/logo/logo.png" alt="Logo" className="w-10 h-10 object-contain" />
                </div>
                <span className="font-display font-black text-2xl text-gradient">QuickBite</span>
             </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-black text-[#1a0a0a] dark:text-[#f8f8f8] tracking-tight mb-3">
              Welcome Back!
            </h2>
            <p className="text-[#6b4040] dark:text-[#c9a97a] font-medium opacity-80">
              Please enter your credentials to access your dashboard.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/50 dark:bg-gray-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white dark:border-gray-800 shadow-2xl shadow-primary/5">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  icon={<FontAwesomeIcon icon={faEnvelope} />}
                  required
                />
                <div className="relative group">
                  <Input
                    label="Password"
                    type="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    icon={<FontAwesomeIcon icon={faLock} />}
                    required
                  />
                  <Link to="#" className="absolute top-0 right-0 text-[11px] font-black text-primary uppercase hover:underline">
                    Forgot?
                  </Link>
                </div>
              </div>

              {error && (
                <div className="px-4 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold border border-red-100 dark:border-red-900/50 animate-shake">
                   <FontAwesomeIcon icon={faExclamationTriangle} className="mr-2" /> {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                className="w-full py-4 rounded-2xl text-lg font-black shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Sign In
              </Button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full h-px bg-gray-200 dark:bg-gray-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 text-[10px] font-black text-gray-400 dark:text-gray-500 bg-[#f8f8f8] dark:bg-[#0f0505] uppercase tracking-[0.2em]">
                  Or Quick Start
                </span>
              </div>
            </div>

            {/* Quick Demo Login Grid */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { role: "Customer", email: "customer@demo.com", icon: faUser, color: "hover:border-blue-500" },
                { role: "Driver", email: "driver@demo.com", icon: faMotorcycle, color: "hover:border-emerald-500" },
                { role: "Admin", email: "admin@demo.com", icon: faUserTie, color: "hover:border-amber-500" },
              ].map((demo) => (
                <button
                  key={demo.role}
                  title={`Login as ${demo.role}`}
                  onClick={() => handleDemoLogin(demo.email)}
                  disabled={isLoading}
                  className={clsx(
                    "flex flex-col items-center gap-2 p-3 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-xl transition-all group",
                    demo.color
                  )}
                >
                  <span className="text-xl group-hover:scale-110 transition-transform"><FontAwesomeIcon icon={demo.icon} /></span>
                  <span className="text-[10px] font-black text-[#1a0a0a] dark:text-[#f8f8f8] uppercase">
                    {demo.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <p className="mt-10 text-center text-sm font-medium text-[#6b4040] dark:text-[#c9a97a]">
            New to our community?{" "}
            <Link
              to="/register"
              className="font-black text-primary hover:underline underline-offset-4"
            >
              Created an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
