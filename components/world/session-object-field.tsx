'use client';

import { useLayoutEffect, useRef } from 'react';
import { RoundedBoxGeometry } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { Color, Object3D, Vector3, type InstancedMesh } from 'three';
import type { BookmarkObject } from '@/lib/types';
import { useBurrow } from '@/store/use-burrow';

const stationScale=.62;

export function SessionObjectField({objects,selectedId,nearObjectId}:{objects:BookmarkObject[];selectedId:string|null;nearObjectId:string|null}){
  const body=useRef<InstancedMesh>(null);const stand=useRef<InstancedMesh>(null);const base=useRef<InstancedMesh>(null);const screen=useRef<InstancedMesh>(null);
  const setNearObject=useBurrow(s=>s.setNearObject);const openSite=useBurrow(s=>s.openSite);
  useLayoutEffect(()=>{
    const temp=new Object3D();const offset=new Vector3();
    const place=(mesh:InstancedMesh|null,local:[number,number,number])=>{if(!mesh)return;for(const [index,object] of objects.entries()){offset.set(local[0]*stationScale,local[1]*stationScale,local[2]*stationScale).applyAxisAngle(new Vector3(0,1,0),object.rotation);temp.position.set(object.position[0]+offset.x,object.position[1]+offset.y,object.position[2]+offset.z);temp.rotation.set(0,object.rotation,0);temp.scale.setScalar(stationScale);temp.updateMatrix();mesh.setMatrixAt(index,temp.matrix);}mesh.instanceMatrix.needsUpdate=true;};
    place(body.current,[0,.92,0]);place(stand.current,[0,.39,0]);place(base.current,[0,.1,.03]);place(screen.current,[0,.92,.26]);
    if(screen.current){for(const [index,object] of objects.entries()){const emphasized=object.id===selectedId||object.id===nearObjectId;const color=new Color(object.color).lerp(new Color('#edf9ff'),emphasized ? .34 : .12);screen.current.setColorAt(index,color);}if(screen.current.instanceColor)screen.current.instanceColor.needsUpdate=true;}
  },[nearObjectId,objects,selectedId]);
  const idFor=(event:ThreeEvent<PointerEvent>)=>event.instanceId===undefined?undefined:objects[event.instanceId]?.id;
  const activate=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();const id=idFor(event);if(id)openSite(id);};
  const hover=(event:ThreeEvent<PointerEvent>)=>{event.stopPropagation();setNearObject(idFor(event)??null);};
  const userData={sessionObjectIds:objects.map(object=>object.id)};
  return <group>
    <instancedMesh ref={base} args={[undefined,undefined,objects.length]} frustumCulled={false} userData={userData} onPointerDown={activate} onPointerMove={hover} onPointerOut={()=>setNearObject(null)}><RoundedBoxGeometry args={[1.05,.16,.68]} radius={.07}/><meshStandardMaterial color="#293240" roughness={.9}/></instancedMesh>
    <instancedMesh ref={stand} args={[undefined,undefined,objects.length]} frustumCulled={false} userData={userData} onPointerDown={activate} onPointerMove={hover} onPointerOut={()=>setNearObject(null)}><RoundedBoxGeometry args={[.14,.62,.16]} radius={.045}/><meshStandardMaterial color="#384353" roughness={.84}/></instancedMesh>
    <instancedMesh ref={body} args={[undefined,undefined,objects.length]} frustumCulled={false} userData={userData} onPointerDown={activate} onPointerMove={hover} onPointerOut={()=>setNearObject(null)}><RoundedBoxGeometry args={[1.05,.72,.22]} radius={.075}/><meshStandardMaterial color="#17202d" roughness={.88}/></instancedMesh>
    <instancedMesh ref={screen} args={[undefined,undefined,objects.length]} frustumCulled={false} userData={userData} onPointerDown={activate} onPointerMove={hover} onPointerOut={()=>setNearObject(null)}><planeGeometry args={[.82,.47]}/><meshBasicMaterial color="#a7b0bf"/></instancedMesh>
  </group>;
}
