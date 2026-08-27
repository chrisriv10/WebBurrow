'use client';

import { Canvas, type ThreeEvent, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PointerLockControls, RoundedBox, Sparkles, Text } from '@react-three/drei';
import { CapsuleCollider, Physics, RigidBody, type RapierRigidBody } from '@react-three/rapier';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MathUtils, Vector3, type Group } from 'three';
import type { BookmarkObject, Room } from '@/lib/types';
import { useBurrow } from '@/store/use-burrow';
import { playerTelemetry } from '@/world/telemetry';

const THEMES={
  den:{background:'#090b18',floor:'#1b1c2d',wall:'#121527',rug:'#302642',warm:'#ffb46c',cool:'#756cff'},
  studio:{background:'#07101a',floor:'#13212b',wall:'#0f1b27',rug:'#173648',warm:'#f2ca86',cool:'#5ec7dc'},
  lounge:{background:'#130b16',floor:'#241728',wall:'#201322',rug:'#4a2535',warm:'#ff8c63',cool:'#b176ff'},
};

function PlayerController({room,enabled}:{room:Room;enabled:boolean}) {
  const body=useRef<RapierRigidBody>(null); const keys=useRef(new Set<string>()); const velocity=useRef(new Vector3()); const vertical=useRef(0); const lastTeleport=useRef(-1); const {camera}=useThree();
  const teleportNonce=useBurrow(s=>s.teleportNonce); const teleportTarget=useBurrow(s=>s.teleportTarget);
  useEffect(()=>{const down=(e:KeyboardEvent)=>{keys.current.add(e.code);if(e.code==='Space')e.preventDefault();};const up=(e:KeyboardEvent)=>keys.current.delete(e.code);window.addEventListener('keydown',down);window.addEventListener('keyup',up);return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};},[]);
  useFrame((_,delta)=>{
    const rigid=body.current;if(!rigid)return;
    if(lastTeleport.current!==teleportNonce){lastTeleport.current=teleportNonce;rigid.setNextKinematicTranslation({x:teleportTarget[0],y:teleportTarget[1],z:teleportTarget[2]});camera.position.set(teleportTarget[0],teleportTarget[1]+.8,teleportTarget[2]);velocity.current.set(0,0,0);return;}
    const pos=rigid.translation();const forward=new Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new Vector3().crossVectors(forward,camera.up).normalize();const desired=new Vector3();
    if(enabled){if(keys.current.has('KeyW'))desired.add(forward);if(keys.current.has('KeyS'))desired.sub(forward);if(keys.current.has('KeyD'))desired.add(right);if(keys.current.has('KeyA'))desired.sub(right);}
    if(desired.lengthSq())desired.normalize().multiplyScalar(keys.current.has('ShiftLeft')?5.6:4.25);
    const smoothing=1-Math.exp(-delta*(desired.lengthSq()?11:8));velocity.current.lerp(desired,smoothing);
    const grounded=pos.y<=1.101;if(grounded){vertical.current=Math.max(0,vertical.current);if(enabled&&keys.current.has('Space')){vertical.current=6.2;keys.current.delete('Space');}}else vertical.current-=18*delta;
    const x=MathUtils.clamp(pos.x+velocity.current.x*delta,-8.15,8.15);const z=MathUtils.clamp(pos.z+velocity.current.z*delta,-9.3,9.2);const y=Math.max(1.1,pos.y+vertical.current*delta);if(y===1.1)vertical.current=0;
    rigid.setNextKinematicTranslation({x,y,z});camera.position.set(x,y+.82,z);playerTelemetry.position=[x,y,z];
  });
  return <RigidBody ref={body} type="kinematicPosition" colliders={false} position={room.spawn} enabledRotations={[false,false,false]}><CapsuleCollider args={[.5,.35]}/></RigidBody>;
}

