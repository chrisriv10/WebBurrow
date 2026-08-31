import { describe, expect, it } from 'vitest';
import { threeText } from '@/lib/assets';

describe('threeText',()=>{
  it('keeps supported symbols instead of showing replacement question marks',()=>{
    expect(threeText('Bellwood · 75°F — rain…')).toBe('Bellwood · 75°F - rain...');
  });

  it('removes unsupported glyphs without leaking question marks into world text',()=>{
    expect(threeText('Notes 🧠')).toBe('Notes ');
  });
});
