<script lang="ts">
  import { updateOrderStatus } from '$lib/stores/dashboard';
  import type { Order, Branch } from '$lib/stores/dashboard';

  interface Props {
    orders?: Order[];
    branches?: Branch[];
  }

  let { orders = [], branches = [] }: Props = $props();

  function getBranchName(branchId?: string): string {
    if (!branchId) return '—';
    return branches.find(b => b.id === branchId)?.name ?? branchId;
  }
</script>

<section id="orders" class="orders">
  <table>
    <thead>
      <tr>
        <th>Order</th>
        <th>Customer</th>
        <th>Branch</th>
        <th>Dist (km)</th>
        <th>Total</th>
        <th>Status</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
      {#each orders as o}
        <tr>
          <td>{o.id}</td>
          <td>{o.customer}</td>
          <td class="branch-cell">{getBranchName(o.branchId)}</td>
          <td class="dist-cell">{o.distanceKm != null ? o.distanceKm.toFixed(2) : '—'}</td>
          <td>{o.total}</td>
          <td>
            <select onchange={(e) => updateOrderStatus(o.id, (e.currentTarget as HTMLSelectElement).value as Order['status'])} aria-label="Change status">
              <option selected={o.status === 'Pending'}>Pending</option>
              <option selected={o.status === 'Completed'}>Completed</option>
              <option selected={o.status === 'Cancelled'}>Cancelled</option>
            </select>
            <span class="status {o.status.toLowerCase()}">{o.status}</span>
          </td>
          <td>{o.time}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</section>

<style>
  .orders table{width:100%;border-collapse:collapse}
  th,td{padding:0.5rem 0.75rem;text-align:left;border-bottom:1px solid #eee;font-size:0.9rem}
  select{margin-right:0.5rem}
  .status{padding:0.25rem 0.5rem;border-radius:6px;font-size:0.8rem}
  .status.pending{background:#fff4e5;color:#b36b00}
  .status.completed{background:#e8fff3;color:#057a3a}
  .status.cancelled{background:#ffecec;color:#a20000}
  .branch-cell{color:#0b74de;font-weight:500;font-size:0.85rem}
  .dist-cell{color:#64748b;font-size:0.85rem}
</style>
