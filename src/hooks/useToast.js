import useAppStore from "@/store/appStore";

const useToast = () => {
  const { addToast } = useAppStore();

  return {
    success: (title, message, duration) =>
      addToast({ type: "success", title, message, duration }),
    error: (title, message, duration) =>
      addToast({ type: "error", title, message, duration }),
    info: (title, message, duration) =>
      addToast({ type: "info", title, message, duration }),
    warning: (title, message, duration) =>
      addToast({ type: "warning", title, message, duration }),
    custom: (opts) => addToast(opts),
  };
};

export default useToast;
