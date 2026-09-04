'use client';

import {useEffect,useState} from 'react';
import {useRouter} from 'next/navigation';
import ProfilePassport from '../ProfilePassport';
import {supabase} from '../../lib/supabase';
import {progressionFor} from '../../lib/progressionBadges';

const FALLBACK_BADGE='/badges/principiante-lagartija.webp';

export default function ProfilePage(){
 const router=useRouter();
 const[user,setUser]=useState(null),[avatar,setAvatar]=useState(''),[badge,setBadge]=useState(FALLBACK_BADGE),[ready,setReady]=useState(false);
 useEffect(()=>{let active=true;async function load(){
  const{data:{user:currentUser}}=await supabase.auth.getUser();
  if(!active)return;
  if(!currentUser){setReady(true);return}
  setUser(currentUser);
  const{data:profile}=await supabase.from('profiles').select('progression_xp,approved_route_contributions,accredited_level,avatar_path,avatar_display').eq('id',currentUser.id).maybeSingle();
  if(!active)return;
  const currentBadge=progressionFor(Number(profile?.progression_xp||0),{expertUnlocked:profile?.accredited_level==='experto',approvedRoutes:Number(profile?.approved_route_contributions||0)}).current.asset||FALLBACK_BADGE;
  setBadge(currentBadge);
  if(profile?.avatar_display==='badge')setAvatar(currentBadge);
  else if(profile?.avatar_display==='photo'&&profile.avatar_path){const{data:signed}=await supabase.storage.from('avatars').createSignedUrl(profile.avatar_path,3600);if(active)setAvatar(signed?.signedUrl?`${signed.signedUrl}&v=${encodeURIComponent(profile.avatar_path)}`:'')}
  if(active)setReady(true);
 }load();return()=>{active=false}},[]);
 if(!ready||!user)return <main className="profileStandaloneLoading" role="status"><span/><strong>Abriendo tu perfil…</strong></main>;
 return <ProfilePassport user={user} avatar={avatar} badge={badge} onClose={()=>router.replace('/')} onEditAvatar={()=>router.replace('/?open=profile')}/>;
}
