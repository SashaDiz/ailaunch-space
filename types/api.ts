// ─── API Response Types ──────────────────────────────────────────────────────

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

/** Paginated API response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/** API error response */
export interface ApiError {
  error: string;
  status: number;
  details?: Record<string, string[]>;
}

// ─── Request Types ───────────────────────────────────────────────────────────

/** Common query parameters for listing endpoints */
export interface ListQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

/** Project listing query parameters */
export interface ProjectListParams extends ListQueryParams {
  section?: string;
  category?: string;
  status?: string;
  plan?: string;
}
