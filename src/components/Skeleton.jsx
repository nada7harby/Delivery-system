import clsx from "clsx";

const Skeleton = ({ className = "", rounded = "rounded-xl" }) => {
  return (
    <div
      className={clsx(
        "animate-pulse bg-[#E5D0AC]/60 dark:bg-[#3d1a1a]/60",
        rounded,
        className,
      )}
    />
  );
};

export default Skeleton;
