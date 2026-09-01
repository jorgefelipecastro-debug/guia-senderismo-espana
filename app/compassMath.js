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
 if(distance>=45)return smoothHeading(current,target,{factor:.9,maxStep:90,deadband:0});
 if(distance>=18)return smoothHeading(current,target,{factor:.75,maxStep:28,deadband:.3});
 if(distance>=8)return smoothHeading(current,target,{factor:.32,maxStep:5,deadband:1});
 return smoothHeading(current,target,{factor:.14,maxStep:.8,deadband:2});
}

export function nextCalibrationState(current,spread,accurate=true){
 if(!accurate)return 'calibrating';
 if(current==='stable')return spread<=18?'stable':'calibrating';
 return spread<=10?'stable':'calibrating';
}

export function shouldUseHeadingSource(currentSource,nextSource){
 if(!currentSource||currentSource===nextSource)return true;
 // DeviceOrientation absoluto es la lectura ya compensada por Android y debe
 // prevalecer. El Generic Sensor queda como respaldo para navegadores que no
 // entregan esa lectura; mezclar ambos provoca saltos y bloqueos aparentes.
 return nextSource!=='Sensor Android avanzado';
}

export function calibrationWarning(dismissed,{ios=false,accuracy=NaN,spread=0}={}){
 if(dismissed)return '';
 if(ios&&Number.isFinite(accuracy)&&accuracy>35)return 'La precisión magnética es baja. Aleja el móvil de fundas magnéticas, llaves, altavoces y objetos metálicos. Después muévelo lentamente dibujando un 8 en el aire.';
 if(spread>18)return 'Señal magnética inestable. Aleja el móvil de objetos metálicos y calibra el sensor moviendo el teléfono lentamente en forma de 8.';
 return '';
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
