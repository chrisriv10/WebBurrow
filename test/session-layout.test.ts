import { describe,expect,it } from 'vitest';
import { planSessionLayout } from '@/lib/session-layout';
import type { BookmarkObject } from '@/lib/types';

function objects(count:number):BookmarkObject[]{return Array.from({length:count},(_,index)=>({
  id:`tab-${index}`,roomId:'session-room',name:`Tab ${index}`,url:`https://${index%3===0?'docs.example.com':index%3===1?'github.com':'news.example.net'}/item/${index}`,
  archetype:'desk-monitor',icon:'globe',color:'#78dbea',position:[0,0,0],rotation:0,favorite:false,usageCount:0,collection:'Session',collectionId:'session',
  lifecycle:'session',source:'browser-extension',browserReference:{workspaceId:'workspace',tabId:index,groupId:index%4,groupName:`Group ${index%4}`,receivedAt:index},isDemo:false,createdAt:index,updatedAt:index,
}));}

describe('adaptive browser workspace layouts',()=>{
  it('keeps small sessions as individually legible floor objects',()=>{
    const plan=planSessionLayout(objects(24),'auto');expect(plan.density).toBe('individual');expect(plan.slots).toHaveLength(24);expect(new Set(plan.slots.map(slot=>slot.position.join(','))).size).toBe(24);
  });

  it('turns medium sessions into labeled workstation banks',()=>{
    const plan=planSessionLayout(objects(48),'browser-group');expect(plan.density).toBe('banks');expect(plan.banks.length).toBeGreaterThanOrEqual(4);expect(plan.banks.every(bank=>bank.count<=10)).toBe(true);expect(plan.banks.some(bank=>bank.label.startsWith('Group'))).toBe(true);
  });

  it('uses dense racks for one hundred tabs while preserving unique slots',()=>{
    const plan=planSessionLayout(objects(100),'domain');expect(plan.density).toBe('dense');expect(plan.slots).toHaveLength(100);expect(new Set(plan.slots.map(slot=>slot.position.join(','))).size).toBe(100);expect(Math.max(...plan.slots.map(slot=>slot.position[1]))).toBeGreaterThan(1);
  });

  it('is deterministic and moves focused items to the front',()=>{
    const input=objects(40);const first=planSessionLayout(input,'grid',['tab-32']);const second=planSessionLayout(input,'grid',['tab-32']);expect(first).toEqual(second);expect(first.slots[0].objectId).toBe('tab-32');
  });
});
