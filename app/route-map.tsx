'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import type { LocatedStop } from './day-route';

export default function RouteMap({ stops, focused }: { stops: LocatedStop[]; focused?: string }) {
  const element = useRef<HTMLDivElement>(null);
  const markers = useRef(new Map<string, L.Marker>());

  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, { scrollWheelZoom: false });
    const activeMarkers = markers.current;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const coordinates = stops.map((stop) => stop.coordinates);
    if (coordinates.length > 1) {
      L.polyline(coordinates, { color: '#1b675a', weight: 3, dashArray: '5 6' }).addTo(map);
      map.fitBounds(L.latLngBounds(coordinates), { padding: [34, 34], maxZoom: 16 });
    } else {
      map.setView(coordinates[0], 15);
    }

    for (const stop of stops) {
      const label = document.createElement('span');
      label.textContent = stop.label;
      const popup = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = stop.title;
      popup.append(title);
      if (stop.time) popup.append(document.createElement('br'), stop.time);
      const marker = L.marker(stop.coordinates, {
        icon: L.divIcon({ className: 'routePin', html: label, iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15] }),
        title: stop.title,
      }).bindPopup(popup).addTo(map);
      activeMarkers.set(stop.id, marker);
    }

    return () => {
      activeMarkers.clear();
      map.remove();
    };
  }, [stops]);

  useEffect(() => {
    if (focused) markers.current.get(focused)?.openPopup();
  }, [focused, stops]);

  return <div ref={element} className="routeMap" aria-label="Mappa interattiva delle tappe" role="region" />;
}
