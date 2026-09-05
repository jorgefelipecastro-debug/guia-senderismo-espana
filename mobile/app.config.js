const base=require('./app.json');
module.exports=()=>({...base.expo,plugins:[...(base.expo.plugins||[]),['@rnmapbox/maps',{RNMapboxMapsDownloadToken:process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN}]],extra:{...base.expo.extra,webUrl:process.env.EXPO_PUBLIC_WEB_URL,mapboxAccessToken:process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN}});
