'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Sparkles, Text } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import type { Group } from 'three';
import type { Room } from '@/lib/types';
import { useBurrow } from '@/store/use-burrow';
import { ROOM_THEMES, type RoomTheme } from './theme';
import { localAsset, threeText } from '@/lib/assets';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');
const MONO=localAsset('fonts/ibm-plex-mono-latin-500-normal.woff');

function Architecture({theme}:{theme:RoomTheme}) {
  return <RigidBody type="fixed" colliders={false}>
    <mesh receiveShadow position={[0,-.2,0]}><boxGeometry args={[18,.4,21]}/><meshStandardMaterial color={theme.floor} roughness={.92}/></mesh>
    <mesh receiveShadow position={[0,-.005,0]}><boxGeometry args={[16.9,.035,19.7]}/><meshStandardMaterial color={theme.floorAlt} roughness={.88}/></mesh>
    <mesh receiveShadow position={[0,3.25,-10.35]}><boxGeometry args={[18,6.5,.4]}/><meshStandardMaterial color={theme.wall} roughness={.86}/></mesh>
    <mesh receiveShadow position={[-8.8,3.25,0]}><boxGeometry args={[.4,6.5,21]}/><meshStandardMaterial color={theme.wallAlt} roughness={.88}/></mesh>
    <mesh receiveShadow position={[8.8,3.25,0]}><boxGeometry args={[.4,6.5,21]}/><meshStandardMaterial color={theme.wallAlt} roughness={.88}/></mesh>
    <mesh receiveShadow position={[-5.85,3.25,10.35]}><boxGeometry args={[6.3,6.5,.4]}/><meshStandardMaterial color={theme.wall} roughness={.86}/></mesh>
    <mesh receiveShadow position={[5.85,3.25,10.35]}><boxGeometry args={[6.3,6.5,.4]}/><meshStandardMaterial color={theme.wall} roughness={.86}/></mesh>
    <mesh receiveShadow position={[0,6.45,0]}><boxGeometry args={[18,.3,21]}/><meshStandardMaterial color="#0d111c" roughness={.95}/></mesh>
    <CuboidCollider args={[9,.2,10.5]} position={[0,-.2,0]}/><CuboidCollider args={[9,3.25,.2]} position={[0,3.25,-10.35]}/><CuboidCollider args={[.2,3.25,10.5]} position={[-8.8,3.25,0]}/><CuboidCollider args={[.2,3.25,10.5]} position={[8.8,3.25,0]}/><CuboidCollider args={[3.15,3.25,.2]} position={[-5.85,3.25,10.35]}/><CuboidCollider args={[3.15,3.25,.2]} position={[5.85,3.25,10.35]}/>
    {[-8.45,8.45].map(x=><mesh key={`base-side-${x}`} position={[x,.32,0]}><boxGeometry args={[.18,.42,20.2]}/><meshStandardMaterial color={theme.trim} roughness={.75}/></mesh>)}
    <mesh position={[0,.32,-10.08]}><boxGeometry args={[17,.42,.18]}/><meshStandardMaterial color={theme.trim} roughness={.75}/></mesh>
    {[-6,-2,2,6].map(x=><mesh key={`beam-${x}`} position={[x,6.18,0]}><boxGeometry args={[.16,.28,20.2]}/><meshStandardMaterial color={theme.trim} roughness={.72}/></mesh>)}
    {[-6.2,6.2].map(x=><mesh key={`wall-column-${x}`} position={[x,3.4,-10.04]}><boxGeometry args={[.22,5.8,.18]}/><meshStandardMaterial color={theme.trim} roughness={.72}/></mesh>)}
  </RigidBody>;
}

