<script lang="ts">
  interface Props {
    title: string;
    value: string | number;
    change?: string | null;
  }
  let { title, value, change = null }: Props = $props();
</script>

<article class="card">
  <div class="meta">
    <div class="title">{title}</div>
    {#if change}
      <div class="change">{change}</div>
    {/if}
  </div>
  <div class="value">{value}</div>
</article>

<style>
  .card{
    padding:1rem;
    border-radius:8px;
    background:var(--card-bg);
    box-shadow:0 1px 2px rgba(0,0,0,0.03);
    border:1px solid var(--border);
    display:flex;
    flex-direction:column;
    justify-content:space-between;
  }
  .meta{display:flex;justify-content:space-between;align-items:center}
  .title{font-size:0.875rem;color:var(--text-muted)}
  .change{font-size:0.75rem;color:var(--accent)}
  .value{font-weight:700;font-size:1.25rem;margin-top:0.5rem}
</style>

