'use client';

import { useLayoutEffect, useRef } from 'react';

export default function LocationPicker({
  onLocationSelect,
}: {
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address_line: string;
    city: string;
    state: string;
    country: string;
    zipcode: string;
  }) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const geocoder = useRef<google.maps.Geocoder | null>(null);

  const reverseGeocode = (lat: number, lng: number) => {
    if (!geocoder.current) geocoder.current = new google.maps.Geocoder();

    geocoder.current.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const components: any = {};

        for (const comp of result.address_components) {
          if (comp.types.includes('locality')) components.city = comp.long_name;
          if (comp.types.includes('administrative_area_level_1')) components.state = comp.long_name;
          if (comp.types.includes('country')) components.country = comp.long_name;
          if (comp.types.includes('postal_code')) components.zipcode = comp.long_name;
        }

        onLocationSelect({
          lat,
          lng,
          address_line: result.formatted_address,
          city: components.city || '',
          state: components.state || '',
          country: components.country || '',
          zipcode: components.zipcode || '',
        });
      } else {
        onLocationSelect({
          lat,
          lng,
          address_line: '',
          city: '',
          state: '',
          country: '',
          zipcode: '',
        });
      }
    });
  };

  useLayoutEffect(() => {
    if (!window.google || !mapRef.current) return;

    const defaultLatLng = { lat: 9.9816, lng: 76.2999 };

    const initializeMap = (latlng: { lat: number; lng: number }) => {
      const map = new google.maps.Map(mapRef.current!, {
        center: latlng,
        zoom: 14,
      });

      const marker = new google.maps.Marker({
        position: latlng,
        map,
        draggable: true,
      });

      // Fetch and send address info
      reverseGeocode(latlng.lat, latlng.lng);

      marker.addListener('dragend', () => {
        const pos = marker.getPosition();
        if (pos) reverseGeocode(pos.lat(), pos.lng());
      });

      map.addListener('click', (e: google.maps.MapMouseEvent) => {
        const clicked = e.latLng;
        if (clicked) {
          marker.setPosition(clicked);
          reverseGeocode(clicked.lat(), clicked.lng());
        }
      });

      mapInstance.current = map;
      markerRef.current = marker;
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        initializeMap({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => initializeMap(defaultLatLng)
    );
  }, []);

  return <div className="h-64 w-full border rounded mt-4" ref={mapRef} />;
}
