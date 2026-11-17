# Il mio calendario

Mini-app Next.js per telefono e desktop. Eventi iniziali del viaggio a New York (17–20 novembre 2026).

## Avvio locale

```bash
npm install
npm run dev
```

Apri http://localhost:3000.

## Pubblicazione su Vercel

1. Carica questa cartella in un nuovo repository GitHub.
2. In Vercel scegli **Add New → Project**, importa il repository e clicca **Deploy**.
3. Apri il link HTTPS di Vercel su iPhone in Safari e scegli **Condividi → Aggiungi alla schermata Home**.

Non sono necessarie variabili d'ambiente né Supabase.

## Importante

Gli eventi vengono salvati in `localStorage` del browser: **non si sincronizzano tra dispositivi** e possono andare persi se cancelli i dati del sito. Usa **Esporta backup eventi** per conservare una copia JSON. La PWA richiede una connessione Internet per caricare la pagina (non include cache offline).

Gli orari inseriti come indicativi sono contrassegnati nelle note. Il calendario non effettua prenotazioni né verifica la disponibilità degli eventi.
