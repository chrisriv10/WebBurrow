'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { CapsuleCollider, RigidBody, useRapier, type RapierRigidBody } from '@react-three/rapier';
import { Vector3 } from 'three';
import type { Room } from '@/lib/types';
import { useBurrow } from '@/store/use-burrow';
import { playerTelemetry } from '@/world/telemetry';

export function PlayerController({room,enabled}:{room:Room;enabled:boolean}) {
  const body=useRef<RapierRigidBody>(null);
  const keys=useRef(new Set<string>());
  const velocity=useRef(new Vector3());
  const verticalVelocity=useRef(0);
  const lastTeleport=useRef(-1);
  const walkTime=useRef(0);
  const grounded=useRef(true);
  const {camera}=useThree();
  const {world}=useRapier();
  const teleportNonce=useBurrow(s=>s.teleportNonce);
  const teleportTarget=useBurrow(s=>s.teleportTarget);
  const controller=useMemo(()=>{
    const next=world.createCharacterController(.025);
    next.enableAutostep(.32,.16,true);
    next.enableSnapToGround(.26);
    next.setMaxSlopeClimbAngle(Math.PI*.28);
    next.setMinSlopeSlideAngle(Math.PI*.34);
    return next;
  },[world]);

  useEffect(()=>()=>world.removeCharacterController(controller),[controller,world]);
  useEffect(()=>{
    const down=(event:KeyboardEvent)=>{
      if(event.target instanceof HTMLElement&&event.target.matches('input,textarea,select,[contenteditable=true]'))return;
      keys.current.add(event.code);
      if(event.code==='Space')event.preventDefault();
    };
    const up=(event:KeyboardEvent)=>keys.current.delete(event.code);
    window.addEventListener('keydown',down);
    window.addEventListener('keyup',up);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);};
  },[]);

  useFrame((_,delta)=>{
    const rigid=body.current;
    if(!rigid)return;
    if(lastTeleport.current!==teleportNonce){
      lastTeleport.current=teleportNonce;
      rigid.setNextKinematicTranslation({x:teleportTarget[0],y:teleportTarget[1],z:teleportTarget[2]});
      camera.position.set(teleportTarget[0],teleportTarget[1]+.8,teleportTarget[2]);
      velocity.current.set(0,0,0);verticalVelocity.current=0;return;
    }
    if(!enabled){velocity.current.set(0,0,0);return;}

    const forward=new Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();
    const right=new Vector3().crossVectors(forward,camera.up).normalize();
    const desired=new Vector3();
    if(keys.current.has('KeyW'))desired.add(forward);
    if(keys.current.has('KeyS'))desired.sub(forward);
    if(keys.current.has('KeyD'))desired.add(right);
    if(keys.current.has('KeyA'))desired.sub(right);
    const sprinting=keys.current.has('ShiftLeft')||keys.current.has('ShiftRight');
    if(desired.lengthSq())desired.normalize().multiplyScalar(sprinting?5.9:4.25);
    velocity.current.lerp(desired,1-Math.exp(-delta*(desired.lengthSq()?10.5:13.5)));
    if(grounded.current&&keys.current.has('Space')){
      verticalVelocity.current=5.35;grounded.current=false;keys.current.delete('Space');
    }
    verticalVelocity.current-=15.5*delta;

    const movement={x:velocity.current.x*delta,y:verticalVelocity.current*delta,z:velocity.current.z*delta};
    const collider=rigid.collider(0);
    if(!collider)return;
    controller.computeColliderMovement(collider,movement);
    const corrected=controller.computedMovement();
    const pos=rigid.translation();
    const next={x:pos.x+corrected.x,y:pos.y+corrected.y,z:pos.z+corrected.z};
    grounded.current=controller.computedGrounded();
    if(grounded.current&&verticalVelocity.current<0)verticalVelocity.current=-.15;
    rigid.setNextKinematicTranslation(next);

    const speed=velocity.current.length();
    if(grounded.current&&speed>.2)walkTime.current+=delta*(sprinting?10.5:8.2);
    const bob=grounded.current?Math.sin(walkTime.current)*Math.min(speed/4.25,1)*.014:0;
    camera.position.set(next.x,next.y+.8+bob,next.z);
    playerTelemetry.position=[next.x,next.y,next.z];
  });

  return <RigidBody ref={body} type="kinematicPosition" colliders={false} position={room.spawn} enabledRotations={[false,false,false]} canSleep={false}><CapsuleCollider args={[.5,.34]}/></RigidBody>;
}
