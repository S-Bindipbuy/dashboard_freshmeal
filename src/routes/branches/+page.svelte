<script lang="ts">
  import { branches, toggleBranchStatus, addBranch } from '$lib/stores/dashboard';
  import { fromStore } from 'svelte/store';

  let branchesList = fromStore(branches);

  let name = $state('');
  let address = $state('');
  let phone = $state('');

  function handleSubmit(e: Event) {
    e.preventDefault();
    if (!name || !address || !phone) return;

    // Generate random coordinates near HCMC center if not defined
    const latVal = 10.7769 + (Math.random() - 0.5) * 0.15;
    const lngVal = 106.7009 + (Math.random() - 0.5) * 0.15;

    addBranch({
      id: `B-${Date.now()}`,
      name,
      address,
      phone,
      active: true,
      location: { lat: latVal, lng: lngVal }
    });

    name = '';
    address = '';
    phone = '';
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
        <input id="br-name" type="text" placeholder="e.g. District 3 Express" bind:value={name} required />
      </div>
      <div class="form-group">
        <label for="br-address">Address</label>
        <input id="br-address" type="text" placeholder="e.g. 100 Nguyen Dinh Chieu" bind:value={address} required />
      </div>
      <div class="form-group">
        <label for="br-phone">Phone</label>
        <input id="br-phone" type="text" placeholder="e.g. 028-3930-4000" bind:value={phone} required />
      </div>
      <button type="submit" class="btn-primary">Add Branch</button>
    </form>
  </section>

  <section class="panel">
    <h2>Active Storefronts</h2>
    <div class="branches-grid">
      {#each branchesList.current as branch}
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
            <p><strong>📞 Phone:</strong> {branch.phone}</p>
            <p style="color: #0b74de; font-weight: 500; font-size: 0.8rem; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.25rem;">
              <span>📈 Click to view revenue & stats</span>
            </p>
          </div>
          <div class="branch-actions">
            <button onclick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBranchStatus(branch.id); }} class="btn-toggle-branch">
              {branch.active ? 'Temporarily Close' : 'Activate Branch'}
            </button>
          </div>
        </a>
      {/each}
    </div>
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
