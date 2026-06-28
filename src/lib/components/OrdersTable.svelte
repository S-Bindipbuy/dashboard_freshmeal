<script lang="ts">
  import { updateOrderStatus } from '$lib/stores/dashboard';
  import type { Order, Branch } from '$lib/stores/dashboard';

  interface Props {
    orders?: Order[];
    branches?: Branch[];
  }

  let { orders = [], branches = [] }: Props = $props();

  const STATUSES = ['Pending', 'Paid', 'Confirmed', 'Preparing', 'Delivered', 'Cancelled'];

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
          <td>{o.total}</td>
          <td>
            <select onchange={(e) => updateOrderStatus(o.id, (e.currentTarget as HTMLSelectElement).value)} aria-label="Change status">
              {#each STATUSES as s}
                <option value={s} selected={o.status === s}>{s}</option>
              {/each}
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
  .status.paid{background:#e0f2fe;color:#0369a1}
  .status.confirmed{background:#e0e7ff;color:#4338ca}
  .status.preparing{background:#fef3c7;color:#d97706}
  .status.delivered{background:#dcfce7;color:#15803d}
  .status.cancelled{background:#fee2e2;color:#b91c1c}
  .branch-cell{color:#0b74de;font-weight:500;font-size:0.85rem}
</style>
