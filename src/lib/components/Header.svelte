<script lang="ts">
  interface Props {
    title?: string;
  }
  let { title = 'Food App Dashboard' }: Props = $props();
</script>

<header class="header">
  <div class="brand">
    <h1>{title}</h1>
  </div>
  <nav class="nav">
    <a href="/">Overview</a>
    <a href="/orders">Orders</a>
    <a href="/menu">Menu</a>
    <a href="/customers">Customers</a>
  </nav>
</header>

