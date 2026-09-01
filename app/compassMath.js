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
