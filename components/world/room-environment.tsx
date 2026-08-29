'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { DoubleSide, Shape, type Group } from 'three';
import type { Room } from '@/lib/types';
import { ROOM_LAYOUTS, wallSegments, type WallSegment } from '@/lib/room-layouts';
import { integrationRegistry } from '@/lib/integrations/registry';
import { useBurrow } from '@/store/use-burrow';
import { localAsset } from '@/lib/assets';
import { ExteriorWindow } from './exterior-weather';
import { FLOOR_COLORS, WALL_COLORS, lightingProfile } from './materials';
import { RoomFurniture } from './props/furniture';
import { ArchitectureDetails } from './rooms/architecture-details';

const MONO=localAsset('fonts/ibm-plex-mono-latin-500-normal.woff');

function floorShape(outline:[number,number][]){
  const shape=new Shape();outline.forEach(([x,z],index)=>index?shape.lineTo(x,-z):shape.moveTo(x,-z));shape.closePath();return shape;
}

function Wall({segment,height,room,index}:{segment:WallSegment;height:number;room:Room;index:number}){
  const dx=segment.end[0]-segment.start[0],dz=segment.end[1]-segment.start[1],length=Math.hypot(dx,dz),rotation=-Math.atan2(dz,dx);
  const position:[number,number,number]=[(segment.start[0]+segment.end[0])/2,height/2,(segment.start[1]+segment.end[1])/2];
  const wallColor=WALL_COLORS[room.appearance.wall];
  return <group position={position} rotation={[0,rotation,0]}>
    <mesh castShadow receiveShadow><boxGeometry args={[length,height,.22]}/><meshStandardMaterial color={index%3===0?wallColor:'#171e2b'} roughness={.95}/></mesh>
    <mesh position={[0,-height/2+.18,.14]}><boxGeometry args={[length,.24,.12]}/><meshStandardMaterial color="#343d4c" roughness={.8} metalness={.08}/></mesh>
    <mesh position={[0,height/2-.18,.13]}><boxGeometry args={[length,.14,.1]}/><meshStandardMaterial color="#2d3543" roughness={.84}/></mesh>
    {room.appearance.wall==='navy-panel'&&length>3&&Array.from({length:Math.max(1,Math.floor(length/2.2))},(_,i)=><mesh key={i} position={[-length/2+1.1+i*2.2,.15,.125]}><boxGeometry args={[.055,height-.75,.04]}/><meshStandardMaterial color="#33495a" roughness={.82}/></mesh>)}
    {room.appearance.wall==='soft-slate'&&length>3&&<RoundedBox args={[Math.max(.5,length-1.1),height*.48,.045]} radius={.06} position={[0,.25,.13]}><meshStandardMaterial color="#242b3b" roughness={.98}/></RoundedBox>}
    <CuboidCollider args={[length/2,height/2,.12]} />
  </group>;
}

function Architecture({room}:{room:Room}){
  const layout=ROOM_LAYOUTS[room.template],shape=useMemo(()=>floorShape(layout.outline),[layout.outline]),segments=useMemo(()=>wallSegments(layout),[layout]);
  const width=layout.bounds.maxX-layout.bounds.minX,depth=layout.bounds.maxZ-layout.bounds.minZ,centerZ=(layout.bounds.minZ+layout.bounds.maxZ)/2;
  return <RigidBody type="fixed" colliders={false}>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><shapeGeometry args={[shape]}/><meshStandardMaterial color={FLOOR_COLORS[room.appearance.floor]} roughness={room.appearance.floor==='technical'?.84:.98} metalness={room.appearance.floor==='technical'?.04:0}/></mesh>
    <mesh position={[0,layout.ceilingHeight,0]} rotation={[Math.PI/2,0,0]}><shapeGeometry args={[shape]}/><meshStandardMaterial color="#0e1420" roughness={1} side={DoubleSide}/></mesh>
    {segments.map((segment,index)=><Wall key={`${segment.start.join(':')}-${segment.end.join(':')}`} segment={segment} height={layout.ceilingHeight} room={room} index={index}/>)}
    {layout.obstacles.map(obstacle=><group key={obstacle.id} position={[obstacle.x,.65,obstacle.z]} rotation={[0,obstacle.rotation??0,0]}><CuboidCollider args={[obstacle.width/2,.65,obstacle.depth/2]}/></group>)}
    <CuboidCollider args={[width/2,.18,depth/2]} position={[0,-.18,centerZ]}/>
  </RigidBody>;
}

