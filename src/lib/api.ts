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

function authHeaders(): HeadersInit {
  return _token ? { Authorization: `Bearer ${_token}` } : {};
}

export interface LoginResponse {
  token: string;
  id: number;
  name: string;
}

export async function apiLogin(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error(await res.text());
  const data: LoginResponse = await res.json();
  _token = data.token;
  _userId = data.id;
  _userName = data.name;
  persistAuth();
  return data;
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
  return res.json();
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
  return res.json();
}

export async function apiGetCustomer(id: number): Promise<ApiCustomer> {
  const res = await fetch(`${BASE_URL}/customer?id=${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Fetching customer ${id} failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export interface ApiProduct {
  id: number;
  name: string;
  description: string | null;
  price: string;
  available: boolean;
  image: string;
  deleted_at: string | null;
  created_at: string;
}

export async function apiGetProducts(): Promise<ApiProduct[]> {
  const res = await fetch(`${BASE_URL}/products`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiCreateProduct(form: FormData): Promise<ApiProduct> {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
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
}

export async function apiGetOrders(lastId?: number, limit = 50): Promise<ApiOrder[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (lastId != null) params.set('last_id', String(lastId));
  const res = await fetch(`${BASE_URL}/orders?${params}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPlaceOrder(items: { product_id: number; quantity: number }[]): Promise<void> {
  const res = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(items),
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

export async function apiGetMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  const res = await fetch(`${BASE_URL}/admin/revenue/monthly`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiGetYearlyRevenue(): Promise<YearlyRevenue[]> {
  const res = await fetch(`${BASE_URL}/admin/revenue/yearly`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
