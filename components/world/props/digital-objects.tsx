'use client';

import { Instance, Instances, RoundedBox, Text } from '@react-three/drei';
import type { BookmarkObject } from '@/lib/types';
import { localAsset, threeText } from '@/lib/assets';
import { siteIdentity } from '@/lib/site-identity';
import { SURFACES } from '../materials';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');
const MONO=localAsset('fonts/ibm-plex-mono-latin-500-normal.woff');

type ObjectProps={object:BookmarkObject;selected:boolean;active:boolean};
type ScreenProps=ObjectProps&{size?:[number,number];position?:[number,number,number];rotation?:[number,number,number];label?:string};

function ScreenPanel({object,size=[1.42,.82],position=[0,1.35,.36],rotation=[0,0,0],selected,active,label}:ScreenProps){
  const identity=siteIdentity(object);const intensity=active?.34:selected?.24:.1;
  return <group position={position} rotation={rotation}>
    <RoundedBox args={[size[0]+.16,size[1]+.16,.075]} radius={.055}><meshStandardMaterial {...SURFACES.darkMetal}/></RoundedBox>
    <mesh position={[0,0,.043]}><planeGeometry args={size}/><meshStandardMaterial color="#08111c" emissive={object.color} emissiveIntensity={intensity} roughness={.88}/></mesh>
    <Text font={FONT} position={[0,.075,.049]} fontSize={Math.min(size[0],size[1])*.25} color="#f2f5fb" anchorX="center" anchorY="middle">{threeText(identity.monogram)}</Text>
    {size[0]>.92&&<Text font={MONO} position={[0,-size[1]*.29,.05]} maxWidth={size[0]*.78} fontSize={.058} color="#9ba8bc" anchorX="center">{threeText(label??identity.domain)}</Text>}
    <mesh position={[0,-size[1]*.43,.052]}><planeGeometry args={[size[0]*.58,.014]}/><meshBasicMaterial color={object.color} transparent opacity={active?.72:.38}/></mesh>
  </group>;
}

function StatusLight({color,active,position=[0,0,0]}:{color:string;active:boolean;position?:[number,number,number]}){return <group position={position}><mesh><sphereGeometry args={[.035,10,8]}/><meshStandardMaterial color={active?'#edfdf7':'#6b7789'} emissive={color} emissiveIntensity={active?.65:.12} roughness={.45}/></mesh><mesh position={[0,0,-.022]}><cylinderGeometry args={[.065,.065,.025,16]}/><meshStandardMaterial {...SURFACES.trim}/></mesh></group>}

function VentStrip({position,rotation=[0,0,0],count=5}:{position:[number,number,number];rotation?:[number,number,number];count?:number}){return <group position={position} rotation={rotation}>{Array.from({length:count},(_,index)=><mesh key={index} position={[(index-(count-1)/2)*.105,0,0]}><boxGeometry args={[.055,.012,.018]}/><meshBasicMaterial color="#687384"/></mesh>)}</group>}

function Keyboard({position=[0,.56,.24],width=1.3}:{position?:[number,number,number];width?:number}){return <group position={position}><RoundedBox args={[width,.075,.48]} radius={.035}><meshStandardMaterial {...SURFACES.plastic}/></RoundedBox>{Array.from({length:4},(_,row)=>Array.from({length:8},(__,column)=><mesh key={`${row}-${column}`} position={[(column-3.5)*width/9,.045,(row-1.5)*.085]}><boxGeometry args={[width/11,.018,.048]}/><meshStandardMaterial color={row===3&&column>4?'#566176':'#3a4352'} roughness={.9}/></mesh>))}</group>}

function Feet({width=.85,z=0}:{width?:number;z?:number}){return <>{[-width,width].map(x=><RoundedBox key={x} args={[.22,.12,.42]} radius={.045} position={[x,.09,z]}><meshStandardMaterial {...SURFACES.graphite}/></RoundedBox>)}</>}

function Terminal({object,selected,active}:ObjectProps){return <group>
  <Feet width={.63}/><mesh position={[0,.47,0]}><cylinderGeometry args={[.13,.2,.74,14]}/><meshStandardMaterial {...SURFACES.trim}/></mesh>
  <RoundedBox args={[1.82,1.2,.48]} position={[0,1.35,0]} radius={.13} castShadow><meshStandardMaterial {...SURFACES.graphite}/></RoundedBox>
  <ScreenPanel object={object} selected={selected} active={active}/><VentStrip position={[0,1.83,-.25]} count={6}/><StatusLight color={object.color} active={active} position={[.67,.88,.25]}/>
  <Keyboard position={[0,.18,.24]} width={1.34}/>
  <mesh position={[-.73,1.35,.24]}><boxGeometry args={[.035,.82,.03]}/><meshStandardMaterial color={object.color} roughness={.8}/></mesh>
  </group>}

