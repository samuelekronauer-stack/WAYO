'use client';

import { useState, type FormEvent } from 'react';
import { BedDouble, CalendarDays, ChevronLeft, ChevronRight, Download, MapPin, Pencil, Plus, Route, Trash2, X } from 'lucide-react';
import { ActivityMap, getDestination, getDirections } from './activity-map';
import { createId, formatTripDates, newYork, type CalendarEvent, type Trip } from './trips';

const categories = ['Viaggio', 'Sport', 'Cibo', 'Eventi', 'Altro'];
const monthLabel = new Intl.DateTimeFormat('it-IT', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const dayLabel = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const weekdayLabel = new Intl.DateTimeFormat('it-IT', { weekday: 'short', timeZone: 'UTC' });

function shiftDay(date: string, days: number): string {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function startOfWeek(date: string): string {
  return shiftDay(date, -((new Date(date).getUTCDay() + 6) % 7));
}

function shiftMonth(date: string, months: number): string {
  const value = new Date(date);
  const day = value.getUTCDate();
  value.setUTCDate(1);
  value.setUTCMonth(value.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + 1, 0)).getUTCDate();
  value.setUTCDate(Math.min(day, lastDay));
  return value.toISOString().slice(0, 10);
}

type CalendarProps = {
  trip: Trip;
  onBack: () => void;
  onEventsChange: (update: (events: CalendarEvent[]) => CalendarEvent[]) => boolean;
  onLodgingChange: (address: string) => boolean;
};

export default function Calendar({ trip, onBack, onEventsChange, onLodgingChange }: CalendarProps) {
  const { events } = trip;
  const isNewYork = trip.id === newYork.id;
  const lodging = trip.lodging?.trim();
  const [selected, setSelected] = useState(isNewYork ? '2026-11-17' : trip.startDate);
  const [view, setView] = useState<'week' | 'month'>('week');
  const [editor, setEditor] = useState<CalendarEvent | null>(null);
  const [mapEvent, setMapEvent] = useState<CalendarEvent | null>(null);
  const [editingLodging, setEditingLodging] = useState(false);
  const firstDay = startOfWeek(view === 'week' ? selected : `${selected.slice(0, 7)}-01`);
  const days = Array.from({ length: view === 'week' ? 7 : 42 }, (_, index) => shiftDay(firstDay, index));
  const eventsByDay = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDay.get(event.date);
    if (list) list.push(event);
    else eventsByDay.set(event.date, [event]);
  }
  const agenda = (eventsByDay.get(selected) ?? []).sort((a, b) => a.time.localeCompare(b.time));

  function navigate(direction: number) {
    setSelected((date) => view === 'week' ? shiftDay(date, direction * 7) : shiftMonth(date, direction));
  }

  function addEvent() {
    setEditor({ id: '', title: '', date: selected, time: '09:00', location: '', notes: '', category: 'Viaggio' });
  }

  function saveEvent(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!editor || !editor.title.trim() || !editor.date) return;
    const updated = { ...editor, id: editor.id || createId() };
    const saved = onEventsChange((current) => editor.id
      ? current.map((event) => event.id === editor.id ? updated : event)
      : [...current, updated]);
    if (!saved) return;
    setSelected(updated.date);
    setEditor(null);
  }

  function saveLodging(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    const address = String(new FormData(formEvent.currentTarget).get('lodging') ?? '').trim();
    if (onLodgingChange(address)) setEditingLodging(false);
  }

  function download() {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'calendario-backup.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <div className="content itinerary">
        <button className="tripBack" onClick={onBack}><ChevronLeft size={18} aria-hidden="true" /> I tuoi viaggi</button>
        <div className="itineraryHeader">
          <div>
            <h1>{trip.name}</h1>
            <p><CalendarDays size={17} aria-hidden="true" /> {formatTripDates(trip)}</p>
          </div>
          <button className="add" onClick={addEvent}><Plus size={18} aria-hidden="true" /> Nuovo evento</button>
        </div>

        <section className="lodgingCard" aria-labelledby="lodging-title">
          <span className="brandIcon"><BedDouble size={20} aria-hidden="true" /></span>
          <div>
            <h2 id="lodging-title">Alloggio</h2>
            <p>{lodging || 'Aggiungi un punto di partenza per le indicazioni.'}</p>
          </div>
          <button className="itineraryAction" onClick={() => setEditingLodging(true)}>
            {lodging ? 'Modifica alloggio' : 'Aggiungi alloggio'}
          </button>
        </section>

        <section className="calendarPanel" aria-label="Calendario">
          <div className="toolbar">
            <div className="monthNav">
              <button aria-label="Precedente" onClick={() => navigate(-1)}><ChevronLeft aria-hidden="true" /></button>
              <h2>{monthLabel.format(new Date(selected))}</h2>
              <button aria-label="Successivo" onClick={() => navigate(1)}><ChevronRight aria-hidden="true" /></button>
            </div>
            <div className="switch" aria-label="Vista calendario" role="group">
              <button className={view === 'week' ? 'active' : ''} aria-pressed={view === 'week'} onClick={() => setView('week')}>Settimana</button>
              <button className={view === 'month' ? 'active' : ''} aria-pressed={view === 'month'} onClick={() => setView('month')}>Mese</button>
            </div>
          </div>
          <div className={`days ${view === 'month' ? 'monthGrid' : ''}`}>
            {days.map((date) => {
              const value = new Date(date);
              const dailyEvents = eventsByDay.get(date) ?? [];
              return (
                <button
                  key={date}
                  className={`day${date === selected ? ' chosen' : ''}${date.slice(0, 7) !== selected.slice(0, 7) ? ' muted' : ''}`}
                  aria-label={dayLabel.format(value)}
                  aria-pressed={date === selected}
                  onClick={() => setSelected(date)}
                >
                  <span>{weekdayLabel.format(value)}</span>
                  <strong>{value.getUTCDate()}</strong>
                  <span className="dots" aria-hidden="true">
                    {dailyEvents.slice(0, 3).map((event) => <i key={event.id} className={`dot ${event.category}`} />)}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="agenda-title">
          <div className="sectionHead">
            <div>
              <h2 id="agenda-title">{dayLabel.format(new Date(selected))}</h2>
              <p>{agenda.length} attività in programma</p>
            </div>
            <button aria-label="Aggiungi" onClick={addEvent}><Plus size={17} aria-hidden="true" /> Aggiungi</button>
          </div>
          {agenda.length ? (
            <ol className="eventList itineraryAgenda">
              {agenda.map((event) => {
                const destination = getDestination(event, isNewYork);
                return (
                  <li key={event.id} className={`event ${event.category}`}>
                    <time className="time">{event.time}</time>
                    <div className="details">
                      <h3>{event.title}</h3>
                      {event.notes && <small>{event.notes}</small>}
                      {destination && (
                        <div className="eventActions">
                          <button className="eventMap" onClick={() => setMapEvent(event)} aria-label={`Mostra sulla mappa: ${event.title}`}>
                            <MapPin size={15} aria-hidden="true" /> {event.location}
                          </button>
                          {lodging && (
                            <a className="directionsLink" href={getDirections(lodging, destination)} target="_blank" rel="noopener noreferrer" aria-label={`Indicazioni dall’alloggio: ${event.title}`}>
                              <Route size={15} aria-hidden="true" /> Indicazioni
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                    <button className="edit" aria-label="Modifica evento" onClick={() => setEditor({ ...event })}><Pencil size={17} aria-hidden="true" /></button>
                  </li>
                );
              })}
            </ol>
          ) : <p className="empty">Nessun evento per questa giornata.</p>}
        </section>
        <button className="backup" onClick={download}><Download size={16} aria-hidden="true" /> Esporta backup eventi</button>
      </div>

      {mapEvent && <ActivityMap event={mapEvent} destination={getDestination(mapEvent, isNewYork)} onClose={() => setMapEvent(null)} />}

      {editingLodging && (
        <div className="overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditingLodging(false);
        }}>
          <form className="modal" role="dialog" aria-modal="true" aria-labelledby="lodging-editor-title" onSubmit={saveLodging} onKeyDown={(event) => {
            if (event.key === 'Escape') setEditingLodging(false);
          }}>
            <div className="modalHead">
              <h2 id="lodging-editor-title">Alloggio</h2>
              <button type="button" aria-label="Chiudi" onClick={() => setEditingLodging(false)}><X /></button>
            </div>
            <label>Nome e città oppure indirizzo<input name="lodging" autoFocus defaultValue={lodging} /></label>
            <div className="actions">
              {lodging && <button type="button" className="delete" onClick={() => {
                if (onLodgingChange('')) setEditingLodging(false);
              }}>Rimuovi alloggio</button>}
              <button className="save">Salva alloggio</button>
            </div>
          </form>
        </div>
      )}

      {editor && (
        <div className="overlay" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setEditor(null);
        }}>
          <form className="modal" role="dialog" aria-modal="true" aria-labelledby="event-editor-title" onSubmit={saveEvent} onKeyDown={(event) => {
            if (event.key === 'Escape') setEditor(null);
          }}>
            <div className="modalHead">
              <h2 id="event-editor-title">{editor.id ? 'Modifica evento' : 'Nuovo evento'}</h2>
              <button type="button" aria-label="Chiudi" onClick={() => setEditor(null)}><X /></button>
            </div>
            <label>Titolo<input autoFocus required value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })} placeholder="Es. Brunch" /></label>
            <label>Data<input type="date" required value={editor.date} onChange={(event) => setEditor({ ...editor, date: event.target.value })} /></label>
            <label>Orario<input type="time" value={editor.time} onChange={(event) => setEditor({ ...editor, time: event.target.value })} /></label>
            <label>Luogo<input value={editor.location} onChange={(event) => setEditor({ ...editor, location: event.target.value })} placeholder="Es. museo, indirizzo o coordinate" /></label>
            <label>Categoria<select value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Note<textarea rows={3} value={editor.notes} onChange={(event) => setEditor({ ...editor, notes: event.target.value })} /></label>
            <div className="actions">
              {editor.id && <button type="button" className="delete" onClick={() => {
                if (confirm('Eliminare questo evento?') && onEventsChange((current) => current.filter((event) => event.id !== editor.id))) {
                  setEditor(null);
                }
              }}><Trash2 size={17} aria-hidden="true" /> Elimina</button>}
              <button className="save" disabled={!editor.title.trim()}>Salva evento</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
