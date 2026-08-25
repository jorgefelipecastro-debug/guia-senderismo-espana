function key(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const CURATED_ROUTES = [
  {
    matches: ({ name, ref }) => key(ref).includes('pr cv 282') || key(name).includes('cami de la sendera'),
    distanceKm: 19.39,
    duration: '4 h',
    routeType: 'Lineal',
    officialUrl: 'https://senders.femecv.com/es/sendero/ver/pr-cv-282',
    metricsSource: 'FEMECV',
    metricsSourceUrl: 'https://femecv.blob.core.windows.net/publico/folletos/PR-CV-282_es.pdf',
    image: {
      src: 'https://s2.wklcdn.com/image_462/13875483/146853911/93043109Master.jpg',
      sourceUrl: 'https://es.wikiloc.com/rutas-senderismo/pr-cv-282-cami-de-la-sendera-146853911',
      credit: 'Turismo San Vicente del Raspeig · PR-CV 282',
      license: 'Imagen enlazada desde la ficha de origen',
    },
  },
  {
    matches: ({ name }) => key(name).includes('ruta el humedal'),
    routeType: 'Circular',
    officialUrl: 'https://clotdegalvany.es/rutas/',
    image: {
      src: 'https://www.elche.es/wp-content/uploads/2021/01/Clot-de-Galvany07-scaled.jpg',
      sourceUrl: 'https://www.elche.es/2022/02/talleres-y-actividades-en-el-clot-de-galvany-para-dar-a-conocer-el-papel-que-desempenan-los-humedales/',
      credit: 'Ayuntamiento de Elche · Clot de Galvany',
      license: 'Imagen enlazada desde la fuente municipal',
    },
    gallery: [{
      src: 'https://clotdegalvany.es/wp-content/uploads/2013/04/Mapa-Ruta-El-Humedal.jpg',
      sourceUrl: 'https://clotdegalvany.es/rutas/',
      credit: 'Mapa oficial · Ruta El Humedal',
      license: 'Fuente: Clot de Galvany',
    }],
  },
  {
    matches: ({ name }) => key(name).includes('monte y la loma'),
    routeType: 'Circular',
    officialUrl: 'https://clotdegalvany.es/rutas/ruta-el-monte-y-la-loma/',
    image: {
      src: 'https://www.visitelche.com/wp-content/uploads/2024/02/ruta-el-monte.jpg',
      sourceUrl: 'https://www.visitelche.com/naturaleza/paraje-natural-del-clot-galvany/',
      credit: 'VisitElche · Ruta El Monte y la Loma',
      license: 'Imagen enlazada desde la fuente turística municipal',
    },
    gallery: [{
      src: 'https://clotdegalvany.es/wp-content/uploads/2013/04/Mapa-Ruta-El-Monte-y-la-Loma1.png',
      sourceUrl: 'https://clotdegalvany.es/rutas/ruta-el-monte-y-la-loma/',
      credit: 'Mapa oficial · Ruta El Monte y la Loma',
      license: 'Fuente: Clot de Galvany',
    }],
  },
];

export function findCuratedRoute(name, ref) {
  return CURATED_ROUTES.find(route => route.matches({ name, ref })) || null;
}
