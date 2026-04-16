/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#f8f8f8",
          100: "#FFF3C4",
          200: "#E5D0AC",
        },
        brand: {
          50: "#f8f8f8",
          100: "#E5D0AC",
          200: "#c9a97a",
          300: "#b08b5a",
          400: "#A31D1D",
          500: "#8a1818",
          600: "#6D2323",
          700: "#5a1c1c",
          800: "#461515",
          900: "#330f0f",
        },
        primary: "#6D2323",
        "primary-light": "#A31D1D",
        "primary-dark": "#5a1c1c",
        accent: "#A31D1D",
        surface: "#f8f8f8",
        muted: "#E5D0AC",
        status: {
          pending: "#6B7280",
          confirmed: "#3B82F6",
          preparing: "#F59E0B",
          ready: "#8B5CF6",
          pickedup: "#EC4899",
          ontheway: "#7C3AED",
          delivered: "#10B981",
          cancelled: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-in-right": "slideInRight 0.3s ease-out",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 3s linear infinite",
        bounce: "bounce 1s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
        "ping-slow": "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
      boxShadow: {
        card: "0 4px 20px rgba(109, 35, 35, 0.08)",
        "card-hover": "0 8px 30px rgba(109, 35, 35, 0.15)",
        glow: "0 0 20px rgba(163, 29, 29, 0.3)",
        inner: "inset 0 2px 4px rgba(0,0,0,0.06)",
      },
      backgroundImage: {
        "gradient-brand":
          "linear-gradient(135deg, #6D2323 0%, #A31D1D 50%, #c9a97a 100%)",
        "gradient-surface":
          "linear-gradient(180deg, #f8f8f8 0%, #E5D0AC 100%)",
        "gradient-dark":
          "linear-gradient(135deg, #1a0a0a 0%, #2d1010 50%, #3d1a1a 100%)",
      },
    },
  },
  plugins: [],
};
