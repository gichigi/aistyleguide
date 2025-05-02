import useSWR from "swr";

import Logger from "./logger";

export interface ApiRequestOptions extends RequestInit {
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

/**
 * Base function for making API requests
 * @param url The API endpoint URL
 * @param options Request options
 * @returns The response data
 */
async function apiRequest<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  try {
    const { params, ...restOptions } = options;

    // Add query parameters if provided
    const queryString = params ? new URLSearchParams(params).toString() : "";
    const finalUrl = queryString ? `${url}?${queryString}` : url;

    Logger.debug(`Making API request to ${finalUrl}`, {
      method: options.method || "GET",
    });

    const response = await fetch(finalUrl, {
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed: ${response.status} ${
          response.statusText
        } - ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    return data as T;
  } catch (error) {
    Logger.error(
      "API request failed",
      error instanceof Error ? error : new Error("Unknown error")
    );
    throw error;
  }
}

/**
 * Makes a GET request to an API endpoint
 * @param url The API endpoint URL
 * @param options Request options
 * @returns The response data
 */
export function apiGet<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(url, { ...options, method: "GET" });
}

/**
 * Makes a POST request to an API endpoint
 * @param url The API endpoint URL
 * @param data The data to send
 * @param options Request options
 * @returns The response data
 */
export function apiPost<T, Data = Record<string, unknown>>(
  url: string,
  data: Data,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Makes a PUT request to an API endpoint
 * @param url The API endpoint URL
 * @param data The data to send
 * @param options Request options
 * @returns The response data
 */
export function apiPut<T, Data = Record<string, unknown>>(
  url: string,
  data: Data,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(url, {
    ...options,
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Makes a DELETE request to an API endpoint
 * @param url The API endpoint URL
 * @param options Request options
 * @returns The response data
 */
export function apiDelete<T>(
  url: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  return apiRequest<T>(url, { ...options, method: "DELETE" });
}

export function useApiGet<T>(url: string, options: ApiRequestOptions = {}) {
  const fetcher = (url: string) => apiRequest<T>(url, options);
  const { data, error, mutate } = useSWR<T>(url, fetcher, {
    dedupingInterval: 10000, // Set dedup interval to 10000ms
  });

  return { data, error, loading: !error && !data, refresh: mutate };
}

export function useApiPost<T, Data = Record<string, unknown>>(
  url: string,
  body: Data,
  options: ApiRequestOptions = {}
) {
  const fetcher = (url: string) => apiPost<T, Data>(url, body, options);
  const { data, error, mutate } = useSWR<T>(url, fetcher);

  return { data, error, loading: !error && !data, refresh: mutate };
}

export function useApiPut<T, Data = Record<string, unknown>>(
  url: string,
  body: Data,
  options: ApiRequestOptions = {}
) {
  const fetcher = (url: string) => apiPut<T, Data>(url, body, options);
  const { data, error, mutate } = useSWR<T>(url, fetcher);

  return { data, error, loading: !error && !data, refresh: mutate };
}

export function useApiDelete<T>(url: string, options: ApiRequestOptions = {}) {
  const fetcher = (url: string) => apiDelete<T>(url, options);
  const { data, error, mutate } = useSWR<T>(url, fetcher);

  return { data, error, loading: !error && !data, refresh: mutate };
}