function CeilingLights({theme,template}:{theme:RoomTheme;template:Room['template']}) {
  const count=template==='studio'?5:3;
  return <group>{Array.from({length:count},(_,index)=>{
    const x=(index-(count-1)/2)*(template==='studio'?2.75:3.7);
    return <group key={x} position={[x,6.13,template==='lounge' ? .8 : 0]}><RoundedBox args={[template==='studio'?2.05:1.65,.1,.3]} radius={.04}><meshStandardMaterial color="#252b3a" roughness={.55}/></RoundedBox><mesh position={[0,-.065,0]}><boxGeometry args={[template==='studio'?1.75:1.35,.025,.12]}/><meshBasicMaterial color={template==='den'?theme.warm:theme.cool} transparent opacity={.75}/></mesh></group>;
  })}</group>;
}

function WindowScape({theme,variant,condition}:{theme:RoomTheme;variant:Room['template'];condition?:string}) {
  const lights=variant==='studio'?['#55a9c6','#7ec1d2','#334e67']:variant==='lounge'?['#8a6fa2','#c29bb2','#455376']:['#6676a8','#a1a8c7','#3c527e'];
  const sky=condition==='storm'?'#25223c':condition==='rain'?'#283b50':condition==='snow'?'#7890a6':condition==='clear'?'#416c99':theme.sky;
  return <group position={[variant==='lounge'?-5.25:5.25,3.5,-10.08]}>
    <RoundedBox args={[5.3,3.45,.18]} radius={.08}><meshStandardMaterial color="#252a39" roughness={.62}/></RoundedBox>
    <mesh position={[0,0,.1]}><planeGeometry args={[4.8,3.0]}/><meshBasicMaterial color={sky}/></mesh>
    <mesh position={[0,-1.18,.13]}><planeGeometry args={[4.7,.58]}/><meshBasicMaterial color={theme.horizon} transparent opacity={.24}/></mesh>
    {Array.from({length:11},(_,index)=>{const x=-2.1+(index%6)*.82;const y=-.95+Math.floor(index/6)*.48;const height=.25+(index%4)*.16;return <mesh key={index} position={[x,y,.16]}><boxGeometry args={[.48,height,.025]}/><meshBasicMaterial color={lights[index%lights.length]} transparent opacity={.55}/></mesh>;})}
    {Array.from({length:13},(_,index)=><mesh key={`star-${index}`} position={[-2.1+(index*1.27)%4.3,-.1+((index*1.91)%1.25),.17]}><circleGeometry args={[index%3===0 ? .018 : .011,6]}/><meshBasicMaterial color="#d8e5ff" transparent opacity={.52}/></mesh>)}
    <mesh position={[0,0,.19]}><boxGeometry args={[.08,3,.04]}/><meshStandardMaterial color="#3a4052"/></mesh><mesh position={[0,0,.19]}><boxGeometry args={[4.8,.08,.04]}/><meshStandardMaterial color="#3a4052"/></mesh>
  </group>;
}

function LowPolyPlant({position=[0,0,0],scale=1}:{position?:[number,number,number];scale?:number}) {
  const leaves=useRef<Group>(null);const reduced=useBurrow(s=>s.preferences.reducedEffects);
  useFrame(({clock})=>{if(leaves.current&&!reduced&&!document.hidden)leaves.current.rotation.z=Math.sin(clock.elapsedTime*.48+position[0])*.018;});
  return <group position={position} scale={scale}><mesh position={[0,.34,0]} castShadow><cylinderGeometry args={[.38,.3,.68,10]}/><meshStandardMaterial color="#3b3543" roughness={.86}/></mesh><group ref={leaves} position={[0,.72,0]}>{[-.7,-.35,0,.35,.7].map((rotation,index)=><mesh key={rotation} rotation={[0,rotation,index%2 ? .35 : -.35]} position={[Math.sin(rotation)*.18,.24+index%2*.18,Math.cos(rotation)*.12]} castShadow><coneGeometry args={[.28,.92,5]}/><meshStandardMaterial color={index%2?'#3e665b':'#547362'} roughness={.92}/></mesh>)}</group></group>;
}

