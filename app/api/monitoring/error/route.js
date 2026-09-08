import {recordServerError} from '../../../../lib/monitoring';

export const dynamic='force-dynamic';
export async function POST(request){
 let body;try{body=await request.json()}catch{return Response.json({error:'Solicitud no válida.'},{status:400})}
 const message=String(body?.message||'').trim();if(!message||message.length>4000)return Response.json({error:'Incidencia no válida.'},{status:400});
 const clientError=new Error(message);clientError.stack=String(body.stack||'').slice(0,8000);
 const fingerprint=await recordServerError(clientError,{source:'client',severity:body.severity==='critical'?'critical':'error',route:String(body.route||'client'),runtime:'browser'});
 return Response.json({recorded:true,incident:fingerprint.slice(0,12)},{status:202});
}
