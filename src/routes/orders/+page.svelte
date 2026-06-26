<script lang="ts">
  import OrdersTable from '$lib/components/OrdersTable.svelte';
  import OrderMap from '$lib/components/OrderMap.svelte';
  import { orders, branches } from '$lib/stores/dashboard';
  import { fromStore } from 'svelte/store';

  let order_list = fromStore(orders);
  let branch_list = fromStore(branches);
</script>

<main class="container">
  <header class="page-header">
    <h1>Mobile Orders</h1>
    <p>Incoming customer orders from mobile app</p>
  </header>

  <section class="panel map-section" style="margin-top:1rem">
    <h2>📍 Branch & Order Point Map</h2>
    <p class="map-subtitle">
      Branch pins show store locations. Customer dots show order pickup points, colour‑coded to their assigned branch.
      Dashed lines connect each order to its nearest branch.
    </p>
    <OrderMap branches={branch_list.current} orders={order_list.current} />
  </section>

  <section class="panel" style="margin-top:1rem">
    <h2>All Orders</h2>
    <OrdersTable orders={order_list.current} branches={branch_list.current} />
  </section>
</main>

<style>
  .map-section h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1rem;
    font-weight: 600;
  }
  .map-subtitle {
    font-size: 0.82rem;
    color: #64748b;
    margin: 0 0 0.75rem 0;
  }
</style>
