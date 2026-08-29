import { Svg, Text } from '@react-three/drei';
import type { SiteIdentity } from '@/lib/site-identity';
import { localAsset, threeText } from '@/lib/assets';

const FONT=localAsset('fonts/space-grotesk-latin-500-normal.woff');
const MARKS:Partial<Record<SiteIdentity['brand'],string>>={
  google:localAsset('site-logos/google.svg'),'google-docs':localAsset('site-logos/google-docs.svg'),wikipedia:localAsset('site-logos/wikipedia.svg'),github:localAsset('site-logos/github.svg'),stackoverflow:localAsset('site-logos/stackoverflow.svg'),leetcode:localAsset('site-logos/leetcode.svg'),youtube:localAsset('site-logos/youtube.svg'),spotify:localAsset('site-logos/spotify.svg'),twitch:localAsset('site-logos/twitch.svg'),mdn:localAsset('site-logos/mdn.svg'),notion:localAsset('site-logos/notion.svg'),vercel:localAsset('site-logos/vercel.svg'),
};

export function BrandLogo({identity,size,position=[0,0,0]}:{identity:SiteIdentity;size:number;position?:[number,number,number]}){
  const mark=MARKS[identity.brand];
  if(!mark)return <Text font={FONT} position={position} fontSize={size*.42} color="#f2f5fb" anchorX="center" anchorY="middle">{threeText(identity.monogram)}</Text>;
  return <Svg src={mark} position={position} scale={size/100} />;
}
