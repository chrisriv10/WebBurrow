import { describe, expect, it } from 'vitest';
import { buildIntegrationUrl, isPrivateAddress, isSafeExternalUrl, parseDeepLink } from '../desktop/security.mjs';
import { decodeNativeMessage, encodeNativeMessage, EXTENSION_ID } from '../desktop/native-messaging.mjs';

describe('desktop boundary validation',()=>{
  it('allowlists integration hosts and operations',()=>{
    expect(buildIntegrationUrl({kind:'github',path:'/repos/openai/openai-node'}).hostname).toBe('api.github.com');
    expect(buildIntegrationUrl({kind:'weather',endpoint:'forecast',query:{latitude:1,longitude:2}}).hostname).toBe('api.open-meteo.com');
    expect(()=>buildIntegrationUrl({kind:'github',path:'/orgs/openai/secrets'})).toThrow();
    expect(()=>buildIntegrationUrl({kind:'rss',url:'http://example.com/feed'})).toThrow();
  });
  it('recognizes private network ranges and safe external links',()=>{
    expect(['127.0.0.1','10.0.0.2','172.16.2.1','192.168.1.1','::1'].every(isPrivateAddress)).toBe(true);
    expect(isPrivateAddress('8.8.8.8')).toBe(false);
    expect(isSafeExternalUrl('https://example.com')).toBe(true);
    expect(isSafeExternalUrl('file:///C:/secret.txt')).toBe(false);
  });
  it('accepts only allowlisted deep-link routes and safe add prefills',()=>{
    expect(parseDeepLink('webburrow://quick-access')).toEqual({type:'quick-access'});
    expect(parseDeepLink('webburrow://room/room-home')).toEqual({type:'room',payload:'room-home'});
    expect(parseDeepLink('webburrow://add?title=Docs&url=https%3A%2F%2Fexample.com')).toEqual({type:'add',payload:{title:'Docs',url:'https://example.com'}});
    expect(parseDeepLink('webburrow://add?url=file%3A%2F%2F%2FC%3A%2Fsecret.txt')).toBeNull();
    expect(parseDeepLink('webburrow://exec/calc.exe')).toBeNull();
  });
  it('round-trips length-prefixed messages and pins the extension identity',()=>{
    const message={type:'capabilities',requestId:'r1'};expect(decodeNativeMessage(encodeNativeMessage(message))).toEqual(message);
    expect(()=>decodeNativeMessage(Buffer.from([2,0,0,0,123]))).toThrow();
    expect(EXTENSION_ID).toBe('igfepplhdmogifjmgfligakhgoacflhg');
  });
});