function Television({object,selected,active}:ObjectProps){return <group position={[0,-.24,0]}>
  <RoundedBox args={[2.72,1.7,.4]} position={[0,1.48,0]} radius={.16} castShadow><meshStandardMaterial {...SURFACES.graphite}/></RoundedBox>
  <ScreenPanel object={object} size={[2.35,1.3]} position={[0,1.5,.22]} selected={selected} active={active}/>
  <RoundedBox args={[1.8,.3,.72]} position={[0,.39,0]} radius={.08}><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>
  <mesh position={[0,.73,.02]}><cylinderGeometry args={[.09,.13,.55,16]}/><meshStandardMaterial {...SURFACES.trim}/></mesh>
  {[-1.08,1.08].map(x=><group key={x} position={[x,1.48,.23]}>{[-.28,-.14,0,.14,.28].map(y=><mesh key={y} position={[0,y,0]}><circleGeometry args={[.022,10]}/><meshBasicMaterial color="#596575"/></mesh>)}</group>)}
  </group>}

function Book({object,active}:ObjectProps){const identity=siteIdentity(object),shelfMounted=object.mount?.kind==='shelf';return <group position={[0,shelfMounted?.44:.9,shelfMounted?.44:0]} scale={shelfMounted?.48:1} rotation={[0,0,-.055]}>
  <RoundedBox args={[1.1,1.78,.38]} radius={.08} castShadow><meshStandardMaterial color={object.color} roughness={.92}/></RoundedBox>
  <RoundedBox args={[.91,1.56,.08]} position={[.04,0,.22]} radius={.035}><meshStandardMaterial color="#202432" roughness={1}/></RoundedBox>
  <mesh position={[-.48,0,.23]}><boxGeometry args={[.065,1.48,.05]}/><meshStandardMaterial color="#d9d2c5" roughness={1}/></mesh>
  <Text font={FONT} position={[.06,.2,.27]} fontSize={.21} maxWidth={.72} textAlign="center" color="#f5f4f8">{threeText(identity.monogram)}</Text>
  <Text font={MONO} position={[.06,-.27,.27]} fontSize={.06} maxWidth={.7} textAlign="center" color="#adb4c4">{threeText(identity.category.toUpperCase())}</Text>
  <mesh position={[.06,-.52,.273]}><planeGeometry args={[.52,.018]}/><meshBasicMaterial color={active?'#ffffff':object.color}/></mesh>
  </group>}

function Poster({object,selected,active}:ObjectProps){return <group>
  <RoundedBox args={[1.62,2.48,.16]} position={[0,1.5,0]} radius={.045} castShadow><meshStandardMaterial {...SURFACES.darkWood}/></RoundedBox>
  <ScreenPanel object={object} size={[1.32,2.12]} position={[0,1.5,.095]} selected={selected} active={active}/>
  {[-.66,.66].map(x=><mesh key={x} position={[x,2.55,.1]}><cylinderGeometry args={[.035,.035,.035,12]}/><meshStandardMaterial color="#b59b78" roughness={.7}/></mesh>)}
  </group>}

function Arcade({object,selected,active}:ObjectProps){return <group>
  <RoundedBox args={[1.44,1.6,1.1]} position={[0,.82,-.06]} radius={.11} castShadow><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>
  <RoundedBox args={[1.44,1.1,.86]} position={[0,1.66,-.13]} rotation={[-.14,0,0]} radius={.11}><meshStandardMaterial {...SURFACES.graphite}/></RoundedBox>
  <ScreenPanel object={object} size={[1.08,.65]} position={[0,1.69,.32]} rotation={[-.14,0,0]} selected={selected} active={active}/>
  <RoundedBox args={[1.36,.23,.7]} position={[0,1.03,.3]} radius={.07}><meshStandardMaterial color="#343145" roughness={.86}/></RoundedBox>
  <mesh position={[-.3,1.18,.66]}><cylinderGeometry args={[.045,.065,.22,12]}/><meshStandardMaterial color="#aab3c2" roughness={.68}/></mesh><mesh position={[-.3,1.3,.66]}><sphereGeometry args={[.075,12,8]}/><meshStandardMaterial color={object.color} roughness={.52}/></mesh>
  {[-.03,.17,.37].map((x,index)=><mesh key={x} position={[x,1.14,.66]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.047,.047,.035,12]}/><meshStandardMaterial color={index===2?'#cfaa77':'#707da1'} roughness={.62}/></mesh>)}
  <VentStrip position={[0,.43,.5]} count={7}/>
  </group>}

