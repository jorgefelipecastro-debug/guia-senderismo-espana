import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '../../../../lib/supabase-admin';

export const dynamic='force-dynamic';

async function adminFor(request){
 const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!token)return null;
 const supabase=getSupabaseAdmin();
 const{data,error}=await supabase.auth.getUser(token);
 if(error||data.user?.app_metadata?.role!=='admin')return null;
 return{supabase,user:data.user};
}

export async function GET(request){
 const auth=await adminFor(request);if(!auth)return NextResponse.json({error:'No autorizado.'},{status:403});
 const{searchParams}=request.nextUrl,section=searchParams.get('section')||'reports';
 const tables={reports:'social_user_reports',routes:'user_route_submissions',warnings:'social_moderation_events'};
 const table=tables[section];if(!table)return NextResponse.json({error:'Sección no válida.'},{status:400});
 let query=auth.supabase.from(table).select('*').order('created_at',{ascending:false}).limit(100);
 if(section==='reports')query=query.in('status',['pending','reviewing']);
 if(section==='routes')query=query.in('status',['pending','needs_changes']);
 if(section==='warnings')query=query.eq('status','pending');
 const{data,error}=await query;if(error)return NextResponse.json({error:'No se pudo cargar la cola.'},{status:500});
 return NextResponse.json({items:data||[]});
}

export async function POST(request){
 const auth=await adminFor(request);if(!auth)return NextResponse.json({error:'No autorizado.'},{status:403});
 let body;try{body=await request.json()}catch{return NextResponse.json({error:'Solicitud no válida.'},{status:400})}
 const now=new Date().toISOString();
 if(body.section==='reports'&&['reviewing','resolved','dismissed'].includes(body.status)){
  const{error}=await auth.supabase.from('social_user_reports').update({status:body.status,reviewed_at:now,reviewed_by:auth.user.id}).eq('id',body.id);
  return error?NextResponse.json({error:'No se pudo actualizar.'},{status:500}):NextResponse.json({ok:true});
 }
 if(body.section==='routes'&&['needs_changes','approved','rejected','duplicate'].includes(body.status)){
  const{error}=await auth.supabase.from('user_route_submissions').update({status:body.status,reviewer_notes:String(body.notes||'').slice(0,1000),reviewed_at:now,reviewed_by:auth.user.id}).eq('id',body.id);
  return error?NextResponse.json({error:'No se pudo actualizar.'},{status:500}):NextResponse.json({ok:true});
 }
 if(body.section==='warnings'&&['reviewed','dismissed','sanctioned'].includes(body.status)){
  const{error}=await auth.supabase.from('social_moderation_events').update({status:body.status,reviewer_notes:String(body.notes||'').slice(0,1000),reviewed_at:now,reviewed_by:auth.user.id}).eq('id',body.id);
  if(error)return NextResponse.json({error:'No se pudo actualizar.'},{status:500});
  if(body.status==='sanctioned'){
   const{data:event}=await auth.supabase.from('social_moderation_events').select('user_id').eq('id',body.id).maybeSingle();
   if(!event?.user_id)return NextResponse.json({error:'No se encontró el usuario sancionado.'},{status:404});
   const until=new Date(Date.now()+7*86400000).toISOString(),{error:restrictionError}=await auth.supabase.from('social_chat_restrictions').upsert({user_id:event.user_id,restricted_until:until,reason:'Sanción revisada por moderación',created_at:now});
   if(restrictionError)return NextResponse.json({error:'El aviso se revisó, pero no se pudo aplicar la restricción.'},{status:500});
  }
  return NextResponse.json({ok:true});
 }
 return NextResponse.json({error:'Acción no válida.'},{status:400});
}
