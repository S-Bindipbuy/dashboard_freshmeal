<script lang="ts">
  import { onMount } from 'svelte';
  import OrdersTable from '$lib/components/OrdersTable.svelte';
  import OrderMap from '$lib/components/OrderMap.svelte';
  import { orders, branches, refreshOrders, refreshBranches } from '$lib/stores/dashboard';
  import type { Order, Branch } from '$lib/stores/dashboard';

  let selectedBranchId = $state<string | null>(null);
  let rawOrders = $state<Order[]>([]);
  let rawBranches = $state<Branch[]>([]);

  let filteredOrders = $derived(
    selectedBranchId
      ? rawOrders.filter(o => o.branchId === selectedBranchId)
      : rawOrders
  );

  let branch = $derived(
    selectedBranchId ? rawBranches.find(b => b.id === selectedBranchId) ?? null : null
  );

  onMount(async () => {
    await Promise.all([
      refreshOrders(),
      refreshBranches(),
    ]);
    return orders.subscribe(v => rawOrders = v);
  });

  onMount(() => {
    return branches.subscribe(v => rawBranches = v);
  });

  function selectBranch(id: string) {
    selectedBranchId = id;
  }

  function back() {
    selectedBranchId = null;
  }
</script>

<main class="container">
  <header class="page-header">
    <h1>Mobile Orders</h1>
    <p>Incoming customer orders from mobile app</p>
  </header>

  {#if !selectedBranchId}
    <section class="panel" style="margin-top:1rem">
      <h2>Select a Branch</h2>
      <p style="color:#64748b;font-size:0.85rem;margin:0 0 1rem 0;">Choose a branch to view its orders and map.</p>
      <div class="branches-grid">
        {#each rawBranches as b}
          <button onclick={() => selectBranch(b.id)} class="branch-card" class:inactive={!b.active}>
            <div class="branch-card-header">
              <h3>{b.name}</h3>
              <span class="branch-badge" class:badge-active={b.active} class:badge-inactive={!b.active}>
                {b.active ? 'Active' : 'Closed'}
              </span>
            </div>
            <p class="branch-addr">{b.address}</p>
            <p class="branch-orders-count">
              {rawOrders.filter(o => o.branchId === b.id).length} orders
            </p>
          </button>
        {/each}
      </div>
    </section>
  {:else}
    <div class="back-nav">
      <button onclick={back} class="btn-back">← All Branches</button>
    </div>

    {#if branch}
      <section class="panel map-section" style="margin-top:0.5rem">
        <h2>📍 {branch.name}</h2>
        <p class="map-subtitle">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} for this branch.
        </p>
        <OrderMap branches={rawBranches} orders={filteredOrders} />
      </section>

      <section class="panel" style="margin-top:1rem">
        <h2>Orders</h2>
        <OrdersTable orders={filteredOrders} branches={rawBranches} />
      </section>
    {/if}
  {/if}
</main>

<style>
  .back-nav {
    margin-bottom: 0.75rem;
  }
  .btn-back {
    background: none;
    border: none;
    color: #0b74de;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    padding: 0;
  }
  .btn-back:hover {
    text-decoration: underline;
  }

  .branches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 1rem;
  }

  .branch-card {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    background: #ffffff;
    text-align: left;
    cursor: pointer;
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    font-family: inherit;
    font-size: inherit;
    width: 100%;
  }
  .branch-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  }
  .branch-card.inactive {
    opacity: 0.65;
  }

  .branch-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.5rem;
  }
  .branch-card-header h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: #0f172a;
  }

  .branch-badge {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }
  .badge-active {
    background: #dcfce7;
    color: #15803d;
  }
  .badge-inactive {
    background: #fee2e2;
    color: #b91c1c;
  }

  .branch-addr {
    font-size: 0.83rem;
    color: #64748b;
    margin: 0 0 0.5rem 0;
  }
  .branch-orders-count {
    font-size: 0.78rem;
    color: #0b74de;
    font-weight: 500;
    margin: 0;
  }

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
