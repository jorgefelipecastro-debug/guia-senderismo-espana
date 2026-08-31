import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '../../../../lib/supabase-admin';

export const dynamic='force-dynamic';

export async function POST(request){
 const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!token)return NextResponse.json({error:'Debes iniciar sesión de nuevo.'},{status:401});
 let body;try{body=await request.json()}catch{return NextResponse.json({error:'Solicitud no válida.'},{status:400})}
 if(body?.confirmation!=='ELIMINAR MI CUENTA')return NextResponse.json({error:'Escribe exactamente ELIMINAR MI CUENTA.'},{status:400});
 const admin=getSupabaseAdmin(),{data,error}=await admin.auth.getUser(token),user=data?.user;
 if(error||!user)return NextResponse.json({error:'La sesión ha caducado. Inicia sesión de nuevo.'},{status:401});
 const{error:deleteError}=await admin.auth.admin.deleteUser(user.id);
 if(deleteError)return NextResponse.json({error:'No se ha podido eliminar la cuenta. Contacta con soporte.'},{status:500});
 return NextResponse.json({ok:true});
}
