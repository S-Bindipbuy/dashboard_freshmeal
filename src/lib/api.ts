import { freshmeal } from '$lib/proto/freshmeal.js';

export const BASE_URL = '/api';

const LS_TOKEN   = 'fm_token';
const LS_USER_ID = 'fm_user_id';
const LS_USER_NAME = 'fm_user_name';

let _token: string | null = (typeof localStorage !== 'undefined' ? localStorage.getItem(LS_TOKEN) : null);
let _userId: number | null = (typeof localStorage !== 'undefined' ? Number(localStorage.getItem(LS_USER_ID)) || null : null);
let _userName: string | null = (typeof localStorage !== 'undefined' ? localStorage.getItem(LS_USER_NAME) : null);

export function getToken() { return _token; }
export function getUserId() { return _userId; }
export function getUserName() { return _userName; }
export function isLoggedIn() { return !!_token; }

function persistAuth() {
  if (typeof localStorage === 'undefined') return;
  if (_token)    localStorage.setItem(LS_TOKEN, _token); else localStorage.removeItem(LS_TOKEN);
  if (_userId)   localStorage.setItem(LS_USER_ID, String(_userId)); else localStorage.removeItem(LS_USER_ID);
  if (_userName) localStorage.setItem(LS_USER_NAME, _userName); else localStorage.removeItem(LS_USER_NAME);
}

export function clearAuth() {
  _token = null;
  _userId = null;
  _userName = null;
  persistAuth();
}

function authHeaders(): Record<string, string> {
  return _token ? { Authorization: `Bearer ${_token}` } : {};
}

function protoHeaders(): Record<string, string> {
  return { 'Content-Type': 'application/x-protobuf' };
}

function longToNumber(v: number | Long): number {
  return typeof v === 'number' ? v : (v as any).toNumber();
}

export interface LoginResponse {
  token: string;
  id: number;
  name: string;
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const body = freshmeal.LoginRequest.encode(
    freshmeal.LoginRequest.create({ email, password })
  ).finish();
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.LoginResponse.decode(new Uint8Array(await res.arrayBuffer()));
  _token = data.token;
  _userId = longToNumber(data.id);
  _userName = data.name;
  persistAuth();
  return { token: data.token, id: longToNumber(data.id), name: data.name };
}

export interface ProfileResponse {
  id: number;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
}

