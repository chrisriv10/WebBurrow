'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PointerLockControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import { ACESFilmicToneMapping, Quaternion, Raycaster, SRGBColorSpace, Vector2 } from 'three';
import { useBurrow } from '@/store/use-burrow';
import { playerTelemetry } from '@/world/telemetry';
import { PlayerController } from './player-controller';
import { RoomEnvironment } from './room-environment';
import { BurrowPortal } from './portal';
import { WebsiteObject } from './website-object';
import { SessionObjectField } from './session-object-field';
import { LiveWidget } from './live-widget';
import { integrationAdapters } from '@/lib/integrations/registry';
import { ROOM_LAYOUTS, wallSegments } from '@/lib/room-layouts';
import { recordWorldFrame } from '@/lib/performance';

function EditCameraRig({active}:{active:boolean}) {
  const {camera}=useThree();const wasActive=useRef(false);const savedQuaternion=useRef(new Quaternion());
  useEffect(()=>{
    if(active&&!wasActive.current){savedQuaternion.current.copy(camera.quaternion);camera.position.set(10.5,10.5,12);camera.lookAt(0,0,-1.2);}
    if(!active&&wasActive.current){const [x,y,z]=playerTelemetry.position;camera.position.set(x,y+.8,z);camera.quaternion.copy(savedQuaternion.current);}
    wasActive.current=active;
  },[active,camera]);
  return null;
}

function PerformanceProbe({physicsBodies}:{physicsBodies:number}){
  const {gl,scene}=useThree();const structural=useRef({frames:0,objects:0,lights:0});
  useFrame((_state,delta)=>{structural.current.frames+=1;if(structural.current.frames%30===1){let objects=0,lights=0;scene.traverse(object=>{objects+=1;if(object.type.endsWith('Light'))lights+=1;});structural.current.objects=objects;structural.current.lights=lights;}recordWorldFrame(delta*1000,gl.info.render.calls,structural.current.objects,structural.current.lights,physicsBodies);});
  return null;
}

