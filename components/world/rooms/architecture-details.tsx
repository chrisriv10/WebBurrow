import { RoundedBox } from '@react-three/drei';
import type { Room } from '@/lib/types';

function DenDetails({room}:{room:Room}){
  return <>
    <group position={[-5.25,4.72,-2.15]} rotation={[0,Math.PI/2,0]}>
      <RoundedBox args={[3.45,.22,2.05]} radius={.07}><meshStandardMaterial color="#202839" roughness={.9}/></RoundedBox>
      {[-1.35,-.45,.45,1.35].map(x=><mesh key={x} position={[x,-.3,.83]}><boxGeometry args={[.1,.62,.16]}/><meshStandardMaterial color="#4a4353" roughness={.9}/></mesh>)}
    </group>
    <group position={[-6.01,2.75,2.55]} rotation={[0,Math.PI/2,0]}>{[-1.2,-.4,.4,1.2].map((x,i)=><RoundedBox key={x} args={[.58,2.4,.12]} radius={.04} position={[x,0,0]}><meshStandardMaterial color={i%2?'#252c3a':'#202634'} roughness={.95}/></RoundedBox>)}</group>
    <RoundedBox args={[3.8,.12,.24]} radius={.04} position={[1.8,5.12,5.15]}><meshStandardMaterial color="#393444" emissive={room.accent} emissiveIntensity={.025} roughness={.88}/></RoundedBox>
    <mesh position={[-1.1,.045,2.1]} rotation={[-Math.PI/2,0,.1]} receiveShadow><circleGeometry args={[2.75,48]}/><meshStandardMaterial color="#302b40" roughness={1}/></mesh>
  </>;
}

function StudioDetails({room}:{room:Room}){
  return <>
    <group position={[0,5.58,0]}>{[-5.4,0,5.4].map(x=><group key={x} position={[x,0,0]}>
      <mesh><boxGeometry args={[.14,.12,13.3]}/><meshStandardMaterial color="#344552" roughness={.8} metalness={.1}/></mesh>
      {[-3.8,0,3.8].map(z=><mesh key={z} position={[0,-.08,z]}><boxGeometry args={[.34,.08,1.65]}/><meshStandardMaterial color="#7398a5" emissive={room.accent} emissiveIntensity={.035} roughness={.82}/></mesh>)}
    </group>)}</group>
    <group position={[0,2.8,-8.27]}>{[-5.4,-2.8,2.8,5.4].map((x,i)=><group key={x} position={[x,0,0]}>
      <RoundedBox args={[2.15,3.8,.13]} radius={.055}><meshStandardMaterial color={i%2?'#172532':'#1c2b37'} roughness={.93}/></RoundedBox>
      {[-.66,0,.66].map(y=><mesh key={y} position={[0,y,.08]}><boxGeometry args={[1.55,.035,.03]}/><meshBasicMaterial color="#426170" transparent opacity={.42}/></mesh>)}
    </group>)}</group>
    <group position={[0,.035,0]}>{[-3.3,0,3.3].map(x=><mesh key={x} position={[x,0,0]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.024,12.5]}/><meshBasicMaterial color="#4d7c88" transparent opacity={.28}/></mesh>)}</group>
    <RoundedBox args={[5.2,.18,.58]} radius={.06} position={[0,.12,4.75]}><meshStandardMaterial color="#1c323d" roughness={.88}/></RoundedBox>
  </>;
}

function LoungeDetails({room}:{room:Room}){
  return <>
    <group position={[0,3,-7.27]}>{[-5.2,-3.9,3.9,5.2].map((x,i)=><RoundedBox key={x} args={[1.02,3.25,.16]} radius={.08} position={[x,0,0]} rotation={[0,0,i%2?.025:-.025]}><meshStandardMaterial color={i%2?'#272436':'#312a3b'} roughness={1}/></RoundedBox>)}</group>
    <group position={[0,5.28,-.4]}>{[-4.6,0,4.6].map(x=><mesh key={x} position={[x,0,0]}><boxGeometry args={[2.55,.12,8.4]}/><meshStandardMaterial color="#242132" roughness={.94}/></mesh>)}</group>
    <group position={[6.95,2.2,-.9]} rotation={[0,-Math.PI/2,0]}>{[-1.25,-.42,.42,1.25].map((x,i)=><RoundedBox key={x} args={[.65,2.25,.12]} radius={.05} position={[x,0,0]}><meshStandardMaterial color={i%2?'#343044':'#29283a'} roughness={1}/></RoundedBox>)}</group>
    <mesh position={[.25,.05,1.05]} rotation={[-Math.PI/2,0,0]} receiveShadow><circleGeometry args={[4.15,56]}/><meshStandardMaterial color="#352b43" roughness={1}/></mesh>
    <RoundedBox args={[6.4,.11,.28]} radius={.05} position={[0,4.92,-7.13]}><meshStandardMaterial color="#3b3348" emissive={room.accent} emissiveIntensity={.03} roughness={.9}/></RoundedBox>
  </>;
}

export function ArchitectureDetails({room}:{room:Room}){
  return room.template==='den'?<DenDetails room={room}/>:room.template==='studio'?<StudioDetails room={room}/>:<LoungeDetails room={room}/>;
}
