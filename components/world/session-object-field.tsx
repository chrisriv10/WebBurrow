'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { RoundedBox, RoundedBoxGeometry, Text } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Color, Object3D, Vector3, type InstancedMesh } from 'three';
import type { BookmarkObject, BrowserWorkspace } from '@/lib/types';
import { planSessionLayout } from '@/lib/session-layout';
import { localAsset, threeText } from '@/lib/assets';
import { useBurrow } from '@/store/use-burrow';
import { SURFACES } from './materials';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');
const MONO=localAsset('fonts/ibm-plex-mono-latin-500-normal.woff');

export function SessionObjectField({objects,workspace,selectedId,nearObjectId}:{objects:BookmarkObject[];workspace:BrowserWorkspace;selectedId:string|null;nearObjectId:string|null}){
  const body=useRef<InstancedMesh>(null);const stand=useRef<InstancedMesh>(null);const base=useRef<InstancedMesh>(null);const screen=useRef<InstancedMesh>(null);const shelves=useRef<InstancedMesh>(null);
  const setNearObject=useBurrow(state=>state.setNearObject);
  const plan=useMemo(()=>planSessionLayout(objects,workspace.layoutMode),[objects,workspace.layoutMode]);const stationScale=plan.density==='dense'?.5:.62;
  const shelfPlan=useMemo(()=>plan.density==='dense'?plan.banks.flatMap(bank=>Array.from({length:bank.rows+1},(_,index)=>({bank,index}))):[],[plan]);
  useLayoutEffect(()=>{
    const temp=new Object3D();const offset=new Vector3();const axis=new Vector3(0,1,0);
    const place=(mesh:InstancedMesh|null,local:[number,number,number])=>{if(!mesh)return;for(const [index,object] of objects.entries()){offset.set(local[0]*stationScale,local[1]*stationScale,local[2]*stationScale).applyAxisAngle(axis,object.rotation);temp.position.set(object.position[0]+offset.x,object.position[1]+offset.y,object.position[2]+offset.z);temp.rotation.set(0,object.rotation,0);temp.scale.setScalar(stationScale);temp.updateMatrix();mesh.setMatrixAt(index,temp.matrix);}mesh.instanceMatrix.needsUpdate=true;};
    place(body.current,[0,.92,0]);place(stand.current,[0,.39,0]);place(base.current,[0,.1,.03]);place(screen.current,[0,.92,.26]);
    if(screen.current){for(const [index,object] of objects.entries()){const emphasized=object.id===selectedId||object.id===nearObjectId;screen.current.setColorAt(index,new Color(object.color).lerp(new Color('#edf9ff'),emphasized?.36:.1));}if(screen.current.instanceColor)screen.current.instanceColor.needsUpdate=true;}
  },[nearObjectId,objects,selectedId,stationScale]);
  useLayoutEffect(()=>{if(!shelves.current)return;const temp=new Object3D();const offset=new Vector3();const axis=new Vector3(0,1,0);for(const [instance,{bank,index}] of shelfPlan.entries()){offset.set(0,.14+index*.49,-.075).applyAxisAngle(axis,bank.rotation);temp.position.set(bank.position[0]+offset.x,bank.position[1]+offset.y,bank.position[2]+offset.z);temp.rotation.set(0,bank.rotation,0);temp.scale.set(bank.width-.18,.035,.42);temp.updateMatrix();shelves.current.setMatrixAt(instance,temp.matrix);}shelves.current.instanceMatrix.needsUpdate=true;},[shelfPlan]);
  const idFor=(event:ThreeEvent<PointerEvent>)=>event.instanceId===undefined?undefined:objects[event.instanceId]?.id;
  const activate=()=>{};
  const hover=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();setNearObject(idFor(event)??null);};
  const eventProps={onPointerDown:activate,onPointerMove:hover,onPointerOut:()=>setNearObject(null)};const userData={sessionObjectIds:objects.map(object=>object.id)};
  return <group>
    {plan.banks.map(bank=><group key={bank.id} position={bank.position} rotation={[0,bank.rotation,0]}>
      {plan.density==='dense'?<>
        <RoundedBox args={[bank.width,2.55,.24]} radius={.08} position={[0,1.15,-.22]} castShadow><meshStandardMaterial {...SURFACES.graphite}/></RoundedBox>
      </>:<>
        <RoundedBox args={[bank.width,.13,bank.depth]} radius={.07} position={[0,.07,0]} receiveShadow><meshStandardMaterial color="#24303c" roughness={.94}/></RoundedBox>
        <mesh position={[0,.014,0]} rotation={[-Math.PI/2,0,0]}><ringGeometry args={[Math.max(bank.width,bank.depth)*.28,Math.max(bank.width,bank.depth)*.3,48]}/><meshBasicMaterial color={bank.color} transparent opacity={.22}/></mesh>
      </>}
      <group position={[0,plan.density==='dense'?2.7:.2,plan.density==='dense'?-.02:bank.depth/2+.06]}>
        <RoundedBox args={[Math.min(bank.width-0.3,2.4),.33,.08]} radius={.055}><meshStandardMaterial color="#1b2632" emissive={bank.color} emissiveIntensity={.035} roughness={.9}/></RoundedBox>
        <Text font={FONT} position={[-Math.min(bank.width-0.5,2.1)/2,.03,.05]} anchorX="left" fontSize={.09} color="#eaf0f6">{threeText(bank.label.slice(0,28))}</Text>
        <Text font={MONO} position={[Math.min(bank.width-0.5,2.1)/2,-.08,.05]} anchorX="right" fontSize={.052} color={bank.color}>{bank.count} TABS</Text>
      </group>
    </group>)}
    {shelfPlan.length>0&&<instancedMesh ref={shelves} args={[undefined,undefined,shelfPlan.length]} frustumCulled={false}><boxGeometry/><meshStandardMaterial {...SURFACES.trim}/></instancedMesh>}
    <instancedMesh ref={base} args={[undefined,undefined,objects.length]} frustumCulled={false} userData={userData} {...eventProps}><RoundedBoxGeometry args={[1.05,.16,.68]} radius={.07}/><meshStandardMaterial color="#293240" roughness={.94}/></instancedMesh>
    <instancedMesh ref={stand} args={[undefined,undefined,objects.length]} frustumCulled={false} userData={userData} {...eventProps}><RoundedBoxGeometry args={[.14,.62,.16]} radius={.045}/><meshStandardMaterial color="#465162" roughness={.86}/></instancedMesh>
    <instancedMesh ref={body} args={[undefined,undefined,objects.length]} frustumCulled={false} userData={userData} {...eventProps}><RoundedBoxGeometry args={[1.05,.72,.22]} radius={.075}/><meshStandardMaterial color="#141d29" roughness={.92}/></instancedMesh>
    <instancedMesh ref={screen} args={[undefined,undefined,objects.length]} frustumCulled={false} userData={userData} {...eventProps}><planeGeometry args={[.82,.47]}/><meshBasicMaterial color="#a7b0bf"/></instancedMesh>
  </group>;
}
