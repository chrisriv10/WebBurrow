import type { RoomTemplate } from '@/lib/types';

export type RoomTheme={
  background:string; floor:string; floorAlt:string; wall:string; wallAlt:string;
  trim:string; rug:string; wood:string; fabric:string; warm:string; cool:string;
  sky:string; horizon:string;
};

export const ROOM_THEMES:Record<RoomTemplate,RoomTheme>={
  den:{background:'#070a14',floor:'#1d2030',floorAlt:'#292d40',wall:'#151b2a',wallAlt:'#1d2538',trim:'#3b4258',rug:'#312b45',wood:'#443536',fabric:'#383f57',warm:'#e7bd8b',cool:'#7f93db',sky:'#101b34',horizon:'#5d6a91'},
  studio:{background:'#060b13',floor:'#17252f',floorAlt:'#203541',wall:'#111e29',wallAlt:'#192c3a',trim:'#345260',rug:'#1b3948',wood:'#30383e',fabric:'#324752',warm:'#d8c39a',cool:'#6dbbd7',sky:'#0c2232',horizon:'#4f8798'},
  lounge:{background:'#090912',floor:'#211e2d',floorAlt:'#2e2a3d',wall:'#181925',wallAlt:'#242238',trim:'#464059',rug:'#3a2d49',wood:'#453740',fabric:'#443950',warm:'#d9ae88',cool:'#9786cc',sky:'#16142a',horizon:'#725f82'},
};
