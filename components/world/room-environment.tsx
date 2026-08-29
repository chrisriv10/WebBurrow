'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { Color, DoubleSide, Object3D, Shape, type Group, type InstancedMesh } from 'three';
import type { Room } from '@/lib/types';
import { ROOM_LAYOUTS, wallSegments } from '@/lib/room-layouts';
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

type WallDetail={segment:ReturnType<typeof wallSegments>[number];index:number;item:number;count:number;kind:'rail'|'inset'};

function WallVisuals({room,height,segments}:{room:Room;height:number;segments:ReturnType<typeof wallSegments>}){
  const main=useRef<InstancedMesh>(null),base=useRef<InstancedMesh>(null),top=useRef<InstancedMesh>(null),detail=useRef<InstancedMesh>(null);
  const details=useMemo(()=>segments.flatMap<WallDetail>((segment,index):WallDetail[]=>{const dx=segment.end[0]-segment.start[0],dz=segment.end[1]-segment.start[1],length=Math.hypot(dx,dz);if(length<=3)return[];if(room.appearance.wall==='navy-panel')return Array.from({length:Math.max(1,Math.floor(length/2.2))},(_,item)=>({segment,index,item,count:Math.max(1,Math.floor(length/2.2)),kind:'rail'}));if(room.appearance.wall==='soft-slate')return[{segment,index,item:0,count:1,kind:'inset'}];return[];}),[room.appearance.wall,segments]);
  useLayoutEffect(()=>{
    const temp=new Object3D(),wallColor=WALL_COLORS[room.appearance.wall];
    segments.forEach((segment,index)=>{const dx=segment.end[0]-segment.start[0],dz=segment.end[1]-segment.start[1],length=Math.hypot(dx,dz),rotation=-Math.atan2(dz,dx),x=(segment.start[0]+segment.end[0])/2,z=(segment.start[1]+segment.end[1])/2;const place=(mesh:InstancedMesh|null,y:number,scale:[number,number,number],offset=0)=>{if(!mesh)return;temp.position.set(x+Math.sin(rotation)*offset,y,z+Math.cos(rotation)*offset);temp.rotation.set(0,rotation,0);temp.scale.set(...scale);temp.updateMatrix();mesh.setMatrixAt(index,temp.matrix);};place(main.current,height/2,[length,height,.22]);place(base.current,.18,[length,.24,.12],.14);place(top.current,height-.18,[length,.14,.1],.13);main.current?.setColorAt(index,new Color(index%3===0?wallColor:'#171e2b'));});
    for(const mesh of [main.current,base.current,top.current])if(mesh){mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;}
    details.forEach((item,index)=>{if(!detail.current)return;const {segment}=item,dx=segment.end[0]-segment.start[0],dz=segment.end[1]-segment.start[1],length=Math.hypot(dx,dz),rotation=-Math.atan2(dz,dx),centerX=(segment.start[0]+segment.end[0])/2,centerZ=(segment.start[1]+segment.end[1])/2,along=item.kind==='rail'?-length/2+(item.item+1)*length/(item.count+1):0;temp.position.set(centerX+Math.cos(rotation)*along+Math.sin(rotation)*.13,item.kind==='rail'?height/2+.15:height/2+.25,centerZ-Math.sin(rotation)*along+Math.cos(rotation)*.13);temp.rotation.set(0,rotation,0);temp.scale.set(item.kind==='rail'?.055:Math.max(.5,length-1.1),item.kind==='rail'?height-.75:height*.48,item.kind==='rail'?.04:.045);temp.updateMatrix();detail.current.setMatrixAt(index,temp.matrix);detail.current.setColorAt(index,new Color(item.kind==='rail'?'#33495a':'#242b3b'));});
    if(detail.current){detail.current.instanceMatrix.needsUpdate=true;if(detail.current.instanceColor)detail.current.instanceColor.needsUpdate=true;}
  },[details,height,room.appearance.wall,segments]);
  return <group>
    <instancedMesh ref={main} args={[undefined,undefined,segments.length]} receiveShadow><boxGeometry/><meshStandardMaterial color="#ffffff" roughness={.95}/></instancedMesh>
    <instancedMesh ref={base} args={[undefined,undefined,segments.length]}><boxGeometry/><meshStandardMaterial color="#343d4c" roughness={.8} metalness={.08}/></instancedMesh>
    <instancedMesh ref={top} args={[undefined,undefined,segments.length]}><boxGeometry/><meshStandardMaterial color="#2d3543" roughness={.84}/></instancedMesh>
    {details.length>0&&<instancedMesh ref={detail} args={[undefined,undefined,details.length]}><boxGeometry/><meshStandardMaterial color="#ffffff" roughness={.96}/></instancedMesh>}
  </group>;
}

