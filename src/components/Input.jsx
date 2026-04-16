import { forwardRef } from "react";
import clsx from "clsx";

const Input = forwardRef(
  (
    {
      label,
      error,
      hint,
      icon,
      iconRight,
      className = "",
      containerClass = "",
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <div className={clsx("flex flex-col gap-1.5", containerClass)}>
        {label && (
          <label className="input-label">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9e7272] text-base pointer-events-none">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            type={type}
            className={clsx(
              "input",
              icon && "pl-10",
              iconRight && "pr-10",
              error && "border-red-500 focus:ring-red-400",
              className
            )}
            {...props}
          />

          {iconRight && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9e7272] text-base">
              {iconRight}
            </span>
          )}
        </div>

        {hint && !error && (
          <p className="text-xs text-[#9e7272] dark:text-[#6b4040]">{hint}</p>
        )}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
