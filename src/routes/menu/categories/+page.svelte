<script lang="ts">
  import { onMount } from 'svelte';
  import { apiGetCategories, apiCreateCategory, apiUpdateCategory, apiDeleteCategory, type ApiCategory } from '$lib/api';
  import { isLoggedIn } from '$lib/stores/auth';
  import { fromStore } from 'svelte/store';

  let loggedIn = fromStore(isLoggedIn);

  let categories = $state<ApiCategory[]>([]);
  let loading = $state(true);
  let error = $state('');

  let search = $state('');

  // Add form
  let catName = $state('');
  let catDesc = $state('');
  let catSubmitting = $state(false);
  let catError = $state('');
  let catSuccess = $state('');

  // Edit state
  let editingId = $state<number | null>(null);
  let editName = $state('');
  let editDesc = $state('');
  let editSubmitting = $state(false);
  let editError = $state('');

  onMount(() => loadCategories());

  async function loadCategories() {
    loading = true;
    error = '';
    try {
      categories = await apiGetCategories(search || undefined);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to load categories';
    } finally {
      loading = false;
    }
  }

  function doSearch() {
    loadCategories();
  }

  function startEdit(c: ApiCategory) {
    editingId = c.id;
    editName = c.name;
    editDesc = c.description ?? '';
    editError = '';
  }

  function cancelEdit() {
    editingId = null;
  }

  async function handleAdd(e: Event) {
    e.preventDefault();
    if (!catName) return;
    catError = '';
    catSuccess = '';
    catSubmitting = true;
    try {
      const created = await apiCreateCategory(catName, catDesc || undefined);
      categories = [...categories, created];
      catName = '';
      catDesc = '';
      catSuccess = 'Category created';
    } catch (e: unknown) {
      catError = e instanceof Error ? e.message : 'Failed to create category';
    } finally {
      catSubmitting = false;
    }
  }

  async function handleEditSubmit() {
    if (!editingId || !editName) return;
    editError = '';
    editSubmitting = true;
    try {
      const updated = await apiUpdateCategory(editingId, editName, editDesc || undefined);
      categories = categories.map(c => c.id === editingId ? updated : c);
      editingId = null;
    } catch (e: unknown) {
      editError = e instanceof Error ? e.message : 'Failed to update category';
    } finally {
      editSubmitting = false;
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this category? Products in this category will lose their category reference.')) return;
    try {
      await apiDeleteCategory(id);
      categories = categories.filter(c => c.id !== id);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to delete category';
    }
  }
</script>

<main class="container">
  <header class="page-header">
    <h1>Manage Categories</h1>
    <p>Create, edit, delete, and search categories</p>
  </header>

  <nav style="display:flex; gap:0.75rem; margin-bottom:1rem; align-items:center;">
    <a href="/menu" class="btn-secondary">&larr; Back to Products</a>
  </nav>

  {#if loggedIn.current}
    <section class="panel" style="margin-bottom: 1.5rem;">
      <h2>Add New Category</h2>
      <form onsubmit={handleAdd} class="cat-form">
        <div class="form-group">
          <label for="cat-name">Category Name</label>
          <input id="cat-name" type="text" placeholder="e.g. Main Course" bind:value={catName} required />
        </div>
        <div class="form-group">
          <label for="cat-desc">Description</label>
          <input id="cat-desc" type="text" placeholder="Optional" bind:value={catDesc} />
        </div>
        <button type="submit" class="btn-primary" disabled={catSubmitting}>
          {catSubmitting ? 'Adding\u2026' : 'Add Category'}
        </button>
      </form>
      {#if catSuccess}
        <p class="form-success">{catSuccess}</p>
      {/if}
      {#if catError}
        <p class="form-error">{catError}</p>
      {/if}
    </section>
  {/if}

  <section class="panel">
    <h2>Categories</h2>

    <div class="search-bar">
      <input type="text" placeholder="Search categories\u2026" bind:value={search} oninput={doSearch} />
    </div>

    {#if loading}
      <p class="muted">Loading categories\u2026</p>
    {:else if error}
      <p class="form-error">{error}</p>
    {:else if categories.length === 0}
      <p class="muted">No categories found.</p>
    {:else}
      <table class="cat-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Description</th>
            <th>Created</th>
            {#if loggedIn.current}
              <th style="width:120px;">Actions</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each categories as c (c.id)}
            {#if editingId === c.id}
              <tr>
                <td>{c.id}</td>
                <td>
                  <input type="text" bind:value={editName} required style="width:100%;" />
                </td>
                <td>
                  <input type="text" bind:value={editDesc} style="width:100%;" />
                </td>
                <td>{c.created_at}</td>
                <td>
                  <div class="actions">
                    <button type="button" class="btn-primary btn-sm" disabled={editSubmitting} onclick={handleEditSubmit}>
                      {editSubmitting ? 'Saving\u2026' : 'Save'}
                    </button>
                    <button type="button" class="btn-secondary btn-sm" onclick={cancelEdit}>Cancel</button>
                  </div>
                  {#if editError}
                    <p class="form-error" style="margin-top:0.25rem;">{editError}</p>
                  {/if}
                </td>
              </tr>
            {:else}
              <tr>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.description ?? ''}</td>
                <td>{c.created_at}</td>
                {#if loggedIn.current}
                  <td>
                    <div class="actions">
                      <button type="button" class="btn-edit" onclick={() => startEdit(c)}>Edit</button>
                      <button type="button" class="btn-delete" onclick={() => handleDelete(c.id)}>Del</button>
                    </div>
                  </td>
                {/if}
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    {/if}
  </section>
</main>

<style>
  .cat-form {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: flex-end;
    margin-top: 0.75rem;
  }
  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    flex: 1;
    min-width: 160px;
  }
  .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--text);
  }
  input[type="text"] {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.9rem;
    outline: none;
  }
  input:focus { border-color: var(--accent); }

  .btn-primary {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    height: 38px;
    white-space: nowrap;
  }
  .btn-primary:hover:not(:disabled) { background: var(--accent-hover); }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--card-bg);
    color: var(--text);
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    height: 38px;
    white-space: nowrap;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .btn-secondary:hover { background: var(--hover-bg); }
  .btn-sm { height: 32px; padding: 0.3rem 0.75rem; font-size: 0.82rem; }
  .btn-edit {
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    border: 1px solid var(--accent);
    background: transparent;
    color: var(--accent);
    cursor: pointer;
    font-weight: 500;
    font-size: 0.82rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .btn-edit:hover { background: var(--hover-bg); }
  .btn-delete {
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    border: 1px solid var(--error-text);
    background: transparent;
    color: var(--error-text);
    cursor: pointer;
    font-weight: 500;
    font-size: 0.82rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .btn-delete:hover { background: var(--error-bg); }
  .form-success {
    color: var(--success-text);
    background: var(--success-bg);
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  .form-error {
    color: var(--error-text);
    background: var(--error-bg);
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  .muted { color: var(--text-muted); font-size: 0.9rem; }

  .search-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
  }
  .search-bar input { flex: 1; }

  .cat-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  .cat-table th {
    text-align: left;
    padding: 0.5rem 0.75rem;
    border-bottom: 2px solid var(--border);
    color: var(--text-muted);
    font-weight: 600;
    font-size: 0.82rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .cat-table td {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border);
    vertical-align: middle;
  }
  .cat-table tr:hover td { background: var(--table-row-hover); }

  .actions {
    display: flex;
    gap: 0.4rem;
  }
</style>