function Shelf({position,rotation=0,wood,items=6}:{position:[number,number,number];rotation?:number;wood:string;items?:number}) {
  return <group position={position} rotation={[0,rotation,0]}><RoundedBox args={[3.4,.18,.62]} position={[0,.25,0]} radius={.05} castShadow><meshStandardMaterial color={wood} roughness={.78}/></RoundedBox>{[1.05,2.05,3.05].map(y=><RoundedBox key={y} args={[3.4,.14,.62]} position={[0,y,0]} radius={.04} castShadow><meshStandardMaterial color={wood} roughness={.78}/></RoundedBox>)}{[-1.56,1.56].map(x=><mesh key={x} position={[x,1.7,0]} castShadow><boxGeometry args={[.14,3.4,.58]}/><meshStandardMaterial color={wood} roughness={.8}/></mesh>)}{Array.from({length:items},(_,index)=><mesh key={index} position={[-1.22+(index%3)*.82,.64+Math.floor(index/3),.02]} rotation={[0,0,index%2 ? .04 : -.03]}><boxGeometry args={[.18+(index%2)*.08,.62,.42]}/><meshStandardMaterial color={['#667195','#8d667c','#566e75','#9a8667'][index%4]} roughness={.88}/></mesh>)}</group>;
}

function FloorLamp({position,theme}:{position:[number,number,number];theme:RoomTheme}) {
  return <group position={position}><mesh position={[0,.08,0]}><cylinderGeometry args={[.48,.56,.16,16]}/><meshStandardMaterial color="#303645" roughness={.58}/></mesh><mesh position={[0,1.48,0]}><cylinderGeometry args={[.045,.055,2.85,10]}/><meshStandardMaterial color="#596071" metalness={.22}/></mesh><mesh position={[0,2.9,0]}><cylinderGeometry args={[.58,.32,.72,12,1,true]}/><meshStandardMaterial color="#b9a88f" emissive={theme.warm} emissiveIntensity={.18} roughness={.82} side={2}/></mesh><pointLight position={[0,2.75,0]} color={theme.warm} intensity={5.2} distance={5.5} decay={2}/></group>;
}

function ClockDisplay({position,rotation=0,color}:{position:[number,number,number];rotation?:number;color:string}) {
  const [time,setTime]=useState('');
  useEffect(()=>{const tick=()=>setTime(new Intl.DateTimeFormat(undefined,{hour:'2-digit',minute:'2-digit'}).format(new Date()));tick();const id=setInterval(tick,30000);return()=>clearInterval(id);},[]);
  return <group position={position} rotation={[0,rotation,0]}><RoundedBox args={[1.7,.7,.15]} radius={.08}><meshStandardMaterial color="#101722" roughness={.55}/></RoundedBox><Text font={MONO} position={[0,.02,.085]} fontSize={.28} color={color}>{time}</Text></group>;
}

function NotesBoard({position,rotation=0}:{position:[number,number,number];rotation?:number}) {
  const note=useBurrow(s=>s.note);const setTrayOpen=useBurrow(s=>s.setTrayOpen);
  const preview=(note||'Pin a thought in the Burrow Tray.').replace(/\s+/g,' ').slice(0,64);
  const safePreview=threeText(preview);
  return <group position={position} rotation={[0,rotation,0]} onClick={()=>setTrayOpen(true)} userData={{interactionId:'__notes'}}><RoundedBox args={[2.7,1.7,.16]} radius={.08} castShadow><meshStandardMaterial color="#34303b" roughness={.94}/></RoundedBox><RoundedBox args={[2.3,1.3,.05]} position={[0,0,.105]} radius={.035}><meshStandardMaterial color="#d4c7ad" roughness={1}/></RoundedBox><Text font={MONO} position={[-.94,.42,.14]} anchorX="left" maxWidth={1.9} fontSize={.085} lineHeight={1.45} color="#3b3540">POCKET NOTE{`\n\n`}{safePreview}</Text><mesh position={[.92,.48,.16]}><circleGeometry args={[.05,12]}/><meshBasicMaterial color="#7f6fa6"/></mesh></group>;
}

