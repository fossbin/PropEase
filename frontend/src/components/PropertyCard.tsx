'use client';

import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';

interface PropertyCardProps {
  id: string;
  title: string;
  price: string;
  location: string;
  imageUrl: string;
  isFavorited?: boolean;
}

const PropertyCard: React.FC<PropertyCardProps> = ({
  id,
  title,
  price,
  location,
  imageUrl,
  isFavorited = false,
}) => {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
      <div className="relative">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-48 object-cover"
        />
        <button className="absolute top-2 right-2 bg-white p-1 rounded-full shadow">
          <Heart
            className={`w-5 h-5 ${
              isFavorited ? 'text-red-500' : 'text-gray-400'
            }`}
          />
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-2">{location}</p>
        <p className="text-blue-600 font-bold text-lg">{price}</p>
        <Link
          href={`/properties/${id}`}
          className="inline-block mt-3 text-blue-600 hover:underline text-sm"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PropertyCard;
