const BASE = import.meta.env.VITE_API_URL || '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...options, headers: { ...authHeaders(), ...options.headers } });
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.reload();
    throw new Error('Unauthorized');
  }
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Auth
  register: (data: { email: string; password: string; name: string }) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => request<any>('/auth/me'),
  updateProfile: (data: any) => request<any>('/auth/me', { method: 'PUT', body: JSON.stringify(data) }),
  getUsers: () => request<any[]>('/auth/users'),
  updateUserRole: (id: string, role: string) => request<any>(`/auth/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),

  // Products
  getProducts: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ products: any[]; total: number; page: number; pages: number }>(`/products${qs}`);
  },
  getProduct: (slug: string) => request<any>(`/products/${slug}`),
  createProduct: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) => request<any>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProduct: (id: string) => request<void>(`/products/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: () => request<any[]>('/categories'),
  createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Cart
  getCart: () => request<{ items: any[]; subtotal: number; itemCount: number }>('/cart'),
  addToCart: (product_id: string, quantity = 1) => request<any>('/cart', { method: 'POST', body: JSON.stringify({ product_id, quantity }) }),
  updateCartItem: (id: string, quantity: number) => request<any>(`/cart/${id}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),
  removeCartItem: (id: string) => request<void>(`/cart/${id}`, { method: 'DELETE' }),
  clearCart: () => request<void>('/cart', { method: 'DELETE' }),

  // Orders
  getOrders: () => request<any[]>('/orders'),
  getOrder: (id: string) => request<any>(`/orders/${id}`),
  createOrder: (data: any) => request<any>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  getAdminOrders: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ orders: any[]; total: number; page: number; pages: number }>(`/orders/admin/all${qs}`);
  },
  updateOrderStatus: (id: string, status: string) => request<any>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Reviews
  getProductReviews: (productId: string) => request<any[]>(`/reviews/product/${productId}`),
  createReview: (data: any) => request<any>('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  deleteReview: (id: string) => request<void>(`/reviews/${id}`, { method: 'DELETE' }),

  // Wishlist
  getWishlist: () => request<any[]>('/wishlist'),
  addToWishlist: (product_id: string) => request<any>('/wishlist', { method: 'POST', body: JSON.stringify({ product_id }) }),
  removeFromWishlist: (productId: string) => request<void>(`/wishlist/${productId}`, { method: 'DELETE' }),

  // Analytics
  getDashboard: () => request<any>('/analytics/dashboard'),
};
