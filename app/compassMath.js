export function normalizeHeading(value){
 return ((value%360)+360)%360;
}

export function angleDifference(target,current){
 return ((target-current+540)%360)-180;
}

export function circularMean(values){
 if(!values.length)return null;
 let x=0,y=0;
 for(const value of values){
  const radians=normalizeHeading(value)*Math.PI/180;
  x+=Math.cos(radians);
  y+=Math.sin(radians);
 }
 return normalizeHeading(Math.atan2(y,x)*180/Math.PI);
}

export function circularSpread(values,mean=circularMean(values)){
 if(mean===null)return Infinity;
 return Math.max(...values.map(value=>Math.abs(angleDifference(value,mean))));
}

export function smoothHeading(current,target,{factor=.18,maxStep=3,deadband=.6}={}){
 if(current===null||!Number.isFinite(current))return normalizeHeading(target);
 const delta=angleDifference(target,current);
 if(Math.abs(delta)<deadband)return normalizeHeading(current);
 const step=Math.max(-maxStep,Math.min(maxStep,delta*factor));
 return normalizeHeading(current+step);
}

export function adaptiveHeading(current,target){
 if(current===null||!Number.isFinite(current))return normalizeHeading(target);
 const distance=Math.abs(angleDifference(target,current));
 if(distance>=75)return smoothHeading(current,target,{factor:.72,maxStep:55,deadband:0});
 if(distance>=25)return smoothHeading(current,target,{factor:.52,maxStep:28,deadband:.15});
 if(distance>=7)return smoothHeading(current,target,{factor:.34,maxStep:12,deadband:.35});
 return smoothHeading(current,target,{factor:.2,maxStep:4,deadband:.8});
}

export function headingFromQuaternion(quaternion){
 if(!quaternion||quaternion.length<4)return null;
 const[x,y,z,w]=quaternion.map(Number);
 if(![x,y,z,w].every(Number.isFinite))return null;
 // Proyecta el eje +Y del dispositivo (parte superior del móvil) sobre
 // los ejes terrestres X=este e Y=norte.
 const east=2*(x*y-z*w),north=1-2*(x*x+z*z);
 if(Math.hypot(east,north)<.25)return null;
 return normalizeHeading(Math.atan2(east,north)*180/Math.PI);
}