function DenFurniture({theme}:{theme:RoomTheme}) {
  return <><RigidBody type="fixed" colliders={false}><group position={[-6.4,0,2.15]} rotation={[0,Math.PI/2,0]}><RoundedBox args={[4.1,.72,1.7]} position={[0,.52,0]} radius={.22} castShadow receiveShadow><meshStandardMaterial color={theme.fabric} roughness={.94}/></RoundedBox><RoundedBox args={[4.1,1.35,.42]} position={[0,1.15,-.62]} radius={.18} castShadow><meshStandardMaterial color="#343a50" roughness={.96}/></RoundedBox>{[-1.25,0,1.25].map((x,index)=><RoundedBox key={x} args={[1.08,.42,1.35]} position={[x,.92,.08]} radius={.16}><meshStandardMaterial color={index===1?'#41465b':'#383e54'} roughness={1}/></RoundedBox>)}</group><CuboidCollider args={[.9,.72,2.15]} position={[-6.4,.72,2.15]}/><group position={[6.55,0,2.5]} rotation={[0,-Math.PI/2,0]}><RoundedBox args={[3.6,.18,1.25]} position={[0,1.12,0]} radius={.06} castShadow><meshStandardMaterial color={theme.wood} roughness={.75}/></RoundedBox>{[-1.45,1.45].map(x=><mesh key={x} position={[x,.56,0]}><boxGeometry args={[.15,1.12,1.05]}/><meshStandardMaterial color="#30313a"/></mesh>)}</group><CuboidCollider args={[.72,.62,1.85]} position={[6.55,.62,2.5]}/></RigidBody><Shelf position={[-6.45,0,-8.45]} wood={theme.wood}/><FloorLamp position={[-4.3,0,4.3]} theme={theme}/><LowPolyPlant position={[7.1,0,-7.85]} scale={1.15}/><NotesBoard position={[8.52,3.35,-1.2]} rotation={-Math.PI/2}/><ClockDisplay position={[-8.51,4.8,-2.1]} rotation={Math.PI/2} color={theme.cool}/><mesh position={[0,.025,2.3]} rotation={[-Math.PI/2,0,0]} receiveShadow><ringGeometry args={[2.1,4.7,48]}/><meshStandardMaterial color={theme.rug} roughness={1}/></mesh></>;
}

function StudioFurniture({theme}:{theme:RoomTheme}) {
  return <><RigidBody type="fixed" colliders={false}><group position={[-6.65,0,.8]} rotation={[0,Math.PI/2,0]}><RoundedBox args={[5.2,.18,1.15]} position={[0,1.08,0]} radius={.04} castShadow><meshStandardMaterial color="#28333a" roughness={.68} metalness={.12}/></RoundedBox>{[-2.2,0,2.2].map(x=><mesh key={x} position={[x,.52,0]}><boxGeometry args={[.12,1.05,.9]}/><meshStandardMaterial color="#34444c"/></mesh>)}</group><CuboidCollider args={[.68,.62,2.65]} position={[-6.65,.62,.8]}/><group position={[6.75,0,1.3]}><RoundedBox args={[1.35,4.2,1.35]} position={[0,2.1,0]} radius={.08} castShadow><meshStandardMaterial color="#17242c" roughness={.62}/></RoundedBox>{[.65,1.35,2.05,2.75,3.45].map((y,index)=><group key={y}><mesh position={[0,y,.69]}><boxGeometry args={[1.05,.34,.04]}/><meshStandardMaterial color="#243944" emissive={index%2?theme.cool:'#2e4651'} emissiveIntensity={.16}/></mesh><mesh position={[-.42,y,.72]}><circleGeometry args={[.025,8]}/><meshBasicMaterial color={index%2?'#72d5c0':'#7ba9c9'}/></mesh></group>)}</group><CuboidCollider args={[.78,2.1,.78]} position={[6.75,2.1,1.3]}/></RigidBody><Shelf position={[6.55,0,-7.55]} wood="#26343c" items={4}/><ClockDisplay position={[-8.51,4.85,-2]} rotation={Math.PI/2} color={theme.cool}/><LowPolyPlant position={[-7.35,0,-7.6]} scale={.9}/><group position={[-1.9,5.85,-10.05]}>{[-1.6,0,1.6].map((x,index)=><mesh key={x} position={[x,0,.1]}><boxGeometry args={[1.2,.08,.08]}/><meshBasicMaterial color={index===1?'#b8eaff':theme.cool}/></mesh>)}</group><mesh position={[0,.018,1.2]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[11,6.8]}/><meshStandardMaterial color={theme.rug} roughness={.98}/></mesh>{[-4,-2,0,2,4].map(x=><mesh key={x} position={[x,.027,1.2]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.02,6.4]}/><meshBasicMaterial color="#467080" transparent opacity={.2}/></mesh>)}</>;
}

