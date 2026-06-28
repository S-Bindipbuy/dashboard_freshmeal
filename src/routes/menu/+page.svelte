<script lang="ts">
  import { onMount } from 'svelte';
  import { apiGetProducts, apiCreateProduct, apiUpdateProduct, apiDeleteProduct, apiGetCategories, apiToggleProductAvailability, BASE_URL, type ApiProduct, type ApiCategory } from '$lib/api';
  import { isLoggedIn } from '$lib/stores/auth';
  import { fromStore } from 'svelte/store';

  let loggedIn = fromStore(isLoggedIn);

  let products = $state<ApiProduct[]>([]);
  let categories = $state<ApiCategory[]>([]);
  let loading = $state(true);
  let error = $state('');

  let search = $state('');
  let filterCategory = $state('');

  // Add form
  let name = $state('');
  let description = $state('');
  let price = $state('');
  let categoryId = $state('');
  let imageFile = $state<File | null>(null);
  let submitting = $state(false);
  let formError = $state('');

  // Edit state
  let editingId = $state<number | null>(null);
  let editName = $state('');
  let editDescription = $state('');
  let editPrice = $state('');
  let editAvailable = $state(false);
  let editCategoryId = $state('');
  let editImageFile = $state<File | null>(null);
  let editSubmitting = $state(false);
  let editError = $state('');

  let toggling = $state<Set<number>>(new Set());

  onMount(async () => {
    try {
      [products, categories] = await Promise.all([
        apiGetProducts(),
        apiGetCategories(),
      ]);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to load data';
    } finally {
      loading = false;
    }
  });

  async function reloadProducts() {
    try {
      products = await apiGetProducts(search || undefined, filterCategory ? Number(filterCategory) : undefined);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to load products';
    }
  }

  function doSearch() {
    reloadProducts();
  }

  function doFilter() {
    reloadProducts();
  }

  function startEdit(p: ApiProduct) {
    editingId = p.id;
    editName = p.name;
    editDescription = p.description ?? '';
    editPrice = p.price;
    editAvailable = p.available;
    editCategoryId = p.category_id != null ? String(p.category_id) : '';
    editImageFile = null;
    editError = '';
  }

  function cancelEdit() {
    editingId = null;
  }

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name || !price) return;
    formError = '';
    submitting = true;
    try {
      const form = new FormData();
      form.append('name', name);
      form.append('description', description);
      form.append('price', price);
      form.append('available', 'true');
      if (categoryId) form.append('category_id', categoryId);
      if (imageFile) form.append('image', imageFile);
      const created = await apiCreateProduct(form);
      products = [created, ...products];
      name = '';
      description = '';
      price = '';
      categoryId = '';
      imageFile = null;
    } catch (e: unknown) {
      formError = e instanceof Error ? e.message : 'Failed to create product';
    } finally {
      submitting = false;
    }
  }

  async function handleEditSubmit(e: Event) {
    e.preventDefault();
    if (!editingId || !editName || !editPrice) return;
    editError = '';
    editSubmitting = true;
    try {
      const form = new FormData();
      form.append('name', editName);
      form.append('description', editDescription);
      form.append('price', editPrice);
      form.append('available', editAvailable ? 'true' : 'false');
      if (editCategoryId) form.append('category_id', editCategoryId);
      if (editImageFile) form.append('image', editImageFile);
      const updated = await apiUpdateProduct(editingId, form);
      products = products.map(p => p.id === editingId ? updated : p);
      editingId = null;
    } catch (e: unknown) {
      editError = e instanceof Error ? e.message : 'Failed to update product';
    } finally {
      editSubmitting = false;
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this product?')) return;
    try {
      await apiDeleteProduct(id);
      products = products.filter(p => p.id !== id);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to delete product';
    }
  }

  async function handleToggleAvail(p: ApiProduct) {
    toggling = new Set([...toggling, p.id]);
    try {
      const updated = await apiToggleProductAvailability(p.id, !p.available);
      products = products.map(pr => pr.id === p.id ? updated : pr);
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to toggle availability';
    } finally {
      const next = new Set(toggling);
      next.delete(p.id);
      toggling = next;
    }
  }

  function onFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    imageFile = input.files?.[0] ?? null;
  }

  function onEditFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    editImageFile = input.files?.[0] ?? null;
  }

  function productImageUrl(img: string): string {
    return `${BASE_URL}/images/${img}`;
  }

  function categoryName(id: number | null): string {
    if (id == null) return '';
    return categories.find(c => c.id === id)?.name ?? '';
  }
</script>

