<script lang="ts">
  import { branches, toggleBranchStatus, addBranch, refreshBranches } from '$lib/stores/dashboard';
  import type { Branch } from '$lib/stores/dashboard';
  import { onMount } from 'svelte';
  import { apiCreateBranch } from '$lib/api';

  let rawBranches = $state<Branch[]>([]);
  let loading = $state(true);

  onMount(() => {
    return branches.subscribe(v => rawBranches = v);
  });

  let name = $state('');
  let address = $state('');
  let lat = $state('');
  let lng = $state('');

  onMount(async () => {
    await refreshBranches();
    loading = false;
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name || !address || !lat || !lng) return;

    const latVal = parseFloat(lat);
    const lngVal = parseFloat(lng);

    try {
      const b = await apiCreateBranch(name, address, latVal, lngVal);
      addBranch({
        id: String(b.id),
        name: b.name,
        address: b.address,
        phone: '',
        active: true,
        location: { lat: b.lat, lng: b.lng }
      });
    } catch (_) {
      // fallback to local
      addBranch({
        id: `B-${Date.now()}`,
        name,
        address,
        phone: '',
        active: true,
        location: { lat: latVal, lng: lngVal }
      });
    }

    name = '';
    address = '';
    lat = '';
    lng = '';
  }

  function handleToggle(id: string) {
    toggleBranchStatus(id);
  }
</script>

<main class="container">
  <header class="page-header">
    <h1>Store Branches</h1>
    <p>Manage physical storefronts and location status. Click a card to view detailed revenue analytics.</p>
  </header>

  <section class="panel" style="margin-bottom: 1.5rem;">
    <h2>Add New Branch</h2>
    <form onsubmit={handleSubmit} class="branch-form">
      <div class="form-group">
        <label for="br-name">Branch Name</label>
        <input id="br-name" type="text" placeholder="e.g. Downtown Branch" bind:value={name} required />
      </div>
      <div class="form-group">
        <label for="br-address">Address</label>
        <input id="br-address" type="text" placeholder="e.g. 123 Main Street" bind:value={address} required />
      </div>
      <div class="form-group">
        <label for="br-lat">Latitude</label>
        <input id="br-lat" type="number" step="any" placeholder="e.g. 3.1390" bind:value={lat} required />
      </div>
      <div class="form-group">
        <label for="br-lng">Longitude</label>
        <input id="br-lng" type="number" step="any" placeholder="e.g. 101.6869" bind:value={lng} required />
      </div>
      <button type="submit" class="btn-primary">Add Branch</button>
    </form>
  </section>

  <section class="panel">
    <h2>Storefronts</h2>
    {#if loading}
      <p style="text-align:center;padding:2rem;color:#64748b;">Loading branches...</p>
    {:else if rawBranches.length === 0}
      <p style="text-align:center;padding:2rem;color:#64748b;">No branches yet.</p>
    {:else}
      <div class="branches-grid">
        {#each rawBranches as branch}
          <a 
            href="/branches/{branch.id}"
            class="branch-card" 
            class:inactive-card={!branch.active} 
          >
            <div class="branch-card-header">
              <h3>{branch.name}</h3>
              <span class="branch-badge" class:badge-active={branch.active} class:badge-inactive={!branch.active}>
                {branch.active ? 'Active' : 'Closed'}
              </span>
            </div>
            <div class="branch-details">
              <p><strong>📍 Address:</strong> {branch.address}</p>
              <p style="color: #0b74de; font-weight: 500; font-size: 0.8rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
                <span>📈 Click to view revenue & stats</span>
              </p>
            </div>
            <div class="branch-actions">
              <button onclick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggle(branch.id); }} class="btn-toggle-branch" style="color:#059669;border-color:#6ee7b7;">
                {branch.active ? 'Close' : 'Open'}
              </button>
            </div>
          </a>
        {/each}
      </div>
    {/if}
  </section>
</main>

<style>
  .branch-form {
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
    min-width: 200px;
  }
  .form-group label {
    font-size: 0.85rem;
    font-weight: 500;
    color: #444;
  }
  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    outline: none;
  }
  input:focus {
    border-color: #0b74de;
  }
  .btn-primary {
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    border: 1px solid #0b74de;
    background: #0b74de;
    color: #fff;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    height: 38px;
  }
  .btn-primary:hover {
    background: #095fb8;
  }

  .branches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
    margin-top: 1rem;
  }

  .branch-card {
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 1.25rem;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
    text-decoration: none;
    color: inherit;
  }
  .branch-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0,0,0,0.05);
  }
  .branch-card:focus-visible {
    outline: 2px solid #0b74de;
    outline-offset: 2px;
  }

  .inactive-card {
    opacity: 0.7;
    background: #f8fafc;
  }

  .branch-card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }
  .branch-card-header h3 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #0f172a;
  }

  .branch-badge {
    font-size: 0.75rem;
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

  .branch-details {
    font-size: 0.85rem;
    color: #475569;
    margin-bottom: 1rem;
  }
  .branch-details p {
    margin: 0.25rem 0;
  }

  .btn-toggle-branch {
    width: 100%;
    padding: 0.5rem;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    color: #475569;
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-toggle-branch:hover {
    background: #f1f5f9;
    color: #0f172a;
  }
</style>
