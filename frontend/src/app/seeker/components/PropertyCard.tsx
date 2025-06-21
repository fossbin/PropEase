interface Props {
  property: {
    id: string;
    title: string;
    price: number;
    type: string;
    photos: string[];
    location: string;
  };
}

export default function PropertyCard({ property }: Props) {
  return (
    <div className="border rounded-xl shadow p-4">
      <img
        src={property.photos?.[0] || '/placeholder.jpg'}
        alt="Property"
        className="w-full h-48 object-cover rounded"
      />
      <h2 className="text-lg font-semibold mt-2">{property.title}</h2>
      <p className="text-sm text-gray-600">{property.type}</p>
      <p className="text-blue-600 font-semibold">₹{property.price}</p>
      <p className="text-xs text-gray-400 mt-1">{property.location}</p>
    </div>
  );
}