function Pedestal({object,active}:ObjectProps){const identity=siteIdentity(object);return <group>
  <mesh position={[0,.42,0]} castShadow><cylinderGeometry args={[.58,.8,.84,10]}/><meshStandardMaterial {...SURFACES.paintedMetal}/></mesh>
  <mesh position={[0,.86,0]}><cylinderGeometry args={[.49,.58,.08,16]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={active?.3:.12} roughness={.72}/></mesh>
  <mesh position={[0,1.38,0]} rotation={[0,Math.PI/4,0]}><octahedronGeometry args={[.5,0]}/><meshStandardMaterial color={object.color} emissive={object.color} emissiveIntensity={active?.42:.2} roughness={.58} transparent opacity={.88}/></mesh>
  <mesh position={[0,1.38,0]}><torusGeometry args={[.7,.018,8,48]}/><meshBasicMaterial color={object.color} transparent opacity={active?.62:.28}/></mesh>
  <Text font={FONT} position={[0,1.39,.54]} fontSize={.15} color="#ffffff">{identity.monogram}</Text>
  </group>}

function Laptop({object,selected,active}:ObjectProps){return <group position={[0,-.555,0]}>
  <RoundedBox args={[1.66,.11,1.08]} position={[0,.61,.13]} radius={.055} castShadow><meshStandardMaterial {...SURFACES.trim}/></RoundedBox>
  <RoundedBox args={[1.62,1.05,.12]} position={[0,1.14,-.34]} rotation={[-.11,0,0]} radius={.06}><meshStandardMaterial {...SURFACES.graphite}/></RoundedBox>
  <ScreenPanel object={object} size={[1.38,.82]} position={[0,1.14,-.273]} rotation={[-.11,0,0]} selected={selected} active={active}/>
  <Keyboard position={[0,.665,.2]} width={1.35}/><mesh position={[0,.67,.58]} rotation={[-Math.PI/2,0,0]}><planeGeometry args={[.45,.23]}/><meshStandardMaterial color="#343d4b" roughness={.72}/></mesh>
  </group>}

function Radio({object,active}:ObjectProps){const identity=siteIdentity(object);return <group position={[0,-.15,0]}>
  <RoundedBox args={[1.68,1.1,.78]} position={[0,.7,0]} radius={.15} castShadow><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>
  <mesh position={[-.43,.7,.405]}><cylinderGeometry args={[.34,.34,.05,32]}/><meshStandardMaterial color="#101621" roughness={1}/></mesh>
  {Array.from({length:4},(_,ring)=><mesh key={ring} position={[-.43,.7,.438]}><ringGeometry args={[.07+ring*.065,.083+ring*.065,24]}/><meshBasicMaterial color={ring===3&&active?object.color:'#536071'}/></mesh>)}
  <ScreenPanel object={object} size={[.57,.4]} position={[.37,.79,.405]} selected={false} active={active} label={identity.category}/>
  <StatusLight color={object.color} active={active} position={[.6,.38,.43]}/>
  <mesh position={[0,1.42,-.08]} rotation={[0,0,.18]}><cylinderGeometry args={[.022,.022,1.18,8]}/><meshStandardMaterial {...SURFACES.trim}/></mesh>
  <RoundedBox args={[.65,.09,.14]} position={[.32,1.2,.3]} radius={.025}><meshStandardMaterial {...SURFACES.darkMetal}/></RoundedBox>
  </group>}

function FileBox({object}:ObjectProps){const identity=siteIdentity(object);return <group>
  <RoundedBox args={[1.42,.94,1.08]} position={[0,.5,0]} radius={.1} castShadow><meshStandardMaterial color={object.color} roughness={.94}/></RoundedBox>
  <RoundedBox args={[1.52,.15,1.15]} position={[0,.99,0]} radius={.045}><meshStandardMaterial {...SURFACES.paper}/></RoundedBox>
  <RoundedBox args={[.76,.38,.04]} position={[0,.56,.555]} radius={.03}><meshStandardMaterial color="#ece8df" roughness={1}/></RoundedBox>
  <Text font={FONT} position={[0,.58,.58]} fontSize={.12} color="#272b37">{threeText(identity.monogram)}</Text>
  <Instances limit={3}><boxGeometry args={[.6,.72,.045]}/><meshStandardMaterial roughness={1}/>{[[-.33,1.2,-.12],[0,1.28,-.02],[.34,1.18,.04]].map((p,index)=><Instance key={index} position={p as [number,number,number]} rotation={[-.15+index*.05,0,(index-1)*.04]} color={index===1?'#d8d2c6':'#aeb9c4'}/>)}</Instances>
  </group>}

function DeskMonitor({object,selected,active}:ObjectProps){return <group position={[0,-.32,0]}>
  <RoundedBox args={[2.12,1.34,.26]} position={[0,1.43,0]} radius={.13} castShadow><meshStandardMaterial {...SURFACES.graphite}/></RoundedBox>
  <ScreenPanel object={object} size={[1.8,1.01]} position={[0,1.43,.15]} selected={selected} active={active}/>
  <mesh position={[0,.73,.01]}><cylinderGeometry args={[.075,.12,.63,14]}/><meshStandardMaterial {...SURFACES.trim}/></mesh>
  <RoundedBox args={[.88,.12,.6]} radius={.05} position={[0,.38,.08]}><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>
  <StatusLight color={object.color} active={active} position={[.8,.82,.16]}/><VentStrip position={[0,2.05,-.14]} count={7}/>
  </group>}

function WallDisplay({object,selected,active}:ObjectProps){return <group>
  <RoundedBox args={[2.82,1.8,.18]} position={[0,1.56,0]} radius={.11} castShadow><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>
  <ScreenPanel object={object} size={[2.43,1.42]} position={[0,1.56,.105]} selected={selected} active={active}/>
  {[-1.16,1.16].map(x=><group key={x} position={[x,.48,-.04]}><RoundedBox args={[.16,.68,.32]} radius={.05}><meshStandardMaterial {...SURFACES.trim}/></RoundedBox><mesh position={[0,-.36,-.08]}><boxGeometry args={[.42,.1,.48]}/><meshStandardMaterial {...SURFACES.graphite}/></mesh></group>)}
  </group>}

function Tablet({object,selected,active}:ObjectProps){return <group position={[0,-.08,0]} rotation={[-.17,0,0]}>
  <RoundedBox args={[1.16,1.7,.12]} position={[0,.98,0]} radius={.12} castShadow><meshStandardMaterial {...SURFACES.graphite}/></RoundedBox>
  <ScreenPanel object={object} size={[.95,1.4]} position={[0,.99,.07]} selected={selected} active={active}/>
  <mesh position={[0,.2,-.17]}><boxGeometry args={[.72,.12,.7]}/><meshStandardMaterial {...SURFACES.paintedMetal}/></mesh>
  <mesh position={[0,.16,.26]}><cylinderGeometry args={[.035,.035,.5,10]}/><meshStandardMaterial {...SURFACES.trim}/></mesh>
  </group>}

function CompactPortal({object,active}:ObjectProps){const identity=siteIdentity(object);return <group position={[0,-.06,0]}>
  <RoundedBox args={[1.65,.24,.82]} radius={.1} position={[0,.18,0]}><meshStandardMaterial {...SURFACES.paintedMetal}/></RoundedBox>
  <mesh position={[0,1.2,0]}><torusGeometry args={[.7,.095,12,48]}/><meshStandardMaterial color="#364253" emissive={object.color} emissiveIntensity={active?.25:.08} roughness={.78}/></mesh>
  <mesh position={[0,1.2,-.035]}><circleGeometry args={[.61,40]}/><meshStandardMaterial color="#09121e" emissive={object.color} emissiveIntensity={active?.12:.035} roughness={1}/></mesh>
  <mesh position={[0,1.2,.004]}><ringGeometry args={[.37,.39,40]}/><meshBasicMaterial color={object.color} transparent opacity={active?.65:.3}/></mesh>
  <Text font={FONT} position={[0,1.21,.03]} fontSize={.2} color="#f3f6fb">{identity.monogram}</Text>
  {[-.78,.78].map(x=><RoundedBox key={x} args={[.22,1.58,.3]} radius={.08} position={[x,.83,0]}><meshStandardMaterial {...SURFACES.trim}/></RoundedBox>)}
  <StatusLight color={object.color} active={active} position={[.58,.21,.43]}/>
  </group>}

export function DigitalObject({object,selected,active}:ObjectProps){
  if(object.archetype==='terminal')return <Terminal object={object} selected={selected} active={active}/>;
  if(object.archetype==='tv')return <Television object={object} selected={selected} active={active}/>;
  if(object.archetype==='book')return <Book object={object} selected={selected} active={active}/>;
  if(object.archetype==='poster')return <Poster object={object} selected={selected} active={active}/>;
  if(object.archetype==='arcade')return <Arcade object={object} selected={selected} active={active}/>;
  if(object.archetype==='pedestal')return <Pedestal object={object} selected={selected} active={active}/>;
  if(object.archetype==='laptop')return <Laptop object={object} selected={selected} active={active}/>;
  if(object.archetype==='radio')return <Radio object={object} selected={selected} active={active}/>;
  if(object.archetype==='file-box')return <FileBox object={object} selected={selected} active={active}/>;
  if(object.archetype==='desk-monitor')return <DeskMonitor object={object} selected={selected} active={active}/>;
  if(object.archetype==='wall-display')return <WallDisplay object={object} selected={selected} active={active}/>;
  if(object.archetype==='tablet')return <Tablet object={object} selected={selected} active={active}/>;
  return <CompactPortal object={object} selected={selected} active={active}/>;
}