function Architecture({room}:{room:Room}){
  const layout=ROOM_LAYOUTS[room.template],shape=useMemo(()=>floorShape(layout.outline),[layout.outline]),segments=useMemo(()=>wallSegments(layout),[layout]);
  const width=layout.bounds.maxX-layout.bounds.minX,depth=layout.bounds.maxZ-layout.bounds.minZ,centerZ=(layout.bounds.minZ+layout.bounds.maxZ)/2;
  return <RigidBody type="fixed" colliders={false}>
    <mesh rotation={[-Math.PI/2,0,0]} receiveShadow><shapeGeometry args={[shape]}/><meshStandardMaterial color={FLOOR_COLORS[room.appearance.floor]} roughness={room.appearance.floor==='technical'?.84:.98} metalness={room.appearance.floor==='technical'?.04:0}/></mesh>
    <mesh position={[0,layout.ceilingHeight,0]} rotation={[Math.PI/2,0,0]}><shapeGeometry args={[shape]}/><meshStandardMaterial color="#0e1420" roughness={1} side={DoubleSide}/></mesh>
    <WallVisuals room={room} height={layout.ceilingHeight} segments={segments}/>
    {segments.map(segment=>{const dx=segment.end[0]-segment.start[0],dz=segment.end[1]-segment.start[1],length=Math.hypot(dx,dz),rotation=-Math.atan2(dz,dx);return <group key={`${segment.start.join(':')}-${segment.end.join(':')}`} position={[(segment.start[0]+segment.end[0])/2,layout.ceilingHeight/2,(segment.start[1]+segment.end[1])/2]} rotation={[0,rotation,0]}><CuboidCollider args={[length/2,layout.ceilingHeight/2,.12]}/></group>;})}
    {layout.obstacles.map(obstacle=><group key={obstacle.id} position={[obstacle.x,.65,obstacle.z]} rotation={[0,obstacle.rotation??0,0]}><CuboidCollider args={[obstacle.width/2,.65,obstacle.depth/2]}/></group>)}
    <CuboidCollider args={[width/2,.18,depth/2]} position={[0,-.18,centerZ]}/>
  </RigidBody>;
}

function FloorTreatment({room}:{room:Room}){
  const layout=ROOM_LAYOUTS[room.template],width=layout.bounds.maxX-layout.bounds.minX,depth=layout.bounds.maxZ-layout.bounds.minZ,centerZ=(layout.bounds.minZ+layout.bounds.maxZ)/2;
  const positions=useMemo(()=>{const xs=room.appearance.floor==='dark-wood'?Array.from({length:9},(_,i)=>-width/2+(i+1)*width/10):[-3.2,0,3.2];return new Float32Array(xs.flatMap(x=>[x,.018,centerZ-depth*.4,x,.018,centerZ+depth*.4]));},[centerZ,depth,room.appearance.floor,width]);
  if(room.appearance.floor==='dark-wood'||room.appearance.floor==='technical')return <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><lineBasicMaterial color={room.appearance.floor==='technical'?room.accent:'#554048'} transparent opacity={room.appearance.floor==='technical'?.22:.19}/></lineSegments>;
  return <mesh position={[0,.018,centerZ+.6]} rotation={[-Math.PI/2,0,.04]} receiveShadow><circleGeometry args={[Math.min(width,depth)*.29,56]}/><meshStandardMaterial color="#302b42" roughness={1}/></mesh>;
}

function CeilingFan({room}:{room:Room}){
  const fan=useRef<Group>(null),blades=useRef<InstancedMesh>(null),reduced=useBurrow(state=>state.preferences.reducedEffects);
  useLayoutEffect(()=>{const temp=new Object3D();[0,1,2].forEach(index=>{const angle=index*Math.PI*2/3;temp.position.set(Math.cos(angle)*.85,0,-Math.sin(angle)*.85);temp.rotation.set(0,angle,0);temp.scale.set(1.75,.065,.25);temp.updateMatrix();blades.current?.setMatrixAt(index,temp.matrix);});if(blades.current)blades.current.instanceMatrix.needsUpdate=true;},[]);
  useFrame((_state,delta)=>{if(fan.current&&!reduced&&!document.hidden)fan.current.rotation.y+=delta*.34;});
  if(room.template==='studio')return null;
  return <group ref={fan} position={[room.template==='den'?-1.1:1.6,ROOM_LAYOUTS[room.template].ceilingHeight-.22,2]}>
    <mesh><cylinderGeometry args={[.14,.14,.18,14]}/><meshStandardMaterial color="#4c5565" roughness={.76}/></mesh>
    <instancedMesh ref={blades} args={[undefined,undefined,3]}><boxGeometry/><meshStandardMaterial color="#303747" roughness={.88}/></instancedMesh>
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
