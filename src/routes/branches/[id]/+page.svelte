<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { branches, orders, refreshOrders, refreshBranches, toggleBranchStatus } from '$lib/stores/dashboard';
  import { apiGetMonthlyRevenue, apiGetYearlyRevenue } from '$lib/api';
  import type { MonthlyRevenue, YearlyRevenue } from '$lib/api';

  let monthlyRevenueData = $state<MonthlyRevenue[]>([]);
  let yearlyRevenueData = $state<YearlyRevenue[]>([]);
  let activeTab = $state<'monthly' | 'yearly'>('monthly');

  let branchId = $derived(page.params.id);
  let branch = $derived($branches.find(b => b.id === branchId));
  let branchOrders = $derived($orders.filter(o => o.branchId === branchId));

  let stats = $derived.by(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = months.map((month, index) => {
      const m = index + 1;
      const data = monthlyRevenueData.find(r => r.year === 2026 && r.month === m);
      return { month, revenue: data ? parseFloat(data.revenue) : 0 };
    });
    const years = ['2023', '2024', '2025', '2026'];
    const yearly = years.map(year => {
      const y = parseInt(year, 10);
      const data = yearlyRevenueData.find(r => r.year === y);
      return { year, revenue: data ? parseFloat(data.revenue) : 0 };
    });
    const total2026 = monthly.reduce((s, m) => s + m.revenue, 0);
    return { monthly, yearly, total2026 };
  });

  onMount(() => {
    refreshOrders();
    refreshBranches();
    const numericId = parseInt(branchId ?? '', 10);
    if (!isNaN(numericId)) {
      Promise.all([
        apiGetMonthlyRevenue(numericId),
        apiGetYearlyRevenue(numericId),
      ]).then(([monthly, yearly]) => {
        monthlyRevenueData = monthly;
        yearlyRevenueData = yearly;
      }).catch(() => {});
    }
  });
</script>

