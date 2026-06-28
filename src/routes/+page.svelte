<script lang="ts">
  import { onMount } from 'svelte';
  import StatsCard from '$lib/components/StatsCard.svelte';
  import OrdersTable from '$lib/components/OrdersTable.svelte';
  import { stats, orders as ordersStore, refreshOrders } from '$lib/stores/dashboard';

  const sparkData = [5,8,6,10,9,11,8,12,9,10];

  onMount(() => { refreshOrders(); });
</script>

<main class="container">
  <header class="page-header">
    <h1>Dashboard Overview</h1>
    <p>Real-time analytics and store status</p>
  </header>
  <section class="grid-stats">
    <StatsCard title={"Today's Orders"} value={$stats.todaysOrders} change={'+8%'} />
    <StatsCard title={'Revenue'} value={$stats.revenue} change={'+12%'} />
    <StatsCard title={'Active Users'} value={$stats.activeUsers} change={'+3%'} />
    <StatsCard title={'Avg. Order Value'} value={$stats.avgOrder} change={null} />
  </section>

  <section class="panels">
    <article class="panel">
      <h2>Orders Overview</h2>
      <div class="spark">
        <svg viewBox="0 0 100 30" preserveAspectRatio="none">
          {#each sparkData as v, i}
            <circle cx={(i*(100/(sparkData.length-1)))} cy={30 - v*2.2} r="1.2" fill="#0b74de" />
          {/each}
          <polyline fill="none" stroke="#0b74de" stroke-width="0.8" points={sparkData.map((v,i)=>`${i*(100/(sparkData.length-1))},${30 - v*2.2}`).join(' ')} />
        </svg>
      </div>
    </article>

    <article class="panel">
      <h2>Recent Orders</h2>
      <OrdersTable orders={$ordersStore} />
    </article>
  </section>
</main>

<style>
  .container{padding:1rem 1.25rem;max-width:1100px;margin:0 auto}
  .grid-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0.75rem;margin:1rem 0}
  .panels{display:grid;grid-template-columns:2fr 1fr;gap:1rem}
  .panel{background:#ffffff;padding:1rem;border-radius:8px;border:1px solid #e6e6e6}
  .panel h2{margin:0 0 0.5rem 0;font-size:1rem}
  .spark{height:60px}
  svg{width:100%;height:100%}

  @media(max-width:800px){
    .panels{grid-template-columns:1fr}
  }
</style>
