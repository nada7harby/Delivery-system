import clsx from "clsx";
import {
  ORDER_LIFECYCLE,
  STATUS_LABELS,
  STATUS_ICONS,
  getStatusIndex,
} from "@/constants/orderStatus";

const Stepper = ({ currentStatus, compact = false }) => {
  const currentIndex = getStatusIndex(currentStatus);

  // Filter out cancelled
  const steps = ORDER_LIFECYCLE;

  return (
    <div className={clsx("w-full", compact ? "overflow-x-auto pb-2" : "")}>
      <div className={clsx("flex items-start", compact ? "min-w-max gap-0" : "gap-0")}>
        {steps.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isPending = index > currentIndex;

          return (
            <div key={step} className="flex items-center flex-1">
              {/* Step */}
              <div className="stepper-step">
                <div
                  className={clsx("stepper-dot", {
                    completed: isCompleted,
                    active: isActive,
                    pending: isPending,
                  })}
                >
                  {isCompleted ? (
                    <span className="text-xs">✓</span>
                  ) : (
                    <span className={clsx("text-sm", compact ? "text-xs" : "")}>
                      {STATUS_ICONS[step]}
                    </span>
                  )}
                </div>
                {!compact && (
                  <span
                    className={clsx(
                      "text-xs font-medium text-center mt-1 leading-tight w-16",
                      isCompleted
                        ? "text-primary"
                        : isActive
                        ? "text-primary font-bold"
                        : "text-[#9e7272] dark:text-[#6b4040]"
                    )}
                  >
                    {STATUS_LABELS[step]}
                  </span>
                )}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={clsx("stepper-line mb-5", {
                    completed: isCompleted || isActive,
                    pending: isPending && !isActive,
                  })}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
