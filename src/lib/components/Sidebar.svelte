<script lang="ts">
  import { page } from '$app/state';
  import { authStore, currentUser } from '$lib/stores/auth';
  import { apiUploadAvatar } from '$lib/api';
  import { onMount } from 'svelte';
  import { fromStore } from 'svelte/store';

  interface Props {
    title?: string;
  }
  let { title = 'Food App Dashboard' }: Props = $props();

  let user = fromStore(currentUser);
  let showProfile = $state(false);
  let darkMode = $state(false);

  onMount(() => {
    darkMode = localStorage.getItem('theme') === 'dark';
    if (darkMode) document.documentElement.classList.add('dark');
  });

  function isActive(path: string) {
    if (path === '/') return page.url.pathname === '/';
    return page.url.pathname.startsWith(path);
  }

  function handleLogout() {
    authStore.logout();
  }

  let fileInput = $state<HTMLInputElement | null>(null);

  let editing = $state(false);
  let editName = $state('');
  let editEmail = $state('');
  let saving = $state(false);

  function startEditing() {
    editName = user.current?.name ?? '';
    editEmail = user.current?.email ?? '';
    editing = true;
  }

  async function handleSaveProfile() {
    saving = true;
    try {
      await authStore.updateProfile(editName, editEmail);
      editing = false;
    } catch {
      console.warn('Profile save failed');
    } finally { saving = false; }
  }

  async function handleAvatarUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      await apiUploadAvatar(file);
      await authStore._setProfileFromApi();
    } catch {
      console.warn('Avatar upload failed');
    }
  }

  function toggleDark() {
    darkMode = !darkMode;
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }

  const avatarUrl = $derived(user.current?.avatar ? `/images/${user.current.avatar}` : null);
  const initials = $derived((user.current?.name ?? 'A').charAt(0).toUpperCase());
</script>