function WebsiteVisual({object,selected,near,onBeginDrag}:{object:BookmarkObject;selected:boolean;near:boolean;onBeginDrag:(id:string)=>void}) {
  const editMode=useBurrow(s=>s.editMode);const setSelected=useBurrow(s=>s.setSelected);const openSite=useBurrow(s=>s.openSite);const group=useRef<Group>(null);
  useFrame(({clock})=>{if(group.current&&object.archetype==='pedestal')group.current.position.y=Math.sin(clock.elapsedTime*1.2+object.position[0])*.045;});
  const screen=<mesh position={[0,1.35,.36]}><planeGeometry args={object.archetype==='tv'?[2.25,1.2]:[1.35,.78]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={selected?2:1} toneMapped={false}/></mesh>;
  const click=(event:ThreeEvent<MouseEvent>)=>{event.stopPropagation();if(editMode){setSelected(object.id);onBeginDrag(object.id);}else openSite(object.id);};
  return <group position={object.position} rotation={[0,object.rotation,0]} onPointerDown={click}>
    <group ref={group}>{object.archetype==='terminal'&&<><RoundedBox args={[1.65,1.1,.5]} position={[0,1.3,0]} radius={.1}><meshStandardMaterial color="#171a27" metalness={.55}/></RoundedBox>{screen}<mesh position={[0,.42,0]}><cylinderGeometry args={[.18,.3,.75,8]}/><meshStandardMaterial color="#25283a"/></mesh></>}
    {object.archetype==='tv'&&<><RoundedBox args={[2.55,1.55,.42]} position={[0,1.35,0]} radius={.14}><meshStandardMaterial color="#161724" metalness={.48}/></RoundedBox>{screen}<mesh position={[0,.36,0]}><boxGeometry args={[1.4,.25,.65]}/><meshStandardMaterial color="#252338"/></mesh></>}
    {object.archetype==='book'&&<group position={[0,.8,0]} rotation={[0,0,-.08]}><RoundedBox args={[1.05,1.65,.36]} radius={.08}><meshStandardMaterial color={object.color} roughness={.7}/></RoundedBox><mesh position={[0,0,.2]}><planeGeometry args={[.82,1.4]}/><meshStandardMaterial color="#171629"/></mesh></group>}
    {object.archetype==='poster'&&<><mesh position={[0,1.35,0]}><boxGeometry args={[1.4,2.25,.16]}/><meshStandardMaterial color="#242134"/></mesh><mesh position={[0,1.35,.09]}><planeGeometry args={[1.18,2.02]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={.55}/></mesh></>}
    {object.archetype==='arcade'&&<><mesh position={[0,.85,0]}><boxGeometry args={[1.35,1.7,1.05]}/><meshStandardMaterial color="#252036"/></mesh><mesh position={[0,1.55,-.1]} rotation={[-.2,0,0]}><boxGeometry args={[1.3,1.0,.75]}/><meshStandardMaterial color="#211c31"/></mesh><mesh position={[0,1.55,.31]} rotation={[-.2,0,0]}><planeGeometry args={[1.02,.62]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={1}/></mesh></>}
    {object.archetype==='pedestal'&&<><mesh position={[0,.45,0]}><cylinderGeometry args={[.62,.85,.9,8]}/><meshStandardMaterial color="#24243a" metalness={.45}/></mesh><mesh position={[0,1.35,0]}><octahedronGeometry args={[.58,0]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={1.35} transparent opacity={.82}/></mesh></>}</group>
    {(editMode||selected||near)&&<Text position={[0,2.55,.05]} fontSize={.18} maxWidth={2.2} color={selected||near?'#ffffff':'#c9c5d8'} anchorX="center" outlineWidth={.012} outlineColor="#090a12">{object.name}</Text>}
    {selected&&<mesh position={[0,.03,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[.85,1.02,36]}/><meshBasicMaterial color="#8be6ff" transparent opacity={.8}/></mesh>}
  </group>;
}

function Portal({room}:{room:Room}) {
  const rooms=useBurrow(s=>s.rooms);const setCurrentRoom=useBurrow(s=>s.setCurrentRoom);const ring=useRef<Group>(null);
  useFrame((_,d)=>{if(ring.current)ring.current.rotation.z+=d*.08;});
  const go=()=>{const index=rooms.findIndex(r=>r.id===room.id);setCurrentRoom(rooms[(index+1)%rooms.length].id);};
  return <group position={[0,1.75,-9.6]} onClick={go}><group ref={ring}><mesh><torusGeometry args={[1.55,.18,12,48]}/><meshStandardMaterial color={room.accent} emissive={room.accent} emissiveIntensity={1.5}/></mesh><mesh position={[0,0,-.04]}><circleGeometry args={[1.38,48]}/><meshStandardMaterial color="#14152a" emissive={room.accent} emissiveIntensity={.35}/></mesh></group><Text position={[0,2.08,.05]} fontSize={.2} letterSpacing={.1} color="#ded8ff">BURROW LIFT</Text></group>;
}

function RoomDecor({room}:{room:Room}) {
  const theme=THEMES[room.template];const reduced=useBurrow(s=>s.preferences.reducedEffects);const fan=useRef<Group>(null);
  useFrame((_,d)=>{if(fan.current&&!reduced)fan.current.rotation.z-=d*.7;});
  return <><color attach="background" args={[theme.background]}/><fog attach="fog" args={[theme.background,11,31]}/><ambientLight intensity={.48} color={theme.cool}/><directionalLight position={[4,8,5]} intensity={2.15} color="#ffd5ac" castShadow shadow-mapSize={[1024,1024]}/><pointLight position={[-5,2,-4]} intensity={15} distance={9} color={theme.cool}/><pointLight position={[5,2,1]} intensity={11} distance={8} color={theme.warm}/>
    <RigidBody type="fixed"><mesh receiveShadow position={[0,-.25,0]}><boxGeometry args={[18,.5,21]}/><meshStandardMaterial color={theme.floor} roughness={.9}/></mesh><mesh position={[0,4.1,-10.5]} receiveShadow><boxGeometry args={[18,8.2,.45]}/><meshStandardMaterial color={theme.wall}/></mesh><mesh position={[-9,4.1,0]} receiveShadow><boxGeometry args={[.45,8.2,21]}/><meshStandardMaterial color={theme.wall}/></mesh><mesh position={[9,4.1,0]} receiveShadow><boxGeometry args={[.45,8.2,21]}/><meshStandardMaterial color={theme.wall}/></mesh></RigidBody>
    <mesh position={[0,.015,1.4]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[10,6]}/><meshStandardMaterial color={theme.rug} roughness={1}/></mesh>
    <group position={[-6.7,1.2,-7.8]}><mesh position={[0,0,0]}><cylinderGeometry args={[.5,.72,2.4,8]}/><meshStandardMaterial color="#242a37"/></mesh><mesh position={[0,1.55,0]}><dodecahedronGeometry args={[.8,0]}/><meshStandardMaterial color={room.template==='lounge'?'#794a6e':'#44695e'} roughness={.9}/></mesh></group>
    <group ref={fan} position={[0,5.7,-10.15]}>{[0,1,2,3].map(i=><mesh key={i} rotation={[0,0,i*Math.PI/2]} position={[0,0,.1]}><boxGeometry args={[.22,2.1,.12]}/><meshStandardMaterial color="#4e4a68"/></mesh>)}<mesh><cylinderGeometry args={[.3,.3,.3,16]}/><meshStandardMaterial color="#b3a9d8"/></mesh></group>
    <group position={[6.6,3.4,-10.18]}><mesh><boxGeometry args={[2.8,2.2,.1]}/><meshStandardMaterial color="#09111f" emissive={theme.cool} emissiveIntensity={.18}/></mesh><mesh position={[0,0,.07]}><planeGeometry args={[2.45,1.85]}/><meshStandardMaterial color="#15283c" emissive="#2f5680" emissiveIntensity={.32}/></mesh></group>
    {!reduced&&<Sparkles count={32} scale={[16,6,18]} size={1.1} speed={.14} opacity={.25} color="#c9c1ff"/>}
  </>;
}

function Scene({onLockChange}:{onLockChange:(locked:boolean)=>void}) {
  const rooms=useBurrow(s=>s.rooms);const currentRoomId=useBurrow(s=>s.currentRoomId);const objects=useBurrow(s=>s.objects);const editMode=useBurrow(s=>s.editMode);const selectedId=useBurrow(s=>s.selectedId);const nearObjectId=useBurrow(s=>s.nearObjectId);const setSelected=useBurrow(s=>s.setSelected);const beginObjectEdit=useBurrow(s=>s.beginObjectEdit);const placeObject=useBurrow(s=>s.placeObject);const setNearObject=useBurrow(s=>s.setNearObject);const openSite=useBurrow(s=>s.openSite);const returnToSpawn=useBurrow(s=>s.returnToSpawn);const setCurrentRoom=useBurrow(s=>s.setCurrentRoom);const [dragging,setDragging]=useState<string|null>(null);
  const room=rooms.find(r=>r.id===currentRoomId)||rooms[0];const roomObjects=useMemo(()=>objects.filter(o=>o.roomId===room?.id),[objects,room?.id]);
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if((e.target as HTMLElement)?.matches('input,textarea,select'))return;if(e.code==='Home')returnToSpawn();if(e.code==='KeyE'&&!editMode){const near=useBurrow.getState().nearObjectId;if(near==='__portal'){const index=rooms.findIndex(r=>r.id===currentRoomId);setCurrentRoom(rooms[(index+1)%rooms.length].id);}else if(near)openSite(near);}};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);},[currentRoomId,editMode,openSite,returnToSpawn,rooms,setCurrentRoom]);
  useFrame(()=>{if(editMode||!room)return;const [x,,z]=playerTelemetry.position;let nearest:string|null=null;let distance=3.15;for(const object of roomObjects){const d=Math.hypot(object.position[0]-x,object.position[2]-z);if(d<distance){distance=d;nearest=object.id;}}if(Math.hypot(x,z+9.2)<2.7)nearest='__portal';if(nearest!==useBurrow.getState().nearObjectId)setNearObject(nearest);});
  if(!room)return null;
  const floorMove=(event:ThreeEvent<PointerEvent>)=>{if(dragging)placeObject(dragging,[event.point.x,0,event.point.z]);};
  return <><RoomDecor room={room}/><Portal room={room}/><mesh position={[0,.025,0]} rotation={[-Math.PI/2,0,0]} onPointerMove={floorMove} onPointerUp={()=>setDragging(null)} onPointerDown={()=>{if(editMode&&!dragging)setSelected(null);}}><planeGeometry args={[16.3,18.6]}/><meshBasicMaterial transparent opacity={0}/></mesh>
    {roomObjects.map(o=><WebsiteVisual key={o.id} object={o} selected={o.id===selectedId} near={o.id===nearObjectId} onBeginDrag={id=>{beginObjectEdit(id);setDragging(id);}}/>)}
    <PlayerController room={room} enabled={!editMode}/>{editMode?<OrbitControls makeDefault target={[0,0,-1]} maxPolarAngle={Math.PI/2.2} minDistance={5} maxDistance={20}/>:<PointerLockControls makeDefault selector="#world-surface" onLock={()=>onLockChange(true)} onUnlock={()=>onLockChange(false)}/>}</>;
}

export function BurrowWorld({onLockChange}:{onLockChange:(locked:boolean)=>void}) {
  const reduced=useBurrow(s=>s.preferences.reducedEffects);
  return <Canvas shadows={!reduced} dpr={reduced?[1,1]:[1,1.5]} camera={{position:[0,2,7],fov:66}} gl={{antialias:true,powerPreference:'high-performance'}}><Physics gravity={[0,-18,0]} timeStep="vary"><Scene onLockChange={onLockChange}/></Physics></Canvas>;
}
