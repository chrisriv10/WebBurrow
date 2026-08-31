export function localAsset(path:string) {
  if(typeof document==='undefined')return `/${path}`;
  return new URL(path,document.baseURI).href;
}

const THREE_TEXT_REPLACEMENTS:Record<string,string>={
  '\u00a0':' ',
  '\u00b0':'°',
  '\u00b7':'·',
  '\u00d7':'x',
  '\u00b1':'+/-',
  '\u2013':'-',
  '\u2014':'-',
  '\u2018':"'",
  '\u2019':"'",
  '\u201c':'"',
  '\u201d':'"',
  '\u2022':'-',
  '\u2026':'...',
  '\u2190':'<-',
  '\u2192':'->',
  '\u2194':'<->',
  '\u2212':'-',
};

export function threeText(value:string) {
  return value.normalize('NFKD')
    .replace(/[\u00a0\u00b0\u00b7\u00d7\u00b1\u2013\u2014\u2018\u2019\u201c\u201d\u2022\u2026\u2190\u2192\u2194\u2212]/g,character=>THREE_TEXT_REPLACEMENTS[character]??character)
    .replace(/\p{M}/gu,'')
    .replace(/[^\x20-\x7E\n\r°·]/gu,'');
}
