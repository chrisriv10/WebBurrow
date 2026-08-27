export function localAsset(path:string) {
  if(typeof document==='undefined')return `/${path}`;
  return new URL(path,document.baseURI).href;
}

export function threeText(value:string) {
  return value.normalize('NFKD').replace(/[^\x20-\x7E]/g,'?');
}
