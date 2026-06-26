<script lang="ts">
  import { page } from '$app/state';

  interface Props {
    title?: string;
  }
  let { title = 'Food App Dashboard' }: Props = $props();

  // Helper to determine active link
  function isActive(path: string) {
    if (path === '/') {
      return page.url.pathname === '/';
    }
    return page.url.pathname.startsWith(path);
  }
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
    <a href="/branches" class:active={isActive('/branches')}>
      <span class="nav-icon">🏢</span>
      Store Branches
    </a>
  </nav>

  <div class="sidebar-footer">
    <div class="user-profile">
      <div class="avatar">A</div>
      <div class="user-info">
        <span class="username">Admin User</span>
        <span class="role">Store Manager</span>
      </div>
    </div>
  </div>
</aside>

<style>
  .sidebar {
    width: 260px;
    height: 100vh;
    background: #f8fafc; /* Sleek light slate */
    color: #0f172a; /* Slate 900 text */
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    border-right: 1px solid #e2e8f0;
    z-index: 100;
  }

  .brand {
    padding: 1.5rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .brand-icon {
    font-size: 1.5rem;
  }

  .brand h2 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 700;
    letter-spacing: -0.2px;
    color: #0f172a;
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
    color: #475569; /* Muted Slate */
    text-decoration: none;
    border-radius: 8px;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.15s ease;
  }

  .nav a:hover {
    color: #0f172a;
    background: #f1f5f9;
  }

  .nav a.active {
    color: #0f172a;
    background: #e2e8f0; /* Crisp soft gray active */
    font-weight: 600;
  }

  .nav-icon {
    font-size: 1.15rem;
  }

  .sidebar-footer {
    padding: 1.25rem;
    border-top: 1px solid #e2e8f0;
    background: #f8fafc;
  }

  .user-profile {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .avatar {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #0f172a;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: #ffffff;
    font-size: 0.9rem;
  }

  .user-info {
    display: flex;
    flex-direction: column;
  }

  .username {
    font-size: 0.85rem;
    font-weight: 600;
    color: #0f172a;
  }

  .role {
    font-size: 0.75rem;
    color: #64748b;
  }
</style>