function FloorTreatment({room}:{room:Room}){
  const layout=ROOM_LAYOUTS[room.template],width=layout.bounds.maxX-layout.bounds.minX,depth=layout.bounds.maxZ-layout.bounds.minZ,centerZ=(layout.bounds.minZ+layout.bounds.maxZ)/2;
  if(room.appearance.floor==='dark-wood')return <group position={[0,.012,centerZ]}>{Array.from({length:9},(_,i)=><mesh key={i} position={[-width/2+(i+1)*width/10,0,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.018,depth*.82]}/><meshBasicMaterial color="#554048" transparent opacity={.19}/></mesh>)}</group>;
  if(room.appearance.floor==='technical')return <group position={[0,.014,centerZ]}>{[-3.2,0,3.2].map(x=><mesh key={x} position={[x,0,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.024,depth*.75]}/><meshBasicMaterial color={room.accent} transparent opacity={.22}/></mesh>)}</group>;
  return <mesh position={[0,.018,centerZ+.6]} rotation={[-Math.PI/2,0,.04]} receiveShadow><circleGeometry args={[Math.min(width,depth)*.29,56]}/><meshStandardMaterial color="#302b42" roughness={1}/></mesh>;
}

function CeilingFan({room}:{room:Room}){
  const fan=useRef<Group>(null),reduced=useBurrow(state=>state.preferences.reducedEffects);
  useFrame((_state,delta)=>{if(fan.current&&!reduced&&!document.hidden)fan.current.rotation.y+=delta*.34;});
  if(room.template==='studio')return null;
  return <group ref={fan} position={[room.template==='den'?-1.1:1.6,ROOM_LAYOUTS[room.template].ceilingHeight-.22,2]}>
    <mesh><cylinderGeometry args={[.14,.14,.18,14]}/><meshStandardMaterial color="#4c5565" roughness={.76}/></mesh>
    {[0,1,2].map(i=><RoundedBox key={i} args={[1.75,.065,.25]} radius={.045} position={[.85,0,0]} rotation={[0,i*Math.PI*2/3,0]}><meshStandardMaterial color="#303747" roughness={.88}/></RoundedBox>)}
  </group>;
}

export function RoomEnvironment({room}:{room:Room}){
  const layout=ROOM_LAYOUTS[room.template],reduced=useBurrow(state=>state.preferences.reducedEffects),windowEffects=useBurrow(state=>state.preferences.windowEffects);
  const integrationCache=useBurrow(state=>state.integrationCache);
  const weatherWidget=useMemo(()=>integrationRegistry.weather.toWorldWidgets(integrationCache.filter(item=>item.integrationId==='weather'))[0],[integrationCache]);
  const profile=lightingProfile(room.template,room.appearance.lighting),condition=weatherWidget?.secondary?.toLowerCase();
  const [visible,setVisible]=useState(()=>typeof document==='undefined'||!document.hidden);
  useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  const background=condition==='storm'?'#070a11':condition==='rain'?'#08101a':profile.background;
  return <>
    <color attach="background" args={[background]}/><fog attach="fog" args={[background,profile.fogNear,profile.fogFar]}/>
    <hemisphereLight args={[condition==='storm'?'#59677c':profile.sky,profile.ground,profile.fillIntensity]}/>
    <ambientLight intensity={profile.fillIntensity*.62} color={profile.fill}/>
    <directionalLight position={[-5,8,6]} intensity={profile.keyIntensity} color={profile.key} castShadow shadow-mapSize={[reduced?512:1024,reduced?512:1024]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-bias={-.0004}/>
    <pointLight position={[room.template==='den'?4.2:5.6,3.2,4.2]} intensity={profile.practicalIntensity} distance={7.5} decay={2} color={profile.practical}/>
    <Architecture room={room}/><FloorTreatment room={room}/><ArchitectureDetails room={room}/><RoomFurniture room={room} layout={layout}/>
    {layout.windows.map(window=><ExteriorWindow key={window.id} room={room} window={window} widget={weatherWidget} reduced={reduced||!visible} enabled={windowEffects}/>) }
    <CeilingFan room={room}/>
    {room.purpose==='browser-session'&&<group position={[0,.04,4.85]}><mesh rotation={[-Math.PI/2,0,0]}><ringGeometry args={[1.2,1.42,48]}/><meshBasicMaterial color={room.accent} transparent opacity={.34}/></mesh><Text font={MONO} position={[0,.08,-1.6]} rotation={[-Math.PI/2,0,0]} fontSize={.105} color={room.accent}>TEMPORARY SESSION</Text></group>}
  </>;
}
