import { toast as toastify, ToastOptions } from 'react-toastify';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Helper to format message with title and description
const formatMessage = (title?: string, description?: string): string => {
  if (!title && !description) return '';
  if (!description) return title!;
  if (!title) return description;
  return `${title}: ${description}`;
};

// Helper to format HTML message for line breaks
const formatHtmlMessage = (title?: string, description?: string): string => {
  if (!title && !description) return '';
  if (!description) return title!;
  if (!title) return description;
  return `<div><strong>${title}</strong><br/><span style="opacity: 0.8;">${description}</span></div>`;
};

// Main toast object
export const toast = {
  // Direct react-toastify methods
  success: (message: string, options?: ToastOptions) => 
    toastify.success(message, { 
      position: 'top-right', 
      ...options 
    }),
  
  error: (message: string, options?: ToastOptions) => 
    toastify.error(message, { 
      position: 'top-right', 
      ...options 
    }),
  
  info: (message: string, options?: ToastOptions) => 
    toastify.info(message, { 
      position: 'top-right', 
      ...options 
    }),
  
  warning: (message: string, options?: ToastOptions) => 
    toastify.warning(message, { 
      position: 'top-right', 
      ...options 
    }),
  
  // Default toast (for compatibility)
  default: (message: string, options?: ToastOptions) => 
    toastify(message, { 
      position: 'top-right', 
      ...options 
    }),
  
  // Loading toast
  loading: (message: string, options?: ToastOptions) => 
    toastify.loading(message, { 
      position: 'top-right', 
      ...options 
    }),
  
  // Dismiss
  dismiss: (toastId?: string) => toastify.dismiss(toastId),
  
  // Promise
  promise: toastify.promise,
  
  // Shadcn-style API (maintains your existing API) - Using HTML for formatting
  shadcn: ({ title, description, variant = 'default' }: ToastProps) => {
    const message = formatMessage(title, description);
    
    if (variant === 'destructive') {
      return toastify.error(message, { 
        position: 'top-right',
        className: 'toast-error' 
      });
    }
    return toastify.success(message, { 
      position: 'top-right',
      className: 'toast-success' 
    });
  }
};

// For backward compatibility with your old hook (shows title: description)
export function useToast() {
  const showToast = ({ title, description, variant = 'default' }: ToastProps) => {
    const message = formatMessage(title, description);
    
    if (variant === 'destructive') {
      return toastify.error(message, { 
        position: 'top-right' 
      });
    }
    return toastify.success(message, { 
      position: 'top-right' 
    });
  };

  return {
    toast: showToast,
    dismiss: toastify.dismiss,
  };
}

// Alternative that formats as "Title: Description"
export const useToastFormatted = () => {
  const formatToast = (title: string, description?: string): string => {
    return description ? `${title}: ${description}` : title;
  };

  return {
    toast: {
      success: (title: string, description?: string) => 
        toast.success(formatToast(title, description)),
      error: (title: string, description?: string) => 
        toast.error(formatToast(title, description)),
      warning: (title: string, description?: string) => 
        toast.warning(formatToast(title, description)),
      info: (title: string, description?: string) => 
        toast.info(formatToast(title, description)),
    },
    dismiss: toast.dismiss,
  };
};

// Alternative that uses the shadcn format directly
export const toastShadcn = {
  success: (title: string, description?: string) => {
    const message = description ? `${title}: ${description}` : title;
    return toast.success(message);
  },
  error: (title: string, description?: string) => {
    const message = description ? `${title}: ${description}` : title;
    return toast.error(message);
  },
  warning: (title: string, description?: string) => {
    const message = description ? `${title}: ${description}` : title;
    return toast.warning(message);
  },
  info: (title: string, description?: string) => {
    const message = description ? `${title}: ${description}` : title;
    return toast.info(message);
  }
};