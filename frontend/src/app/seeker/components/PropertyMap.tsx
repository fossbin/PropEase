'use client';

import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px',
};

interface Props {
  center: { lat: number; lng: number };
}

export default function PropertyMap({ center }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  if (!isLoaded) return <p>Loading map...</p>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={13}>
      <Marker position={center} />
    </GoogleMap>
  );
}
