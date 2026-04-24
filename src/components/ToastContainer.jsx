import useAppStore from "@/store/appStore";
import clsx from "clsx";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faExclamationCircle,
  faInfoCircle,
  faExclamationTriangle,
  faTimes,
} from "@/utils/icons";

const ICONS = {
  success: faCheckCircle,
  error: faExclamationCircle,
  info: faInfoCircle,
  warning: faExclamationTriangle,
};

const BG = {
  success:
    "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700",
  error: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700",
  info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700",
  warning:
    "bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700",
};

const TEXT = {
  success: "text-emerald-800 dark:text-emerald-200",
  error: "text-red-800 dark:text-red-200",
  info: "text-blue-800 dark:text-blue-200",
  warning: "text-amber-800 dark:text-amber-200",
};

const ToastItem = ({ toast }) => {
  const { removeToast } = useAppStore();
  const type = toast.type || "info";
  const Icon = toast.icon || ICONS[type] || faInfoCircle;

  return (
    <Motion.div
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={clsx("toast border pointer-events-auto", BG[type])}
    >
      <span className="text-xl flex-shrink-0">
        <FontAwesomeIcon icon={Icon} className="text-lg" />
      </span>
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className={clsx("font-semibold text-sm", TEXT[type])}>
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p className={clsx("text-sm mt-0.5", TEXT[type], "opacity-90")}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className={clsx(
          "text-sm flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity",
          TEXT[type],
        )}
      >
        <FontAwesomeIcon icon={faTimes} className="text-xs" />
      </button>
    </Motion.div>
  );
};

const ToastContainer = () => {
  const { toasts } = useAppStore();

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
