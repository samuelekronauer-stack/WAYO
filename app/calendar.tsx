'use client';
import {useMemo,useState} from 'react';
import {CalendarDays,ChevronLeft,ChevronRight,Plus,MapPin,Trash2,Pencil,X,Download} from 'lucide-react';
import { ActivityMap } from './activity-map';
import { createId, newYork, type CalendarEvent as Event, type Trip } from './trips';
const categories=['Viaggio','Sport','Cibo','Eventi','Altro'];
const empty=(date:string):Event=>({id:'',title:'',date,time:'09:00',location:'',notes:'',category:'Viaggio'});
const dateLabel=(d:string)=>new Date(d+'T12:00:00').toLocaleDateString('it-IT',{weekday:'long',day:'numeric',month:'long'});
const shift=(d:string,n:number)=>{const x=new Date(d+'T12:00:00');x.setDate(x.getDate()+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
type CalendarProps = {
  trip: Trip;
  onBack: () => void;
  onEventsChange: (update: (events: Event[]) => Event[]) => boolean;
};

export default function Calendar({ trip, onBack, onEventsChange }: CalendarProps) {
 const { events } = trip;
 const [selected,setSelected]=useState(trip.id === newYork.id ? '2026-11-17' : trip.startDate);
 const [view,setView]=useState<'week'|'month'>('week');
 const [editor,setEditor]=useState<Event|null>(null);
 const [mapEvent, setMapEvent] = useState<Event | null>(null);
 const weekStart=useMemo(()=>{const x=new Date(selected+'T12:00:00');return shift(selected,-((x.getDay()+6)%7))},[selected]);
 const days=useMemo(()=>Array.from({length:7},(_,i)=>shift(weekStart,i)),[weekStart]);
 const monthDays=useMemo(()=>{const first=selected.slice(0,7)+'-01';const start=shift(first,-((new Date(first+'T12:00:00').getDay()+6)%7));return Array.from({length:42},(_,i)=>shift(start,i))},[selected]);
 const todays=events.filter(e=>e.date===selected).sort((a,b)=>a.time.localeCompare(b.time));
 function save() {
   if (!editor || !editor.title.trim() || !editor.date) return;
   const updated = { ...editor, id: editor.id || createId() };
   const saved = onEventsChange((current) => editor.id
     ? current.map((event) => event.id === editor.id ? updated : event)
     : [...current, updated]);
   if (!saved) return;
   setSelected(updated.date);
   setEditor(null);
 }
 const download=()=>{const blob=new Blob([JSON.stringify(events,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='calendario-backup.json';a.click();URL.revokeObjectURL(url)};
 return <main className="shell"><header><div className="brand"><span className="brandIcon"><CalendarDays size={22}/></span><div><strong>{trip.name}</strong><small>Il mio calendario</small></div></div><button className="add desktop" onClick={()=>setEditor(empty(selected))}><Plus size={18}/> Nuovo evento</button></header>
 <section className="content"><button className="tripBack" onClick={onBack}><ChevronLeft size={18}/> I tuoi viaggi</button><div className="calendarPanel"><div className="toolbar"><div className="monthNav"><button aria-label="Precedente" onClick={()=>setSelected(shift(selected,view==='week'?-7:-30))}><ChevronLeft/></button><h1>{new Date(selected+'T12:00:00').toLocaleDateString('it-IT',{month:'long',year:'numeric'})}</h1><button aria-label="Successivo" onClick={()=>setSelected(shift(selected,view==='week'?7:30))}><ChevronRight/></button></div><div className="switch"><button className={view==='week'?'active':''} onClick={()=>setView('week')}>Settimana</button><button className={view==='month'?'active':''} onClick={()=>setView('month')}>Mese</button></div></div>
 <div className={'days '+(view==='month'?'monthGrid':'')}>{(view==='week'?days:monthDays).map(d=><button key={d} className={'day '+(d===selected?'chosen ':'')+(d.slice(0,7)!==selected.slice(0,7)?'muted':'')} onClick={()=>setSelected(d)}><span>{new Date(d+'T12:00:00').toLocaleDateString('it-IT',{weekday:'short'})}</span><strong>{Number(d.slice(8))}</strong><div className="dots">{events.filter(e=>e.date===d).slice(0,3).map(e=><i key={e.id} className={'dot '+e.category}/>)}</div></button>)}</div>
 </div><div className="sectionHead"><h2>{dateLabel(selected)}</h2><button onClick={()=>setEditor(empty(selected))}><Plus size={17}/> Aggiungi</button></div>
 <div className="eventList">{todays.length?todays.map(e=><article className={'event '+e.category} key={e.id}><div className="time">{e.time}</div><div className="details"><strong>{e.title}</strong>{e.location?.trim() && <button type="button" className="eventMap" onClick={() => setMapEvent(e)} aria-label={`Mostra sulla mappa: ${e.title}`}><MapPin size={15} aria-hidden="true" />{e.location}<span className="mapHint">Mappa</span></button>}{e.notes&&<small>{e.notes}</small>}</div><button className="edit" aria-label="Modifica evento" onClick={()=>setEditor({...e})}><Pencil size={17}/></button></article>):<div className="empty">Nessun evento per questa giornata.<br/>Aggiungine uno con il pulsante +</div>}</div>
 <button className="backup" onClick={download}><Download size={16}/> Esporta backup eventi</button></section>
 <button className="floating" aria-label="Aggiungi evento" onClick={()=>setEditor(empty(selected))}><Plus size={26}/></button>
 {mapEvent && <ActivityMap event={mapEvent} isNewYork={trip.id === newYork.id} onClose={() => setMapEvent(null)} />}
 {editor&&<div className="overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setEditor(null)}}><section className="modal"><div className="modalHead"><h2>{editor.id?'Modifica evento':'Nuovo evento'}</h2><button aria-label="Chiudi" onClick={()=>setEditor(null)}><X/></button></div><label>Titolo<input autoFocus value={editor.title} onChange={e=>setEditor({...editor,title:e.target.value})} placeholder="Es. Brunch"/></label><label>Data<input type="date" value={editor.date} onChange={e=>setEditor({...editor,date:e.target.value})}/></label><label>Orario<input type="time" value={editor.time} onChange={e=>setEditor({...editor,time:e.target.value})}/></label><label>Luogo<input value={editor.location} onChange={e=>setEditor({...editor,location:e.target.value})} placeholder="Es. museo, indirizzo o coordinate"/></label><label>Categoria<select value={editor.category} onChange={e=>setEditor({...editor,category:e.target.value})}>{categories.map(c=><option key={c}>{c}</option>)}</select></label><label>Note<textarea rows={3} value={editor.notes} onChange={e=>setEditor({...editor,notes:e.target.value})}/></label><div className="actions">{editor.id&&<button className="delete" onClick={()=>{if(confirm('Eliminare questo evento?')){if(onEventsChange(current=>current.filter(e=>e.id!==editor.id)))setEditor(null)}}}><Trash2 size={17}/> Elimina</button>}<button className="save" onClick={save} disabled={!editor.title.trim()}>Salva evento</button></div></section></div>}</main>
}
