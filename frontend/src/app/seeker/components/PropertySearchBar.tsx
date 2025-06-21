'use client';

import { useRef, useEffect } from 'react';

interface Props {
  onSelectLocation: (loc: { lat: number; lng: number }) => void;
}

export default function PropertySearchBar({ onSelectLocation }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!window.google || !inputRef.current) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      const loc = place.geometry?.location;
      if (loc) {
        onSelectLocation({ lat: loc.lat(), lng: loc.lng() });
      }
    });
  }, []);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search by city, area, or address"
      className="w-full max-w-xl p-3 border rounded-md"
    />
  );
}
