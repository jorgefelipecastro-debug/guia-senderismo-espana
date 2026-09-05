const BADGE_ASSET_VERSION='transparent-20260901';
const badgeAsset=path=>`${path}?v=${BADGE_ASSET_VERSION}`;

export const PROGRESSION = [
  {id:'principiante', label:'Principiante', xp:0, asset:badgeAsset('/badges/principiante-lagartija.webp')},
  {id:'principiante-1', label:'Principiante 1', xp:150, asset:badgeAsset('/badges/progression/principiante-1-bronce.webp')},
  {id:'principiante-2', label:'Principiante 2', xp:300, asset:badgeAsset('/badges/progression/principiante-2-plata.webp')},
  {id:'principiante-3', label:'Principiante 3', xp:450, asset:badgeAsset('/badges/progression/principiante-3-oro.webp')},
  {id:'intermedio', label:'Intermedio', xp:750, asset:badgeAsset('/badges/intermedio-camaleon.webp')},
  {id:'intermedio-1', label:'Intermedio 1', xp:1050, asset:badgeAsset('/badges/progression/intermedio-1-bronce.webp')},
  {id:'intermedio-2', label:'Intermedio 2', xp:1350, asset:badgeAsset('/badges/progression/intermedio-2-plata.webp')},
  {id:'intermedio-3', label:'Intermedio 3', xp:1650, asset:badgeAsset('/badges/progression/intermedio-3-oro.webp')},
  {id:'experto', label:'Experto', xp:2150, asset:badgeAsset('/badges/experto-serpiente.webp'), requirements:['Primeros auxilios acreditados','Curso de brújula y orientación acreditado']},
  {id:'experto-1', label:'Experto 1', xp:2750, asset:badgeAsset('/badges/progression/experto-1-bronce.webp')},
  {id:'experto-2', label:'Experto 2', xp:3350, asset:badgeAsset('/badges/progression/experto-2-plata.webp')},
  {id:'experto-3', label:'Experto 3', xp:3950, asset:badgeAsset('/badges/progression/experto-3-oro.webp')},
  {id:'maestro-encumbrate', label:'Maestro Encúmbrate', xp:5950, asset:badgeAsset('/badges/progression/maestro-cumbre.webp'), requirements:['5 rutas propias aprobadas por Encúmbrate']}
];

export function progressionFor(xp=0,{expertUnlocked=false,approvedRoutes=0}={}){
  const points=Math.max(0,Number(xp)||0);
  let current=PROGRESSION[0];
  for(const badge of PROGRESSION){
    if(points<badge.xp) break;
    if(badge.id==='experto' && !expertUnlocked) break;
    if(badge.id==='maestro-encumbrate' && approvedRoutes<5) break;
    current=badge;
  }
  const currentIndex=PROGRESSION.findIndex(item=>item.id===current.id);
  const next=PROGRESSION[currentIndex+1]||null;
  const span=next?Math.max(1,next.xp-current.xp):1;
  const progress=next?Math.max(0,Math.min(100,((points-current.xp)/span)*100)):100;
  return {current,next,points,progress,xpRemaining:next?Math.max(0,next.xp-points):0};
}