<main class="container">
  <div class="back-nav">
    <a href="/branches" class="btn-back">← Back to Branches</a>
  </div>

  {#if !branch}
    <div class="panel error-panel">
      <h2>Branch Not Found</h2>
      <p>The branch with ID "{branchId}" does not exist or has been removed.</p>
      <a href="/branches" class="btn-primary" style="display: inline-block; text-decoration: none; margin-top: 1rem; text-align: center; line-height: 38px;">Return to Branches</a>
    </div>
  {:else}
    <header class="page-header branch-header">
      <div>
        <div class="title-row">
          <h1>{branch.name}</h1>
          <span class="branch-badge" class:badge-active={branch.active} class:badge-inactive={!branch.active}>
            {branch.active ? 'Active Storefront' : 'Closed Storefront'}
          </span>
        </div>
        <p class="branch-address">📍 {branch.address} &nbsp;|&nbsp; 📞 {branch.phone}</p>
      </div>
      <button 
        onclick={() => toggleBranchStatus(branch!.id)} 
        class="btn-status-toggle"
        class:btn-close-branch={branch.active}
        class:btn-open-branch={!branch.active}
      >
        {branch.active ? 'Temporarily Close Storefront' : 'Activate Storefront'}
      </button>
    </header>

    <!-- Branch Quick Info cards -->
    <section class="branch-stats-grid">
      <div class="stat-mini-card">
        <span class="label">2026 Est. Revenue</span>
        <span class="value">${stats?.total2026.toLocaleString()}</span>
      </div>
      <div class="stat-mini-card">
        <span class="label">Operational Status</span>
        <span class="value" class:text-active={branch.active} class:text-inactive={!branch.active}>
          {branch.active ? 'Active' : 'Closed'}
        </span>
      </div>
      <div class="stat-mini-card">
        <span class="label">Recent Active Orders</span>
        <span class="value">{branchOrders.length}</span>
      </div>
    </section>

    <div class="layout-main">
      <!-- Analytics Section -->
      <section class="panel analytics-panel">
        <div class="panel-header-tabs">
          <h2>Revenue Performance</h2>
          <div class="tab-selectors">
            <button class="tab-btn" class:active={activeTab === 'monthly'} onclick={() => activeTab = 'monthly'}>Monthly</button>
            <button class="tab-btn" class:active={activeTab === 'yearly'} onclick={() => activeTab = 'yearly'}>Yearly</button>
          </div>
        </div>

        <div class="tab-content">
          {#if activeTab === 'monthly' && stats}
            <div class="chart-container">
              <svg viewBox="0 0 600 240" class="revenue-chart">
                <!-- Grid lines -->
                <line x1="40" y1="30" x2="570" y2="30" stroke="#f1f5f9" stroke-width="1" />
                <line x1="40" y1="80" x2="570" y2="80" stroke="#f1f5f9" stroke-width="1" />
                <line x1="40" y1="130" x2="570" y2="130" stroke="#f1f5f9" stroke-width="1" />
                <line x1="40" y1="180" x2="570" y2="180" stroke="#e2e8f0" stroke-width="1" />
                
                <!-- Draw bars -->
                {#each stats.monthly as item, i}
                  {@const maxVal = Math.max(...stats.monthly.map(m => m.revenue)) || 1}
                  {@const barHeight = (item.revenue / maxVal) * 140}
                  {@const x = 50 + i * 43}
                  {@const y = 180 - barHeight}
                  
                  <rect 
                    x={x} 
                    y={y} 
                    width="26" 
                    height={barHeight} 
                    rx="4"
                    fill="url(#barGradient)" 
                    class="chart-bar"
                  >
                    <title>{item.month}: ${item.revenue.toLocaleString()}</title>
                  </rect>

                  <!-- Value label above bar -->
                  <text 
                    x={x + 13} 
                    y={y - 6} 
                    text-anchor="middle" 
                    font-size="9" 
                    fill="#475569" 
                    font-weight="600"
                  >
                    ${Math.round(item.revenue / 100) / 10}k
                  </text>

                  <!-- Month label -->
                  <text 
                    x={x + 13} 
                    y="198" 
                    text-anchor="middle" 
                    font-size="10" 
                    fill="#64748b"
                  >
                    {item.month}
                  </text>
                {/each}

                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6" />
                    <stop offset="100%" stop-color="#1d4ed8" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            
            <div class="revenue-list">
              {#each stats.monthly as item}
                <div class="revenue-item">
                  <span class="item-name">{item.month} 2026</span>
                  <span class="item-value">${item.revenue.toLocaleString()}</span>
                </div>
              {/each}
            </div>

          {:else if activeTab === 'yearly' && stats}
            <div class="chart-container">
              <svg viewBox="0 0 600 240" class="revenue-chart">
                <!-- Grid lines -->
                <line x1="50" y1="30" x2="550" y2="30" stroke="#f1f5f9" stroke-width="1" />
                <line x1="50" y1="105" x2="550" y2="105" stroke="#f1f5f9" stroke-width="1" />
                <line x1="50" y1="180" x2="550" y2="180" stroke="#e2e8f0" stroke-width="1" />
                
                <!-- Draw bars for years -->
                {#each stats.yearly as item, i}
                  {@const maxVal = Math.max(...stats.yearly.map(y => y.revenue)) || 1}
                  {@const barHeight = (item.revenue / maxVal) * 140}
                  {@const x = 90 + i * 120}
                  {@const y = 180 - barHeight}
                  
                  <rect 
                    x={x} 
                    y={y} 
                    width="60" 
                    height={barHeight} 
                    rx="6"
                    fill="url(#yearlyGradient)" 
                    class="chart-bar"
                  >
                    <title>{item.year}: ${item.revenue.toLocaleString()}</title>
                  </rect>

                  <text 
                    x={x + 30} 
                    y={y - 8} 
                    text-anchor="middle" 
                    font-size="11" 
                    fill="#1e293b" 
                    font-weight="600"
                  >
                    ${item.revenue.toLocaleString()}
                  </text>

                  <text 
                    x={x + 30} 
                    y="202" 
                    text-anchor="middle" 
                    font-size="12" 
                    fill="#475569" 
                    font-weight="600"
                  >
                    {item.year}
                  </text>
                {/each}

                <defs>
                  <linearGradient id="yearlyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#10b981" />
                    <stop offset="100%" stop-color="#047857" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <div class="revenue-list">
              {#each stats.yearly as item}
                <div class="revenue-item">
                  <span class="item-name">{item.year} Financial Year</span>
                  <span class="item-value" style="color: #047857; font-weight: 600;">
                    ${item.revenue.toLocaleString()}
                  </span>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      </section>

      <!-- Side Order Section -->
      <section class="panel orders-panel">
        <h2>Recent Orders</h2>
        {#if branchOrders.length === 0}
          <p class="no-orders-msg">No recent orders processed at this branch.</p>
        {:else}
          <div class="branch-orders-list">
            {#each branchOrders as o}
              <div class="order-mini-card">
                <div class="order-row-top">
                  <span class="order-id">{o.id}</span>
                  <span class="order-time">🕒 {o.time}</span>
                </div>
                <div class="order-row-mid">
                  <span class="customer-name">👤 {o.customer}</span>
                  <span class="order-total">{o.total}</span>
                </div>
                <div class="order-row-bot">
                  <span class="status {o.status.toLowerCase()}">{o.status}</span>
                  {#if o.distanceKm != null}
                    <span class="order-dist">📍 {o.distanceKm.toFixed(2)} km away</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  {/if}
</main>

<style>
  .back-nav {
    margin-bottom: 1.25rem;
  }

  .btn-back {
    display: inline-flex;
    align-items: center;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 0.9rem;
    font-weight: 500;
    transition: color 0.15s ease;
  }

  .btn-back:hover {
    color: var(--text);
  }

  .branch-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 1.5rem;
    border-bottom: 1px solid var(--border);
    padding-bottom: 1.5rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .title-row h1 {
    margin: 0;
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
  }

  .branch-badge {
    font-size: 0.8rem;
    font-weight: 600;
    padding: 0.25rem 0.6rem;
    border-radius: 8px;
  }

  .badge-active {
    background: var(--success-bg);
    color: var(--success-text);
  }

  .badge-inactive {
    background: var(--error-bg);
    color: var(--error-text);
  }

  .branch-address {
    margin: 0.5rem 0 0;
    font-size: 0.95rem;
    color: var(--text-muted);
  }

  .btn-status-toggle {
    padding: 0.6rem 1.2rem;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s ease;
    border: 1px solid transparent;
  }

  .btn-close-branch {
    background: var(--error-bg);
    color: var(--error-text);
    border-color: var(--error-text);
  }

  .btn-close-branch:hover {
    background: var(--error-bg);
  }

  .btn-open-branch {
    background: var(--success-bg);
    color: var(--success-text);
    border-color: var(--success-text);
  }

  .btn-open-branch:hover {
    background: var(--success-bg);
  }

  .branch-stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1.25rem;
    margin: 1.5rem 0;
  }

  .stat-mini-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    padding: 1.25rem;
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    box-shadow: 0 1px 3px rgba(0,0,0,0.02);
  }

  .stat-mini-card .label {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .stat-mini-card .value {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
  }

  .text-active {
    color: var(--success-text);
  }

  .text-inactive {
    color: var(--error-text);
  }

  .layout-main {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 1.5rem;
    align-items: start;
  }

  @media (max-width: 900px) {
    .layout-main {
      grid-template-columns: 1fr;
    }
  }

  .panel-header-tabs {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border);
    padding-bottom: 1rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .panel-header-tabs h2 {
    margin: 0;
  }

  .tab-selectors {
    display: flex;
    background: var(--hover-bg);
    padding: 0.25rem;
    border-radius: 8px;
  }

  .tab-btn {
    background: none;
    border: none;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.15s ease;
  }

  .tab-btn.active {
    background: var(--card-bg);
    color: var(--text);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }

  .chart-container {
    background: var(--bg);
    border-radius: 12px;
    padding: 1.25rem;
    border: 1px solid var(--border);
    margin-bottom: 1.25rem;
  }

  .revenue-chart {
    width: 100%;
    height: auto;
    display: block;
  }

  .chart-bar {
    transition: opacity 0.15s ease;
  }

  .chart-bar:hover {
    opacity: 0.85;
    cursor: pointer;
  }

  .revenue-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 0.75rem;
  }

  .revenue-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem;
    background: #f8fafc;
    border: 1px solid #f1f5f9;
    border-radius: 8px;
    font-size: 0.85rem;
  }

  .revenue-item .item-name {
    color: var(--text-muted);
    font-weight: 500;
  }

  .revenue-item .item-value {
    color: var(--text);
    font-weight: 600;
  }

  .branch-orders-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 480px;
    overflow-y: auto;
    padding-right: 0.25rem;
  }

  .order-mini-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .order-row-top, .order-row-mid, .order-row-bot {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .order-id {
    font-weight: 700;
    color: var(--accent);
    font-size: 0.85rem;
  }

  .order-time, .order-dist {
    font-size: 0.75rem;
    color: var(--text-muted);
  }

  .customer-name {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--text);
  }

  .order-total {
    font-weight: 700;
    color: var(--text);
    font-size: 0.85rem;
  }

  .no-orders-msg {
    text-align: center;
    color: var(--text-muted);
    padding: 2.5rem;
    font-size: 0.9rem;
  }

  .error-panel {
    text-align: center;
    padding: 3rem 2rem;
    margin-top: 2rem;
  }

  .error-panel h2 {
    color: var(--error-text);
    margin-top: 0;
  }

  .btn-primary {
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    background: var(--accent);
    color: #fff;
    font-weight: 500;
    border: none;
    cursor: pointer;
  }

  .btn-primary:hover {
    background: var(--accent-hover);
  }
</style>
