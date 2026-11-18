export type CalendarEvent={id:string;title:string;date:string;time:string;location:string;notes:string;category:string};
const initialEvents: CalendarEvent[] =[
{id:'1',title:"Ralph's Coffee",date:'2026-11-17',time:'09:00',location:'Manhattan',notes:'',category:'Viaggio'},
{id:'2',title:'Financial District, Borsa, Oculus e World Trade Center',date:'2026-11-17',time:'10:00',location:'Lower Manhattan',notes:'Orario indicativo',category:'Viaggio'},
{id:'3',title:'DUMBO, Brooklyn',date:'2026-11-18',time:'14:00',location:'Brooklyn',notes:'Pomeriggio; orario indicativo',category:'Viaggio'},
{id:'4',title:'Brooklyn Nets vs Chicago Bulls',date:'2026-11-18',time:'19:30',location:'Brooklyn',notes:'',category:'Eventi'},
{id:'5',title:'SUMMIT One Vanderbilt',date:'2026-11-19',time:'09:30',location:'Manhattan',notes:'',category:'Viaggio'},
{id:'6',title:'Brunch Pershing Square',date:'2026-11-19',time:'11:00',location:'Manhattan',notes:'',category:'Cibo'},
{id:'7',title:'Pilates MOUV',date:'2026-11-20',time:'09:30',location:'Brooklyn',notes:'',category:'Sport'},
{id:'8',title:'Cena Chinatown',date:'2026-11-20',time:'20:30',location:'Chinatown',notes:'',category:'Cibo'}];

export type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  lodging?: string;
  events: CalendarEvent[];
};

export const newYork: Trip = {
  id: 'new-york',
  name: 'New York',
  startDate: '2026-11-14',
  endDate: '2026-11-21',
  events: initialEvents,
};

export const tripsKey = 'wayo-trips-v1';

export function createId(): string {
  return crypto.getRandomValues(new Uint32Array(4)).join('-');
}

function readArray(storage: Storage, key: string): unknown[] | undefined {
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? 'null');
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export function loadTrips(storage: Storage): Trip[] {
  const trips = readArray(storage, tripsKey) as Trip[] | undefined;
  if (trips?.length) return trips;

  // An empty legacy calendar is valid and must stay empty.
  const savedEvents = readArray(storage, 'nyc-calendar-events-v1') as CalendarEvent[] | undefined;
  return [{ ...newYork, events: savedEvents ?? newYork.events }];
}

const tripDates = new Intl.DateTimeFormat('it-IT', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

export function formatTripDates(trip: Trip): string {
  return tripDates.formatRange(new Date(trip.startDate), new Date(trip.endDate));
}
