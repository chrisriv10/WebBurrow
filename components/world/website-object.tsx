'use client';

import { useEffect, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { MathUtils, type Group } from 'three';
import type { BookmarkObject } from '@/lib/types';
import { siteIdentity } from '@/lib/site-identity';
import { footprintFor } from '@/lib/placement';
import { localAsset, threeText } from '@/lib/assets';
import { useBurrow } from '@/store/use-burrow';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');
const MONO=localAsset('fonts/ibm-plex-mono-latin-500-normal.woff');

function Screen({object,size=[1.35,.78],position=[0,1.35,.36],rotation=[0,0,0],selected,active}:{object:BookmarkObject;size?:[number,number];position?:[number,number,number];rotation?:[number,number,number];selected:boolean;active:boolean}) {
  const identity=siteIdentity(object);
  return <group position={position} rotation={rotation}>
    <mesh><planeGeometry args={size}/><meshStandardMaterial color="#0b1220" emissive={object.color} emissiveIntensity={active ? .68 : selected ? .48 : .24} roughness={.7}/></mesh>
    <Text font={FONT} position={[0,.08,.012]} fontSize={Math.min(size[0],size[1])*.28} color="#f4f7ff" anchorX="center" anchorY="middle">{threeText(identity.monogram)}</Text>
    {size[0]>.95&&<Text font={MONO} position={[0,-size[1]*.3,.014]} maxWidth={size[0]*.82} fontSize={.07} color="#a9b7d4" anchorX="center">{threeText(identity.domain)}</Text>}
    <mesh position={[0,-size[1]*.42,.02]}><planeGeometry args={[size[0]*.62,.018]}/><meshBasicMaterial color={object.color} transparent opacity={.72}/></mesh>
  </group>;
}

function Terminal({object,selected,active}:{object:BookmarkObject;selected:boolean;active:boolean}) {
  return <group><RoundedBox args={[1.75,1.18,.55]} position={[0,1.35,0]} radius={.12} castShadow><meshStandardMaterial color="#171c29" metalness={.08} roughness={.8}/></RoundedBox><Screen object={object} selected={selected} active={active}/><mesh position={[0,.48,0]} castShadow><cylinderGeometry args={[.14,.24,.72,14]}/><meshStandardMaterial color="#252b3a" roughness={.78}/></mesh><RoundedBox args={[1.2,.14,.62]} position={[0,.13,.05]} radius={.05}><meshStandardMaterial color="#202534" roughness={.82}/></RoundedBox><mesh position={[-.55,1.93,.22]}><sphereGeometry args={[.035,8,8]}/><meshBasicMaterial color={active?'#d5fffb':'#69dbc9'}/></mesh></group>;
}

function Television({object,selected,active}:{object:BookmarkObject;selected:boolean;active:boolean}) {
  return <group><RoundedBox args={[2.62,1.62,.46]} position={[0,1.45,0]} radius={.16} castShadow><meshStandardMaterial color="#141925" metalness={.06} roughness={.8}/></RoundedBox><Screen object={object} size={[2.28,1.22]} position={[0,1.46,.24]} selected={selected} active={active}/><RoundedBox args={[1.45,.28,.7]} position={[0,.48,0]} radius={.08} castShadow><meshStandardMaterial color="#252939" roughness={.82}/></RoundedBox><mesh position={[0,.72,.12]}><boxGeometry args={[.1,.45,.12]}/><meshStandardMaterial color="#30364a" roughness={.8}/></mesh></group>;
}

function Book({object}:{object:BookmarkObject}) {
  const identity=siteIdentity(object);
  return <group position={[0,.85,0]} rotation={[0,0,-.06]}><RoundedBox args={[1.08,1.72,.38]} radius={.08} castShadow><meshStandardMaterial color={object.color} roughness={.78}/></RoundedBox><RoundedBox args={[.9,1.52,.08]} position={[.04,0,.21]} radius={.035}><meshStandardMaterial color="#171b28" roughness={.9}/></RoundedBox><mesh position={[-.47,0,.22]}><boxGeometry args={[.055,1.48,.05]}/><meshStandardMaterial color="#e0d7c4"/></mesh><Text font={FONT} position={[.06,.17,.268]} fontSize={.2} maxWidth={.7} textAlign="center" color="#f4f4fb">{identity.monogram}</Text><Text font={MONO} position={[.06,-.28,.27]} fontSize={.065} maxWidth={.72} textAlign="center" color="#aeb4c8">{identity.category.toUpperCase()}</Text></group>;
}

function Poster({object,selected,active}:{object:BookmarkObject;selected:boolean;active:boolean}) {
  return <group><RoundedBox args={[1.5,2.35,.19]} position={[0,1.38,0]} radius={.05} castShadow><meshStandardMaterial color="#2b2d3b" roughness={.58}/></RoundedBox><Screen object={object} size={[1.25,2.08]} position={[0,1.38,.105]} selected={selected} active={active}/><mesh position={[0,.15,-.04]}><boxGeometry args={[.72,.12,.58]}/><meshStandardMaterial color="#222635"/></mesh></group>;
}

function Arcade({object,selected,active}:{object:BookmarkObject;selected:boolean;active:boolean}) {
  return <group><RoundedBox args={[1.38,1.62,1.08]} position={[0,.84,-.06]} radius={.11} castShadow><meshStandardMaterial color="#242839" roughness={.58}/></RoundedBox><RoundedBox args={[1.38,1.06,.84]} position={[0,1.67,-.12]} rotation={[-.14,0,0]} radius={.1} castShadow><meshStandardMaterial color="#1a1e2c" roughness={.48}/></RoundedBox><Screen object={object} size={[1.05,.62]} position={[0,1.7,.31]} rotation={[-.14,0,0]} selected={selected} active={active}/><RoundedBox args={[1.32,.24,.68]} position={[0,1.05,.29]} radius={.07}><meshStandardMaterial color="#343044"/></RoundedBox><mesh position={[-.26,1.19,.65]}><sphereGeometry args={[.075,12,8]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={.55}/></mesh>{[-.05,.14,.32].map(x=><mesh key={x} position={[x,1.16,.65]}><cylinderGeometry args={[.045,.045,.035,12]}/><meshStandardMaterial color={x===.32?'#e6b68f':'#7f8ab8'}/></mesh>)}</group>;
}

function Pedestal({object,active}:{object:BookmarkObject;active:boolean}) {
  const identity=siteIdentity(object);
  return <group><mesh position={[0,.42,0]} castShadow><cylinderGeometry args={[.58,.8,.84,10]}/><meshStandardMaterial color="#232a3b" metalness={.25} roughness={.52}/></mesh><mesh position={[0,.86,0]}><cylinderGeometry args={[.48,.58,.08,16]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={active ? .75 : .32}/></mesh><mesh position={[0,1.38,0]} rotation={[0,Math.PI/4,0]}><octahedronGeometry args={[.52,0]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={active?1.1:.62} roughness={.35} transparent opacity={.9}/></mesh><Text font={FONT} position={[0,1.39,.55]} fontSize={.16} color="#ffffff">{identity.monogram}</Text></group>;
}

function Laptop({object,selected,active}:{object:BookmarkObject;selected:boolean;active:boolean}) {
  return <group><RoundedBox args={[1.6,.12,1.05]} position={[0,.61,.14]} radius={.06} castShadow><meshStandardMaterial color="#272d3a" metalness={.22} roughness={.5}/></RoundedBox><RoundedBox args={[1.58,1.02,.11]} position={[0,1.12,-.34]} rotation={[-.12,0,0]} radius={.06} castShadow><meshStandardMaterial color="#1c2230" metalness={.18} roughness={.46}/></RoundedBox><Screen object={object} size={[1.38,.82]} position={[0,1.12,-.274]} rotation={[-.12,0,0]} selected={selected} active={active}/><mesh position={[0,.68,.67]}><planeGeometry args={[.68,.28]}/><meshStandardMaterial color="#333947"/></mesh><Text font={MONO} position={[0,.685,.682]} rotation={[-Math.PI/2,0,0]} fontSize={.055} color="#8e98ad">WEBBURROW</Text></group>;
}

function Radio({object,active}:{object:BookmarkObject;active:boolean}) {
  const identity=siteIdentity(object);
  return <group><RoundedBox args={[1.62,1.08,.78]} position={[0,.72,0]} radius={.15} castShadow><meshStandardMaterial color="#242a37" roughness={.72}/></RoundedBox><mesh position={[-.43,.72,.405]}><cylinderGeometry args={[.32,.32,.05,24]}/><meshStandardMaterial color="#111722" roughness={.9}/></mesh><mesh position={[-.43,.72,.438]}><circleGeometry args={[.23,24]}/><meshBasicMaterial color={object.color} transparent opacity={active ? .75 : .4}/></mesh><Screen object={object} size={[.56,.42]} position={[.36,.78,.405]} selected={false} active={active}/><mesh position={[.55,.42,.42]}><cylinderGeometry args={[.055,.055,.05,12]}/><meshStandardMaterial color="#c2c8d8"/></mesh><Text font={MONO} position={[.36,1.16,.41]} fontSize={.07} color="#aeb7ca">{identity.category.toUpperCase()}</Text><mesh position={[0,1.38,-.1]} rotation={[0,0,.18]}><cylinderGeometry args={[.025,.025,1.15,8]}/><meshStandardMaterial color="#565f72"/></mesh></group>;
}

function FileBox({object}:{object:BookmarkObject}) {
  const identity=siteIdentity(object);
  return <group><RoundedBox args={[1.35,.92,1.05]} position={[0,.5,0]} radius={.1} castShadow><meshStandardMaterial color={object.color} roughness={.82}/></RoundedBox><RoundedBox args={[1.44,.14,1.12]} position={[0,.99,0]} radius={.045}><meshStandardMaterial color="#d8d2c7" roughness={.8}/></RoundedBox><mesh position={[0,.58,.532]}><planeGeometry args={[.72,.34]}/><meshStandardMaterial color="#ece8df" roughness={1}/></mesh><Text font={FONT} position={[0,.6,.545]} fontSize={.13} color="#252737">{identity.monogram}</Text><mesh position={[0,1.17,-.12]} rotation={[-.18,0,0]}><boxGeometry args={[.85,.65,.06]}/><meshStandardMaterial color="#b9c2cf" roughness={.9}/></mesh></group>;
}

function DeskMonitor({object,selected,active}:{object:BookmarkObject;selected:boolean;active:boolean}) {return <group><RoundedBox args={[2.05,1.28,.28]} position={[0,1.42,0]} radius={.13} castShadow><meshStandardMaterial color="#1b2230" roughness={.82}/></RoundedBox><Screen object={object} size={[1.76,.98]} position={[0,1.42,.15]} selected={selected} active={active}/><RoundedBox args={[.82,.12,.58]} radius={.05} position={[0,.38,.08]}><meshStandardMaterial color="#2c3442" roughness={.82}/></RoundedBox><mesh position={[0,.72,.02]}><cylinderGeometry args={[.08,.12,.62,14]}/><meshStandardMaterial color="#3b4452" roughness={.76}/></mesh><mesh position={[.78,.82,.16]}><circleGeometry args={[.025,10]}/><meshBasicMaterial color={active?'#9ce8d1':'#667487'}/></mesh></group>}
function WallDisplay({object,selected,active}:{object:BookmarkObject;selected:boolean;active:boolean}) {return <group><RoundedBox args={[2.75,1.75,.2]} position={[0,1.55,0]} radius={.12} castShadow><meshStandardMaterial color="#222937" roughness={.86}/></RoundedBox><Screen object={object} size={[2.42,1.42]} position={[0,1.55,.11]} selected={selected} active={active}/>{[-1.15,1.15].map(x=><RoundedBox key={x} args={[.16,.5,.32]} radius={.05} position={[x,.42,-.02]}><meshStandardMaterial color="#303746" roughness={.82}/></RoundedBox>)}</group>}
function Tablet({object,selected,active}:{object:BookmarkObject;selected:boolean;active:boolean}) {return <group rotation={[-.18,0,0]}><RoundedBox args={[1.12,1.65,.12]} position={[0,.96,0]} radius={.12} castShadow><meshStandardMaterial color="#222936" roughness={.84}/></RoundedBox><Screen object={object} size={[.94,1.4]} position={[0,.96,.07]} selected={selected} active={active}/><mesh position={[0,.17,-.18]}><boxGeometry args={[.65,.12,.66]}/><meshStandardMaterial color="#303746" roughness={.86}/></mesh></group>}
function CompactPortal({object,active}:{object:BookmarkObject;active:boolean}) {const identity=siteIdentity(object);return <group><RoundedBox args={[1.55,.24,.78]} radius={.1} position={[0,.18,0]}><meshStandardMaterial color="#252c3a" roughness={.84}/></RoundedBox><mesh position={[0,1.18,0]}><torusGeometry args={[.7,.11,12,48]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={active ? .48 : .2} roughness={.7}/></mesh><mesh position={[0,1.18,-.03]}><circleGeometry args={[.61,40]}/><meshStandardMaterial color="#0c1422" emissive={object.color} emissiveIntensity={.08} roughness={1}/></mesh><Text font={FONT} position={[0,1.2,.03]} fontSize={.2} color="#f3f6fb">{identity.monogram}</Text><RoundedBox args={[.22,1.55,.3]} radius={.08} position={[-.78,.82,0]}><meshStandardMaterial color="#2d3543" roughness={.82}/></RoundedBox><RoundedBox args={[.22,1.55,.3]} radius={.08} position={[.78,.82,0]}><meshStandardMaterial color="#2d3543" roughness={.82}/></RoundedBox></group>}

export function WebsiteObject({object,selected,near,onBeginDrag}:{object:BookmarkObject;selected:boolean;near:boolean;onBeginDrag:(id:string)=>void}) {
  const editMode=useBurrow(s=>s.editMode);const setSelected=useBurrow(s=>s.setSelected);const openSite=useBurrow(s=>s.openSite);const openPulse=useBurrow(s=>s.openPulse);const reduced=useBurrow(s=>s.preferences.reducedEffects);const arrivalIndex=useBurrow(s=>s.arrivalIds.indexOf(object.id));
  const motion=useRef<Group>(null);const [hovered,setHovered]=useState(false);const pulse=useRef(0);const born=useRef<number|null>(null);const identity=siteIdentity(object);
  useEffect(()=>{if(openPulse?.id===object.id)pulse.current=1;},[object.id,openPulse]);
  useFrame(({clock},delta)=>{
    if(!motion.current)return;
    pulse.current=Math.max(0,pulse.current-delta*1.65);
    const float=!reduced&&object.archetype==='pedestal'?Math.sin(clock.elapsedTime*1.2+object.position[0])*.05:0;
    motion.current.position.y=MathUtils.damp(motion.current.position.y,float+(near ? .045 : 0),8,delta);
    if(born.current===null)born.current=clock.elapsedTime;
    const arrived=reduced||arrivalIndex<0||(clock.elapsedTime-born.current)*1000>arrivalIndex*90;const target=(arrived?1:.04)+pulse.current*.05+(hovered ? .012 : 0);const scale=MathUtils.damp(motion.current.scale.x,target,arrived?9:12,delta);motion.current.scale.setScalar(scale);
  });
  const active=near||hovered||openPulse?.id===object.id;
  const click=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();if(editMode){setSelected(object.id);onBeginDrag(object.id);}else openSite(object.id);};
  return <group position={object.position} rotation={[0,object.rotation,0]} userData={{interactionId:object.id}} onPointerDown={click} onPointerOver={event=>{event.stopPropagation();setHovered(true);}} onPointerOut={()=>setHovered(false)}>
    <group ref={motion}>
      {object.archetype==='terminal'&&<Terminal object={object} selected={selected} active={active}/>}
      {object.archetype==='tv'&&<Television object={object} selected={selected} active={active}/>}
      {object.archetype==='book'&&<Book object={object}/>}
      {object.archetype==='poster'&&<Poster object={object} selected={selected} active={active}/>}
      {object.archetype==='arcade'&&<Arcade object={object} selected={selected} active={active}/>}
      {object.archetype==='pedestal'&&<Pedestal object={object} active={active}/>}
      {object.archetype==='laptop'&&<Laptop object={object} selected={selected} active={active}/>}
      {object.archetype==='radio'&&<Radio object={object} active={active}/>}
      {object.archetype==='file-box'&&<FileBox object={object}/>}
      {object.archetype==='desk-monitor'&&<DeskMonitor object={object} selected={selected} active={active}/>}
      {object.archetype==='wall-display'&&<WallDisplay object={object} selected={selected} active={active}/>}
      {object.archetype==='tablet'&&<Tablet object={object} selected={selected} active={active}/>}
      {object.archetype==='compact-portal'&&<CompactPortal object={object} active={active}/>}
    </group>
    {(selected||near||hovered)&&<group position={[0,2.72,.1]}><Text font={FONT} fontSize={.18} maxWidth={2.25} color="#ffffff" anchorX="center" outlineWidth={.012} outlineColor="#080a12">{threeText(object.name)}</Text><Text font={MONO} position={[0,-.25,0]} fontSize={.075} maxWidth={2.1} color={object.color} anchorX="center">{threeText(`${identity.category.toUpperCase()} - ${identity.domain}`)}</Text></group>}
    {selected&&<><mesh position={[0,.025,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[footprintFor(object.archetype)+.1,footprintFor(object.archetype)+.18,48]}/><meshBasicMaterial color="#9cecff" transparent opacity={.9}/></mesh><mesh position={[0,.021,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[footprintFor(object.archetype)+.08,48]}/><meshBasicMaterial color="#7cdff5" transparent opacity={.055}/></mesh></>}
  </group>;
}