function Speaker({position}:{position:[number,number,number]}) {return <group position={position}><RoundedBox args={[1,2.65,.8]} position={[0,1.33,0]} radius={.12} castShadow><meshStandardMaterial color="#20222e" roughness={.72}/></RoundedBox>{[.78,1.78].map((y,index)=><group key={y} position={[0,y,.42]}><mesh><cylinderGeometry args={[index ? .27 : .34,index ? .27 : .34,.05,24]}/><meshStandardMaterial color="#11141d"/></mesh><mesh position={[0,.01,.03]}><circleGeometry args={[index ? .14 : .2,24]}/><meshStandardMaterial color="#44475b" roughness={.8}/></mesh></group>)}</group>}

function LoungeFurniture({theme}:{theme:RoomTheme}) {
  return <><RigidBody type="fixed" colliders={false}><group position={[-6.35,0,2.1]} rotation={[0,Math.PI/2,0]}><RoundedBox args={[4.4,.75,1.85]} position={[0,.52,0]} radius={.26} castShadow><meshStandardMaterial color={theme.fabric} roughness={1}/></RoundedBox><RoundedBox args={[4.4,1.28,.42]} position={[0,1.2,-.7]} radius={.2}><meshStandardMaterial color="#40364a" roughness={1}/></RoundedBox>{[-1.35,0,1.35].map((x,index)=><RoundedBox key={x} args={[1.16,.38,1.48]} position={[x,.94,.1]} radius={.18}><meshStandardMaterial color={index===1?'#4a3f54':'#3b3548'} roughness={1}/></RoundedBox>)}</group><CuboidCollider args={[1,.72,2.3]} position={[-6.35,.72,2.1]}/><RoundedBox args={[3.1,.42,1.55]} position={[0,.32,2.15]} radius={.18} castShadow><meshStandardMaterial color={theme.wood} roughness={.76}/></RoundedBox><CuboidCollider args={[1.6,.26,.82]} position={[0,.28,2.15]}/></RigidBody><Speaker position={[-6.85,0,-7.6]}/><Speaker position={[6.85,0,-7.6]}/><FloorLamp position={[6.8,0,4.2]} theme={theme}/><LowPolyPlant position={[7.05,0,-4.8]} scale={1.08}/><NotesBoard position={[8.52,3.25,-1.4]} rotation={-Math.PI/2}/><group position={[5.15,3.65,-10.06]}><RoundedBox args={[4.7,2.45,.12]} radius={.08}><meshStandardMaterial color="#111722" emissive={theme.cool} emissiveIntensity={.08} roughness={.52}/></RoundedBox><mesh position={[0,0,.07]}><planeGeometry args={[4.3,2.05]}/><meshStandardMaterial color="#16243a" emissive={theme.cool} emissiveIntensity={.16} roughness={.5}/></mesh><Text font={MONO} position={[0,0,.12]} fontSize={.14} letterSpacing={.18} color="#8693b8">MEDIA WALL</Text></group><mesh position={[0,.02,1.7]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[4.2,48]}/><meshStandardMaterial color={theme.rug} roughness={1}/></mesh></>;
}

