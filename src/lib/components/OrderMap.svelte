<script lang="ts">
  import type { Branch, Order } from '$lib/stores/dashboard';

  interface Props {
    branches?: Branch[];
    orders?: Order[];
  }

  let { branches = [], orders = [] }: Props = $props();

  // ──────────────────────────────────────────────
  // Ho Chi Minh City bounding box (roughly)
  // ──────────────────────────────────────────────
  const LAT_MIN = 10.68;
  const LAT_MAX = 10.85;
  const LNG_MIN = 106.62;
  const LNG_MAX = 106.78;

  const W = 760;
  const H = 420;

  function toX(lng: number) {
    return ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W;
  }
  function toY(lat: number) {
    // invert Y so north is up
    return (1 - (lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H;
  }

  // tooltip state
  let tooltip = $state<{ x: number; y: number; label: string } | null>(null);

  function showTip(x: number, y: number, label: string) {
    tooltip = { x, y, label };
  }
  function hideTip() {
    tooltip = null;
  }

  // branch color lookup
  const BRANCH_COLORS = ['#0b74de', '#e84393', '#f59e0b', '#10b981', '#8b5cf6'];
  function branchColor(id: string) {
    const idx = branches.findIndex(b => b.id === id);
    return BRANCH_COLORS[idx % BRANCH_COLORS.length] ?? '#999';
  }
</script>

<div class="map-wrap">
  <svg
    viewBox="0 0 {W} {H}"
    class="map-svg"
    role="img"
    aria-label="Order and branch location map"
  >
    <!-- subtle grid -->
    {#each [1,2,3,4] as i}
      <line x1={W/5*i} y1="0" x2={W/5*i} y2={H} stroke="#e2e8f0" stroke-width="1"/>
    {/each}
    {#each [1,2,3] as i}
      <line x1="0" y1={H/4*i} x2={W} y2={H/4*i} stroke="#e2e8f0" stroke-width="1"/>
    {/each}

    <!-- connecting line: customer → assigned branch -->
    {#each orders as o}
      {#if o.branchId}
        {@const branch = branches.find(b => b.id === o.branchId)}
        {#if branch}
          <line
            x1={toX(o.customerLocation.lng)}
            y1={toY(o.customerLocation.lat)}
            x2={toX(branch.location.lng)}
            y2={toY(branch.location.lat)}
            stroke={branchColor(o.branchId)}
            stroke-width="1.5"
            stroke-dasharray="5 3"
            opacity="0.45"
          />
        {/if}
      {/if}
    {/each}

    <!-- customer order dots -->
    {#each orders as o}
      {@const cx = toX(o.customerLocation.lng)}
      {@const cy = toY(o.customerLocation.lat)}
      {@const color = o.branchId ? branchColor(o.branchId) : '#64748b'}
      <circle
        {cx} {cy} r="7"
        fill={color}
        fill-opacity="0.18"
        stroke={color}
        stroke-width="1.5"
        style="cursor:pointer"
        role="button"
        tabindex="0"
        aria-label="{o.id} {o.customer} {o.status}"
        onmouseenter={() => showTip(cx, cy, `${o.id} · ${o.customer} (${o.status})`)}
        onmouseleave={hideTip}
      />
      <!-- pulse ring for pending -->
      {#if o.status === 'Pending'}
        <circle {cx} {cy} r="12" fill="none" stroke={color} stroke-width="1" opacity="0.35">
          <animate attributeName="r" values="9;16;9" dur="2s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite"/>
        </circle>
      {/if}
    {/each}

    <!-- branch pins -->
    {#each branches as b}
      {@const bx = toX(b.location.lng)}
      {@const by = toY(b.location.lat)}
      {@const color = branchColor(b.id)}
      <!-- pin body -->
      <circle
        cx={bx} cy={by} r="11"
        fill={b.active ? color : '#94a3b8'}
        stroke="#fff"
        stroke-width="2.5"
        style="cursor:pointer"
        role="button"
        tabindex="0"
        aria-label="{b.name} {b.active ? 'Active' : 'Closed'}"
        onmouseenter={() => showTip(bx, by, `${b.name} · ${b.active ? 'Active' : 'Closed'}`)}
        onmouseleave={hideTip}
      />
      <!-- store icon text -->
      <text
        x={bx} y={by + 5}
        text-anchor="middle"
        font-size="11"
        fill="#fff"
        pointer-events="none"
        font-weight="700"
      >🏢</text>
    {/each}

    <!-- tooltip -->
    {#if tooltip}
      {@const tx = Math.min(tooltip.x + 12, W - 180)}
      {@const ty = Math.max(tooltip.y - 30, 8)}
      <rect x={tx} y={ty} width="200" height="26" rx="6" fill="#0f172a" opacity="0.88"/>
      <text x={tx + 8} y={ty + 17} fill="#fff" font-size="11" pointer-events="none">{tooltip.label}</text>
    {/if}
  </svg>

  <!-- legend -->
  <div class="legend">
    {#each branches as b}
      <span class="legend-item">
        <span class="legend-dot" style="background:{branchColor(b.id)};opacity:{b.active ? 1 : 0.4}"></span>
        {b.name}
      </span>
    {/each}
    <span class="legend-item">
      <span class="legend-dot" style="background:#64748b;border-radius:50%;width:8px;height:8px;display:inline-block"></span>
      Customer location
    </span>
    <span class="legend-item pulse-legend">
      <span class="legend-pulse"></span>
      Pending
    </span>
  </div>
</div>

<style>
  .map-wrap {
    background: #f8fafc;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }

  .map-svg {
    width: 100%;
    display: block;
    background: linear-gradient(160deg, #eef2ff 0%, #f0f9ff 100%);
  }

  .legend {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.25rem;
    padding: 0.65rem 1rem;
    border-top: 1px solid #e2e8f0;
    background: #fff;
    font-size: 0.78rem;
    color: #475569;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
    flex-shrink: 0;
  }

  .legend-pulse {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #0b74de;
    display: inline-block;
    animation: pulse-anim 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes pulse-anim {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.5); opacity: 0.4; }
  }
</style>
