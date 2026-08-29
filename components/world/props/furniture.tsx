'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { DoubleSide, Shape, type Group } from 'three';
import type { LayoutFurniture, RoomLayoutDefinition } from '@/lib/room-layouts';
import type { Room } from '@/lib/types';
import { useBurrow } from '@/store/use-burrow';
import { localAsset, threeText } from '@/lib/assets';
import { SURFACES } from '../materials';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');
const MONO=localAsset('fonts/ibm-plex-mono-latin-500-normal.woff');

function BeveledTop({width,depth,color,position=[0,1,0]}:{width:number;depth:number;color:string;position?:[number,number,number]}){
  return <RoundedBox args={[width,.18,depth]} radius={.075} smoothness={3} position={position} castShadow receiveShadow><meshStandardMaterial color={color} roughness={.88} metalness={.03}/></RoundedBox>;
}

function Desk({room,variant}:{room:Room;variant?:LayoutFurniture['variant']}){
  const width=variant==='compact'?3.25:4.05,technical=variant==='technical'||room.appearance.furniture==='modular';
  return <group>
    <BeveledTop width={width} depth={1.38} color={technical?'#293943':SURFACES.darkWood.color} position={[0,1.06,0]}/>
    <mesh position={[0,.91,-.58]}><boxGeometry args={[width-.3,.1,.1]}/><meshStandardMaterial color="#424b58" roughness={.8} metalness={.12}/></mesh>
    {[-width/2+.34,width/2-.34].map(x=><group key={x} position={[x,0,0]}>
      <RoundedBox args={[.17,.94,1.05]} radius={.035} position={[0,.53,0]} castShadow><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>
      <RoundedBox args={[.68,.12,1.2]} radius={.04} position={[0,.08,0]}><meshStandardMaterial {...SURFACES.darkMetal}/></RoundedBox>
      <mesh position={[0,.52,-.48]}><boxGeometry args={[.34,.08,.08]}/><meshStandardMaterial color="#576273" roughness={.72}/></mesh>
    </group>)}
    <RoundedBox args={[width*.58,.12,.35]} radius={.035} position={[0,.78,-.5]}><meshStandardMaterial color="#1b232e" roughness={.86}/></RoundedBox>
    {technical&&<>
      <RoundedBox args={[1.02,.12,.58]} radius={.035} position={[width*.23,1.2,.23]}><meshStandardMaterial color="#182730" roughness={.82}/></RoundedBox>
      <mesh position={[-width*.28,1.19,.28]}><cylinderGeometry args={[.14,.17,.12,18]}/><meshStandardMaterial color="#6a7480" roughness={.86}/></mesh>
      {[-.34,0,.34].map(x=><mesh key={x} position={[x,.84,-.64]}><circleGeometry args={[.028,10]}/><meshBasicMaterial color={x===0?'#82cfc7':'#65758d'}/></mesh>)}
    </>}
  </group>;
}

function Sofa({room,variant}:{room:Room;variant?:LayoutFurniture['variant']}){
  const width=variant==='wide'?5.15:3.75,count=variant==='wide'?4:3,gap=(width-.62)/count;
  const fabric=room.template==='lounge'?'#403a50':SURFACES.fabric.color;
  return <group>
    <RoundedBox args={[width,.38,1.65]} radius={.14} smoothness={4} position={[0,.38,0]} castShadow><meshStandardMaterial color="#252c3b" roughness={.96}/></RoundedBox>
    <RoundedBox args={[width-.22,.84,.34]} radius={.15} position={[0,1.04,-.67]} castShadow><meshStandardMaterial color={fabric} roughness={1}/></RoundedBox>
    {[-width/2+.22,width/2-.22].map(x=><RoundedBox key={x} args={[.42,.7,1.52]} radius={.16} position={[x,.72,0]} castShadow><meshStandardMaterial color="#303748" roughness={1}/></RoundedBox>)}
    {Array.from({length:count},(_,i)=><group key={i} position={[-(width-.62)/2+gap/2+i*gap,.82,.08]}>
      <RoundedBox args={[gap-.1,.3,1.18]} radius={.12} rotation={[0,0,(i%2?.008:-.008)]} castShadow><meshStandardMaterial color={i%2?fabric:'#384055'} roughness={1}/></RoundedBox>
      <RoundedBox args={[gap-.13,.68,.25]} radius={.11} position={[0,.45,-.52]} rotation={[-.05,0,0]}><meshStandardMaterial color={i%2?'#3a4054':'#454058'} roughness={1}/></RoundedBox>
    </group>)}
    {[-width*.34,width*.34].map(x=><group key={x} position={[x,.12,0]}><mesh><cylinderGeometry args={[.08,.095,.24,12]}/><meshStandardMaterial color="#171d28" roughness={.86}/></mesh></group>)}
    <RoundedBox args={[.9,.36,.16]} radius={.11} position={[width*.2,1.5,-.47]} rotation={[0,0,-.1]}><meshStandardMaterial color={room.accent} roughness={1}/></RoundedBox>
  </group>;
}

