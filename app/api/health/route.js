import {getSupabaseAdmin} from '../../../lib/supabase-admin';
import {recordServerError} from '../../../lib/monitoring';

export const dynamic='force-dynamic';
export async function GET(request){
 const started=Date.now(),requestId=request.headers.get('x-request-id')||request.headers.get('x-railway-request-id')||crypto.randomUUID();
 try{
  const supabase=getSupabaseAdmin();
  const {error}=await supabase.from('hiking_routes').select('id',{head:true,count:'estimated'}).eq('published',true).limit(1);
  if(error)throw error;
  return Response.json({status:'healthy',database:'healthy',latencyMs:Date.now()-started,release:process.env.RAILWAY_GIT_COMMIT_SHA?.slice(0,12)||process.env.GITHUB_SHA?.slice(0,12)||'local'},{headers:{'Cache-Control':'no-store','X-Request-Id':requestId}});
 }catch(error){
  const incident=await recordServerError(error,{source:'health',severity:'critical',route:'/api/health',requestId});
  return Response.json({status:'degraded',database:'unavailable',incident:incident.slice(0,12)},{status:503,headers:{'Cache-Control':'no-store','Retry-After':'30','X-Request-Id':requestId}});
 }
}
