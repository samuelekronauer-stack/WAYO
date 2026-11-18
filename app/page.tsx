'use client';

import { ArrowUpRight, CalendarDays, MapPin, Plus, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import Calendar from './calendar';
import { createId, loadTrips, newYork, tripsKey, type CalendarEvent, type Trip } from './trips';

const tripDates = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export default function Page() {
  const [trips, setTrips] = useState<Trip[]>([newYork]);
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string>();
  const [creatingTrip, setCreatingTrip] = useState(false);
  const [startDate, setStartDate] = useState('');
  const activeTrip = trips.find((trip) => trip.id === activeId);

  useEffect(() => {
    try {
      setTrips(loadTrips(window.localStorage));
    } catch {
      // The default calendar remains available if storage is blocked.
    }
    setReady(true);
  }, []);

  function updateTrips(update: (current: Trip[]) => Trip[]) {
    try {
      const storage = window.localStorage;
      const nextTrips = update(loadTrips(storage));
      storage.setItem(tripsKey, JSON.stringify(nextTrips));
      setTrips(nextTrips);
      return true;
    } catch {
      window.alert('Impossibile salvare le modifiche. Verifica le impostazioni di archiviazione del browser.');
      return false;
    }
  }

  function updateEvents(update: (events: CalendarEvent[]) => CalendarEvent[]) {
    return updateTrips((current) => current.map((trip) =>
      trip.id === activeId ? { ...trip, events: update(trip.events) } : trip,
    ));
  }

  function createTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('name') ?? '').trim();
    const endDate = String(data.get('endDate') ?? '');
    if (!name || !startDate || !endDate || endDate < startDate) return;

    const trip: Trip = {
      id: createId(),
      name,
      startDate,
      endDate,
      events: [],
    };
    if (!updateTrips((current) => [...current, trip])) return;
    setCreatingTrip(false);
    setActiveId(trip.id);
  }

  if (activeTrip) {
    return (
      <Calendar
        key={activeTrip.id}
        trip={activeTrip}
        onBack={() => setActiveId(undefined)}
        onEventsChange={updateEvents}
      />
    );
  }

  return (
    <main className="shell">
      <header>
        <div className="brand">
          <span className="brandIcon"><MapPin size={22} aria-hidden="true" /></span>
          <div><strong>WAYO</strong></div>
        </div>
      </header>
      <section className="content">
        <div className="tripsHeading">
          <h1>I tuoi viaggi</h1>
          <button className="add" disabled={!ready} onClick={() => {
            setStartDate('');
            setCreatingTrip(true);
          }}>
            <Plus size={18} aria-hidden="true" /> Nuovo viaggio
          </button>
        </div>
        <ul className="tripList">
          {trips.map((trip) => (
            <li key={trip.id}>
              <button className={`tripCard${trip.id === newYork.id ? " tripCardNewYork" : ""}`} disabled={!ready} onClick={() => setActiveId(trip.id)}>
                <span className="tripDetails">
                  <strong>{trip.name}</strong>
                  <span><CalendarDays size={16} aria-hidden="true" />{tripDates.formatRange(new Date(trip.startDate), new Date(trip.endDate))}</span>
                </span>
                <span className="tripArrow"><ArrowUpRight size={20} aria-hidden="true" /></span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {creatingTrip && (
        <div className="overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setCreatingTrip(false);
        }}>
          <form
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-trip-title"
            onSubmit={createTrip}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setCreatingTrip(false);
            }}
          >
            <div className="modalHead">
              <h2 id="new-trip-title">Nuovo viaggio</h2>
              <button type="button" aria-label="Chiudi" onClick={() => setCreatingTrip(false)}><X /></button>
            </div>
            <label>Nome del viaggio<input name="name" autoFocus required pattern={'.*\\S.*'} /></label>
            <label>Data di inizio<input type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></label>
            <label>Data di fine<input name="endDate" type="date" required min={startDate || undefined} /></label>
            <div className="actions"><button className="save">Crea viaggio</button></div>
          </form>
        </div>
      )}
    </main>
  );
}