function Shelf({room,variant}:{room:Room;variant?:LayoutFurniture['variant']}){
  const width=variant==='low'?3.4:3.05,height=variant==='low'?2.35:3.25,levels=variant==='low'?2:4;
  return <group>
    {[-width/2,width/2].map(x=><RoundedBox key={x} args={[.18,height,.62]} radius={.045} position={[x,height/2,0]} castShadow><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>)}
    {Array.from({length:levels},(_,i)=>{const y=.14+i*((height-.18)/(levels-1));return <group key={i}>
      <RoundedBox args={[width+.18,.14,.76]} radius={.035} position={[0,y,0]} castShadow><meshStandardMaterial color={SURFACES.darkWood.color} roughness={.93}/></RoundedBox>
      {i<levels-1&&room.appearance.decor!=='minimal'&&Array.from({length:i%2?4:3},(_v,j)=><RoundedBox key={j} args={[.19+(j%2)*.07,.42+(j%3)*.08,.38]} radius={.025} position={[-width*.3+j*.45,y+.28,.05]} rotation={[0,0,(j-1)*.035]}><meshStandardMaterial color={['#566a82','#74667e','#607c77','#8b7867'][(i+j)%4]} roughness={.96}/></RoundedBox>)}
    </group>;})}
    <mesh position={[0,height*.52,-.31]}><boxGeometry args={[width-.15,height-.25,.06]}/><meshStandardMaterial color="#141a24" roughness={.94}/></mesh>
  </group>;
}

function FloorLamp({room}:{room:Room}){
  return <group>
    <mesh position={[0,.08,0]} castShadow><cylinderGeometry args={[.42,.5,.16,24]}/><meshStandardMaterial {...SURFACES.darkMetal}/></mesh>
    <mesh position={[0,1.28,0]}><cylinderGeometry args={[.035,.05,2.4,12]}/><meshStandardMaterial {...SURFACES.trim}/></mesh>
    <mesh position={[0,2.58,0]} castShadow><cylinderGeometry args={[.58,.34,.7,24,1,true]}/><meshStandardMaterial color="#c7c0b2" emissive="#c4a98a" emissiveIntensity={.035} roughness={1} side={DoubleSide}/></mesh>
    <mesh position={[0,2.31,0]}><sphereGeometry args={[.1,12,8]}/><meshBasicMaterial color="#dfc6a5"/></mesh>
    <pointLight position={[0,2.28,0]} color="#cbb39b" intensity={room.appearance.lighting==='cozy-night'?2.35:1.3} distance={4.25} decay={2}/>
  </group>;
}

function Plant({room}:{room:Room}){
  const leaves=useRef<Group>(null),reduced=useBurrow(state=>state.preferences.reducedEffects);
  useFrame(({clock})=>{if(leaves.current&&!reduced&&!document.hidden)leaves.current.rotation.z=Math.sin(clock.elapsedTime*.28)*.008;});
  return <group>
    <mesh position={[0,.32,0]} castShadow><cylinderGeometry args={[.34,.46,.64,16]}/><meshStandardMaterial color={room.appearance.decor==='technical'?'#39444f':'#393846'} roughness={.94}/></mesh>
    <mesh position={[0,.62,0]}><cylinderGeometry args={[.025,.04,.9,8]}/><meshStandardMaterial color="#435f53" roughness={1}/></mesh>
    <group ref={leaves} position={[0,.72,0]}>{Array.from({length:8},(_,i)=>{const a=i/8*Math.PI*2;return <mesh key={i} position={[Math.cos(a)*.2,.25+(i%3)*.13,Math.sin(a)*.2]} rotation={[Math.sin(a)*.42,a,-Math.cos(a)*.38]} castShadow><capsuleGeometry args={[.11,.5,3,8]}/><meshStandardMaterial color={i%2?'#48685b':'#597668'} roughness={1}/></mesh>;})}</group>
  </group>;
}

