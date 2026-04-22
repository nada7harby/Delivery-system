import clsx from "clsx";
import { motion as Motion } from "framer-motion";

const CategoryTabs = ({ categories = [], activeCategory, onChange }) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {categories.map((category) => (
        <Motion.button
          key={category}
          onClick={() => onChange(category)}
          whileTap={{ scale: 0.98 }}
          className={clsx(
            "flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all",
            activeCategory === category
              ? "bg-primary text-white"
              : "bg-white dark:bg-[#2a1010] text-[#6b4040] dark:text-[#c9a97a] hover:bg-primary/10",
          )}
        >
          {category}
        </Motion.button>
      ))}
    </div>
  );
};

export default CategoryTabs;
