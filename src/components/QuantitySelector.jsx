import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faMinus } from "@/utils/icons";

const QuantitySelector = ({
  value,
  onDecrement,
  onIncrement,
  compact = false,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-xl ${
        compact ? "p-1" : "p-1.5"
      } bg-[#f4e7d2]/60 dark:bg-[#3d1a1a]/60`}
    >
      <button
        type="button"
        onClick={onDecrement}
        className={`${
          compact ? "w-7 h-7" : "w-8 h-8"
        } rounded-lg font-bold text-primary hover:bg-primary hover:text-white transition-colors`}
      >
        <FontAwesomeIcon icon={faMinus} className="text-xs" />
      </button>
      <span
        className={`${
          compact ? "w-5" : "w-6"
        } text-center font-bold text-[#1a0a0a] dark:text-[#f8f8f8]`}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className={`${
          compact ? "w-7 h-7" : "w-8 h-8"
        } rounded-lg font-bold text-primary hover:bg-primary hover:text-white transition-colors`}
      >
        <FontAwesomeIcon icon={faPlus} className="text-xs" />
      </button>
    </div>
  );
};

export default QuantitySelector;
