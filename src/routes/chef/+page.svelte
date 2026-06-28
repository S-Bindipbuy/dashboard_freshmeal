<script lang="ts">
  import { onMount } from 'svelte';
  import { orders, updateOrderStatus, refreshOrders } from '$lib/stores/dashboard';
  import type { Order } from '$lib/stores/dashboard';

  let rawOrders = $state<Order[]>([]);

  onMount(() => {
    refreshOrders();
    return orders.subscribe(v => rawOrders = v);
  });

  let activeOrders = $derived(rawOrders.filter(o =>
    o.status === 'Paid' || o.status === 'Confirmed' || o.status === 'Preparing' || o.status === 'Pending'
  ));
</script>

<main class="container">
  <header class="page-header">
    <h1>Kitchen cooking monitor</h1>
    <p>Incoming mobile customer orders that need preparation</p>
  </header>

  <div class="kitchen-grid">
    {#if activeOrders.length === 0}
      <div class="empty-state">
        <span class="emoji">🎉</span>
        <h3>No active orders to cook!</h3>
        <p>All items have been completed or cancelled.</p>
      </div>
    {:else}
      {#each activeOrders as order}
        <article class="chef-card" class:completed-card={order.status === 'Delivered'}>
          <div class="card-header">
            <div>
              <span class="order-id">{order.id}</span>
              <span class="order-time">⏰ {order.time}</span>
            </div>
            <span class="status-badge" class:status-completed={order.status === 'Delivered'} class:status-pending={order.status === 'Pending' || order.status === 'Paid' || order.status === 'Confirmed' || order.status === 'Preparing'}>
              {order.status}
            </span>
          </div>

          <div class="card-body">
            <h3 class="customer-name">{order.customer}</h3>
            <div class="items-list">
              {#each order.items as item}
                <div class="item-row">
                  <span class="item-qty">{item.quantity}x</span>
                  <span class="item-name">{item.product_name}</span>
                </div>
              {/each}
            </div>
          </div>

          <div class="card-actions">
            {#if order.status === 'Paid' || order.status === 'Confirmed'}
              <button 
                onclick={() => updateOrderStatus(order.id, 'Preparing')} 
                class="btn-prepare"
              >
                ⏳ Start preparing
              </button>
            {:else if order.status === 'Preparing'}
              <button 
                onclick={() => updateOrderStatus(order.id, 'Delivered')} 
                class="btn-complete"
              >
                ✓ Complete cooking
              </button>
            {:else if order.status === 'Pending'}
              <span class="waiting-payment">⏳ Awaiting payment</span>
            {/if}
          </div>
        </article>
      {/each}
    {/if}
  </div>
</main>

<style>
  .kitchen-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-top: 1rem;
  }

  .chef-card {
    background: #ffffff;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .chef-card:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.08);
  }

  .completed-card {
    opacity: 0.75;
    border-color: #cbd5e1;
    background: #f8fafc;
  }

  .card-header {
    padding: 1rem;
    background: #f8fafc;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .order-id {
    font-weight: 700;
    color: #0f172a;
    margin-right: 0.5rem;
  }

  .order-time {
    font-size: 0.8rem;
    color: #64748b;
  }

  .status-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.25rem 0.5rem;
    border-radius: 6px;
  }

  .status-pending {
    background: #fef3c7;
    color: #d97706;
  }

  .status-completed {
    background: #dcfce7;
    color: #15803d;
  }

  .card-body {
    padding: 1.25rem;
    flex: 1;
  }

  .customer-name {
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    color: #0f172a;
  }

  .items-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .item-row {
    display: flex;
    gap: 0.75rem;
    font-size: 0.95rem;
    color: #334155;
  }

  .item-qty {
    font-weight: 700;
    color: #0b74de;
  }

  .card-actions {
    padding: 1rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .btn-complete {
    width: 100%;
    padding: 0.65rem;
    background: #15803d;
    color: #ffffff;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.15s ease;
  }

  .btn-complete:hover {
    background: #166534;
  }

  .btn-reopen {
    width: 100%;
    padding: 0.65rem;
    background: #ffffff;
    color: #475569;
    border: 1px solid #cbd5e1;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-reopen:hover {
    background: #f1f5f9;
    color: #0f172a;
  }

  .btn-prepare {
    width: 100%;
    padding: 0.65rem;
    background: #dbeafe;
    color: #1d4ed8;
    border: 1px solid #93c5fd;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .btn-prepare:hover {
    background: #bfdbfe;
  }

  .waiting-payment {
    display: block;
    width: 100%;
    padding: 0.65rem;
    background: #f1f5f9;
    color: #64748b;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.85rem;
    text-align: center;
  }

  .empty-state {
    grid-column: 1 / -1;
    text-align: center;
    padding: 3rem 1rem;
    border: 2px dashed #cbd5e1;
    border-radius: 12px;
    color: #64748b;
  }

  .empty-state .emoji {
    font-size: 3rem;
    display: block;
    margin-bottom: 1rem;
  }

  .empty-state h3 {
    margin: 0;
    color: #0f172a;
  }
</style>
