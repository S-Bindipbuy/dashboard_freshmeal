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
  if (_token)     localStorage.setItem(LS_TOKEN, _token); else localStorage.removeItem(LS_TOKEN);
  if (_userId)    localStorage.setItem(LS_USER_ID, String(_userId)); else localStorage.removeItem(LS_USER_ID);
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

function longToNumber(v: number | { toNumber(): number } | null | undefined): number {
  if (v == null) return 0;
  return typeof v === 'number' ? v : v.toNumber();
}

function bodyBytes(msg: { finish(): Uint8Array }): Uint8Array<ArrayBuffer> {
  const b = msg.finish();
  const r = new Uint8Array(b.length);
  r.set(b);
  return r;
}

export interface LoginResponse {
  token: string;
  id: number;
  name: string;
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const body = bodyBytes(freshmeal.LoginRequest.encode(
    freshmeal.LoginRequest.create({ email, password })
  ));
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.LoginResponse.decode(new Uint8Array(await res.arrayBuffer()));
  _token = data.token ?? null;
  _userId = longToNumber(data.id);
  _userName = data.name ?? null;
  persistAuth();
  return { token: data.token ?? '', id: longToNumber(data.id), name: data.name ?? '' };
}

export async function apiAdminRegister(name: string, email: string, password: string, role: number): Promise<void> {
  const body = bodyBytes(freshmeal.RegisterRequest.encode(
    freshmeal.RegisterRequest.create({ name, email, password, role })
  ));
  const res = await fetch(`${BASE_URL}/users`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiAdminDeleteUser(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiGetUserOrders(userId: number): Promise<ApiOrder[]> {
  const res = await fetch(`${BASE_URL}/users/${userId}/orders`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.OrderHistoryList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.orders.map(o => ({
    id: longToNumber(o.id),
    user_id: longToNumber(o.userId),
    status: orderStatusMap[o.status!] ?? 'pending',
    total: o.total ?? '',
    created_at: o.createdAt ?? '',
    items: (o.items ?? []).map(i => ({
      id: longToNumber(i.id),
      product_id: longToNumber(i.productId),
      product_name: i.productName ?? '',
      quantity: longToNumber(i.quantity),
      price_at_time: i.priceAtTime ?? '',
    })),
    branch_id: o.branchId != null ? longToNumber(o.branchId) : null,
    user_name: o.userName ?? '',
  }));
}

export interface ApiUser {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
  deleted_at: string | null;
}

const userRoleMap: Record<number, string> = {
  [freshmeal.Role.ADMIN]: 'admin',
  [freshmeal.Role.CUSTOMER]: 'customer',
  [freshmeal.Role.RESTAURANT]: 'restaurant',
};

export async function apiGetUsers(role?: string, signal?: AbortSignal): Promise<ApiUser[]> {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  const qs = params.toString();
  const url = qs ? `${BASE_URL}/users?${qs}` : `${BASE_URL}/users`;
  const res = await fetch(url, { headers: authHeaders(), signal });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.UserList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.users.map(u => ({
    id: longToNumber(u.id),
    email: u.email ?? '',
    name: u.name ?? '',
    role: userRoleMap[u.role!] ?? 'customer',
    created_at: u.createdAt ?? '',
    deleted_at: u.deletedAt ?? null,
  }));
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
    email: data.email ?? '',
    name: data.name ?? '',
    role: roleMap[data.role!] ?? 'customer',
    avatar: data.avatar ?? null,
  };
}

export async function apiUpdateProfile(name: string, email: string): Promise<ProfileResponse> {
  const msg = freshmeal.UpdateProfileRequest.create({ name, email });
  const bytes = bodyBytes(freshmeal.UpdateProfileRequest.encode(msg));
  const res = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { ...authHeaders(), 'Content-Type': 'application/x-protobuf' },
    body: bytes,
  });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.ProfileResponse.decode(new Uint8Array(await res.arrayBuffer()));
  const roleMap: Record<number, string> = {
    [freshmeal.Role.ADMIN]: 'admin',
    [freshmeal.Role.CUSTOMER]: 'customer',
    [freshmeal.Role.RESTAURANT]: 'restaurant',
  };
  return {
    id: longToNumber(data.id),
    email: data.email ?? '',
    name: data.name ?? '',
    role: roleMap[data.role!] ?? 'customer',
    avatar: data.avatar ?? null,
  };
}

export async function apiUploadAvatar(file: File): Promise<void> {
  const form = new FormData();
  form.append('image', file);
  const res = await fetch(`${BASE_URL}/profile/avatar`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
}

export interface ApiCustomer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export async function apiGetCustomers(): Promise<ApiCustomer[]> {
  const res = await fetch(`${BASE_URL}/customers`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Fetching customers failed: ${res.status} ${await res.text()}`);
  const data = freshmeal.CustomerList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.customers.map(c => ({
    id: longToNumber(c.id),
    name: c.name ?? '',
    email: c.email ?? '',
    created_at: c.createdAt ?? '',
  }));
}

export async function apiGetCustomer(id: number): Promise<ApiCustomer> {
  const res = await fetch(`${BASE_URL}/customer?id=${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Fetching customer ${id} failed: ${res.status} ${await res.text()}`);
  const data = freshmeal.CustomerResponse.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(data.id),
    name: data.name ?? '',
    email: data.email ?? '',
    created_at: data.createdAt ?? '',
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
    name: p.name ?? '',
    description: p.description ?? null,
    price: p.price ?? '',
    available: p.available ?? false,
    image: p.image ?? '',
    category_id: p.categoryId != null ? longToNumber(p.categoryId) : null,
    deleted_at: p.deletedAt ?? null,
    created_at: p.createdAt ?? '',
  }));
}

export async function apiCreateProduct(form: FormData): Promise<ApiProduct> {
  const imageFile = form.get('image') as File | null;
  const name = form.get('name') as string;
  const description = form.get('description') as string;
  const price = form.get('price') as string;
  const available = form.get('available') === 'true';
  const categoryIdStr = form.get('category_id') as string | null;
  const categoryId = categoryIdStr ? parseInt(categoryIdStr) : undefined;

  const msg = freshmeal.UpdateProductRequest.create({
    name,
    description: description || undefined,
    price,
    available,
    categoryId: categoryId || undefined,
  });
  const dataBytes = bodyBytes(freshmeal.UpdateProductRequest.encode(msg));

  const mp = new FormData();
  mp.append('data', new Blob([dataBytes], { type: 'application/x-protobuf' }));
  if (imageFile) mp.append('image', imageFile);

  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: mp,
  });
  if (!res.ok) throw new Error(await res.text());
  const p = freshmeal.Product.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(p.id),
    name: p.name ?? '',
    description: p.description ?? null,
    price: p.price ?? '',
    available: p.available ?? false,
    image: p.image ?? '',
    category_id: p.categoryId != null ? longToNumber(p.categoryId) : null,
    deleted_at: p.deletedAt ?? null,
    created_at: p.createdAt ?? '',
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
  const imageFile = form.get('image') as File | null;
  const name = form.get('name') as string;
  const description = form.get('description') as string;
  const price = form.get('price') as string;
  const available = form.get('available') === 'true';
  const categoryIdStr = form.get('category_id') as string | null;
  const categoryId = categoryIdStr ? parseInt(categoryIdStr) : undefined;

  const msg = freshmeal.UpdateProductRequest.create({
    name,
    description: description || undefined,
    price,
    available,
    categoryId: categoryId || undefined,
  });
  const dataBytes = bodyBytes(freshmeal.UpdateProductRequest.encode(msg));

  const mp = new FormData();
  mp.append('data', new Blob([dataBytes], { type: 'application/x-protobuf' }));
  if (imageFile) mp.append('image', imageFile);

  const res = await fetch(`${BASE_URL}/products/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: mp,
  });
  if (!res.ok) throw new Error(await res.text());
  const p = freshmeal.Product.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(p.id),
    name: p.name ?? '',
    description: p.description ?? null,
    price: p.price ?? '',
    available: p.available ?? false,
    image: p.image ?? '',
    category_id: p.categoryId != null ? longToNumber(p.categoryId) : null,
    deleted_at: p.deletedAt ?? null,
    created_at: p.createdAt ?? '',
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
    name: c.name ?? '',
    description: c.description ?? null,
    created_at: c.createdAt ?? '',
  }));
}

