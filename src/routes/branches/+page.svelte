<script lang="ts">
  import { branches, toggleBranchStatus, addBranch, refreshBranches } from '$lib/stores/dashboard';
  import type { Branch } from '$lib/stores/dashboard';
  import { onMount } from 'svelte';
  import { apiCreateBranch } from '$lib/api';

  let Leaflet: any;
  let rawBranches = $state<Branch[]>([]);
  let loading = $state(true);

  onMount(() => {
    return branches.subscribe(v => rawBranches = v);
  });

  let name = $state('');
  let address = $state('');
  let lat = $state<number | null>(null);
  let lng = $state<number | null>(null);

  let mapContainer: HTMLDivElement;
  let map: any;
  let marker: any;

  onMount(async () => {
    Leaflet = (await import('leaflet')).default;
    await import('leaflet/dist/leaflet.css');

    await refreshBranches();
    loading = false;

    map = Leaflet.map(mapContainer).setView([11.5564, 104.9282], 12);
    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    map.on('click', (e: any) => {
      lat = e.latlng.lat;
      lng = e.latlng.lng;
      if (marker) marker.setLatLng(e.latlng);
      else marker = Leaflet.marker(e.latlng).addTo(map);
    });
  });

  async function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name || !address || lat == null || lng == null) return;

    try {
      const b = await apiCreateBranch(name, address, lat, lng);
      addBranch({
        id: String(b.id),
        name: b.name,
        address: b.address,
        phone: '',
        active: true,
        location: { lat: b.lat, lng: b.lng }
      });
    } catch (_) {
      addBranch({
        id: `B-${Date.now()}`,
        name,
        address,
        phone: '',
        active: true,
        location: { lat, lng }
      });
    }

    name = '';
    address = '';
    lat = null;
    lng = null;
    if (marker) { marker.remove(); marker = null as any; }
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
      <div class="form-group" style="flex:0 0 100%;">
        <span style="display:block;font-size:0.85rem;font-weight:500;color:#334155;margin-bottom:0.3rem;">Pick Location on Map</span>
        <div bind:this={mapContainer} style="height:300px;border-radius:8px;border:1px solid var(--border);"></div>
        {#if lat != null && lng != null}
          <p style="font-size:0.8rem;color:var(--accent);margin-top:4px;">
            Selected: {lat!.toFixed(4)}, {lng!.toFixed(4)}
          </p>
        {/if}
      </div>
      <button type="submit" class="btn-primary">Add Branch</button>
    </form>
  </section>

  <section class="panel">
    <h2>Storefronts</h2>
    {#if loading}
      <p style="text-align:center;padding:2rem;color:var(--text-muted);">Loading branches...</p>
    {:else if rawBranches.length === 0}
      <p style="text-align:center;padding:2rem;color:var(--text-muted);">No branches yet.</p>
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
              <p style="color: var(--accent); font-weight: 500; font-size: 0.8rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
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
    color: var(--text);
  }
  input {
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.9rem;
    outline: none;
  }
  input:focus {
    border-color: var(--accent);
  }
  .btn-primary {
    padding: 0.5rem 1.25rem;
    border-radius: 6px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #fff;
    cursor: pointer;
    font-weight: 500;
    font-size: 0.9rem;
    height: 38px;
  }
  .btn-primary:hover {
    background: var(--accent-hover);
  }

  .branches-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.25rem;
    margin-top: 1rem;
  }

  .branch-card {
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.25rem;
    background: var(--card-bg);
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
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .inactive-card {
    opacity: 0.7;
    background: var(--bg);
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
    color: var(--text);
  }

  .branch-badge {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    border-radius: 6px;
  }
  .badge-active {
    background: var(--success-bg);
    color: var(--success-text);
  }
  .badge-inactive {
    background: var(--error-bg);
    color: var(--error-text);
  }

  .branch-details {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 1rem;
  }
  .branch-details p {
    margin: 0.25rem 0;
  }

  .btn-toggle-branch {
    width: 100%;
    padding: 0.5rem;
    background: var(--card-bg);
    border: 1px solid var(--input-border);
    color: var(--text-muted);
    border-radius: 6px;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s ease;
  }
  .btn-toggle-branch:hover {
    background: var(--hover-bg);
    color: var(--text);
  }
</style>