function CoffeeTable({room}:{room:Room}){
  return <group>
    <RoundedBox args={[3,.22,1.42]} radius={.13} smoothness={4} position={[0,.48,0]} castShadow receiveShadow><meshStandardMaterial color={room.template==='lounge'?'#3a303b':SURFACES.darkWood.color} roughness={.92}/></RoundedBox>
    <RoundedBox args={[2.2,.12,.9]} radius={.05} position={[0,.17,0]}><meshStandardMaterial color="#1b222d" roughness={.88}/></RoundedBox>
    {[-1.18,1.18].flatMap(x=>[-.48,.48].map(z=><mesh key={`${x}-${z}`} position={[x,.24,z]}><cylinderGeometry args={[.055,.07,.38,10]}/><meshStandardMaterial {...SURFACES.darkMetal}/></mesh>))}
    <mesh position={[.65,.65,.05]}><cylinderGeometry args={[.18,.2,.09,18]}/><meshStandardMaterial color="#555e69" roughness={.9}/></mesh>
  </group>;
}

function MediaConsole({room}:{room:Room}){
  return <group>
    <RoundedBox args={[5.7,.72,.9]} radius={.13} position={[0,.42,0]} castShadow><meshStandardMaterial color="#202733" roughness={.9}/></RoundedBox>
    {[-1.85,0,1.85].map((x,i)=><group key={x} position={[x,.44,.47]}>
      <RoundedBox args={[1.62,.47,.04]} radius={.035}><meshStandardMaterial color={i===1?'#17212b':'#2f3542'} roughness={.9}/></RoundedBox>
      <mesh position={[0,.03,.025]}><boxGeometry args={[1.1,.02,.02]}/><meshBasicMaterial color={i===1?room.accent:'#596171'}/></mesh>
    </group>)}
    {[-2.25,2.25].map(x=><mesh key={x} position={[x,.08,0]}><cylinderGeometry args={[.07,.09,.16,12]}/><meshStandardMaterial {...SURFACES.darkMetal}/></mesh>)}
  </group>;
}

function LoungeChair({room}:{room:Room}){
  const shell=new Shape();shell.moveTo(-.72,-.55);shell.quadraticCurveTo(-.9,.25,-.52,.72);shell.quadraticCurveTo(0,1.05,.52,.72);shell.quadraticCurveTo(.9,.25,.72,-.55);shell.closePath();
  return <group>
    <mesh position={[0,1.02,-.18]} rotation={[0,0,0]} castShadow><extrudeGeometry args={[shell,{depth:.42,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.08,bevelThickness:.08}]}/><meshStandardMaterial color="#303748" roughness={.96}/></mesh>
    <RoundedBox args={[1.35,.28,1.25]} radius={.14} position={[0,.56,.15]} castShadow><meshStandardMaterial color={SURFACES.fabricAlt.color} roughness={1}/></RoundedBox>
    <mesh position={[0,.23,0]}><cylinderGeometry args={[.1,.15,.5,14]}/><meshStandardMaterial {...SURFACES.darkMetal}/></mesh>
    <mesh position={[0,.08,0]} rotation={[-Math.PI/2,0,0]}><cylinderGeometry args={[.48,.48,.09,20]}/><meshStandardMaterial color="#202633" roughness={.86}/></mesh>
    <RoundedBox args={[.72,.25,.12]} radius={.09} position={[.26,1.55,.05]} rotation={[0,0,-.08]}><meshStandardMaterial color={room.accent} roughness={1}/></RoundedBox>
  </group>;
}

