<script lang="ts">
  import { onMount } from 'svelte';
  import { apiAdminRegister, apiGetUsers, apiAdminDeleteUser, apiGetUserOrders, type ApiUser, type ApiOrder } from '$lib/api';

  let name = $state('');
  let email = $state('');
  let password = $state('');
  let role = $state<number>(1);
  let success = $state<string | null>(null);
  let error = $state<string | null>(null);
  let submitting = $state(false);

  let users = $state<ApiUser[]>([]);
  let loading = $state(true);
  let roleFilter = $state('');

  let selectedUser = $state<ApiUser | null>(null);
  let userOrders = $state<ApiOrder[]>([]);
  let ordersLoading = $state(false);

  let abort = $state<AbortController | null>(null);

  const roles = [
    { value: 1, label: 'Admin' },
    { value: 2, label: 'Customer' },
    { value: 3, label: 'Restaurant' },
  ];

  async function loadUsers() {
    abort?.abort();
    const ctrl = new AbortController();
    abort = ctrl;
    loading = true;
    try {
      users = await apiGetUsers(roleFilter || undefined, ctrl.signal);
    } catch {
      console.warn('Failed to load users');
    } finally { if (ctrl === abort) loading = false; }
  }

  function updateFilter(e: Event) {
    roleFilter = (e.target as HTMLSelectElement).value;
    loadUsers();
  }

  onMount(() => loadUsers());

  async function handleSubmit(e: Event) {
    e.preventDefault();
    success = null;
    error = null;
    submitting = true;
    try {
      await apiAdminRegister(name, email, password, role);
      success = `User "${name}" created successfully`;
      name = '';
      email = '';
      password = '';
      role = 1;
      loadUsers();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      submitting = false;
    }
  }

  async function deleteUser(u: ApiUser) {
    if (!confirm(`Delete user "${u.name}"? This disables their account.`)) return;
    try {
      await apiAdminDeleteUser(u.id);
      loadUsers();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : String(e));
    }
  }

  async function showOrders(u: ApiUser) {
    selectedUser = u;
    ordersLoading = true;
    userOrders = [];
    try {
      userOrders = await apiGetUserOrders(u.id);
    } catch {
      console.warn('Failed to load user orders');
    } finally { ordersLoading = false; }
  }

  function closeOrders() {
    selectedUser = null;
    userOrders = [];
  }
</script>

