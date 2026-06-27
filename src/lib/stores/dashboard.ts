import { writable, derived } from 'svelte/store';

export type LatLng = { lat: number; lng: number };

export type Order = {
  id: string;
  customer: string;
  customerLocation: LatLng;
  total: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  time: string;
  branchId?: string;
  distanceKm?: number;
};

export const initialOrders: Order[] = [
  { 
    id: 'FD-1001', 
    customer: 'Alice Nguyen', 
    customerLocation: { lat: 10.7760, lng: 106.7010 }, // Near District 1 Le Loi
    total: '$23.50', 
    status: 'Completed', 
    time: '10:12',
    branchId: 'B-1',
    distanceKm: 0.1
  },
  { 
    id: 'FD-1002', 
    customer: 'Bob Tran', 
    customerLocation: { lat: 10.7280, lng: 106.7200 }, // Near District 7 Nguyen Thi Thap
    total: '$12.00', 
    status: 'Pending', 
    time: '10:20',
    branchId: 'B-2',
    distanceKm: 0.2
  },
  { 
    id: 'FD-1003', 
    customer: 'Cafe Corner', 
    customerLocation: { lat: 10.7810, lng: 106.6980 }, // District 3 Pasteur
    total: '$45.90', 
    status: 'Completed', 
    time: '09:48',
    branchId: 'B-1',
    distanceKm: 0.7
  },
  { 
    id: 'FD-1004', 
    customer: 'Duy Pham', 
    customerLocation: { lat: 10.8160, lng: 106.6640 }, // Near Airport Truong Son
    total: '$8.75', 
    status: 'Cancelled', 
    time: '08:30',
    branchId: 'B-3',
    distanceKm: 0.15
  }
];

export const orders = writable<Order[]>(initialOrders);

// Haversine formula to compute distance in km between two GPS map coordinates
export function getDistanceKm(loc1: LatLng, loc2: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
  const dLng = (loc2.lng - loc1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function updateOrderStatus(id: string, status: Order['status']) {
  orders.update(list => list.map(o => o.id === id ? { ...o, status } : o));
}

// Function to route a new mobile order to the closest active branch based on location map coordinates
export function routeAndAddOrder(customer: string, total: string, customerLocation: LatLng, activeBranches: Branch[]) {
  let closestBranchId = '';
  let minDistance = Infinity;

  // Route to the closest active branch
  const activeOnly = activeBranches.filter(b => b.active);
  const pool = activeOnly.length > 0 ? activeOnly : activeBranches; // fallback to any if all closed

  for (const b of pool) {
    const dist = getDistanceKm(customerLocation, b.location);
    if (dist < minDistance) {
      minDistance = dist;
      closestBranchId = b.id;
    }
  }

  const id = `FD-${Math.floor(Math.random()*9000)+1000}`;
  const newOrder: Order = {
    id,
    customer,
    customerLocation,
    total,
    status: 'Pending',
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    branchId: closestBranchId,
    distanceKm: Number(minDistance.toFixed(2))
  };

  orders.update(list => [newOrder, ...list]);
}

export type MenuItem = { id: string; name: string; price: string; available: boolean };
export const initialMenu: MenuItem[] = [
  { id: 'M-1', name: 'Pho Bo', price: '$4.50', available: true },
  { id: 'M-2', name: 'Banh Mi', price: '$2.25', available: true },
  { id: 'M-3', name: 'Goi Cuon', price: '$3.75', available: false }
];

export const menu = writable<MenuItem[]>(initialMenu);
export function toggleMenuAvailability(id: string) {
  menu.update(list => list.map(m => m.id === id ? { ...m, available: !m.available } : m));
}
export function addMenuItem(item: MenuItem) {
  menu.update(list => [...list, item]);
}

// Customers
export type Customer = { id: string; name: string; orders: number };
export const initialCustomers: Customer[] = [
  { id: 'C-1', name: 'Alice Nguyen', orders: 12 },
  { id: 'C-2', name: 'Bob Tran', orders: 3 },
  { id: 'C-3', name: 'Cafe Corner', orders: 28 }
];
export const customers = writable<Customer[]>(initialCustomers);

// Branches
export type Branch = { id: string; name: string; address: string; phone: string; active: boolean; location: LatLng };
export const initialBranches: Branch[] = [
  { id: 'B-1', name: 'Downtown Branch', address: '123 Le Loi St, District 1, HCMC', phone: '028-3829-1000', active: true, location: { lat: 10.7769, lng: 106.7009 } },
  { id: 'B-2', name: 'Westside Bistro', address: '456 Nguyen Thi Thap, District 7, HCMC', phone: '028-5412-2000', active: true, location: { lat: 10.7289, lng: 106.7196 } },
  { id: 'B-3', name: 'Airport Express', address: '78 Truong Son St, Tan Binh District, HCMC', phone: '028-3848-3000', active: false, location: { lat: 10.8163, lng: 106.6637 } }
];
export const branches = writable<Branch[]>(initialBranches);

export function toggleBranchStatus(id: string) {
  branches.update(list => list.map(b => b.id === id ? { ...b, active: !b.active } : b));
}

export function addBranch(branch: Branch) {
  branches.update(list => [...list, branch]);
}

// Stats derived from orders
function parseMoney(raw: string) {
  const n = parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export const stats = derived(orders, $orders => {
  const revenue = $orders.reduce((s, o) => s + parseMoney(o.total), 0);
  const avg = $orders.length ? revenue / $orders.length : 0;
  const todaysOrders = $orders.length;
  return {
    todaysOrders,
    revenue: `$${revenue.toFixed(2)}`,
    activeUsers: 92,
    avgOrder: `$${avg.toFixed(2)}`
  };
});
