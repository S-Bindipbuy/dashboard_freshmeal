<script lang="ts">
  import { customers } from '$lib/stores/dashboard';
  import { fromStore } from 'svelte/store';
  let customer_list = fromStore(customers);
</script>

<main class="container">
  <header class="page-header">
    <h1>Customers Directory</h1>
    <p>View registered clients and order counts</p>
  </header>
  <section class="panel">
    <h2>Customers</h2>
    <ul style="list-style:none;padding:0;margin:0">
      {#each customer_list.current as c}
        <li style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid #eee">
          <div>
            <div style="font-weight:600">{c.name}</div>
            <div style="font-size:0.85rem;color:#666">Orders: {c.orders}</div>
          </div>
          <div style="color:#666">{c.id}</div>
        </li>
      {/each}
    </ul>
  </section>
</main>

<style>
</style>
