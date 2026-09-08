const baseSteps=[
{title:'Vehículos',render(){host.innerHTML=`<div class="eyebrow">Paso inicial</div><h1>Identifica los vehículos A y B</h1><p class="lead">La primera pantalla del parte sirve únicamente para diferenciar los dos vehículos por su matrícula.</p><div class="card">${field('a_plate','Matrícula Vehículo A','text',{required:true})}${field('b_plate','Matrícula Vehículo B','text',{required:true})}<div class="hint"><b>A</b> será el vehículo Allzone. <b>B</b> será el otro vehículo implicado. Los teléfonos se pedirán después, junto con los datos personales de cada conductor.</div></div>`;bindBasic()}},
{title:'Accidente',render(){host.innerHTML=`<div class="eyebrow">Accidente</div><h1>¿Dónde y cuándo ocurrió?</h1><p class="lead">Datos generales del siniestro.</p><div class="card"><div class="grid">${field('acc_date','Fecha','date',{required:true})}${field('acc_time','Hora','time',{required:true})}${locationField()}${field('acc_country','País','text',{full:true})}</div></div>${yesno('victims','¿Hay víctimas o lesionados, incluso leves?')}${yesno('other_vehicles_damage','¿Hay daños en vehículos distintos de A y B?')}${yesno('other_objects_damage','¿Hay daños ajenos al vehículo? (Mobiliario urbano, señales de tráfico...)')}`;bindBasic();bindGpsLocation()}},
{title:'Daños a propiedad',conditional:'property',render(){propertyDamageScreen()}},
{title:'Número vehículos adicionales',conditional:'extras',render(){extraCountScreen()}},
{title:'Tipo A',render(){host.innerHTML=`<div class="eyebrow">Vehículo A</div><h1>¿Qué tipo de vehículo es A?</h1><p class="lead">Selecciona la silueta que corresponde.</p><div class="card">${chooseHTML('a_vehicle_type',['Moto','Coche','Camión'])}</div>`;bindBasic()}},
{title:'Conductor A',render(){host.innerHTML=`<div class="eyebrow">Vehículo A</div><h1>Datos del conductor A</h1><p class="lead">Copia los datos del permiso de conducir.</p><div class="card"><div class="grid">${field('a_driver_name','Nombre','text',{required:true})}${field('a_driver_surname','Apellidos','text',{required:true})}${field('a_driver_birth','Fecha de nacimiento','date')}${field('a_license','N.º permiso de conducir','text',{required:true})}${field('a_license_category','Categoría','text')}${field('a_license_until','Válido hasta','date')}${field('a_driver_address','Dirección','text',{full:true})}${field('a_driver_country','País','text')}${field('a_driver_contact','Número de teléfono','tel',{required:true})}</div></div>`;bindBasic()}},
{title:'Seguro A',render(){
  host.innerHTML=`<div class="eyebrow">Vehículo A</div>
  <h1>Furgoneta / vehículo A y su seguro</h1>
  <p class="lead">Completa los datos de este vehículo y de su póliza. No se solicita un seguro personal del conductor.</p>
  <div class="card">
    <h2 class="policy-section-title">Datos del vehículo</h2>
    <div class="grid">
      ${field('a_vehicle_model','Marca y modelo','text',{required:true})}
      ${field('a_plate_country','País de matrícula')}
      ${field('a_trailer_plate','Matrícula del remolque, si existe')}
      ${field('a_trailer_country','País del remolque, si existe')}
    </div>
  </div>
  <div class="card">
    <h2 class="policy-section-title">Seguro de este vehículo</h2>
    <div class="grid">
      ${field('a_insurer','Aseguradora del vehículo','text',{required:true})}
      ${field('a_policy','N.º de póliza del vehículo','text',{required:true})}
      ${field('a_own_damage','¿La póliza incluye daños propios al vehículo?','select',{full:true,options:['Sí','No']})}
    </div>
    <div class="hint">La compañía y la póliza quedan editables: pueden cambiar de una furgoneta a otra.</div>
  </div>
  <details class="card policy-details" id="policyInsuredA">
    <summary>Asegurado que figura en la póliza <span>Datos del apartado 6 del parte</span></summary>
    <p class="hint">Copia el nombre de la persona o empresa que figure como asegurado en la póliza del vehículo. Estos campos no se rellenan automáticamente con el nombre del conductor.</p>
    <div class="grid">
      ${field('a_insured_name','Nombre o razón social del asegurado','text',{full:true})}
      ${field('a_insured_surname','Apellidos, si es una persona física','text',{full:true})}
      ${field('a_insured_address','Dirección del asegurado','text',{full:true})}
      ${field('a_insured_postal','Código postal')}
      ${field('a_insured_country','País')}
      ${field('a_insured_contact','Teléfono o e-mail del asegurado','text',{full:true})}
    </div>
  </details>
  <details class="card policy-details" id="policyExtrasA">
    <summary>Otros datos de la póliza <span>Carta Verde y agencia / corredor</span></summary>
    <div class="grid">
      ${field('a_green_card','N.º Carta Verde','text',{full:true})}
      ${field('a_green_from','Carta Verde desde','date')}
      ${field('a_green_to','Carta Verde hasta','date')}
      ${field('a_agency','Agencia / corredor')}
      ${field('a_agency_name','Nombre de la agencia')}
      ${field('a_agency_address','Dirección de la agencia','text',{full:true})}
      ${field('a_agency_country','País de la agencia')}
      ${field('a_agency_contact','Teléfono / e-mail de la agencia')}
    </div>
  </details>`;
  bindBasic();
}},
{title:'Impacto A',render(){impactScreen('A')}},
{title:'Tipo B',render(){host.innerHTML=`<div class="eyebrow">Vehículo B</div><h1>¿Qué tipo de vehículo es B?</h1><p class="lead">Selecciona moto, coche o camión.</p><div class="card">${chooseHTML('b_vehicle_type',['Moto','Coche','Camión'])}</div>`;bindBasic()}},
{title:'Conductor B',render(){host.innerHTML=`<div class="eyebrow">Vehículo B</div><h1>Datos del conductor B</h1><p class="lead">El conductor contrario completa sus datos.</p><div class="card"><div class="grid">${field('b_driver_name','Nombre','text',{required:true})}${field('b_driver_surname','Apellidos','text',{required:true})}${field('b_driver_birth','Fecha de nacimiento','date')}${field('b_license','N.º permiso de conducir','text',{required:true})}${field('b_license_category','Categoría','text')}${field('b_license_until','Válido hasta','date')}${field('b_driver_address','Dirección','text',{full:true})}${field('b_driver_country','País','text')}${field('b_driver_contact','Número de teléfono','tel',{required:true})}</div></div>`;bindBasic()}},
{title:'Asegurado B',render(){host.innerHTML=`<div class="eyebrow">Vehículo B</div><h1>Datos del asegurado y vehículo B</h1><p class="lead">Rellena los datos de la documentación del contrario.</p><div class="card"><div class="grid">${field('b_insured_name','Nombre asegurado')}${field('b_insured_surname','Apellidos')}${field('b_insured_address','Dirección','text',{full:true})}${field('b_insured_postal','Código postal')}${field('b_insured_country','País')}${field('b_insured_contact','Teléfono o e-mail','text',{full:true})}${field('b_vehicle_model','Marca y modelo','text',{required:true})}${field('b_plate_country','País matrícula')}${field('b_trailer_plate','Matrícula remolque')}${field('b_trailer_country','País remolque')}</div></div>`;bindBasic()}},
{title:'Seguro B',render(){host.innerHTML=`<div class="eyebrow">Vehículo B</div><h1>Aseguradora del vehículo B</h1><p class="lead">Copia compañía y póliza del documento del contrario.</p><div class="card"><div class="grid">${field('b_insurer','Aseguradora','text',{required:true})}${field('b_policy','N.º de póliza','text',{required:true})}${field('b_green_card','N.º Carta Verde')}${field('b_own_damage','Daños propios asegurados','select',{options:['Sí','No']})}${field('b_green_from','Carta Verde desde','date')}${field('b_green_to','Carta Verde hasta','date')}${field('b_agency','Agencia / corredor')}${field('b_agency_name','Nombre agencia')}${field('b_agency_address','Dirección agencia','text',{full:true})}${field('b_agency_country','País agencia')}${field('b_agency_contact','Teléfono/e-mail agencia')}</div></div>`;bindBasic()}},
{title:'Impacto B',render(){impactScreen('B')}},
{title:'Daños',render(){host.innerHTML=`<div class="eyebrow">Daños y testigos</div><h1>Describe los daños apreciados</h1><p class="lead">Añade observaciones breves y los testigos si los hubiera.</p><div class="card">${field('a_damages','Daños Vehículo A','textarea',{required:true})}${field('a_observations','Observaciones A','textarea')}${field('b_damages','Daños Vehículo B','textarea',{required:true})}${field('b_observations','Observaciones B','textarea')}${field('witnesses','Testigos: nombre, dirección y teléfono','textarea')}</div>`;bindBasic()}},
{title:'Circunstancias',render(){circScreen()}},
{title:'Croquis',render(){sketchScreen()}},
{title:'Fotos',render(){photoScreen()}},
{title:'Firmas',render(){signatureScreen()}},
{title:'Entrega',render(){host.innerHTML=`<div class="eyebrow">Entrega</div><h1>¿Dónde enviamos las copias?</h1><p class="lead">Destinatarios previstos. En esta prueba no se envían correos automáticamente: descarga el documento y compártelo manualmente.</p><div class="card"><div class="field"><label>Correo Allzone</label><div class="fixed">flota@allzonelogistics.com</div></div>${field('b_copy_email','Correo del conductor / asegurado B','email',{required:true})}${field('a_copy_email','Copia para conductor A','email',{placeholder:'Opcional'})}</div><div class="safe">Una vez firmado y cerrado, el parte debe conservarse sin cambios. Flota recibe el expediente completo. El vehículo B recibe el DAA A-B y cada vehículo adicional recibe exclusivamente su DAA A-C, A-D, etc.</div>`;bindBasic()}},
{title:'Revisión',render(){reviewScreen()}}
 ];
function getSteps(){
  ensureExtraDefaults();
  const out=[];
  for(const s of baseSteps){
    if(s.conditional==='extras' && state.other_vehicles_damage!=='Sí')continue;
    if(s.conditional==='property' && state.other_objects_damage!=='Sí')continue;
    out.push(s);
    if(s.title==='Impacto B' && state.other_vehicles_damage==='Sí'){
      const n=Math.max(1,Math.min(20,parseInt(state.additional_vehicle_count||'1',10)||1));
      for(let i=0;i<n;i++)out.push({title:`Datos adicional ${extraLabel(i)}`,extraIndex:i,render(){extraDetailsStep(i)}});
    }
    if(s.title==='Firmas' && state.other_vehicles_damage==='Sí'){
      const n=Math.max(1,Math.min(20,parseInt(state.additional_vehicle_count||'1',10)||1));
      for(let i=0;i<n;i++)out.push({title:`Firma adicional ${extraLabel(i)}`,extraIndex:i,render(){extraImpactCircSignatureStep(i)}});
    }
  }
  return out;
}
