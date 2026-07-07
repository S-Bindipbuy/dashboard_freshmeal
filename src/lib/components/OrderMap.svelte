<script lang="ts">
  import { onMount } from 'svelte';
  import type { Branch, Order } from '$lib/stores/dashboard';
  import 'leaflet/dist/leaflet.css';

  interface Props {
    branches?: Branch[];
    orders?: Order[];
  }

  let { branches = [], orders = [] }: Props = $props();

  let mapContainer: HTMLDivElement;

  const BRANCH_COLORS = ['#0b74de', '#e84393', '#f59e0b', '#10b981', '#8b5cf6'];

  function branchColor(id: string) {
    const idx = branches.findIndex(b => b.id === id);
    return BRANCH_COLORS[idx % BRANCH_COLORS.length] ?? '#999';
  }

  onMount(() => {
    if (!branches.length && !orders.length) return;

    let map: any;

    (async () => {
      try {
        const mod = await import('leaflet');
        const L = mod.default || mod;

        const allPoints: [number, number][] = [
          ...branches.map(b => [b.location.lat, b.location.lng] as [number, number]),
          ...orders.filter(o => o.customerLocation).map(o => [o.customerLocation!.lat, o.customerLocation!.lng] as [number, number]),
        ];

        const center: [number, number] = allPoints.length
          ? [
              allPoints.reduce((s, p) => s + p[0], 0) / allPoints.length,
              allPoints.reduce((s, p) => s + p[1], 0) / allPoints.length,
            ]
          : [3.1390, 101.6869];

        map = L.map(mapContainer, { zoomControl: true }).setView(center, 12);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        }).addTo(map);

        for (const b of branches) {
          const color = branchColor(b.id);
          const icon = L.divIcon({
            html: `<div style="
              width:22px;height:22px;border-radius:50%;
              background:${b.active ? color : '#94a3b8'};
              border:3px solid #fff;
              display:flex;align-items:center;justify-content:center;
              font-size:11px;font-weight:700;
              box-shadow:0 2px 6px rgba(0,0,0,0.2);
            ">🏢</div>`,
            className: '',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
          });

          const marker = L.marker([b.location.lat, b.location.lng], { icon }).addTo(map);
          marker.bindTooltip(`${b.name} · ${b.active ? 'Active' : 'Closed'}`, {
            permanent: false,
            direction: 'top',
          });
        }

        const lineGroup = L.featureGroup().addTo(map);
        const orderMarkers = L.featureGroup().addTo(map);

        for (const o of orders) {
          if (!o.customerLocation) continue;
          const color = o.branchId ? branchColor(o.branchId) : '#64748b';
          const pos: [number, number] = [o.customerLocation.lat, o.customerLocation.lng];

          const cm = L.circleMarker(pos, {
            radius: 7,
            fillColor: color,
            fillOpacity: 0.25,
            color,
            weight: 2,
          }).addTo(orderMarkers);

          cm.bindTooltip(`${o.id} · ${o.customer} (${o.status})`, {
            permanent: false,
            direction: 'top',
          });

          if (o.status === 'Pending') {
            const pulse = L.circleMarker(pos, {
              radius: 12,
              fill: false,
              color,
              weight: 1,
              opacity: 0.3,
            }).addTo(orderMarkers);
            (pulse as any)._path.classList.add('pulse-ring');
          }

          if (o.branchId) {
            const branch = branches.find(b => b.id === o.branchId);
            if (branch) {
              const latlngs: [number, number][] = [
                pos,
                [branch.location.lat, branch.location.lng],
              ];
              L.polyline(latlngs, {
                color,
                weight: 1.5,
                dashArray: '5, 8',
                opacity: 0.4,
              }).addTo(lineGroup);
            }
          }
        }

        if (allPoints.length > 1) {
          const bounds = L.latLngBounds(allPoints);
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
      } catch (err) {
        console.error('Failed to load map:', err);
      }
    })();

    return () => {
      map?.remove();
    };
  });
</script>

<div class="map-wrap">
  <div bind:this={mapContainer} class="map-container"></div>
</div>

<style>
  .map-wrap {
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    overflow: hidden;
  }
  .map-container {
    height: 420px;
    width: 100%;
  }
  :global(.pulse-ring) {
    animation: pulse-anim 2s ease-in-out infinite;
  }
  @keyframes pulse-anim {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0; }
  }
</style>
