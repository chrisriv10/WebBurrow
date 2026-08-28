import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=path.join(root,'browser-extension','src');const output=path.join(root,'browser-extension','dist');
fs.rmSync(output,{recursive:true,force:true});fs.cpSync(source,output,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(output,'manifest.json'),'utf8'));
const packageVersion=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8')).version;
const exact=(actual,expected)=>Array.isArray(actual)&&actual.length===expected.length&&expected.every(value=>actual.includes(value));
if(manifest.manifest_version!==3||manifest.version!==packageVersion||!manifest.key)throw new Error('Extension identity or release version is invalid.');
if(!exact(manifest.permissions,['activeTab','storage','nativeMessaging'])||!exact(manifest.optional_permissions,['tabs','tabGroups','bookmarks'])||manifest.host_permissions||manifest.content_scripts)throw new Error('Extension permissions are broader than intended.');
const iconPaths=new Set([...Object.values(manifest.icons||{}),...Object.values(manifest.action?.default_icon||{})]);
for(const icon of iconPaths){const bytes=fs.readFileSync(path.join(output,icon));if(bytes.length<100||bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw new Error(`Extension icon is missing or invalid: ${icon}`);}
const count=fs.readdirSync(output,{recursive:true,withFileTypes:true}).filter(entry=>entry.isFile()).length;
console.log(`Validated WebBurrow Companion ${manifest.version} (${count} files, minimal permissions, pinned identity).`);