function Scene({onLockChange}:{onLockChange:(locked:boolean)=>void}) {
  const rooms=useBurrow(s=>s.rooms);const currentRoomId=useBurrow(s=>s.currentRoomId);const objects=useBurrow(s=>s.objects);const integrationCache=useBurrow(s=>s.integrationCache);const integrationObjects=useBurrow(s=>s.integrationObjects);const editMode=useBurrow(s=>s.editMode);const selectedId=useBurrow(s=>s.selectedId);const nearObjectId=useBurrow(s=>s.nearObjectId);const editPreview=useBurrow(s=>s.editPreview);const setSelected=useBurrow(s=>s.setSelected);const beginObjectEdit=useBurrow(s=>s.beginObjectEdit);const previewObjectPlacement=useBurrow(s=>s.previewObjectPlacement);const commitObjectPlacement=useBurrow(s=>s.commitObjectPlacement);const setNearObject=useBurrow(s=>s.setNearObject);const openSite=useBurrow(s=>s.openSite);const returnToSpawn=useBurrow(s=>s.returnToSpawn);const setCurrentRoom=useBurrow(s=>s.setCurrentRoom);const setTrayOpen=useBurrow(s=>s.setTrayOpen);const setLauncher=useBurrow(s=>s.setLauncher);const openModal=useBurrow(s=>s.openModal);const setLiveDetail=useBurrow(s=>s.setLiveDetail);const [dragging,setDragging]=useState<string|null>(null);
  const {camera,scene}=useThree();const raycaster=useMemo(()=>{const next=new Raycaster();next.far=4.25;return next;},[]);const center=useMemo(()=>new Vector2(0,0),[]);const [locked,setLocked]=useState(false);
  const room=rooms.find(item=>item.id===currentRoomId)||rooms[0];
  const layout=room?ROOM_LAYOUTS[room.template]:ROOM_LAYOUTS.den;
  const roomIndex=room?rooms.findIndex(item=>item.id===room.id):0;
  const destination=rooms[(roomIndex+1)%rooms.length]??room;
  const roomObjects=useMemo(()=>objects.filter(object=>object.roomId===room?.id),[objects,room?.id]);
  const workspace=useBurrow(state=>state.browserWorkspaces.find(item=>item.roomId===room?.id));
  const compactSession=Boolean(!editMode&&workspace&&roomObjects.length>24);
  const liveWidgets=useMemo(()=>integrationAdapters.flatMap(adapter=>adapter.toWorldWidgets(integrationCache.filter(item=>item.integrationId===adapter.id))).filter(widget=>widget.kind!=='weather-window').slice(0,4),[integrationCache]);

  useEffect(()=>{
    const activate=(id:string)=>{
      if(id==='__portal'){if(destination)setCurrentRoom(destination.id);return;}
      if(id==='__notes'){setTrayOpen(true);return;}
      if(id==='__favorites'){setLauncher(true);return;}
      if(id.startsWith('__live:')){setLiveDetail(id.slice('__live:'.length));openModal('live-detail');return;}
      openSite(id);
    };
    const key=(event:KeyboardEvent)=>{
      if(event.target instanceof HTMLElement&&event.target.matches('input,textarea,select,[contenteditable=true]'))return;
      if(event.code==='Home')returnToSpawn();
      if(event.code==='KeyE'&&!editMode){const near=useBurrow.getState().nearObjectId;if(near)activate(near);}
    };
    window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);
  },[destination,editMode,openModal,openSite,returnToSpawn,setCurrentRoom,setLauncher,setLiveDetail,setTrayOpen]);

  useFrame(()=>{
    if(editMode||!room)return;
    raycaster.setFromCamera(center,camera);
    const hits=raycaster.intersectObjects(scene.children,true);
    let interaction:string|null=null;
    for(const hit of hits){let target=hit.object;while(target&&!target.userData.interactionId&&!target.userData.sessionObjectIds&&target.parent)target=target.parent;if(target?.userData.interactionId){interaction=target.userData.interactionId as string;break;}const sessionObjectIds=target?.userData.sessionObjectIds as string[]|undefined;if(sessionObjectIds&&hit.instanceId!==undefined){interaction=sessionObjectIds[hit.instanceId]??null;break;}}
    if(interaction!==useBurrow.getState().nearObjectId)setNearObject(interaction);
  });
  if(!room||!destination)return null;
  const floorMove=(event:ThreeEvent<PointerEvent>)=>{if(dragging&&event.buttons===1)previewObjectPlacement(dragging,[event.point.x,0,event.point.z]);};
  const finishDrag=()=>{if(dragging)commitObjectPlacement(dragging);setDragging(null);};
  return <>
    <RoomEnvironment key={`${room.id}-environment`} room={room}/>
    <BurrowPortal room={room} destination={destination} near={nearObjectId==='__portal'} onTravel={()=>{if(!editMode)setCurrentRoom(destination.id);}}/>
    <mesh position={[0,.028,(layout.bounds.minZ+layout.bounds.maxZ)/2]} rotation={[-Math.PI/2,0,0]} onPointerMove={floorMove} onPointerUp={finishDrag} onPointerDown={()=>{if(editMode&&!dragging)setSelected(null);}}><planeGeometry args={[layout.bounds.maxX-layout.bounds.minX,layout.bounds.maxZ-layout.bounds.minZ]}/><meshBasicMaterial transparent opacity={0}/></mesh>
    {editMode&&<gridHelper args={[Math.max(layout.bounds.maxX-layout.bounds.minX,layout.bounds.maxZ-layout.bounds.minZ),32,'#5f8798','#273442']} position={[0,.035,(layout.bounds.minZ+layout.bounds.maxZ)/2]}/>}
    {compactSession&&workspace?<SessionObjectField objects={roomObjects} workspace={workspace} selectedId={selectedId} nearObjectId={nearObjectId}/>:roomObjects.map(object=>{const preview=editPreview?.id===object.id?editPreview:null;return <WebsiteObject key={object.id} object={preview?{...object,position:preview.position}:object} selected={object.id===selectedId} near={object.id===nearObjectId} placementValid={preview?.valid} onBeginDrag={id=>{beginObjectEdit(id);setDragging(id);}}/>;})}
    {!editMode&&liveWidgets.map((widget,index)=>{const pinned=integrationObjects.find(item=>item.roomId===room.id&&(item.reference===widget.reference||item.kind===widget.kind));const anchor=layout.integrations.find(item=>item.kind===widget.kind);const sameKindOffset=liveWidgets.slice(0,index).filter(item=>item.kind===widget.kind).length*.7;const position=pinned?.position??(anchor?[anchor.position[0]+Math.cos(anchor.rotation)*sameKindOffset,anchor.position[1],anchor.position[2]-Math.sin(anchor.rotation)*sameKindOffset] as [number,number,number]:[index*2-3,0,0]);return <LiveWidget key={widget.id} widget={widget} position={position} rotation={pinned?.rotation??anchor?.rotation??0} near={nearObjectId===`__live:${widget.id}`}/>;})}
    <PlayerController room={room} enabled={!editMode&&locked}/><EditCameraRig active={editMode}/><PerformanceProbe physicsBodies={layout.obstacles.length+wallSegments(layout).length+2}/>
    {editMode?<OrbitControls makeDefault target={[0,1,-1.2]} maxPolarAngle={Math.PI/2.08} minPolarAngle={.35} minDistance={6} maxDistance={21} enableDamping dampingFactor={.08}/>:<PointerLockControls makeDefault selector="#world-surface" onLock={()=>{setLocked(true);onLockChange(true);}} onUnlock={()=>{setLocked(false);onLockChange(false);}}/>}
  </>;
}

export function BurrowWorld({onLockChange}:{onLockChange:(locked:boolean)=>void}) {
  const reduced=useBurrow(s=>s.preferences.reducedEffects);const [visible,setVisible]=useState(typeof document==='undefined'||!document.hidden);
  useEffect(()=>{const update=()=>setVisible(!document.hidden);document.addEventListener('visibilitychange',update);return()=>document.removeEventListener('visibilitychange',update);},[]);
  return <Canvas frameloop={visible?'always':'never'} shadows={reduced?false:'percentage'} dpr={reduced?[1,1]:[1,1.45]} camera={{position:[0,1.9,7],fov:64,near:.08,far:42}} gl={{antialias:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.toneMapping=ACESFilmicToneMapping;gl.toneMappingExposure=1.28;gl.outputColorSpace=SRGBColorSpace;}}><Physics paused={!visible} gravity={[0,-15.5,0]} timeStep="vary"><Scene onLockChange={onLockChange}/></Physics></Canvas>;
}
