import clsx from "clsx";

const Card = ({
  children,
  className = "",
  hover = false,
  onClick,
  padding = "p-5",
  glass = false,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        glass ? "glass-card" : "card",
        padding,
        hover &&
          "cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5",
        onClick && "cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = "" }) => (
  <div className={clsx("flex items-center justify-between mb-4", className)}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = "" }) => (
  <h3
    className={clsx(
      "text-lg font-bold text-[#1a0a0a] dark:text-[#f8f8f8]",
      className
    )}
  >
    {children}
  </h3>
);

export default Card;
