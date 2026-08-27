import { describe,expect,it } from 'vitest';
import { autoArchetype, normalizeUrl } from '@/lib/url';

describe('URL handling',()=>{
  it('adds https and canonicalizes hosts and fragments',()=>expect(normalizeUrl('WWW.Example.COM:443/path?q=1#frag')).toBe('https://www.example.com/path?q=1'));
  it('rejects unsafe protocols',()=>expect(()=>normalizeUrl('javascript:alert(1)')).toThrow(/http/));
  it('rejects malformed input',()=>expect(()=>normalizeUrl('http://[bad')).toThrow(/valid/));
  it('chooses useful object archetypes locally',()=>{expect(autoArchetype('github.com')).toBe('terminal');expect(autoArchetype('youtube.com')).toBe('tv');expect(autoArchetype('developer.mozilla.org')).toBe('book');});
});
