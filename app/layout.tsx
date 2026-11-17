import type { Metadata, Viewport } from 'next';
import './style.css';
export const metadata:Metadata={title:'Il mio calendario',description:'Agenda personale',manifest:'/manifest.webmanifest',appleWebApp:{capable:true,title:'Calendario',statusBarStyle:'default'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f8f9fd'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body>{children}</body></html>}
