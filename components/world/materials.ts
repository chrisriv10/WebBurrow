import type { RoomAppearance, RoomTemplate } from '@/lib/types';

export type SurfaceKey='graphite'|'paintedMetal'|'darkMetal'|'darkWood'|'fabric'|'fabricAlt'|'plastic'|'paper'|'glass'|'trim';
export type SurfaceStyle={color:string;roughness:number;metalness?:number;transparent?:boolean;opacity?:number};

export const SURFACES:Record<SurfaceKey,SurfaceStyle>={
  graphite:{color:'#171d29',roughness:.92,metalness:.04},
  paintedMetal:{color:'#27303d',roughness:.82,metalness:.09},
  darkMetal:{color:'#111824',roughness:.74,metalness:.18},
  darkWood:{color:'#382f34',roughness:.93,metalness:0},
  fabric:{color:'#353b50',roughness:1,metalness:0},
  fabricAlt:{color:'#45405a',roughness:1,metalness:0},
  plastic:{color:'#252c39',roughness:.78,metalness:.02},
  paper:{color:'#d9d4c8',roughness:1,metalness:0},
  glass:{color:'#8eb3c9',roughness:.28,metalness:.02,transparent:true,opacity:.22},
  trim:{color:'#4a5363',roughness:.72,metalness:.14},
};

export const WALL_COLORS:Record<RoomAppearance['wall'],string>={graphite:'#151b27','navy-panel':'#132234','soft-slate':'#212737'};
export const FLOOR_COLORS:Record<RoomAppearance['floor'],string>={'dark-wood':'#231f29',woven:'#282838',technical:'#172a34'};

export type LightingProfile={background:string;sky:string;ground:string;key:string;fill:string;practical:string;keyIntensity:number;fillIntensity:number;practicalIntensity:number;exposure:number;fogNear:number;fogFar:number};

const profiles:Record<RoomAppearance['lighting'],Omit<LightingProfile,'background'>>={
  'cozy-night':{sky:'#9aafd0',ground:'#0c0d14',key:'#dbe5f5',fill:'#7d91bc',practical:'#d7b38e',keyIntensity:2.5,fillIntensity:1.02,practicalIntensity:3,exposure:1.32,fogNear:18,fogFar:36},
  'midnight-blue':{sky:'#7388b5',ground:'#090a13',key:'#b7c8ed',fill:'#697cad',practical:'#b4a2c9',keyIntensity:2.05,fillIntensity:.78,practicalIntensity:2.1,exposure:1.18,fogNear:16,fogFar:33},
  focus:{sky:'#9ac4d3',ground:'#081116',key:'#dceff5',fill:'#70aec2',practical:'#c9c6ad',keyIntensity:2.65,fillIntensity:1.08,practicalIntensity:2.45,exposure:1.34,fogNear:20,fogFar:40},
  'soft-day':{sky:'#c4d5e5',ground:'#151720',key:'#f2f5f7',fill:'#abc2d4',practical:'#dfd6c2',keyIntensity:2.8,fillIntensity:1.22,practicalIntensity:1.8,exposure:1.42,fogNear:22,fogFar:44},
  media:{sky:'#908ab5',ground:'#0c0914',key:'#d0d0e7',fill:'#8175ac',practical:'#c4a6b3',keyIntensity:2.25,fillIntensity:.94,practicalIntensity:2.35,exposure:1.25,fogNear:18,fogFar:37},
};

const backgrounds:Record<RoomTemplate,string>={den:'#070914',studio:'#060b12',lounge:'#090812'};

export function lightingProfile(template:RoomTemplate,lighting:RoomAppearance['lighting']):LightingProfile{return{background:backgrounds[template],...profiles[lighting]};}
