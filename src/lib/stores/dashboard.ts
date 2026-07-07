import { writable, derived } from 'svelte/store';
import {
  apiGetOrders,
  apiUpdateOrderStatus as apiUpdateStatus,
  apiGetBranches,
  apiGetMonthlyRevenue,
  apiGetYearlyRevenue,
  apiGetUsers,
  type ApiOrder,
  type ApiBranch,
  type ApiOrderStatus,
  type MonthlyRevenue,
  type YearlyRevenue,
  type ApiUser,
} from '$lib/api';

export type LatLng = { lat: number; lng: number };

function capitalizeStatus(s: ApiOrderStatus): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export type Order = {
  id: string;
  user_id: number;
  customer: string;
  customerLocation?: LatLng;
  total: string;
  status: string;
  time: string;
  created_at: string;
  branchId?: string;
  distanceKm?: number;
  items: ApiOrder['items'];
};

function mapOrder(api: ApiOrder): Order {
  return {
    id: String(api.id),
    user_id: api.user_id,
    customer: api.user_name || `User #${api.user_id}`,
    total: `$${api.total}`,
    status: capitalizeStatus(api.status),
    time: formatTime(api.created_at),
    created_at: api.created_at,
    branchId: api.branch_id != null ? String(api.branch_id) : undefined,
    items: api.items,
  };
}

export const orders = writable<Order[]>([]);

export async function refreshOrders() {
  try {
    const apiOrders = await apiGetOrders();
    orders.set(apiOrders.map(mapOrder));
  } catch (_) {
    console.warn('none not this!!!');
  }
}

export async function updateOrderStatus(id: string, status: string) {
  const numericId = parseInt(id, 10);
  if (isNaN(numericId)) return;
  const apiStatus = status.toLowerCase() as ApiOrderStatus;
  try {
    await apiUpdateStatus(numericId, apiStatus);
  } catch (_) {
    console.warn('updateOrderStatus API call failed, will refresh from server');
  }
  refreshOrders();
}

// Haversine formula to compute distance in km between two GPS map coordinates
export function getDistanceKm(loc1: LatLng, loc2: LatLng): number {
  const R = 6371;
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Menu items (no longer used - menu page uses API directly)
export type MenuItem = { id: string; name: string; price: string; available: boolean };
export const menu = writable<MenuItem[]>([]);

// Customers (no longer used - customers page uses API directly)
export type Customer = { id: string; name: string; orders: number };
export const customers = writable<Customer[]>([]);

// Branches
export type Branch = { id: string; name: string; address: string; phone: string; active: boolean; location: LatLng };
export const branches = writable<Branch[]>([]);

export async function refreshBranches() {
  try {
    const apiBranches = await apiGetBranches();
    const mapped: Branch[] = apiBranches.map(b => ({
      id: String(b.id),
      name: b.name,
      address: b.address,
      phone: '',
      active: true,
      location: { lat: b.lat, lng: b.lng },
    }));
    branches.update(current => {
      const merged = [...mapped];
      for (const existing of current) {
        const idx = merged.findIndex(m => m.id === existing.id);
        if (idx !== -1) {
          merged[idx] = { ...merged[idx], phone: existing.phone, active: existing.active };
        } else {
          merged.push(existing);
        }
      }
      return merged;
    });
  } catch (_) {
    console.warn('refreshBranches failed');
  }
}

export function toggleBranchStatus(id: string) {
  branches.update(list => list.map(b => b.id === id ? { ...b, active: !b.active } : b));
}

export function addBranch(branch: Branch) {
  branches.update(list => [...list, branch]);
}

// Real revenue and user data
export const monthlyRevenue = writable<MonthlyRevenue[]>([]);
export const yearlyRevenue = writable<YearlyRevenue[]>([]);

export async function refreshRevenue() {
  try {
    const [monthly, yearly] = await Promise.all([
      apiGetMonthlyRevenue(),
      apiGetYearlyRevenue(),
    ]);
    monthlyRevenue.set(monthly);
    yearlyRevenue.set(yearly);
  } catch (_) {
    console.warn('refreshRevenue failed');
  }
}

export const userList = writable<ApiUser[]>([]);

export async function refreshUserList() {
  try {
    const list = await apiGetUsers();
    userList.set(list);
  } catch (_) {
    console.warn('refreshUserList failed');
  }
}

function parseMoney(raw: string) {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export const stats = derived([orders, monthlyRevenue, userList], ([$orders, $monthlyRevenue, $userList]) => {
  const revenue = $orders.reduce((s, o) => s + parseMoney(o.total), 0);
  const avg = $orders.length ? revenue / $orders.length : 0;

  const activeUsers = $userList.filter(u => !u.deleted_at).length;

  const sorted = [...$monthlyRevenue].sort((a, b) =>
    b.year !== a.year ? b.year - a.year : b.month - a.month
  );

  let revenueChange = null;
  let ordersChange = null;

  if (sorted.length >= 2) {
    const curr = parseFloat(sorted[0].revenue);
    const prev = parseFloat(sorted[1].revenue);
    if (prev > 0) {
      const pct = ((curr - prev) / prev) * 100;
      revenueChange = `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
    }
    const currOrders = sorted[0].order_count;
    const prevOrders = sorted[1].order_count;
    if (prevOrders > 0) {
      const pct = ((currOrders - prevOrders) / prevOrders) * 100;
      ordersChange = `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
    }
  }

  return {
    todaysOrders: $orders.length,
    revenue: `$${revenue.toFixed(2)}`,
    activeUsers,
    avgOrder: `$${avg.toFixed(2)}`,
    revenueChange,
    ordersChange,
    activeUsersChange: null,
  };
});
