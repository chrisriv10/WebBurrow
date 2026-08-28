// @vitest-environment jsdom
import { afterEach,beforeEach,describe,expect,it } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { CommandLauncher,ModalLayer } from '@/components/overlays';
import { DEFAULT_PREFERENCES,DEMO_OBJECTS,DEMO_ROOMS } from '@/lib/demo';
import { useBurrow } from '@/store/use-burrow';

beforeEach(()=>useBurrow.setState({
  ready:true,rooms:structuredClone(DEMO_ROOMS),objects:structuredClone(DEMO_OBJECTS),collections:[],browserWorkspaces:[],arrivalIds:[],activity:[],notifications:[],integrationCache:[],siteIcons:[],
  currentRoomId:DEMO_ROOMS[0].id,preferences:{...structuredClone(DEFAULT_PREFERENCES),hasEntered:true},modal:null,launcherOpen:false,editMode:false,selectedId:null,nearObjectId:null,toast:null,
}));
afterEach(cleanup);

describe('accessible release surfaces',()=>{
  it('customizes a room through labeled HTML controls',()=>{
    useBurrow.getState().openModal('customize-room');render(<ModalLayer/>);
    fireEvent.change(screen.getByLabelText('Room name'),{target:{value:'Quiet Reading Den'}});
    fireEvent.click(screen.getByRole('button',{name:'soft slate'}));
    fireEvent.click(screen.getByRole('button',{name:/Apply room style/}));
    expect(useBurrow.getState().rooms[0]).toMatchObject({name:'Quiet Reading Den',appearance:{wall:'soft-slate'}});
    expect(useBurrow.getState().modal).toBeNull();
  });

  it('manages and permanently promotes selected temporary tabs',()=>{
    useBurrow.getState().receiveBrowserTabs('Reference sprint',[{title:'Useful docs',url:'https://example.com/docs',tabId:3}],{scope:'selection'});
    const workspace=useBurrow.getState().browserWorkspaces[0];useBurrow.getState().openModal('browser-workspace');render(<ModalLayer/>);
    expect(screen.getByText(/Temporary session · not saved on restart/)).toBeTruthy();
    fireEvent.click(screen.getByLabelText('Select Useful docs'));
    fireEvent.click(screen.getByRole('button',{name:/Save 1 permanently/}));
    const promoted=useBurrow.getState().objects.find(item=>item.name==='Useful docs');
    expect(promoted).toMatchObject({lifecycle:'permanent',roomId:DEMO_ROOMS[0].id});expect(promoted?.browserReference).toBeUndefined();
    expect(useBurrow.getState().browserWorkspaces[0].id).toBe(workspace.id);
  });

  it('runs room customization from keyboard-only Quick Access',()=>{
    useBurrow.getState().setLauncher(true);render(<CommandLauncher/>);const input=screen.getByPlaceholderText('Search your Burrow or the web…');
    fireEvent.change(input,{target:{value:'> customize current room'}});fireEvent.keyDown(input,{key:'Enter'});
    expect(useBurrow.getState().launcherOpen).toBe(false);expect(useBurrow.getState().modal).toBe('customize-room');
  });
});
