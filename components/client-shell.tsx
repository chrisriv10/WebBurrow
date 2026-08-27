'use client';

import dynamic from 'next/dynamic';

const WebBurrowApp=dynamic(()=>import('./webburrow-app').then(module=>module.WebBurrowApp),{
  ssr:false,
  loading:()=> <main className="grid h-dvh w-screen place-items-center bg-[#080913]"><div className="text-center"><span className="burrow-loader mx-auto mb-4 block h-11 w-11 rounded-2xl border border-violet-300/30 bg-violet-300/10"/><p className="mono text-[10px] uppercase tracking-[.25em] text-white/38">Opening your Burrow</p></div></main>,
});

export function ClientShell(){return <WebBurrowApp/>;}
