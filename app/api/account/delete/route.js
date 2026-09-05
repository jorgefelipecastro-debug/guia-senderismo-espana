import {NextResponse} from 'next/server';
import {getSupabaseAdmin} from '../../../../lib/supabase-admin';

export const dynamic='force-dynamic';

const USER_BUCKETS=['avatars','pet-files','route-submissions','social-report-evidence'];
async function listStorageFiles(bucket,prefix){
 const paths=[];
 for(let offset=0;;offset+=100){
  const{data,error}=await bucket.list(prefix,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
  if(error)throw error;
  for(const item of data||[]){
   const path=prefix?`${prefix}/${item.name}`:item.name;
   if(item.id||item.metadata)paths.push(path);
   else paths.push(...await listStorageFiles(bucket,path));
  }
  if((data||[]).length<100)break;
 }
 return paths;
}
async function removeUserStorage(admin,userId){
 for(const bucket of USER_BUCKETS){
  const storage=admin.storage.from(bucket),paths=await listStorageFiles(storage,userId);
  for(let index=0;index<paths.length;index+=100){
   const{error:removeError}=await storage.remove(paths.slice(index,index+100));
   if(removeError)throw removeError;
  }
 }
}

export async function POST(request){
 const token=(request.headers.get('authorization')||'').replace(/^Bearer\s+/i,'');
 if(!token)return NextResponse.json({error:'Debes iniciar sesión de nuevo.'},{status:401});
 let body;try{body=await request.json()}catch{return NextResponse.json({error:'Solicitud no válida.'},{status:400})}
 if(body?.confirmation!=='ELIMINAR MI CUENTA')return NextResponse.json({error:'Escribe exactamente ELIMINAR MI CUENTA.'},{status:400});
 const admin=getSupabaseAdmin(),{data,error}=await admin.auth.getUser(token),user=data?.user;
 if(error||!user)return NextResponse.json({error:'La sesión ha caducado. Inicia sesión de nuevo.'},{status:401});
 const{error:signOutError}=await admin.auth.admin.signOut(token,'global');
 if(signOutError)return NextResponse.json({error:'No se han podido cerrar todas las sesiones. Inténtalo de nuevo.'},{status:500});
 try{await removeUserStorage(admin,user.id)}catch{return NextResponse.json({error:'No se han podido eliminar todos tus archivos. La cuenta no se ha borrado; inténtalo de nuevo.'},{status:500})}
 const{error:deleteError}=await admin.auth.admin.deleteUser(user.id);
 if(deleteError)return NextResponse.json({error:'No se ha podido eliminar la cuenta. Contacta con soporte.'},{status:500});
 return NextResponse.json({ok:true});
}
