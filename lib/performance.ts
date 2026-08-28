export type WebBurrowPerformanceSnapshot={
  frames:number;
  averageFrameMs:number;
  p95FrameMs:number;
  drawCalls:number;
  sceneObjects:number;
  lights:number;
  physicsBodies:number;
  miniBurrowUpdates:number;
  indexedDbWrites:number;
  integrationRefreshes:number;
  reactRenders:Record<string,number>;
  hidden:boolean;
};

const samples:number[]=[];
const counters={drawCalls:0,sceneObjects:0,lights:0,physicsBodies:0,miniBurrowUpdates:0,indexedDbWrites:0,integrationRefreshes:0,reactRenders:{} as Record<string,number>,hidden:false};

export function recordWorldFrame(frameMs:number,drawCalls:number,sceneObjects:number,lights:number,physicsBodies:number){
  if(counters.hidden)return;
  samples.push(frameMs);if(samples.length>360)samples.shift();
  counters.drawCalls=drawCalls;counters.sceneObjects=sceneObjects;counters.lights=lights;counters.physicsBodies=physicsBodies;
}
export function recordMiniBurrowUpdate(){if(!counters.hidden)counters.miniBurrowUpdates+=1;}
export function recordIndexedDbWrite(){counters.indexedDbWrites+=1;}
export function recordIntegrationRefresh(){counters.integrationRefreshes+=1;}
export function recordReactRender(name:string){counters.reactRenders[name]=(counters.reactRenders[name]??0)+1;}
export function setPerformanceHidden(hidden:boolean){counters.hidden=hidden;}
export function performanceSnapshot():WebBurrowPerformanceSnapshot{
  const ordered=[...samples].sort((a,b)=>a-b);const total=samples.reduce((sum,value)=>sum+value,0);
  return{frames:samples.length,averageFrameMs:samples.length?Number((total/samples.length).toFixed(2)):0,p95FrameMs:ordered.length?Number(ordered[Math.min(ordered.length-1,Math.ceil(ordered.length*.95)-1)].toFixed(2)):0,...counters,reactRenders:{...counters.reactRenders}};
}

declare global {interface Window{__WEBBURROW_METRICS__?:()=>WebBurrowPerformanceSnapshot}}
if(typeof window!=='undefined')window.__WEBBURROW_METRICS__=performanceSnapshot;
