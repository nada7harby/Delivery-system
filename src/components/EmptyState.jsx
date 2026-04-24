import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faInbox } from "@/utils/icons";
import clsx from "clsx";

const EmptyState = ({
  icon = faInbox,
  title = "Nothing here yet",
  description = "",
  action = null,
  className = "",
}) => (
  <div
    className={clsx(
      "flex flex-col items-center justify-center text-center py-16 px-6",
      className
    )}
  >
    <div className="text-6xl mb-4 text-[#9e7272] opacity-30 animate-pulse">
      <FontAwesomeIcon icon={icon} />
    </div>
    <h3 className="text-xl font-bold text-[#1a0a0a] dark:text-[#f8f8f8] mb-2">
      {title}
    </h3>
    {description && (
      <p className="text-[#6b4040] dark:text-[#c9a97a] text-sm max-w-xs mb-6">
        {description}
      </p>
    )}
    {action}
  </div>
);

export default EmptyState;