<main class="container">
  <header class="page-header">
    <h1>Users</h1>
    <p>Create and manage accounts</p>
  </header>

  <div class="two-col">
    <section class="panel">
      <h2>Create User</h2>

      {#if success}
        <p class="msg-success">{success}</p>
      {/if}
      {#if error}
        <p class="msg-error">{error}</p>
      {/if}

      <form onsubmit={handleSubmit}>
        <div class="form-group">
          <label for="u-name">Name</label>
          <input id="u-name" type="text" placeholder="Full name" bind:value={name} required />
        </div>
        <div class="form-group">
          <label for="u-email">Email</label>
          <input id="u-email" type="email" placeholder="user@example.com" bind:value={email} required />
        </div>
        <div class="form-group">
          <label for="u-password">Password</label>
          <input id="u-password" type="password" placeholder="Password" bind:value={password} required />
        </div>
        <div class="form-group">
          <label for="u-role">Role</label>
          <select id="u-role" bind:value={role}>
            {#each roles as r}
              <option value={r.value}>{r.label}</option>
            {/each}
          </select>
        </div>
        <button type="submit" class="btn-primary" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create User'}
        </button>
      </form>
    </section>

    <section class="panel">
      <h2>All Users</h2>

      <div class="filter-bar">
        <label for="filter-role">Filter by role:</label>
        <select id="filter-role" onchange={updateFilter}>
          <option value="">All</option>
          <option value="admin">Admin</option>
          <option value="customer">Customer</option>
          <option value="restaurant">Restaurant</option>
        </select>
      </div>

      {#if loading}
        <div>Loading...</div>
      {:else if users.length === 0}
        <div class="empty">No users found</div>
      {:else}
        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {#each users as u (u.id)}
              <tr class:disabled-row={u.deleted_at}>
                <td>{u.id}</td>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span class="badge badge-{u.role}">{u.role}</span></td>
                <td>{#if u.deleted_at}<span class="badge badge-disabled">Disabled</span>{:else}<span class="badge badge-active">Active</span>{/if}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td class="actions-cell">
                  <button onclick={() => showOrders(u)} class="btn-sm" title="View orders">📋</button>
                  {#if !u.deleted_at}
                    <button onclick={() => deleteUser(u)} class="btn-sm btn-danger" title="Disable account">🚫</button>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      {/if}
    </section>
  </div>

  {#if selectedUser}
    <div class="overlay" onclick={closeOrders} onkeydown={(e) => e.key === 'Enter' && closeOrders()} role="button" tabindex="0"></div>
    <div class="modal">
      <div class="modal-header">
        <h3>Orders — {selectedUser.name}</h3>
        <button onclick={closeOrders} class="btn-close">✕</button>
      </div>
      <div class="modal-body">
        {#if ordersLoading}
          <div>Loading...</div>
        {:else if userOrders.length === 0}
          <div class="empty">No orders found</div>
        {:else}
          <table class="order-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Status</th>
                <th>Total</th>
                <th>Date</th>
                <th>Items</th>
              </tr>
            </thead>
            <tbody>
              {#each userOrders as o (o.id)}
                <tr>
                  <td>{o.id}</td>
                  <td><span class="badge badge-{o.status}">{o.status}</span></td>
                  <td>${o.total}</td>
                  <td>{new Date(o.created_at).toLocaleDateString()}</td>
                  <td>{o.items.length}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        {/if}
      </div>
    </div>
  {/if}
</main>

<style>
  .two-col { display:grid;grid-template-columns:1fr 1.5fr;gap:1rem;align-items:start; }
  .panel { background:var(--card-bg);padding:1.5rem;border-radius:8px;border:1px solid var(--border); }
  .form-group { margin-bottom:1rem; }
  .form-group label { display:block;font-size:0.85rem;font-weight:500;color:var(--text-muted);margin-bottom:0.3rem; }
  .form-group input,
  .form-group select {
    width:100%;padding:0.6rem 0.75rem;border:1px solid var(--input-border);border-radius:8px;
    font-size:0.9rem;outline:none;box-sizing:border-box;background:var(--input-bg);color:var(--text);
  }
  .form-group input:focus,
  .form-group select:focus { border-color:var(--accent); }
  .msg-success { background:var(--success-bg);color:var(--success-text);padding:0.5rem 0.75rem;border-radius:6px;font-size:0.85rem;margin-bottom:1rem; }
  .msg-error { background:var(--error-bg);color:var(--error-text);padding:0.5rem 0.75rem;border-radius:6px;font-size:0.85rem;margin-bottom:1rem; }
  .btn-primary {
    width:100%;padding:0.75rem;background:var(--accent);color:#fff;border:none;border-radius:8px;
    font-size:0.95rem;font-weight:600;cursor:pointer;margin-top:0.5rem;
  }
  .btn-primary:hover:not(:disabled) { background:var(--accent-hover); }
  .btn-primary:disabled { opacity:0.6;cursor:not-allowed; }

  .filter-bar { display:flex;align-items:center;gap:0.5rem;margin-bottom:1rem; }
  .filter-bar label { font-size:0.85rem;font-weight:500;color:var(--text-muted);white-space:nowrap; }
  .filter-bar select { padding:0.4rem 0.6rem;border:1px solid var(--input-border);border-radius:6px;font-size:0.85rem;background:var(--input-bg);color:var(--text); }

  .user-table { width:100%;border-collapse:collapse;font-size:0.85rem; }
  .user-table th { text-align:left;padding:0.5rem 0.4rem;border-bottom:2px solid var(--border);color:var(--text-muted);font-weight:600; }
  .user-table td { padding:0.5rem 0.4rem;border-bottom:1px solid var(--border);color:var(--text); }
  .user-table tbody tr:hover td { background:var(--table-row-hover); }
  .disabled-row { opacity:0.5; }

  .badge { display:inline-block;padding:0.15rem 0.5rem;border-radius:999px;font-size:0.75rem;font-weight:600;text-transform:capitalize; }
  .badge-admin { background:var(--badge-admin-bg);color:var(--badge-admin-text); }
  .badge-customer { background:var(--badge-customer-bg);color:var(--badge-customer-text); }
  .badge-restaurant { background:var(--badge-restaurant-bg);color:var(--badge-restaurant-text); }
  .badge-active { background:var(--success-bg);color:var(--success-text); }
  .badge-disabled { background:var(--error-bg);color:var(--error-text); }
  .badge-pending { background:var(--warning-bg);color:var(--warning-text); }
  .badge-paid { background:var(--badge-customer-bg);color:var(--badge-customer-text); }
  .badge-confirmed { background:var(--badge-admin-bg);color:var(--badge-admin-text); }
  .badge-preparing { background:var(--badge-restaurant-bg);color:var(--badge-restaurant-text); }
  .badge-delivered { background:var(--success-bg);color:var(--success-text); }
  .badge-cancelled { background:var(--error-bg);color:var(--error-text); }

  .actions-cell { white-space:nowrap; }
  .btn-sm { padding:0.25rem 0.4rem;border:1px solid var(--input-border);border-radius:4px;background:var(--input-bg);color:var(--text);cursor:pointer;font-size:0.85rem;margin-right:0.25rem; }
  .btn-sm:hover { background:var(--hover-bg); }
  .btn-danger:hover { background:var(--error-bg);border-color:var(--error-text); }

  .overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:200; }
  .modal { position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--modal-bg);border-radius:12px;padding:1.5rem;z-index:201;min-width:500px;max-width:90vw;max-height:80vh;overflow-y:auto; }
  .modal-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem; }
  .modal-header h3 { margin:0;color:var(--text); }
  .btn-close { background:none;border:none;font-size:1.2rem;cursor:pointer;padding:0.25rem;color:var(--text-muted); }
  .order-table { width:100%;border-collapse:collapse;font-size:0.85rem; }
  .order-table th { text-align:left;padding:0.4rem;border-bottom:2px solid var(--border);color:var(--text-muted);font-weight:600; }
  .order-table td { padding:0.4rem;border-bottom:1px solid var(--border);color:var(--text); }

  .empty { color:var(--text-muted);padding:2rem 0;text-align:center; }

  @media(max-width:800px) { .two-col { grid-template-columns:1fr; } }
</style>