export async function apiGetProfile(): Promise<ProfileResponse> {
  const res = await fetch(`${BASE_URL}/profile`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.ProfileResponse.decode(new Uint8Array(await res.arrayBuffer()));
  const roleMap: Record<number, string> = {
    [freshmeal.Role.ADMIN]: 'admin',
    [freshmeal.Role.CUSTOMER]: 'customer',
    [freshmeal.Role.RESTAURANT]: 'restaurant',
  };
  return {
    id: longToNumber(data.id),
    email: data.email,
    name: data.name,
    role: roleMap[data.role] ?? 'customer',
    avatar: data.avatar ?? null,
  };
}

export interface ApiCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export async function apiGetCustomers(): Promise<ApiCustomer[]> {
  const res = await fetch(`${BASE_URL}/customer`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Fetching customers failed: ${res.status} ${await res.text()}`);
  const data = freshmeal.CustomerList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.customers.map(c => ({
    id: longToNumber(c.id),
    name: c.name,
    email: c.email,
    created_at: c.createdAt,
  }));
}

export async function apiGetCustomer(id: number): Promise<ApiCustomer> {
  const res = await fetch(`${BASE_URL}/customer?id=${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Fetching customer ${id} failed: ${res.status} ${await res.text()}`);
  const data = freshmeal.CustomerResponse.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(data.id),
    name: data.name,
    email: data.email,
    created_at: data.createdAt,
  };
}

export interface ApiProduct {
  id: number;
  name: string;
  description: string | null;
  price: string;
  available: boolean;
  image: string;
  category_id: number | null;
  deleted_at: string | null;
  created_at: string;
}

export async function apiGetProducts(search?: string, categoryId?: number): Promise<ApiProduct[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (categoryId != null) params.set('category_id', String(categoryId));
  const qs = params.toString();
  const url = qs ? `${BASE_URL}/products?${qs}` : `${BASE_URL}/products`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.ProductList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.products.map(p => ({
    id: longToNumber(p.id),
    name: p.name,
    description: p.description ?? null,
    price: p.price,
    available: p.available,
    image: p.image,
    category_id: p.categoryId != null ? longToNumber(p.categoryId) : null,
    deleted_at: p.deletedAt ?? null,
    created_at: p.createdAt,
  }));
}

export async function apiCreateProduct(form: FormData): Promise<ApiProduct> {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  const p = freshmeal.Product.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(p.id),
    name: p.name,
    description: p.description ?? null,
    price: p.price,
    available: p.available,
    image: p.image,
    category_id: p.categoryId != null ? longToNumber(p.categoryId) : null,
    deleted_at: p.deletedAt ?? null,
    created_at: p.createdAt,
  };
}

export async function apiDeleteProduct(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiUpdateProduct(id: number, form: FormData): Promise<ApiProduct> {
  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  const p = freshmeal.Product.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(p.id),
    name: p.name,
    description: p.description ?? null,
    price: p.price,
    available: p.available,
    image: p.image,
    category_id: p.categoryId != null ? longToNumber(p.categoryId) : null,
    deleted_at: p.deletedAt ?? null,
    created_at: p.createdAt,
  };
}

export interface ApiCategory {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export async function apiGetCategories(search?: string): Promise<ApiCategory[]> {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const qs = params.toString();
  const url = qs ? `${BASE_URL}/categories?${qs}` : `${BASE_URL}/categories`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.CategoryList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.categories.map(c => ({
    id: longToNumber(c.id),
    name: c.name,
    description: c.description ?? null,
    created_at: c.createdAt,
  }));
}

export async function apiCreateCategory(name: string, description?: string): Promise<ApiCategory> {
  const body = freshmeal.Category.encode(
    freshmeal.Category.create({ name, description: description ?? '' })
  ).finish();
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const c = freshmeal.Category.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(c.id),
    name: c.name,
    description: c.description ?? null,
    created_at: c.createdAt,
  };
}

export async function apiUpdateCategory(id: number, name: string, description?: string): Promise<ApiCategory> {
  const body = freshmeal.Category.encode(
    freshmeal.Category.create({ name, description: description ?? '' })
  ).finish();
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const c = freshmeal.Category.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(c.id),
    name: c.name,
    description: c.description ?? null,
    created_at: c.createdAt,
  };
}

export async function apiDeleteCategory(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiToggleProductAvailability(id: number, available: boolean): Promise<ApiProduct> {
  const body = freshmeal.Product.encode(
    freshmeal.Product.create({ available })
  ).finish();
  const res = await fetch(`${BASE_URL}/products/${id}/availability`, {
    method: 'PATCH',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const p = freshmeal.Product.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(p.id),
    name: p.name,
    description: p.description ?? null,
    price: p.price,
    available: p.available,
    image: p.image,
    category_id: p.categoryId != null ? longToNumber(p.categoryId) : null,
    deleted_at: p.deletedAt ?? null,
    created_at: p.createdAt,
  };
}

export type ApiOrderStatus = 'pending' | 'paid' | 'confirmed' | 'preparing' | 'delivered' | 'cancelled';

export interface ApiOrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  price_at_time: string;
}

export interface ApiOrder {
  id: number;
  user_id: number;
  status: ApiOrderStatus;
  total: string;
  created_at: string;
  items: ApiOrderItem[];
  branch_id: number | null;
  user_name: string;
}

const orderStatusMap: Record<number, ApiOrderStatus> = {
  [freshmeal.OrderStatus.PENDING]: 'pending',
  [freshmeal.OrderStatus.PAID]: 'paid',
  [freshmeal.OrderStatus.CONFIRMED]: 'confirmed',
  [freshmeal.OrderStatus.PREPARING]: 'preparing',
  [freshmeal.OrderStatus.DELIVERED]: 'delivered',
  [freshmeal.OrderStatus.CANCELLED]: 'cancelled',
};

export async function apiGetOrders(lastId?: number, limit = 50): Promise<ApiOrder[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (lastId != null) params.set('last_id', String(lastId));
  const res = await fetch(`${BASE_URL}/orders?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.OrderHistoryList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.orders.map(o => ({
    id: longToNumber(o.id),
    user_id: longToNumber(o.userId),
    status: orderStatusMap[o.status] ?? 'pending',
    total: o.total,
    created_at: o.createdAt,
    items: o.items.map(i => ({
      id: longToNumber(i.id),
      product_id: longToNumber(i.productId),
      product_name: i.productName,
      quantity: longToNumber(i.quantity),
      price_at_time: i.priceAtTime,
    })),
    branch_id: o.branchId != null ? longToNumber(o.branchId) : null,
    user_name: o.userName ?? '',
  }));
}

export async function apiPlaceOrder(items: { product_id: number; quantity: number }[], branchId?: number): Promise<void> {
  const req = freshmeal.OrderRequestList.create({
    requests: items.map(i =>
      freshmeal.OrderRequest.create({ productId: i.product_id, quantity: i.quantity })
    ),
  });
  if (branchId != null) req.branchId = branchId;
  const body = freshmeal.OrderRequestList.encode(req).finish();
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiUpdateOrderStatus(id: number, status: ApiOrderStatus): Promise<void> {
  const res = await fetch(`${BASE_URL}/admin/orders/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error(await res.text());
}

export interface MonthlyRevenue {
  year: number;
  month: number;
  order_count: number;
  revenue: string;
}

export interface YearlyRevenue {
  year: number;
  order_count: number;
  revenue: string;
}

export interface ApiBranch {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  created_at: string;
}

export async function apiGetBranches(): Promise<ApiBranch[]> {
  const res = await fetch(`${BASE_URL}/branches`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.BranchList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.branches.map(b => ({
    id: longToNumber(b.id),
    name: b.name,
    address: b.address,
    lat: b.lat,
    lng: b.lng,
    created_at: b.createdAt,
  }));
}

export async function apiCreateBranch(name: string, address: string, lat: number, lng: number): Promise<ApiBranch> {
  const body = freshmeal.Branch.encode(
    freshmeal.Branch.create({ name, address, lat, lng })
  ).finish();
  const res = await fetch(`${BASE_URL}/branches`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const b = freshmeal.Branch.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(b.id),
    name: b.name,
    address: b.address,
    lat: b.lat,
    lng: b.lng,
    created_at: b.createdAt,
  };
}

export async function apiDeleteBranch(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/branches/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiUpdateBranch(id: number, name: string, address: string, lat: number, lng: number): Promise<ApiBranch> {
  const body = freshmeal.Branch.encode(
    freshmeal.Branch.create({ name, address, lat, lng })
  ).finish();
  const res = await fetch(`${BASE_URL}/branches/${id}`, {
    method: 'PUT',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const b = freshmeal.Branch.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(b.id),
    name: b.name,
    address: b.address,
    lat: b.lat,
    lng: b.lng,
    created_at: b.createdAt,
  };
}

export async function apiGetMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  const res = await fetch(`${BASE_URL}/admin/revenue/monthly`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.MonthlyRevenueList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.revenues.map(r => ({
    year: r.year,
    month: r.month,
    order_count: longToNumber(r.orderCount),
    revenue: r.revenue,
  }));
}

export async function apiGetYearlyRevenue(): Promise<YearlyRevenue[]> {
  const res = await fetch(`${BASE_URL}/admin/revenue/yearly`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.YearlyRevenueList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.revenues.map(r => ({
    year: r.year,
    order_count: longToNumber(r.orderCount),
    revenue: r.revenue,
  }));
}