<aside class="sidebar">
  <div class="brand">
    <span class="brand-icon">🍔</span>
    <h2>{title}</h2>
  </div>

  <nav class="nav">
    <a href="/" class:active={isActive('/')}>
      <span class="nav-icon">📊</span>
      Overview
    </a>
    <a href="/orders" class:active={isActive('/orders')}>
      <span class="nav-icon">📱</span>
      Mobile Orders
    </a>
    <a href="/chef" class:active={isActive('/chef')}>
      <span class="nav-icon">👨‍🍳</span>
      Kitchen View
    </a>
    <a href="/menu" class:active={isActive('/menu')}>
      <span class="nav-icon">🍽️</span>
      Menu / Products
    </a>
    <a href="/customers" class:active={isActive('/customers')}>
      <span class="nav-icon">👥</span>
      Customers
    </a>
    <a href="/users" class:active={isActive('/users')}>
      <span class="nav-icon">👤</span>
      Users
    </a>
    <a href="/branches" class:active={isActive('/branches')}>
      <span class="nav-icon">🏢</span>
      Store Branches
    </a>
  </nav>

  <div class="sidebar-footer">
    <div class="user-profile" onclick={() => showProfile = true} onkeydown={(e) => e.key === 'Enter' && (showProfile = true)} role="button" tabindex="0">
      {#if avatarUrl}
        <img src={avatarUrl} alt="" class="avatar-img" />
      {:else}
        <div class="avatar">{initials}</div>
      {/if}
      <div class="user-info">
        <span class="username">{user.current?.name ?? 'Admin'}</span>
        <span class="role">{user.current?.role ?? 'admin'}</span>
      </div>
    </div>
  </div>
</aside>

{#if showProfile}
  <div class="overlay" onclick={() => showProfile = false} onkeydown={(e) => e.key === 'Enter' && (showProfile = false)} role="button" tabindex="0"></div>
  <div class="profile-modal">
    <div class="profile-modal-header">
      <h3>Profile</h3>
      <button class="btn-close" onclick={() => showProfile = false}>✕</button>
    </div>
    <div class="profile-avatar-section">
      {#if avatarUrl}
        <img src={avatarUrl} alt="" class="modal-avatar-img" />
      {:else}
        <div class="modal-avatar">{initials}</div>
      {/if}
      <button class="btn-change-avatar" onclick={() => fileInput?.click()}>Change Photo</button>
      <input type="file" accept="image/*" bind:this={fileInput} onchange={handleAvatarUpload} style="display:none" />
    </div>
    <div class="profile-details">
      {#if editing}
        <div class="edit-field">
          <label for="edit-name">Name</label>
          <input id="edit-name" type="text" bind:value={editName} />
        </div>
        <div class="edit-field">
          <label for="edit-email">Email</label>
          <input id="edit-email" type="email" bind:value={editEmail} />
        </div>
        <div class="edit-actions">
          <button class="btn-cancel" onclick={() => editing = false}>Cancel</button>
          <button class="btn-save" onclick={handleSaveProfile} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      {:else}
        <div class="detail-row">
          <span class="detail-label">Name</span>
          <span class="detail-value">{user.current?.name ?? '—'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">{user.current?.email ?? '—'}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Role</span>
          <span class="detail-value"><span class="profile-role-badge">{user.current?.role ?? '—'}</span></span>
        </div>
      {/if}
    </div>
    <div class="profile-actions">
      {#if !editing}
        <button class="btn-edit" onclick={startEditing}>✏️ Edit Profile</button>
      {/if}
      <button class="btn-dark-toggle" onclick={toggleDark}>
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>
      <button class="btn-logout" onclick={handleLogout}>🚪 Logout</button>
    </div>
  </div>
{/if}

<style>
  .sidebar {
    width: 260px;
    height: 100vh;
    background: var(--sidebar-bg, #f8fafc);
    color: var(--sidebar-text, #0f172a);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    border-right: 1px solid var(--sidebar-border, #e2e8f0);
    z-index: 100;
  }

  .brand {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid var(--sidebar-border, #e2e8f0);
  }

  .brand-icon { font-size: 1.5rem; }

  .brand h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.2px;
    color: var(--sidebar-text, #0f172a);
  }

  .nav {
    flex: 1;
    padding: 1.5rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .nav a {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    color: var(--sidebar-muted, #475569);
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .nav a:hover {
    color: var(--sidebar-text, #0f172a);
    background: var(--sidebar-hover, #f1f5f9);
  }

  .nav a.active {
    color: var(--sidebar-text, #0f172a);
    background: var(--sidebar-active, #e2e8f0);
    font-weight: 600;
  }

  .nav-icon { font-size: 1.15rem; }

  .sidebar-footer {
    padding: 1.25rem;
    border-top: 1px solid var(--sidebar-border, #e2e8f0);
    background: var(--sidebar-footer-bg, #f8fafc);
    cursor: pointer;
  }
  .sidebar-footer:hover { background: var(--sidebar-hover, #f1f5f9); }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .avatar, .avatar-img {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
  }
  .avatar { background: var(--sidebar-text, #0f172a); color: #fff; }
  .avatar-img { object-fit: cover; }

  .user-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .username {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--sidebar-text, #0f172a);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .role {
    font-size: 0.75rem;
    color: var(--sidebar-muted, #64748b);
    text-transform: capitalize;
  }

  /* ── Profile Modal ── */
  .overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:1100; }
  .profile-modal {
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);
    background:var(--modal-bg, #fff);border-radius:16px;padding:2rem;z-index:1101;
    min-width:360px;max-width:90vw;box-shadow:0 25px 50px rgba(0,0,0,0.25);
  }
  .profile-modal-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem; }
  .profile-modal-header h3 { margin:0;font-size:1.2rem;color:var(--sidebar-text, #0f172a); }
  .btn-close { background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--sidebar-muted, #64748b);padding:0.25rem; }
  .btn-close:hover { color:var(--sidebar-text, #0f172a); }

  .profile-avatar-section { display:flex;flex-direction:column;align-items:center;gap:0.75rem;margin-bottom:1.5rem; }
  .modal-avatar, .modal-avatar-img {
    width:80px;height:80px;border-radius:50%;display:flex;align-items:center;justify-content:center;
    font-weight:700;font-size:1.8rem;
  }
  .modal-avatar { background:var(--sidebar-text, #0f172a);color:#fff; }
  .modal-avatar-img { object-fit:cover; }
  .btn-change-avatar { font-size:0.85rem;color:#0b74de;background:none;border:none;cursor:pointer;padding:0.25rem; }
  .btn-change-avatar:hover { text-decoration:underline; }

  .profile-details { margin-bottom:1.5rem; }
  .detail-row { display:flex;justify-content:space-between;padding:0.6rem 0;border-bottom:1px solid var(--sidebar-border, #e2e8f0); }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { font-size:0.85rem;font-weight:500;color:var(--sidebar-muted, #64748b); }
  .detail-value { font-size:0.85rem;color:var(--sidebar-text, #0f172a);font-weight:500; }
  .profile-role-badge { display:inline-block;padding:0.15rem 0.5rem;border-radius:999px;font-size:0.75rem;font-weight:600;text-transform:capitalize;background:#e0e7ff;color:#3730a3; }

  .edit-field { margin-bottom:0.75rem; }
  .edit-field label { display:block;font-size:0.8rem;font-weight:500;color:var(--sidebar-muted, #64748b);margin-bottom:0.25rem; }
  .edit-field input {
    width:100%;padding:0.5rem 0.6rem;border-radius:8px;border:1px solid var(--input-border, #cbd5e1);
    background:var(--input-bg, #fff);color:var(--text, #0f172a);font-size:0.9rem;outline:none;box-sizing:border-box;
  }
  .edit-field input:focus { border-color:var(--accent, #0b74de); }

  .edit-actions { display:flex;gap:0.5rem;margin-top:1rem; }
  .btn-cancel, .btn-save { flex:1;padding:0.5rem;border-radius:8px;font-size:0.85rem;font-weight:500;cursor:pointer;border:1px solid var(--sidebar-border, #e2e8f0);text-align:center; }
  .btn-cancel { background:var(--sidebar-footer-bg, #f8fafc);color:var(--sidebar-text, #0f172a); }
  .btn-cancel:hover { background:var(--sidebar-hover, #f1f5f9); }
  .btn-save { background:var(--accent, #0b74de);color:#fff;border-color:var(--accent, #0b74de); }
  .btn-save:hover { background:var(--accent-hover, #095fb8); }
  .btn-save:disabled { opacity:0.6;cursor:not-allowed; }

  .profile-actions { display:flex;flex-direction:column;gap:0.5rem; }
  .btn-edit, .btn-dark-toggle, .btn-logout {
    width:100%;padding:0.65rem;border-radius:8px;font-size:0.9rem;font-weight:500;cursor:pointer;border:1px solid var(--sidebar-border, #e2e8f0);background:var(--sidebar-footer-bg, #f8fafc);color:var(--sidebar-text, #0f172a);text-align:center;
  }
  .btn-edit:hover, .btn-dark-toggle:hover, .btn-logout:hover { background:var(--sidebar-hover, #f1f5f9); }
  .btn-logout { border-color:#fee2e2;color:#b91c1c; }
  .btn-logout:hover { background:#fee2e2; }
</style>