export async function apiCreateCategory(name: string, description?: string): Promise<ApiCategory> {
  const body = bodyBytes(freshmeal.Category.encode(
    freshmeal.Category.create({ name, description: description ?? '' })
  ));
  const res = await fetch(`${BASE_URL}/categories`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const c = freshmeal.Category.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(c.id),
    name: c.name ?? '',
    description: c.description ?? null,
    created_at: c.createdAt ?? '',
  };
}

export async function apiUpdateCategory(id: number, name: string, description?: string): Promise<ApiCategory> {
  const body = bodyBytes(freshmeal.Category.encode(
    freshmeal.Category.create({ name, description: description ?? '' })
  ));
  const res = await fetch(`${BASE_URL}/categories/${id}`, {
    method: 'PUT',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const c = freshmeal.Category.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(c.id),
    name: c.name ?? '',
    description: c.description ?? null,
    created_at: c.createdAt ?? '',
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
  const body = bodyBytes(freshmeal.Product.encode(
    freshmeal.Product.create({ available })
  ));
  const res = await fetch(`${BASE_URL}/products/${id}/availability`, {
    method: 'PATCH',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const p = freshmeal.Product.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(p.id),
    name: p.name ?? '',
    description: p.description ?? null,
    price: p.price ?? '',
    available: p.available ?? false,
    image: p.image ?? '',
    category_id: p.categoryId != null ? longToNumber(p.categoryId) : null,
    deleted_at: p.deletedAt ?? null,
    created_at: p.createdAt ?? '',
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
    status: orderStatusMap[o.status!] ?? 'pending',
    total: o.total ?? '',
    created_at: o.createdAt ?? '',
    items: (o.items ?? []).map(i => ({
      id: longToNumber(i.id),
      product_id: longToNumber(i.productId),
      product_name: i.productName ?? '',
      quantity: longToNumber(i.quantity),
      price_at_time: i.priceAtTime ?? '',
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
  const body = bodyBytes(freshmeal.OrderRequestList.encode(req));
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
}

export async function apiUpdateOrderStatus(id: number, status: ApiOrderStatus): Promise<void> {
  const res = await fetch(`${BASE_URL}/orders/${id}/status`, {
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
    name: b.name ?? '',
    address: b.address ?? '',
    lat: b.lat ?? 0,
    lng: b.lng ?? 0,
    created_at: b.createdAt ?? '',
  }));
}

export async function apiCreateBranch(name: string, address: string, lat: number, lng: number): Promise<ApiBranch> {
  const body = bodyBytes(freshmeal.Branch.encode(
    freshmeal.Branch.create({ name, address, lat, lng })
  ));
  const res = await fetch(`${BASE_URL}/branches`, {
    method: 'POST',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const b = freshmeal.Branch.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(b.id),
    name: b.name ?? '',
    address: b.address ?? '',
    lat: b.lat ?? 0,
    lng: b.lng ?? 0,
    created_at: b.createdAt ?? '',
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
  const body = bodyBytes(freshmeal.Branch.encode(
    freshmeal.Branch.create({ name, address, lat, lng })
  ));
  const res = await fetch(`${BASE_URL}/branches/${id}`, {
    method: 'PUT',
    headers: { ...protoHeaders(), ...authHeaders() },
    body,
  });
  if (!res.ok) throw new Error(await res.text());
  const b = freshmeal.Branch.decode(new Uint8Array(await res.arrayBuffer()));
  return {
    id: longToNumber(b.id),
    name: b.name ?? '',
    address: b.address ?? '',
    lat: b.lat ?? 0,
    lng: b.lng ?? 0,
    created_at: b.createdAt ?? '',
  };
}

export async function apiGetMonthlyRevenue(branchId?: number): Promise<MonthlyRevenue[]> {
  const params = new URLSearchParams();
  if (branchId != null) params.set('branch_id', String(branchId));
  const qs = params.toString();
  const url = qs ? `${BASE_URL}/revenue/monthly?${qs}` : `${BASE_URL}/revenue/monthly`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.MonthlyRevenueList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.revenues.map(r => ({
    year: r.year ?? 0,
    month: r.month ?? 0,
    order_count: longToNumber(r.orderCount),
    revenue: r.revenue ?? '',
  }));
}

export async function apiGetYearlyRevenue(branchId?: number): Promise<YearlyRevenue[]> {
  const params = new URLSearchParams();
  if (branchId != null) params.set('branch_id', String(branchId));
  const qs = params.toString();
  const url = qs ? `${BASE_URL}/revenue/yearly?${qs}` : `${BASE_URL}/revenue/yearly`;
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  const data = freshmeal.YearlyRevenueList.decode(new Uint8Array(await res.arrayBuffer()));
  return data.revenues.map(r => ({
    year: r.year ?? 0,
    order_count: longToNumber(r.orderCount),
    revenue: r.revenue ?? '',
  }));
}
