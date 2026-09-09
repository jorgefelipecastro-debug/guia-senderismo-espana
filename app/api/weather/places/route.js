import {NextResponse} from 'next/server';
import {aemetMunicipalities} from '../../../../lib/aemet-client';
import {searchMunicipalities} from '../../../../lib/aemet-weather';
export const maxDuration=30;
export async function GET(request){
 const query=(request.nextUrl.searchParams.get('q')||'').trim();
 if(query.length<2||query.length>80)return NextResponse.json({error:'Escribe entre 2 y 80 caracteres.'},{status:400});
 try{return NextResponse.json({places:searchMunicipalities(await aemetMunicipalities(),query)});}
 catch{return NextResponse.json({error:'AEMET no permite consultar localidades en este momento.'},{status:503});}
}
