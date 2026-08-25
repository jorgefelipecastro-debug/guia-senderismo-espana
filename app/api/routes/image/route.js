import { NextResponse } from 'next/server';
import { findCuratedRoute } from '../../../../lib/route-curation';

export const dynamic = 'force-dynamic';

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';

function cleanText(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/&[^;]+;/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalized(value) {
  return cleanText(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es').replace(/[^a-z0-9]+/g, ' ').trim();
}

function routeTokens(name, ref) {
  const ignored = new Set(['ruta', 'sendero', 'camino', 'etapa', 'tramo', 'circular', 'vuelta', 'del', 'las', 'los', 'por', 'una']);
  return [...new Set(normalized(`${name} ${ref}`).split(' ').filter(word => word.length >= 3 && !ignored.has(word)))];
}

async function fetchJson(url, timeout = 10000) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Encumbrate/1.0 (https://www.encumbrate.es)' },
    signal: AbortSignal.timeout(timeout),
    next: { revalidate: 604800 },
  });
  if (!response.ok) throw new Error(`Wikimedia ${response.status}`);
  return response.json();
}

async function fromWikipedia(reference) {
  const match = String(reference || '').match(/^([a-z-]{2,12}):(.+)$/i);
  if (!match) return null;
  const [, language, title] = match;
  const url = new URL(`https://${language.toLowerCase()}.wikipedia.org/w/api.php`);
  url.search = new URLSearchParams({ action: 'query', format: 'json', redirects: '1', prop: 'pageimages|info', piprop: 'original|thumbnail', pithumbsize: '1200', pilicense: 'free', inprop: 'url', titles: title });
  const data = await fetchJson(url);
  const page = Object.values(data.query?.pages || {})[0];
  const src = page?.original?.source || page?.thumbnail?.source;
  if (!src) return null;
  return { src, sourceUrl: page.fullurl || `https://${language}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`, credit: `Wikipedia · ${page.title}`, license: 'Licencia libre indicada en la página de origen', exact: true };
}

async function fromCommons(name, ref) {
  const tokens = routeTokens(name, ref);
  if (!tokens.length) return [];
  const url = new URL(COMMONS_API);
  url.search = new URLSearchParams({
    action: 'query', format: 'json', generator: 'search', gsrnamespace: '6', gsrlimit: '12',
    gsrsearch: `${name} ${ref || ''}`.trim(), prop: 'imageinfo|globalusage',
    iiprop: 'url|mime|extmetadata', iiurlwidth: '1200', iiextmetadatalanguage: 'es',
    iiextmetadatafilter: 'Artist|Credit|LicenseShortName|ImageDescription', gulimit: '50',
  });
  const data = await fetchJson(url);
  const candidates = Object.values(data.query?.pages || {}).map((page, index) => {
    const info = page.imageinfo?.[0];
    const metadata = info?.extmetadata || {};
    const haystack = normalized(`${page.title} ${metadata.ImageDescription?.value || ''}`);
    const matches = tokens.filter(token => haystack.includes(token)).length;
    const refMatch = ref && haystack.includes(normalized(ref)) ? 1 : 0;
    const excluded = /\b(map|mapa|logo|icon|marker|bandera|flag|señal|sign|diagram)\b/i.test(normalized(page.title));
    return { page, info, metadata, matches, score: matches * 25 + refMatch * 35 + Math.min(50, page.globalusage?.length || 0) - index - (excluded ? 100 : 0) };
  }).filter(item => item.info?.mime?.startsWith('image/') && item.info?.thumburl && item.matches >= Math.min(2, tokens.length));
  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, 4).map(best => ({
    src: best.info.thumburl || best.info.url,
    sourceUrl: best.info.descriptionurl,
    credit: cleanText(best.metadata.Artist?.value || best.metadata.Credit?.value || best.page.title),
    license: cleanText(best.metadata.LicenseShortName?.value || 'Consultar licencia en Wikimedia Commons'),
    exact: true,
  }));
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const name = String(params.get('name') || '').trim().slice(0, 140);
  const ref = String(params.get('ref') || '').trim().slice(0, 50);
  const wikipedia = String(params.get('wikipedia') || '').trim().slice(0, 180);
  if (!name) return NextResponse.json({ found: false }, { status: 400 });
  const curated = findCuratedRoute(name, ref);
  if (curated?.image) {
    const gallery = [curated.image, ...(curated.gallery || [])];
    return NextResponse.json({ found: true, ...curated.image, gallery }, { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000' } });
  }
  let wikipediaPhoto = null, commonsPhotos = [];
  try { wikipediaPhoto = await fromWikipedia(wikipedia); } catch (error) { console.error('Wikipedia route image lookup failed', error); }
  try { commonsPhotos = await fromCommons(name, ref); } catch (error) { console.error('Commons route image lookup failed', error); }
  const gallery = [wikipediaPhoto, ...commonsPhotos].filter(Boolean).filter((photo, index, list) => list.findIndex(item => item.src === photo.src) === index).slice(0, 5);
  const photo = gallery[0];
  return NextResponse.json(photo ? { found: true, ...photo, gallery } : { found: false, gallery: [] }, { headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=2592000' } });
}