function UtilityRack({room}:{room:Room}){
  return <group>
    <RoundedBox args={[1.75,2.25,1]} radius={.1} position={[0,1.15,0]} castShadow><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>
    {Array.from({length:5},(_,i)=><group key={i} position={[0,.36+i*.39,.52]}>
      <RoundedBox args={[1.4,.25,.055]} radius={.025}><meshStandardMaterial color="#121a23" roughness={.82}/></RoundedBox>
      {[-.5,.5].map((x,j)=><mesh key={x} position={[x,0,.032]}><circleGeometry args={[.025,9]}/><meshBasicMaterial color={j===i%2?room.accent:'#4f5b68'}/></mesh>)}
    </group>)}
    <mesh position={[0,2.43,0]}><boxGeometry args={[1.05,.08,.55]}/><meshStandardMaterial color="#394553" roughness={.82}/></mesh>
  </group>;
}

function NotesBoard(){
  const note=useBurrow(state=>state.note),setTrayOpen=useBurrow(state=>state.setTrayOpen);
  return <group onClick={()=>setTrayOpen(true)} userData={{interactionId:'__notes'}}>
    <RoundedBox args={[2.55,1.62,.2]} radius={.1} castShadow><meshStandardMaterial color="#30323b" roughness={.96}/></RoundedBox>
    <RoundedBox args={[2.23,1.3,.055]} position={[0,0,.13]} radius={.035}><meshStandardMaterial {...SURFACES.paper}/></RoundedBox>
    <Text font={MONO} position={[-.9,.44,.17]} anchorX="left" maxWidth={1.8} fontSize={.075} lineHeight={1.4} color="#34333a">POCKET NOTE{`\n\n`}{threeText((note||'A thought can live here.').slice(0,62))}</Text>
    {[-.76,.64].map((x,i)=><mesh key={x} position={[x,.57,.18]}><circleGeometry args={[.045,12]}/><meshBasicMaterial color={i?'#7580a0':'#836f87'}/></mesh>)}
  </group>;
}

function ActivityRack({room}:{room:Room}){
  const objects=useBurrow(state=>state.objects),activity=useBurrow(state=>state.activity),setLauncher=useBurrow(state=>state.setLauncher);
  const favoriteCount=objects.filter(object=>object.favorite).length;
  return <group onClick={()=>setLauncher(true)} userData={{interactionId:'__favorites'}}>
    <RoundedBox args={[3.05,1.15,.18]} radius={.08} castShadow><meshStandardMaterial color="#1d2531" roughness={.9}/></RoundedBox>
    <Text font={MONO} position={[-1.28,.35,.12]} anchorX="left" fontSize={.06} color={room.accent}>FAVORITES / RECENT</Text>
    <Text font={FONT} position={[-1.28,.06,.12]} anchorX="left" maxWidth={2.45} fontSize={.12} color="#e7ebf2">{favoriteCount} pinned · {activity[0]?.name??'Ready when you are'}</Text>
    {[-.95,-.35,.25,.85].map((x,i)=><RoundedBox key={x} args={[.42,.2,.08]} radius={.035} position={[x,-.36,.13]}><meshStandardMaterial color={['#5f8ba5','#6676a0','#806d91','#557b78'][i]} roughness={.9}/></RoundedBox>)}
  </group>;
}

export function RoomFurniture({room,layout}:{room:Room;layout:RoomLayoutDefinition}){
  return <>{layout.furniture.map(item=>{
    if(item.kind==='plant'&&room.appearance.decor!=='plants')return null;
    if(item.kind==='shelf'&&room.appearance.decor==='minimal')return null;
    const scale=room.appearance.furniture==='compact'?.93:room.appearance.furniture==='modular'?1.03:1;
    return <group key={item.id} position={item.position} rotation={[0,item.rotation??0,0]} scale={item.kind==='notes-board'||item.kind==='activity-rack'?1:scale}>
      {item.kind==='desk'?<Desk room={room} variant={item.variant}/>:item.kind==='sofa'?<Sofa room={room} variant={item.variant}/>:item.kind==='shelf'?<Shelf room={room} variant={item.variant}/>:item.kind==='lamp'?<FloorLamp room={room}/>:item.kind==='plant'?<Plant room={room}/>:item.kind==='coffee-table'?<CoffeeTable room={room}/>:item.kind==='media-console'?<MediaConsole room={room}/>:item.kind==='lounge-chair'?<LoungeChair room={room}/>:item.kind==='utility'?<UtilityRack room={room}/>:item.kind==='notes-board'?<NotesBoard/>:<ActivityRack room={room}/>} 
    </group>;
  })}</>;
}
