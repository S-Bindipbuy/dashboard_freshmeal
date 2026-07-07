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

  function handleStatusChange(orderId: string, newStatus: string) {
    updateOrderStatus(orderId, newStatus);
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
      {#each orders as o (o.id)}
        <tr>
          <td>{o.id}</td>
          <td>{o.customer}</td>
          <td class="branch-cell">{getBranchName(o.branchId)}</td>
          <td>{o.total}</td>
          <td>
            <select value={o.status} onchange={(e) => handleStatusChange(o.id, (e.currentTarget as HTMLSelectElement).value)} aria-label="Change status">
              {#each STATUSES as s}
                <option value={s}>{s}</option>
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
  .status.pending{background:var(--warning-bg);color:var(--warning-text)}
  .status.paid{background:var(--badge-customer-bg);color:var(--badge-customer-text)}
  .status.confirmed{background:var(--badge-admin-bg);color:var(--badge-admin-text)}
  .status.preparing{background:var(--warning-bg);color:var(--warning-text)}
  .status.delivered{background:var(--success-bg);color:var(--success-text)}
  .status.cancelled{background:var(--error-bg);color:var(--error-text)}
  .branch-cell{color:var(--accent);font-weight:500;font-size:0.85rem}
</style>
