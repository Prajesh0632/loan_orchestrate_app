export interface RequestOptions extends RequestInit {
  headers?: HeadersInit
}

export function request<T = unknown>(
  endpoint: string,
  options?: RequestOptions,
): Promise<T>