<main class="container">
  <header class="page-header">
    <h1>Menu / Products</h1>
    <p>Live menu from the FreshMeal backend</p>
  </header>

  <nav style="display:flex; gap:0.75rem; margin-bottom:1rem; align-items:center;">
    <a href="/menu/categories" class="btn-secondary">Manage Categories</a>
  </nav>

  {#if loggedIn.current}
    <section class="panel" style="margin-bottom: 1.5rem;">
      <h2>Add New Product</h2>
      <form onsubmit={handleSubmit} class="product-form">
        <div class="form-group">
          <label for="prod-name">Product Name</label>
          <input id="prod-name" type="text" placeholder="e.g. Bun Cha" bind:value={name} required />
        </div>
        <div class="form-group">
          <label for="prod-desc">Description</label>
          <input id="prod-desc" type="text" placeholder="Optional description" bind:value={description} />
        </div>
        <div class="form-group">
          <label for="prod-price">Price (USD)</label>
          <input id="prod-price" type="number" step="0.01" min="0" placeholder="e.g. 5.50" bind:value={price} required />
        </div>
        <div class="form-group">
          <label for="prod-category">Category</label>
          <select id="prod-category" bind:value={categoryId}>
            <option value="">No category</option>
            {#each categories as c}
              <option value={c.id}>{c.name}</option>
            {/each}
          </select>
        </div>
        <div class="form-group">
          <label for="prod-image">Image</label>
          <input id="prod-image" type="file" accept="image/*" onchange={onFileChange} />
        </div>
        <button type="submit" class="btn-primary" disabled={submitting}>
          {submitting ? 'Adding\u2026' : 'Add Product'}
        </button>
      </form>
      {#if formError}
        <p class="form-error">{formError}</p>
      {/if}
    </section>
  {/if}

  <section class="panel">
    <h2>Menu Items</h2>

    <div class="search-bar">
      <input type="text" placeholder="Search products\u2026" bind:value={search} oninput={doSearch} />
      <select bind:value={filterCategory} onchange={doFilter}>
        <option value="">All categories</option>
        {#each categories as c}
          <option value={c.id}>{c.name}</option>
        {/each}
      </select>
    </div>

    {#if loading}
      <p class="muted">Loading products\u2026</p>
    {:else if error}
      <p class="form-error">{error}</p>
    {:else if products.length === 0}
      <p class="muted">No products found.</p>
    {:else}
      <ul class="product-list">
        {#each products as p (p.id)}
          <li class="product-item" class:unavailable={!p.available} class:deleted={!!p.deleted_at}>
            {#if editingId === p.id}
              <form onsubmit={handleEditSubmit} class="edit-form">
                <div class="edit-fields">
                  <div class="form-group">
                    <label for="edit-name-{p.id}">Name</label>
                    <input id="edit-name-{p.id}" type="text" bind:value={editName} required />
                  </div>
                  <div class="form-group">
                    <label for="edit-desc-{p.id}">Description</label>
                    <input id="edit-desc-{p.id}" type="text" bind:value={editDescription} />
                  </div>
                  <div class="form-group">
                    <label for="edit-price-{p.id}">Price</label>
                    <input id="edit-price-{p.id}" type="number" step="0.01" min="0" bind:value={editPrice} required />
                  </div>
                  <div class="form-group">
                    <label for="edit-cat-{p.id}">Category</label>
                    <select id="edit-cat-{p.id}" bind:value={editCategoryId}>
                      <option value="">No category</option>
                      {#each categories as c}
                        <option value={c.id}>{c.name}</option>
                      {/each}
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="checkbox-label">
                      <input type="checkbox" bind:checked={editAvailable} />
                      Available
                    </label>
                  </div>
                  <div class="form-group">
                    <label for="edit-img-{p.id}">Image</label>
                    <input id="edit-img-{p.id}" type="file" accept="image/*" onchange={onEditFileChange} />
                  </div>
                  <div class="edit-actions">
                    <button type="submit" class="btn-primary btn-sm" disabled={editSubmitting}>
                      {editSubmitting ? 'Saving\u2026' : 'Save'}
                    </button>
                    <button type="button" class="btn-secondary btn-sm" onclick={cancelEdit}>Cancel</button>
                  </div>
                </div>
                {#if editError}
                  <p class="form-error">{editError}</p>
                {/if}
              </form>
            {:else}
              <div class="product-img">
                {#if p.image}
                  <img src={productImageUrl(p.image)} alt={p.name} onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
                {:else}
                  <span class="img-placeholder">{'\u{1F37D}\u{FE0F}'}</span>
                {/if}
              </div>
              <div class="product-info">
                <div class="product-name">{p.name}</div>
                {#if p.description}
                  <div class="product-desc">{p.description}</div>
                {/if}
                {#if categoryName(p.category_id)}
                  <div class="product-category">{categoryName(p.category_id)}</div>
                {/if}
                <div class="product-meta">
                  <span class="product-price">${parseFloat(p.price).toFixed(2)}</span>
                  {#if loggedIn.current}
                    <button
                      type="button"
                      class="avail-toggle"
                      class:avail={p.available}
                      class:unavail={!p.available}
                      disabled={toggling.has(p.id)}
                      onclick={() => handleToggleAvail(p)}
                    >
                      {p.available ? 'Available' : 'Unavailable'}
                    </button>
                  {:else}
                    <span class="availability-badge" class:avail={p.available} class:unavail={!p.available}>
                      {p.available ? 'Available' : 'Unavailable'}
                    </span>
                  {/if}
                  {#if p.deleted_at}
                    <span class="deleted-badge">Deleted</span>
                  {/if}
                </div>
              </div>
              {#if loggedIn.current}
                <div class="product-actions">
                  <button type="button" class="btn-edit" onclick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button type="button" class="btn-delete" onclick={() => handleDelete(p.id)}>
                    Del
                  </button>
                </div>
              {/if}
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<style>
  .product-form {
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
    color: #444;
  }
  input[type="text"],
  input[type="number"],
  select {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    outline: none;
  }
  select {
    background: #fff;
  }
  input:focus, select:focus { border-color: #0b74de; }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    cursor: pointer;
    padding-top: 1.25rem;
  }
  .checkbox-label input {
    width: 16px;
    height: 16px;
  }
  .btn-primary {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #0b74de;
    background: #0b74de;
    color: #fff;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    height: 38px;
    white-space: nowrap;
  }
  .btn-primary:hover:not(:disabled) { background: #095fb8; }
  .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
  .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    border: 1px solid #ccc;
    background: #fff;
    color: #333;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    height: 38px;
    white-space: nowrap;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
  }
  .btn-secondary:hover { background: #f5f5f5; }
  .btn-sm { height: 32px; padding: 0.3rem 0.75rem; font-size: 0.82rem; }
  .btn-edit {
    padding: 0.3rem 0.7rem;
    border-radius: 6px;
    border: 1px solid #0b74de;
    background: transparent;
    color: #0b74de;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.82rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .btn-edit:hover { background: #eef4ff; }
  .btn-delete {
    padding: 0.3rem 0.5rem;
    border-radius: 6px;
    border: 1px solid #dc2626;
    background: transparent;
    color: #dc2626;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.82rem;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .btn-delete:hover { background: #fef2f2; }
  .product-actions {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }
  .form-success {
    color: #15803d;
    background: #dcfce7;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  .form-error {
    color: #b91c1c;
    background: #fee2e2;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  .muted { color: #64748b; font-size: 0.9rem; }

  .search-bar {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1rem;
    align-items: stretch;
  }
  .search-bar input { flex: 1; }
  .search-bar select { min-width: 180px; }

  .product-list { list-style: none; padding: 0; margin: 0; }
  .product-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f0f0f0;
    transition: opacity 0.2s;
  }
  .product-item.unavailable { opacity: 0.6; }
  .product-item.deleted { opacity: 0.4; text-decoration: line-through; }

  .product-img {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    overflow: hidden;
    background: #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .product-img img { width: 100%; height: 100%; object-fit: cover; }
  .img-placeholder { font-size: 1.75rem; }

  .product-info { flex: 1; min-width: 0; }
  .product-name { font-weight: 600; color: #0f172a; }
  .product-desc { font-size: 0.82rem; color: #64748b; margin-top: 0.15rem; }
  .product-category {
    font-size: 0.75rem;
    color: #6366f1;
    background: #eef2ff;
    display: inline-block;
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    margin-top: 0.15rem;
  }
  .product-meta { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.35rem; flex-wrap: wrap; }
  .product-price { font-weight: 700; color: #0b74de; font-size: 0.95rem; }

  .availability-badge,
  .avail-toggle {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    border: none;
    cursor: pointer;
  }
  .avail-toggle:disabled { opacity: 0.5; cursor: wait; }
  .avail-toggle.avail,
  .availability-badge.avail { background: #dcfce7; color: #15803d; }
  .avail-toggle.unavail,
  .availability-badge.unavail { background: #fee2e2; color: #b91c1c; }
  .avail-toggle.avail:hover { background: #bbf7d0; }
  .avail-toggle.unavail:hover { background: #fecaca; }
  .deleted-badge {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background: #fef3c7;
    color: #d97706;
  }

  .edit-form {
    width: 100%;
  }
  .edit-fields {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: flex-end;
  }
  .edit-fields .form-group {
    min-width: 140px;
    flex: 1;
  }
  .edit-actions {
    display: flex;
    gap: 0.5rem;
    align-items: flex-end;
    padding-bottom: 0;
  }
</style>
