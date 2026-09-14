'use client';

import LiveRouteGuide from '../LiveRouteGuide';

const route = { id: '__offline_map_smoke_route__', name: 'Prueba offline Alicante' };
const track = {
  id: '__offline_map_smoke_route__',
  name: 'Prueba offline Alicante',
  points: [
    { lat: 38.3452, lon: -0.4815 },
    { lat: 38.3482, lon: -0.4785 },
    { lat: 38.3512, lon: -0.4755 },
  ],
};

export default function OfflineMapSmokePage() {
  return (
    <LiveRouteGuide
      route={route}
      track={track}
      onBack={() => {}}
      onLost={() => {}}
      onFinish={() => {}}
    />
  );
}
