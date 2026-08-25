'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE = 15 * 1024 * 1024;

function safeExtension(file) {
  const byType = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
  return byType[file.type] || String(file.name || '').split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
}

export default function PetVault({ close }) {
  const [files, setFiles] = useState([]), [loading, setLoading] = useState(true), [uploading, setUploading] = useState(''), [error, setError] = useState('');
  const photos = useMemo(() => files.filter(file => file.kind === 'photo'), [files]);
  const documents = useMemo(() => files.filter(file => file.kind === 'document'), [files]);

  useEffect(() => { loadFiles(); }, []);

  async function loadFiles() {
    setLoading(true); setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Inicia sesión para abrir el espacio de tu mascota.'); setLoading(false); return; }
    const { data, error: queryError } = await supabase.from('pet_files').select('id,kind,storage_path,original_name,mime_type,file_size,created_at').eq('user_id', user.id).order('created_at', { ascending: false });
    if (queryError) { setError('No hemos podido cargar los archivos de tu mascota.'); setLoading(false); return; }
    const signedFiles = await Promise.all((data || []).map(async file => {
      const { data: signed } = await supabase.storage.from('pet-files').createSignedUrl(file.storage_path, 3600);
      return { ...file, url: signed?.signedUrl || '' };
    }));
    setFiles(signedFiles); setLoading(false);
  }

  async function upload(event, kind) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setError('');
    if (kind === 'photo' && photos.length >= MAX_PHOTOS) return setError('Puedes guardar un máximo de cinco fotos de tu mascota.');
    const allowed = kind === 'photo' ? ['image/jpeg', 'image/png', 'image/webp'] : ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) return setError(kind === 'photo' ? 'Elige una foto JPG, PNG o WebP.' : 'Elige una imagen o un documento PDF.');
    if (file.size > MAX_FILE_SIZE) return setError('El archivo supera el límite de 15 MB.');
    setUploading(kind);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(''); return setError('Inicia sesión para subir archivos.'); }
    const path = `${user.id}/${kind}/${crypto.randomUUID()}.${safeExtension(file)}`;
    const { error: uploadError } = await supabase.storage.from('pet-files').upload(path, file, { contentType: file.type, cacheControl: '3600' });
    if (uploadError) { setUploading(''); return setError('No hemos podido subir el archivo.'); }
    const { error: rowError } = await supabase.from('pet_files').insert({ user_id: user.id, kind, storage_path: path, original_name: file.name || (kind === 'photo' ? 'Foto de mascota' : 'Documento de mascota'), mime_type: file.type, file_size: file.size });
    if (rowError) { await supabase.storage.from('pet-files').remove([path]); setUploading(''); return setError(rowError.message?.includes('five pet photos') ? 'Puedes guardar un máximo de cinco fotos de tu mascota.' : 'El archivo subió, pero no hemos podido guardarlo en tu ficha.'); }
    await loadFiles(); setUploading('');
  }

  async function removeFile(file) {
    setError('');
    const { error: storageError } = await supabase.storage.from('pet-files').remove([file.storage_path]);
    if (storageError) return setError('No hemos podido eliminar el archivo.');
    const { error: rowError } = await supabase.from('pet_files').delete().eq('id', file.id);
    if (rowError) return setError('El archivo se eliminó, pero no hemos podido actualizar la lista.');
    setFiles(current => current.filter(item => item.id !== file.id));
  }

  return <div className="petVault"><header><button onClick={close} aria-label="Volver">‹</button><div><small>MASCOTAS</small><h1>Compañero de aventura</h1></div><span className="petPaw">🐾</span></header><main><section className="petIntro"><span>🐾</span><div><h2>Documentación segura</h2><p>Guarda aquí cartilla, pasaporte, certificados y fotografías de la mascota que llevas contigo. Los archivos son privados y solo tú puedes abrirlos.</p></div></section>{error&&<p className="petError">{error}</p>}<section className="petSection"><div className="petSectionTitle"><div><h2>Fotos</h2><small>{photos.length} de {MAX_PHOTOS}</small></div><label className={photos.length>=MAX_PHOTOS||uploading?'disabled':''}>{uploading==='photo'?'Subiendo…':'Añadir foto'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={photos.length>=MAX_PHOTOS||Boolean(uploading)} onChange={event=>upload(event,'photo')}/></label></div>{loading?<div className="petLoading">Cargando…</div>:photos.length?<div className="petPhotos">{photos.map(photo=><article key={photo.id}><a href={photo.url} target="_blank" rel="noopener noreferrer"><img src={photo.url} alt={photo.original_name}/></a><button onClick={()=>removeFile(photo)} aria-label={`Eliminar ${photo.original_name}`}>×</button></article>)}</div>:<div className="petEmpty">Todavía no has añadido fotografías.</div>}</section><section className="petSection"><div className="petSectionTitle"><div><h2>Cartillas y documentos</h2><small>Imágenes o PDF, hasta 15 MB</small></div><label className={uploading?'disabled':''}>{uploading==='document'?'Subiendo…':'Añadir documento'}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={Boolean(uploading)} onChange={event=>upload(event,'document')}/></label></div>{documents.length?<div className="petDocuments">{documents.map(document=><article key={document.id}><a href={document.url} target="_blank" rel="noopener noreferrer"><span>{document.mime_type==='application/pdf'?'PDF':'IMG'}</span><div><strong>{document.original_name}</strong><small>{(document.file_size/1024/1024).toLocaleString('es-ES',{maximumFractionDigits:1})} MB</small></div></a><button onClick={()=>removeFile(document)} aria-label={`Eliminar ${document.original_name}`}>×</button></article>)}</div>:!loading&&<div className="petEmpty">Añade la cartilla, el pasaporte u otro documento de tu mascota.</div>}</section></main></div>;
}
