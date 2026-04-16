import { useState, useRef, useEffect } from "react";
import clsx from "clsx";

const CustomSelect = ({ 
  options, 
  value, 
  onChange, 
  label, 
  icon, 
  className,
  placeholder = "Select option..." 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || null;

  return (
    <div className={clsx("relative min-w-[160px]", className)} ref={dropdownRef}>
      {label && (
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block ml-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-300 shadow-sm",
          "bg-white dark:bg-gray-900",
          isOpen 
            ? "border-primary ring-4 ring-primary/10 shadow-lg" 
            : "border-gray-100 dark:border-gray-800 hover:border-primary/50"
        )}
      >
        <div className="flex items-center gap-2.5 truncate">
          {icon && <span className="text-lg">{icon}</span>}
          <span className={clsx(
            "text-sm font-bold truncate",
            selectedOption ? "text-[#1a0a0a] dark:text-[#f8f8f8]" : "text-gray-400"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        
        <span className={clsx(
          "transition-transform duration-300",
          isOpen ? "rotate-180 text-primary" : "text-gray-400"
        )}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={clsx(
          "absolute z-50 w-full mt-2 py-2 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 origin-top"
        )}>
          <div className="max-h-60 overflow-y-auto scrollbar-hide">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={clsx(
                  "w-full flex items-center justify-between px-4 py-2.5 text-sm font-bold transition-all",
                  value === option.value
                    ? "bg-primary text-white"
                    : "text-[#6b4040] dark:text-[#c9a97a] hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-primary"
                )}
              >
                <div className="flex items-center gap-2">
                   {option.icon && <span>{option.icon}</span>}
                   {option.label}
                </div>
                {value === option.value && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
