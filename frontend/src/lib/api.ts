export interface Property {
    id: number;
    title: string;
    price: number;
}

export async function fetchProperties(): Promise<Property[]> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/properties/`);
    if (!res.ok) throw new Error('Failed to fetch properties');
    return res.json();
}
  