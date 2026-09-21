export const OPERATIONAL_API_BASE='https://encumbrate-web-production.up.railway.app';

const localHost=host=>host==='localhost'||host==='127.0.0.1'||host==='[::1]';

export function operationalApiUrl(path){
  const value=String(path||'');
  if(/^https?:\/\//i.test(value))return value;
  const normalized=value.startsWith('/')?value:'/'+value;
  if(typeof location!=='undefined'&&localHost(location.hostname))return normalized;
  return OPERATIONAL_API_BASE.replace(/\/$/,'')+normalized;
}

export async function operationalFetch(path,options={},fetcher=fetch){
  const normalized=String(path||'').startsWith('/')?String(path):'/'+String(path||'');
  try{
    const response=await fetcher(operationalApiUrl(normalized),{...options,credentials:'omit'});
    if(![502,503,504].includes(response.status))return response;
  }catch{}
  return fetcher(normalized,{...options,credentials:options.credentials||'same-origin'});
}
