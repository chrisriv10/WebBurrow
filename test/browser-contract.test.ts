import { describe,expect,it } from 'vitest';
import { browserMessageSchema, faviconPayloadSchema } from '@/lib/integrations/contracts';
import { parseNativeMessage } from '../desktop/native-contract.mjs';

const tab={title:'Reference',url:'https://example.com/docs',tabId:4,windowId:2,groupId:7,groupName:'Research'};

describe('browser companion contract',()=>{
  it('accepts bounded tab group transfers with explicit workspace behavior',()=>{
    const message={type:'send-tabs',requestId:'request-1',tabs:[tab],name:'Research sprint',scope:'group',mode:'append',workspaceId:'workspace-1'};
    expect(browserMessageSchema.parse(message)).toEqual(message);
    expect(parseNativeMessage(message)).toEqual(message);
  });

  it('rejects unknown fields, unsafe URLs, missing append targets and oversized batches',()=>{
    expect(()=>parseNativeMessage({type:'capabilities',requestId:'r1',surprise:true})).toThrow();
    expect(()=>parseNativeMessage({type:'send-tabs',requestId:'r2',tabs:[tab],name:'No target',scope:'selection',mode:'append'})).toThrow();
    expect(()=>parseNativeMessage({type:'send-tabs',requestId:'r3',tabs:Array.from({length:101},()=>tab),name:'Too many',scope:'window',mode:'create'})).toThrow();
    expect(browserMessageSchema.safeParse({type:'send-page',requestId:'r4',page:{...tab,url:'file:///C:/secret.txt'}}).success).toBe(false);
  });

  it('bounds explicit companion favicon payloads to safe re-encoded image types',()=>{
    const favicon={mime:'image/png' as const,dataBase64:Buffer.from('small png fixture').toString('base64')};
    expect(faviconPayloadSchema.parse(favicon)).toEqual(favicon);
    expect(()=>parseNativeMessage({type:'send-page',requestId:'r5',page:{...tab,favicon:{mime:'image/svg+xml',dataBase64:favicon.dataBase64}},favorite:false})).toThrow();
    expect(()=>parseNativeMessage({type:'send-page',requestId:'r6',page:{...tab,favicon:{mime:'image/png',dataBase64:Buffer.alloc(65*1024).toString('base64')}},favorite:false})).toThrow();
  });
});
