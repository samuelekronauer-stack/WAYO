'use client';

import dynamic from 'next/dynamic';
import { ExternalLink, MapPin, Route } from 'lucide-react';
import { useRef, useState } from 'react';
import { getDirections, type TravelMode } from './activity-map';

const RouteMap = dynamic(() => import('./route-map'), {
  ssr: false,
  loading: () => <p className="routeStatus">Caricamento mappa…</p>,
});

type Coordinates = [latitude: number, longitude: number];

export type RouteStop = {
  id: string;
  label: string;
  title: string;
  address: string;
  time?: string;
};

export type LocatedStop = RouteStop & { coordinates: Coordinates };

const newYorkCoordinates: Record<string, Coordinates> = {
  'Financial District, Manhattan, New York': [40.7075, -74.0108],
  'DUMBO, Brooklyn, New York': [40.7033, -73.9881],
  'Barclays Center, Brooklyn, New York': [40.6827, -73.9754],
  'SUMMIT One Vanderbilt, New York': [40.7528, -73.9786],
  'Pershing Square Restaurant, New York': [40.7521, -73.9783],
  'Chinatown, Manhattan, New York': [40.7158, -73.997],
};

const resolvedAddresses = new Map<string, Coordinates>();

function knownCoordinates(address: string): Coordinates | undefined {
  const direct = address.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
  if (direct) {
    const latitude = Number(direct[1]);
    const longitude = Number(direct[2]);
    if (Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180) return [latitude, longitude];
  }
  return resolvedAddresses.get(address) ?? Object.getOwnPropertyDescriptor(newYorkCoordinates, address)?.value;
}

async function locateAddress(address: string): Promise<Coordinates | undefined> {
  const response = await fetch(`https://photon.komoot.io/api/?${new URLSearchParams({ q: address, limit: '1' })}`, {
    signal: AbortSignal.timeout(6000),
    referrerPolicy: 'no-referrer',
  });
  if (!response.ok) return undefined;
  const data = await response.json() as { features?: { geometry?: { coordinates?: number[] } }[] };
  const coordinates = data.features?.[0]?.geometry?.coordinates;
  if (!coordinates) return undefined;
  const [longitude, latitude] = coordinates;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return undefined;
  return [latitude, longitude];
}

export default function DayRoute({ stops, mode, onModeChange }: {
  stops: RouteStop[];
  mode: TravelMode;
  onModeChange: (mode: TravelMode) => void;
}) {
  const [located, setLocated] = useState<LocatedStop[]>(() => stops.flatMap((stop) => {
    const coordinates = knownCoordinates(stop.address);
    return coordinates ? [{ ...stop, coordinates }] : [];
  }));
  const [focused, setFocused] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const pending = useRef(false);
  const locatedIds = new Set(located.map((stop) => stop.id));
  const missing = stops.filter((stop) => !locatedIds.has(stop.id));

  async function completeMap() {
    if (pending.current) return;
    pending.current = true;
    setLoading(true);

    const result: LocatedStop[] = [];
    const found = new Map<string, Coordinates | undefined>();
    for (const stop of missing) {
      if (!found.has(stop.address)) {
        try {
          const coordinates = knownCoordinates(stop.address) ?? await locateAddress(stop.address);
          if (coordinates) resolvedAddresses.set(stop.address, coordinates);
          found.set(stop.address, coordinates);
        } catch {
          found.set(stop.address, undefined);
        }
      }
      const coordinates = found.get(stop.address);
      if (coordinates) result.push({ ...stop, coordinates });
    }

    const byId = new Map([...located, ...result].map((stop) => [stop.id, stop]));
    setLocated(stops.flatMap(({ id }) => {
      const stop = byId.get(id);
      return stop ? [stop] : [];
    }));
    setAttempted(true);
    setLoading(false);
    pending.current = false;
  }

  // Google Maps supports up to three waypoints on mobile browsers. Transit opens one leg per link.
  const stopsPerLink = mode === 'transit' ? 1 : 4;
  const legs = Array.from({ length: Math.ceil(Math.max(0, stops.length - 1) / stopsPerLink) }, (_, index) => {
    const start = index * stopsPerLink;
    return stops.slice(start, start + stopsPerLink + 1);
  });

  return (
    <section className="dayRoute" aria-labelledby="day-route-title">
      <div className="routeHeading">
        <h2 id="day-route-title"><Route size={21} aria-hidden="true" /> Mappa del giorno</h2>
        {stops.length > 1 && (
          <label className="routeMode">
            Come ti sposti?
            <select value={mode} onChange={(event) => onModeChange(event.target.value as TravelMode)}>
              <option value="walking">A piedi</option>
              <option value="transit">Metro e mezzi</option>
              <option value="driving">In auto</option>
            </select>
          </label>
        )}
      </div>

      {located.length > 0 && <RouteMap stops={located} focused={focused} />}
      {missing.length > 0 && (
        <div className="routeLookup">
          <p className="routeStatus" role="status">
            {attempted
              ? `${missing.length} ${missing.length === 1 ? 'indirizzo non trovato' : 'indirizzi non trovati'}. Controlla i luoghi inseriti.`
              : 'Per mostrare gli altri punti, cerca gli indirizzi sulla mappa.'}
          </p>
          <button className="itineraryAction" disabled={loading} onClick={completeMap}>
            {loading ? 'Ricerca in corso…' : attempted ? 'Riprova' : 'Cerca indirizzi'}
          </button>
        </div>
      )}
      <ol className="routeStops">
        {stops.map((stop) => (
          <li key={stop.id}>
            <span className="routeNumber">{stop.label}</span>
            <div>
              {locatedIds.has(stop.id) ? (
                <button className="routeStopButton" onClick={() => setFocused(stop.id)}>
                  {stop.title}
                </button>
              ) : <strong>{stop.title}</strong>}
              <small>{stop.time ? `${stop.time} · ${stop.address}` : stop.address}</small>
            </div>
          </li>
        ))}
      </ol>
      {located.length > 1 && <p className="routeStatus">I punti seguono l’ordine dell’agenda. Google Maps calcola il percorso effettivo.</p>}
      {legs.length > 0 && (
        <div className="routeLinks">
          {legs.map(([origin, ...destinations]) => {
            const destination = destinations[destinations.length - 1];
            const waypoints = destinations.slice(0, -1).map((stop) => stop.address);
            return (
              <a key={origin.id} className="directionsLink" href={getDirections(origin.address, destination.address, mode, waypoints)} target="_blank" rel="noopener noreferrer">
                {legs.length === 1 ? 'Apri itinerario in Google Maps' : `${origin.title} → ${destination.title}`}
                <ExternalLink size={14} aria-hidden="true" />
              </a>
            );
          })}
        </div>
      )}
      {stops.length === 0 && <p className="routeStatus"><MapPin size={15} aria-hidden="true" /> Aggiungi un luogo a un appuntamento per vederlo sulla mappa.</p>}
    </section>
  );
}
