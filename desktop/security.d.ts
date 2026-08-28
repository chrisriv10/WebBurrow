export function isPrivateAddress(address:string):boolean;
export function isSafeExternalUrl(value:string):boolean;
export function parseDeepLink(value:string):{type:string;payload?:unknown}|null;
export function buildIntegrationUrl(request:Record<string,unknown>):URL;
export function hardenedIntegrationRequest(request:Record<string,unknown>,transport?:unknown,resolveHost?:unknown):Promise<{status:number;body:string;contentType:string;etag?:string;notModified?:boolean;bodyEncoding?:string;rateLimit?:{remaining:number;resetAt:number}}>;
