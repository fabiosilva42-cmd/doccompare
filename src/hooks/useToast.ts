import { toast } from "sonner";

export function useToast() {
  return {
    success: (message: string, description?: string) =>
      toast.success(message, description ? { description } : undefined),
    error: (message: string, description?: string) =>
      toast.error(message, description ? { description } : undefined),
    info: (message: string, description?: string) =>
      toast.info(message, description ? { description } : undefined),
    warning: (message: string, description?: string) =>
      toast.warning(message, description ? { description } : undefined),
    loading: (message: string, description?: string) =>
      toast.loading(message, description ? { description } : undefined),
    dismiss: (id: string | number) => toast.dismiss(id),
  };
}
