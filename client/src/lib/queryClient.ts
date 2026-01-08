import { QueryClient, QueryFunction } from "@tanstack/react-query";

function getAuthToken(): string | null {
  // Try multiple storage locations
  return localStorage.getItem("auth_token") || 
         localStorage.getItem("token") ||
         sessionStorage.getItem("auth_token") ||
         sessionStorage.getItem("token");
}

function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    try {
      const json = await res.json();
      errorMessage = json.message || json.error || res.statusText;
    } catch {
      const text = await res.text();
      if (text) errorMessage = text;
    }
    throw new Error(errorMessage);
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const headers: HeadersInit = {
    ...getAuthHeaders(),
  };
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }

  console.log(`${method} ${url}`, data); // Debug logging

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  const text = await res.text();
  if (!text) return {} as T;
  
  try {
    return JSON.parse(text);
  } catch {
    return text as unknown as T;
  }
}

/**
 * Helper function to download files with authentication
 * @param url The URL to download from
 * @param filename The name for the downloaded file
 * @returns Promise<boolean> - true if download was successful
 */
export async function downloadFile(url: string, filename: string): Promise<boolean> {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/pdf',
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      } else if (response.status === 404) {
        throw new Error("File not found.");
      } else {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

/**
 * Specific helper for downloading invoices
 * @param orderNumber The order number to download invoice for
 * @param type The type of invoice ("admin" or "customer")
 * @returns Promise<boolean> - true if download was successful
 */
export async function downloadInvoice(orderNumber: string, type: "admin" | "customer" = "customer"): Promise<boolean> {
  const url = `/api/orders/${orderNumber}/invoice?type=${type}`;
  const filename = `${type}-invoice-${orderNumber}.pdf`;
  return downloadFile(url, filename);
}

/**
 * Helper for downloading files with specific content types
 * @param url The URL to download from
 * @param filename The name for the downloaded file
 * @param contentType The expected content type (default: "application/pdf")
 * @returns Promise<boolean> - true if download was successful
 */
export async function downloadFileWithType(url: string, filename: string, contentType: string = "application/pdf"): Promise<boolean> {
  try {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error("Authentication token not found. Please log in again.");
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': contentType,
      },
      credentials: "include",
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Unauthorized. Please log in again.");
      } else if (response.status === 404) {
        throw new Error("File not found.");
      } else {
        throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      }
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(downloadUrl);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";

function buildUrl(queryKey: readonly unknown[]): string {
  if (!Array.isArray(queryKey) || queryKey.length === 0) {
    return String(queryKey);
  }
  
  const [base, ...rest] = queryKey;
  let url = String(base);
  
  for (const part of rest) {
    if (typeof part === 'object' && part !== null) {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(part)) {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      }
      const queryString = params.toString();
      if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString;
      }
    } else if (part !== undefined && part !== null) {
      url += '/' + String(part);
    }
  }
  
  return url;
}

export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = buildUrl(queryKey);
    
    const res = await fetch(url, {
      headers: getAuthHeaders(),
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 60000,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});