'use client';

import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Text } from '@react-three/drei';
import { BufferAttribute, DoubleSide, Object3D, type InstancedMesh, type Points } from 'three';
import type { LayoutWindow } from '@/lib/room-layouts';
import type { WorldWidgetViewModel } from '@/lib/integrations/contracts';
import type { Room } from '@/lib/types';
import { localAsset, threeText } from '@/lib/assets';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');
const MONO=localAsset('fonts/ibm-plex-mono-latin-500-normal.woff');

function seeded(index:number,offset:number){const value=Math.sin(index*91.17+offset*17.31)*43758.5453;return value-Math.floor(value);}

function Precipitation({condition,width,height,reduced}:{condition:string;width:number;height:number;reduced:boolean}){
  const points=useRef<Points>(null),count=condition==='snow'?48:72;
  const positions=useMemo(()=>{const values=new Float32Array(count*3);for(let i=0;i<count;i++){values[i*3]=(seeded(i,1)-.5)*width;values[i*3+1]=(seeded(i,2)-.5)*height;values[i*3+2]=-.12-seeded(i,3)*1.6;}return values;},[count,height,width]);
  useFrame(({clock},delta)=>{
    if(!points.current||reduced||document.hidden)return;
    const attribute=points.current.geometry.getAttribute('position') as BufferAttribute;
    for(let i=0;i<count;i++){
      const speed=condition==='snow'?.28+seeded(i,5)*.22:1.9+seeded(i,5)*1.2;
      attribute.array[i*3+1]-=speed*delta;
      if(condition==='snow')attribute.array[i*3]+=(Math.sin(clock.elapsedTime*.7+i)*.035)*delta;
      if(attribute.array[i*3+1]<-height/2){attribute.array[i*3+1]=height/2;attribute.array[i*3]=(seeded(i,clock.elapsedTime)-.5)*width;}
    }
    attribute.needsUpdate=true;
  });
  if(reduced)return null;
  return <points ref={points} position={[0,0,-.16]}><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><pointsMaterial color={condition==='snow'?'#e8f2f7':'#80aeca'} size={condition==='snow'?.065:.032} transparent opacity={condition==='storm'?.44:.62} sizeAttenuation/></points>;
}

function exteriorCondition(room:Room,widget?:WorldWidgetViewModel){
  if(widget?.secondary)return widget.secondary.toLowerCase();
  if(room.appearance.exterior==='quiet-rain')return'rain';
  if(room.appearance.exterior==='snowfall')return'snow';
  return'clear';
}

function WeatherStreaks({window}:{window:LayoutWindow}){const positions=useMemo(()=>new Float32Array(Array.from({length:7},(_,i)=>{const x=-window.width*.42+i*(window.width*.84/6),y=-.1+(i%3)*.36,length=.42+(i%2)*.18;return[x+.03,y+length/2,.19,x-.03,y-length/2,.19];}).flat()),[window.width]);return <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[positions,3]}/></bufferGeometry><lineBasicMaterial color="#a5c7d8" transparent opacity={.16}/></lineSegments>}

function WindowMullions({window}:{window:LayoutWindow}){const mullions=useRef<InstancedMesh>(null);useLayoutEffect(()=>{const temp=new Object3D();[[.075,window.height,.07],[window.width,.075,.07]].forEach((scale,index)=>{temp.position.set(0,0,.225);temp.scale.set(scale[0],scale[1],scale[2]);temp.updateMatrix();mullions.current?.setMatrixAt(index,temp.matrix);});if(mullions.current)mullions.current.instanceMatrix.needsUpdate=true;},[window.height,window.width]);return <instancedMesh ref={mullions} args={[undefined,undefined,2]}><boxGeometry/><meshStandardMaterial color="#485363" roughness={.72}/></instancedMesh>}

export function ExteriorWindow({room,window,widget,reduced,enabled}:{room:Room;window:LayoutWindow;widget?:WorldWidgetViewModel;reduced:boolean;enabled:boolean}){
  const condition=exteriorCondition(room,widget),night=['city-night','deep-space'].includes(room.appearance.exterior);
  const sky=condition==='storm'?'#1d2634':condition==='rain'?'#26394a':condition==='snow'?'#60778b':condition==='cloudy'?'#3e5064':night?'#10223c':'#3f6b8d';
  const activeWeather=enabled&&room.appearance.windowEffect!=='still';
  return <group position={window.position} rotation={[0,window.rotation,0]} userData={widget?{interactionId:`__live:${widget.id}`}:{}}>
    <RoundedBox args={[window.width+.46,window.height+.46,.24]} radius={.14} smoothness={4}><meshStandardMaterial color="#313a49" roughness={.76} metalness={.1}/></RoundedBox>
    <mesh position={[0,0,.13]}><planeGeometry args={[window.width,window.height]}/><meshBasicMaterial color={sky} side={DoubleSide}/></mesh>
    <mesh position={[0,-window.height*.34,.145]}><planeGeometry args={[window.width*.98,window.height*.3]}/><meshBasicMaterial color={night?'#233b55':'#496276'} transparent opacity={.72}/></mesh>
    {(condition==='cloudy'||condition==='rain'||condition==='storm'||condition==='snow')&&[-.24,.2].map((y,i)=><mesh key={y} position={[(i?-.16:.24)*window.width,y*window.height,.17]} scale={[i?1.2:1,.82,1]}><circleGeometry args={[window.width*.24,30]}/><meshBasicMaterial color={condition==='storm'?'#34404d':'#718292'} transparent opacity={condition==='storm'?.42:.28}/></mesh>)}
    {activeWeather&&(condition==='rain'||condition==='storm'||condition==='snow')&&<Precipitation condition={condition} width={window.width*.94} height={window.height*.92} reduced={reduced}/>} 
    {activeWeather&&(condition==='rain'||condition==='storm')&&<WeatherStreaks window={window}/>}
    <mesh position={[0,0,.205]}><planeGeometry args={[window.width,window.height]}/><meshPhysicalMaterial color="#8eb3c9" transmission={.1} transparent opacity={.08} roughness={.25} side={DoubleSide}/></mesh>
    <WindowMullions window={window}/>
    {widget&&<group position={[0,-window.height/2-.43,.18]}>
      <RoundedBox args={[Math.min(2.45,window.width*.72),.48,.08]} radius={.06}><meshStandardMaterial color="#151d28" roughness={.86}/></RoundedBox>
      <Text font={MONO} position={[-Math.min(1.03,window.width*.3),.07,.05]} anchorX="left" fontSize={.055} color={widget.tone}>{threeText(widget.title.toUpperCase().slice(0,28))}</Text>
      <Text font={FONT} position={[Math.min(1.03,window.width*.3),-.08,.05]} anchorX="right" fontSize={.12} color="#edf3f7">{threeText(widget.primary.slice(0,16))}</Text>
    </group>}
  </group>;
}
