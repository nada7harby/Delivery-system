import clsx from "clsx";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon = null,
  iconRight = null,
  className = "",
  type = "button",
  ...props
}) => {
  const variantClass = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    outline: "btn-outline",
    ghost: "btn-ghost",
    danger: "btn-danger",
    success: "btn-success",
  }[variant] || "btn-primary";

  const sizeClass = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
    icon: "btn-icon",
  }[size] || "";

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={clsx(variantClass, sizeClass, className)}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="text-base">{icon}</span>}
          {children}
          {iconRight && <span className="text-base">{iconRight}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
