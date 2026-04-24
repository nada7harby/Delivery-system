import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMotorcycle } from "@/utils/icons";

const LoadingSpinner = ({ size = "md", text = "" }) => {
  const sizes = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-2",
    lg: "w-12 h-12 border-3",
    xl: "w-16 h-16 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size] || sizes.md} border-primary border-t-transparent rounded-full animate-spin`}
      />
      {text && (
        <p className="text-sm text-[#6b4040] dark:text-[#c9a97a] font-medium">
          {text}
        </p>
      )}
    </div>
  );
};

export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-[#0f0505]">
    <div className="flex flex-col items-center gap-4">
      <div className="text-5xl animate-bounce text-primary"><FontAwesomeIcon icon={faMotorcycle} /></div>
      <LoadingSpinner size="lg" text="Loading..." />
    </div>
  </div>
);

export default LoadingSpinner;
