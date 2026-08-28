export type NativeMessage={type:string;requestId:string;[key:string]:unknown};
export function parseNativeMessage(input:unknown):NativeMessage;
export function nativeCapabilities(context?:unknown):{version:1;capabilities:string[];workspaces:unknown[];rooms:unknown[];collections:unknown[]};
