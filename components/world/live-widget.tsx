'use client';

import { RoundedBox, Text } from '@react-three/drei';
import type { WorldWidgetViewModel } from '@/lib/integrations/contracts';

export function LiveWidget({widget,position,rotation=0,near}:{widget:WorldWidgetViewModel;position:[number,number,number];rotation?:number;near:boolean}) {
  const wall=widget.kind==='weather-window'||widget.kind==='calendar'||widget.kind==='feed';
  return <group position={position} rotation={[0,rotation,0]} userData={{interactionId:`__live:${widget.id}`}}>
    <RoundedBox args={wall?[3.2,2.05,.18]:[2.5,1.65,.85]} radius={.12} smoothness={3} position={[0,wall?1.5:.85,0]} castShadow>
      <meshStandardMaterial color={near?'#252d4a':'#111529'} emissive={widget.tone} emissiveIntensity={near ? .18 : .055} metalness={.36} roughness={.48}/>
    </RoundedBox>
    <mesh position={[0,wall?1.52:.98,wall ? .105 : .435]}>
      <planeGeometry args={wall?[2.82,1.68]:[2.14,1.06]}/>
      <meshStandardMaterial color="#070a14" emissive={widget.tone} emissiveIntensity={.13}/>
    </mesh>
    <Text position={[0,wall?2.05:1.28,wall ? .12 : .45]} fontSize={.13} color={widget.tone} anchorX="center" anchorY="middle" maxWidth={2.5}>{widget.title.toUpperCase()}</Text>
    <Text position={[0,wall?1.57:.95,wall ? .12 : .45]} fontSize={wall ? .26 : .19} color="#f6f5ff" anchorX="center" anchorY="middle" maxWidth={wall?2.5:1.9} textAlign="center">{widget.primary.slice(0,70)}</Text>
    <Text position={[0,wall?1.05:.66,wall ? .12 : .45]} fontSize={.11} color="#9ca5bc" anchorX="center" anchorY="middle" maxWidth={wall?2.5:1.9} textAlign="center">{widget.secondary.slice(0,90)}</Text>
    <mesh position={[wall?1.34:1.02,wall?2.28:1.5,wall ? .12 : .45]}><sphereGeometry args={[.045,10,10]}/><meshBasicMaterial color={widget.active?'#80f0c2':'#778099'}/></mesh>
  </group>;
}
