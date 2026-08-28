import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const source=path.join(root,'browser-extension','src');const output=path.join(root,'browser-extension','dist');
fs.rmSync(output,{recursive:true,force:true});fs.cpSync(source,output,{recursive:true});
const manifest=JSON.parse(fs.readFileSync(path.join(output,'manifest.json'),'utf8'));
if(manifest.manifest_version!==3||manifest.permissions.includes('tabs')||manifest.permissions.includes('bookmarks')||manifest.host_permissions)throw new Error('Extension permissions are broader than intended.');
console.log(`Validated WebBurrow Companion ${manifest.version} (${fs.readdirSync(output).length} files).`);