function ActivityShelf({theme}:{theme:RoomTheme}) {
  const objects=useBurrow(s=>s.objects);const activity=useBurrow(s=>s.activity);const setLauncher=useBurrow(s=>s.setLauncher);
  const recent=activity[0]?.name??'No launches yet';const favorites=objects.filter(object=>object.favorite).length;
  const summary=threeText(`${favorites} pinned - ${recent}`);
  return <group position={[-5.9,3.85,-10.02]} onClick={()=>setLauncher(true)} userData={{interactionId:'__favorites'}}><RoundedBox args={[3.15,1.45,.16]} radius={.06}><meshStandardMaterial color="#1b2231" roughness={.75}/></RoundedBox><Text font={MONO} position={[-1.25,.43,.1]} anchorX="left" fontSize={.075} color={theme.cool}>FAVORITES RACK</Text><Text font={FONT} position={[-1.25,.08,.1]} anchorX="left" fontSize={.16} maxWidth={2.5} color="#e7eaf5">{summary}</Text>{[-.92,-.3,.32,.94].map((x,index)=><RoundedBox key={x} args={[.42,.3,.12]} position={[x,-.43,.12]} radius={.04}><meshStandardMaterial color={[theme.cool,'#6b7798','#8f728f','#708c83'][index]} emissive={index===0?theme.cool:'#000000'} emissiveIntensity={.12}/></RoundedBox>)}</group>;
}

export function RoomEnvironment({room}:{room:Room}) {
  const theme=ROOM_THEMES[room.template];const reduced=useBurrow(s=>s.preferences.reducedEffects);const windowEffects=useBurrow(s=>s.preferences.windowEffects);const weather=useBurrow(s=>s.integrationCache.find(item=>item.integrationId==='weather'&&item.cacheKey==='current')?.data as {condition?:string}|undefined);const fan=useRef<Group>(null);const [visible,setVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
  useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  useFrame((_,delta)=>{if(fan.current&&!reduced&&!document.hidden)fan.current.rotation.y+=delta*.85;});
  return <>
    <color attach="background" args={[theme.background]}/><fog attach="fog" args={[theme.background,15,34]}/>
    <hemisphereLight args={[theme.sky,'#080910',1]}/><ambientLight intensity={.52} color="#b7c1e2"/>
    <directionalLight position={[-4,9,6]} intensity={1.8} color="#d4e0ff" castShadow shadow-mapSize={[reduced?512:1024,reduced?512:1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10}/>
    <pointLight position={[-5.5,3.1,1]} intensity={room.template==='den'?8.2:5.8} distance={9} decay={2} color={theme.warm}/><pointLight position={[5,3,-4]} intensity={7.5} distance={10} decay={2} color={theme.cool}/><pointLight position={[0,4.8,5.6]} intensity={10} distance={12} decay={2} color={theme.warm}/>
    <Architecture theme={theme}/><CeilingLights theme={theme} template={room.template}/><WindowScape theme={theme} variant={room.template} condition={weather?.condition}/>{room.template!=='lounge'&&<ActivityShelf theme={theme}/>}
    {room.template==='den'?<DenFurniture theme={theme}/>:room.template==='studio'?<StudioFurniture theme={theme}/>:<LoungeFurniture theme={theme}/>}
    <group ref={fan} position={[0,6.05,2.8]}><mesh><cylinderGeometry args={[.18,.18,.22,12]}/><meshStandardMaterial color="#596078"/></mesh>{[0,1,2].map(index=><RoundedBox key={index} args={[2.15,.08,.32]} position={[1.05,0,0]} rotation={[0,index*Math.PI*2/3,0]} radius={.04}><meshStandardMaterial color="#363b50" roughness={.7}/></RoundedBox>)}</group>
    {!reduced&&visible&&<Sparkles count={20} scale={[16,5.5,18]} size={.65} speed={.08} opacity={.16} color="#b9c9e8"/>}
    {!reduced&&windowEffects&&visible&&(weather?.condition==='rain'||weather?.condition==='storm')&&<Sparkles count={35} position={[5.2,3.5,-9.7]} scale={[4.5,3,1]} size={.45} speed={1.1} opacity={.42} color="#88c9ea"/>}
    {!reduced&&windowEffects&&visible&&weather?.condition==='snow'&&<Sparkles count={28} position={[5.2,3.5,-9.7]} scale={[4.5,3,1]} size={1.15} speed={.28} opacity={.6} color="#eef7ff"/>}
  </>;
}
