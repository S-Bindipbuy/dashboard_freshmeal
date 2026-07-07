<script lang="ts">
  import { onMount } from 'svelte';
  import { apiGetCustomers } from '$lib/api';

  type ApiCustomer = { id: number; name: string; email: string; phone?: string; created_at: string };

  let customers = $state<ApiCustomer[]> ([]);
  let selected = $state<ApiCustomer | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  onMount(async () => {
    try {
      customers = await apiGetCustomers();
    } catch (e: any) {
      error = e?.message ?? String(e);
    } finally {
      loading = false;
    }
  });

  function select(c: ApiCustomer) { selected = c; }
  function close() { selected = null; }
</script>

<main class="container">
  <header class="page-header">
    <h1>Customers Directory</h1>
    <p>View registered clients and details</p>
  </header>

  <section class="panel">
    <h2>Customers</h2>

    {#if loading}
      <div>Loading...</div>
    {:else if error}
      <div style="color:var(--error-text)">Error: {error}</div>
    {:else}
      <div style="list-style: none; padding: 0; margin: 0">
        {#each customers as c}
          <button type="button" onclick={() => select(c)} style="display:flex;justify-content:space-between;align-items:center;width:100%;padding:0.5rem 0;border:none;border-bottom:1px solid var(--border);cursor:pointer;background:none;font:inherit;color:inherit;text-align:left">
            <div>
              <div style="font-weight:600">{c.name}</div>
              <div style="font-size:0.85rem;color:var(--text-muted)">{c.email}</div>
            </div>
            <div style="color:var(--text-muted)">{c.id}</div>
          </button>
        {/each}
      </div>
    {/if}
  </section>

  {#if selected}
    <aside class="panel" style="margin-top:1rem">
      <h3>Customer details</h3>
      <div><strong>Name:</strong> {selected.name}</div>
      <div><strong>Email:</strong> {selected.email}</div>
      <div><strong>Phone:</strong> {selected.phone ?? '—'}</div>
      <div><strong>Joined:</strong> {new Date(selected.created_at).toLocaleString()}</div>
      <button style="margin-top:0.5rem" onclick={close}>Close</button>
    </aside>
  {/if}
</main>

<style>
  .panel { background:var(--card-bg);padding:1rem;border-radius:6px;box-shadow:0 1px 3px rgba(0,0,0,0.04); }
</style>
