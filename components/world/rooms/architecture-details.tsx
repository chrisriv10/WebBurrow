import { useLayoutEffect, useRef } from 'react';
import { RoundedBox } from '@react-three/drei';
import { Color, Object3D, type InstancedMesh } from 'three';
import type { Room } from '@/lib/types';

type BoxItem={position:[number,number,number];scale:[number,number,number];rotation?:[number,number,number];color:string};
function BoxInstances({items,roughness=.94,opacity=1}:{items:BoxItem[];roughness?:number;opacity?:number}){const mesh=useRef<InstancedMesh>(null);useLayoutEffect(()=>{const temp=new Object3D();items.forEach((item,index)=>{temp.position.set(...item.position);temp.rotation.set(...(item.rotation??[0,0,0]));temp.scale.set(...item.scale);temp.updateMatrix();mesh.current?.setMatrixAt(index,temp.matrix);mesh.current?.setColorAt(index,new Color(item.color));});if(mesh.current){mesh.current.instanceMatrix.needsUpdate=true;if(mesh.current.instanceColor)mesh.current.instanceColor.needsUpdate=true;}},[items]);return <instancedMesh ref={mesh} args={[undefined,undefined,items.length]}><boxGeometry/><meshStandardMaterial color="#ffffff" roughness={roughness} transparent={opacity<1} opacity={opacity}/></instancedMesh>}

function DenDetails({room}:{room:Room}){
  return <>
    <group position={[-5.25,4.72,-2.15]} rotation={[0,Math.PI/2,0]}>
      <RoundedBox args={[3.45,.22,2.05]} radius={.07}><meshStandardMaterial color="#202839" roughness={.9}/></RoundedBox>
      <BoxInstances items={[-1.35,-.45,.45,1.35].map(x=>({position:[x,-.3,.83],scale:[.1,.62,.16],color:'#4a4353'}))}/>
    </group>
    <group position={[-6.01,2.75,2.55]} rotation={[0,Math.PI/2,0]}><BoxInstances items={[-1.2,-.4,.4,1.2].map((x,i)=>({position:[x,0,0],scale:[.58,2.4,.12],color:i%2?'#252c3a':'#202634'}))}/></group>
    <RoundedBox args={[3.8,.12,.24]} radius={.04} position={[1.8,5.12,5.15]}><meshStandardMaterial color="#393444" emissive={room.accent} emissiveIntensity={.025} roughness={.88}/></RoundedBox>
    <mesh position={[.35,.045,1.1]} rotation={[-Math.PI/2,0,.04]} receiveShadow><circleGeometry args={[2.5,48]}/><meshStandardMaterial color="#302b40" roughness={1}/></mesh>
  </>;
}

function StudioDetails({}:{room:Room}){
  return <>
    <group position={[0,5.58,0]}><BoxInstances items={[-5.4,0,5.4].map(x=>({position:[x,0,0],scale:[.14,.12,13.3],color:'#344552'}))} roughness={.8}/><BoxInstances items={[-5.4,0,5.4].flatMap(x=>[-3.8,0,3.8].map(z=>({position:[x,-.08,z] as [number,number,number],scale:[.34,.08,1.65] as [number,number,number],color:'#7398a5'})))} roughness={.82}/></group>
    <group position={[0,2.8,-8.27]}><BoxInstances items={[-5.4,-2.8,2.8,5.4].map((x,i)=>({position:[x,0,0],scale:[2.15,3.8,.13],color:i%2?'#172532':'#1c2b37'}))}/><BoxInstances items={[-5.4,-2.8,2.8,5.4].flatMap(x=>[-.66,0,.66].map(y=>({position:[x,y,.08] as [number,number,number],scale:[1.55,.035,.03] as [number,number,number],color:'#426170'})))} opacity={.42}/></group>
    <group position={[0,.035,0]}><BoxInstances items={[-3.3,0,3.3].map(x=>({position:[x,0,0],scale:[.024,.01,12.5],color:'#4d7c88'}))} opacity={.28}/></group>
    <RoundedBox args={[5.2,.18,.58]} radius={.06} position={[0,.12,4.75]}><meshStandardMaterial color="#1c323d" roughness={.88}/></RoundedBox>
  </>;
}

function LoungeDetails({room}:{room:Room}){
  return <>
    <group position={[0,3,-7.27]}><BoxInstances items={[-5.2,-3.9,3.9,5.2].map((x,i)=>({position:[x,0,0],scale:[1.02,3.25,.16],rotation:[0,0,i%2?.025:-.025],color:i%2?'#272436':'#312a3b'}))} roughness={1}/></group>
    <group position={[0,5.28,-.4]}><BoxInstances items={[-4.6,0,4.6].map(x=>({position:[x,0,0],scale:[2.55,.12,8.4],color:'#242132'}))}/></group>
    <group position={[8.28,2.2,2.1]} rotation={[0,-Math.PI/2,0]}><BoxInstances items={[-1.2,-.4,.4,1.2].map((x,i)=>({position:[x,0,0],scale:[.65,2.25,.12],color:i%2?'#343044':'#29283a'}))} roughness={1}/></group>
    <mesh position={[.25,.05,1.05]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[4.15,56]}/><meshStandardMaterial color="#352b43" roughness={1}/></mesh>
    <RoundedBox args={[6.4,.11,.28]} radius={.05} position={[0,4.92,-7.13]}><meshStandardMaterial color="#3b3348" emissive={room.accent} emissiveIntensity={.03} roughness={.9}/></RoundedBox>
  </>;
}

export function ArchitectureDetails({room}:{room:Room}){
  return room.template==='den'?<DenDetails room={room}/>:room.template==='studio'?<StudioDetails room={room}/>:<LoungeDetails room={room}/>;
}
