'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { MathUtils, type Group } from 'three';
import type { BookmarkObject } from '@/lib/types';
import { siteIdentity } from '@/lib/site-identity';
import { footprintFor } from '@/lib/placement';
import { localAsset, threeText } from '@/lib/assets';
import { useBurrow } from '@/store/use-burrow';
import { DigitalObject } from './props/digital-objects';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');
const MONO=localAsset('fonts/ibm-plex-mono-latin-500-normal.woff');

export function WebsiteObject({object,selected,near,placementValid,onBeginDrag}:{object:BookmarkObject;selected:boolean;near:boolean;placementValid?:boolean;onBeginDrag:(id:string)=>void}){
  const editMode=useBurrow(state=>state.editMode);const setSelected=useBurrow(state=>state.setSelected);const openPulse=useBurrow(state=>state.openPulse);const reduced=useBurrow(state=>state.preferences.reducedEffects);const arrivalIndex=useBurrow(state=>state.arrivalIds.indexOf(object.id));
  const motion=useRef<Group>(null);const [hovered,setHovered]=useState(false);const pulse=useRef(0);const born=useRef<number|null>(null);const identity=siteIdentity(object);
  useEffect(()=>{if(openPulse?.id===object.id)pulse.current=1;},[object.id,openPulse]);
  useFrame(({clock},delta)=>{
    if(!motion.current)return;
    pulse.current=Math.max(0,pulse.current-delta*1.65);
    const float=!reduced&&object.archetype==='pedestal'?Math.sin(clock.elapsedTime*.9+object.position[0])*.035:0;
    motion.current.position.y=MathUtils.damp(motion.current.position.y,float+(near?.025:0),8,delta);
    if(born.current===null)born.current=clock.elapsedTime;
    const arrived=reduced||arrivalIndex<0||(clock.elapsedTime-born.current)*1000>arrivalIndex*72;
    const target=(arrived?1:.04)+pulse.current*.035+(hovered?.008:0);
    const scale=MathUtils.damp(motion.current.scale.x,target,arrived?9:12,delta);motion.current.scale.setScalar(scale);
  });
  const active=near||hovered||openPulse?.id===object.id;
  const activate=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();if(editMode){setSelected(object.id);onBeginDrag(object.id);}};
  return <group position={object.position} rotation={[0,object.rotation,0]} userData={{interactionId:object.id}} onPointerDown={activate} onPointerOver={event=>{event.stopPropagation();setHovered(true);}} onPointerOut={()=>setHovered(false)}>
    <group ref={motion}><DigitalObject object={object} selected={selected} active={active}/></group>
    {(selected||near||hovered)&&<group position={[0,object.mount?.kind==='shelf'?1.45:2.78,.1]}>
      <Text font={FONT} fontSize={.18} maxWidth={2.25} color="#f7f8fc" anchorX="center" outlineWidth={.012} outlineColor="#080a12">{threeText(object.name)}</Text>
      <Text font={MONO} position={[0,-.25,0]} fontSize={.07} maxWidth={2.1} color={object.color} anchorX="center">{threeText(`${identity.category.toUpperCase()} · ${identity.domain}`)}</Text>
    </group>}
    {selected&&<><mesh position={[0,.025,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[footprintFor(object.archetype)+.1,footprintFor(object.archetype)+.18,48]}/><meshBasicMaterial color={placementValid===false?'#ff8f8f':'#9cecff'} transparent opacity={.82}/></mesh><mesh position={[0,.021,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[footprintFor(object.archetype)+.08,48]}/><meshBasicMaterial color={placementValid===false?'#ff6868':'#7cdff5'} transparent opacity={placementValid===false?.1:.045}/></mesh></>}
  </group>;
}
