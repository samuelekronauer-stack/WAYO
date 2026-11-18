'use client';

import { ExternalLink, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { newYork, type CalendarEvent } from './trips';

// The original itinerary sometimes stores an area instead of a specific venue.
const newYorkDestinations: Record<string, { location: string; destination: string }> = {
  '1': { location: 'Manhattan', destination: 'Ralph’s Coffee Manhattan, New York' },
  '2': { location: 'Lower Manhattan', destination: 'Financial District, Manhattan, New York' },
  '3': { location: 'Brooklyn', destination: 'DUMBO, Brooklyn, New York' },
  '4': { location: 'Brooklyn', destination: 'Barclays Center, Brooklyn, New York' },
  '5': { location: 'Manhattan', destination: 'SUMMIT One Vanderbilt, New York' },
  '6': { location: 'Manhattan', destination: 'Pershing Square Restaurant, New York' },
  '7': { location: 'Brooklyn', destination: 'MOUV Pilates, Brooklyn, New York' },
  '8': { location: 'Chinatown', destination: 'Chinatown, Manhattan, New York' },
};

type Props = {
  event: CalendarEvent;
  destination: string;
  onClose: () => void;
};

export function getDestination(event: CalendarEvent, isNewYork: boolean): string {
  const location = event.location?.trim() ?? '';
  const seed = isNewYork ? newYork.events.find(({ id }) => id === event.id) : undefined;
  const original = seed?.title === event.title ? newYorkDestinations[event.id] : undefined;
  return original?.location === location ? original.destination : location;
}

export function getDirections(lodging: string, destination: string): string {
  const params = new URLSearchParams({ api: '1', origin: lodging, destination });
  return `https://www.google.com/maps/dir/?${params}`;
}

export function ActivityMap({ event, destination, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const encoded = encodeURIComponent(destination);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encoded}`;

  useEffect(() => {
    dialog.current?.showModal();
  }, []);

  return (
    <dialog className="modal mapDialog" ref={dialog} aria-labelledby="map-title" onClose={onClose}>
      <div className="modalHead">
        <h2 id="map-title">{event.title}</h2>
        <button type="button" aria-label="Chiudi mappa" autoFocus onClick={() => dialog.current?.close()}><X /></button>
      </div>
      <p className="mapAddress">{destination}</p>
      <iframe
        className="mapFrame"
        title={`Mappa di ${event.title}`}
        src={`https://maps.google.com/maps?q=${encoded}&output=embed`}
        referrerPolicy="no-referrer"
      />
      <a className="mapExternal" href={mapsUrl} target="_blank" rel="noopener noreferrer">
        Apri in Google Maps <ExternalLink size={16} aria-hidden="true" />
      </a>
    </dialog>
  );
}
