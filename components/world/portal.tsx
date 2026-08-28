'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import type { Group } from 'three';
import type { Room } from '@/lib/types';
import { localAsset, threeText } from '@/lib/assets';
import { ROOM_LAYOUTS } from '@/lib/room-layouts';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');

export function BurrowPortal({room,destination,near,onTravel}:{room:Room;destination:Room;near:boolean;onTravel:()=>void}) {
  const rings=useRef<Group>(null);const glow=useRef<Group>(null);
  useFrame(({clock},delta)=>{
    if(rings.current)rings.current.rotation.z+=delta*(near ? .2 : .055);
    if(glow.current)glow.current.scale.setScalar(1+Math.sin(clock.elapsedTime*1.6)*.018+(near ? .035 : 0));
  });
  return <group position={ROOM_LAYOUTS[room.template].portal} onClick={onTravel} userData={{interactionId:'__portal'}}>
    <RoundedBox args={[4.7,.35,.55]} position={[0,.2,0]} radius={.12} castShadow><meshStandardMaterial color="#24283a" roughness={.62} metalness={.2}/></RoundedBox>
    <RoundedBox args={[.52,4.7,.62]} position={[-2.05,2.45,0]} radius={.14} castShadow><meshStandardMaterial color="#23283a" roughness={.65}/></RoundedBox>
    <RoundedBox args={[.52,4.7,.62]} position={[2.05,2.45,0]} radius={.14} castShadow><meshStandardMaterial color="#23283a" roughness={.65}/></RoundedBox>
    <group ref={glow} position={[0,2.5,.1]}>
      <mesh><torusGeometry args={[1.55,.2,12,64]}/><meshStandardMaterial color={room.accent} emissive={room.accent} emissiveIntensity={near?1.25:.65} roughness={.38}/></mesh>
      <group ref={rings}><mesh rotation={[0,0,.55]}><torusGeometry args={[1.22,.025,8,64]}/><meshBasicMaterial color="#b9d9ff" transparent opacity={near ? .72 : .35}/></mesh><mesh rotation={[0,0,-.55]}><torusGeometry args={[.96,.018,8,64]}/><meshBasicMaterial color={room.accent} transparent opacity={.45}/></mesh></group>
      <mesh position={[0,0,-.04]}><circleGeometry args={[1.38,64]}/><meshStandardMaterial color="#111828" emissive={room.accent} emissiveIntensity={near ? .28 : .12} roughness={1}/></mesh>
      <mesh position={[0,0,.02]}><circleGeometry args={[1.08,48]}/><meshBasicMaterial color="#0a1020" transparent opacity={.76}/></mesh>
    </group>
    <Text font={FONT} position={[0,5.22,.35]} fontSize={.16} letterSpacing={.16} color="#aeb8d8">BURROW LIFT</Text>
    <Text font={FONT} position={[0,4.86,.35]} fontSize={.26} color={near?'#ffffff':'#d9ddf2'}>{threeText(destination.name)}</Text>
    <Text font={FONT} position={[0,.48,.4]} fontSize={.12} letterSpacing={.08} color={near?'#bfefff':'#71809e'}>{near?'E  TRAVEL':'NEXT ROOM'}</Text>
    <pointLight position={[0,2.3,1.2]} color={room.accent} intensity={near?4.2:2.2} distance={4.8} decay={2}/>
  </group>;
}
