<script lang="ts">
  import { onMount } from 'svelte';
  import { apiGetProducts, apiCreateProduct, BASE_URL, type ApiProduct } from '$lib/api';
  import { isAdmin } from '$lib/stores/auth';
  import { fromStore } from 'svelte/store';

  let admin = fromStore(isAdmin);

  let products = $state<ApiProduct[]>([]);
  let loading = $state(true);
  let error = $state('');

  let name = $state('');
  let description = $state('');
  let price = $state('');
  let imageFile = $state<File | null>(null);
  let submitting = $state(false);
  let formError = $state('');

  onMount(async () => {
    try {
      products = await apiGetProducts();
    } catch (e: unknown) {
      error = e instanceof Error ? e.message : 'Failed to load products';
    } finally {
      loading = false;
    }
  });

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
      if (imageFile) form.append('image', imageFile);

      const created = await apiCreateProduct(form);
      products = [created, ...products];
      name = '';
      description = '';
      price = '';
      imageFile = null;
    } catch (e: unknown) {
      formError = e instanceof Error ? e.message : 'Failed to create product';
    } finally {
      submitting = false;
    }
  }

  function onFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    imageFile = input.files?.[0] ?? null;
  }

  function productImageUrl(img: string): string {
    // img is the UUID; backend serves /images/{uuid}.jpg
    return `${BASE_URL}/images/${img}.jpg`;
  }
</script>

<main class="container">
  <header class="page-header">
    <h1>Menu / Products</h1>
    <p>Live menu from the FreshMeal backend</p>
  </header>

  {#if admin.current}
    <section class="panel" style="margin-bottom: 1.5rem;">
      <h2>Add New Product</h2>
      <form onsubmit={handleSubmit} class="add-product-form">
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
          <label for="prod-image">Image</label>
          <input id="prod-image" type="file" accept="image/*" onchange={onFileChange} />
        </div>
        <button type="submit" class="btn-primary" disabled={submitting}>
          {submitting ? 'Adding…' : 'Add Product'}
        </button>
      </form>
      {#if formError}
        <p class="form-error">{formError}</p>
      {/if}
    </section>
  {/if}

  <section class="panel">
    <h2>Menu Items</h2>
    {#if loading}
      <p class="muted">Loading products…</p>
    {:else if error}
      <p class="form-error">{error}</p>
    {:else if products.length === 0}
      <p class="muted">No products found.</p>
    {:else}
      <ul class="product-list">
        {#each products as p (p.id)}
          <li class="product-item" class:unavailable={!p.available} class:deleted={!!p.deleted_at}>
            <div class="product-img">
              {#if p.image}
                <img src={productImageUrl(p.image)} alt={p.name} onerror={(e) => { (e.currentTarget as HTMLImageElement).style.display='none'; }} />
              {:else}
                <span class="img-placeholder">🍽️</span>
              {/if}
            </div>
            <div class="product-info">
              <div class="product-name">{p.name}</div>
              {#if p.description}
                <div class="product-desc">{p.description}</div>
              {/if}
              <div class="product-meta">
                <span class="product-price">${parseFloat(p.price).toFixed(2)}</span>
                <span class="availability-badge" class:avail={p.available} class:unavail={!p.available}>
                  {p.available ? 'Available' : 'Unavailable'}
                </span>
                {#if p.deleted_at}
                  <span class="deleted-badge">Deleted</span>
                {/if}
              </div>
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</main>

<style>
  .add-product-form {
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
  input[type="number"] {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    outline: none;
  }
  input:focus { border-color: #0b74de; }
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
  .form-error {
    color: #b91c1c;
    background: #fee2e2;
    padding: 0.4rem 0.75rem;
    border-radius: 6px;
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }
  .muted { color: #64748b; font-size: 0.9rem; }

  /* Product list */
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

  .product-info { flex: 1; }
  .product-name { font-weight: 600; color: #0f172a; }
  .product-desc { font-size: 0.82rem; color: #64748b; margin-top: 0.15rem; }
  .product-meta { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.35rem; flex-wrap: wrap; }
  .product-price { font-weight: 700; color: #0b74de; font-size: 0.95rem; }

  .availability-badge {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
  }
  .availability-badge.avail { background: #dcfce7; color: #15803d; }
  .availability-badge.unavail { background: #fee2e2; color: #b91c1c; }
  .deleted-badge {
    font-size: 0.72rem;
    font-weight: 600;
    padding: 0.15rem 0.45rem;
    border-radius: 4px;
    background: #fef3c7;
    color: #d97706;
  }
</style>
