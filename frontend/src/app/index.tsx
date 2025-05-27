import { fetchProperties, Property } from '../lib/api';

export const metadata = {
    title: 'Home',
    description: 'List of properties',
};

export default async function HomePage() {
    let properties: Property[] = [];
    let error: string | null = null;

    try {
        properties = await fetchProperties();
    } catch (err: any) {
        error = err.message;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div>
            <h1>Properties</h1>
            {properties.length === 0 ? (
                <p>No properties found</p>
            ) : (
                <ul>
                    {properties.map(({ id, title, price }) => (
                        <li key={id}>
                            {title} - ₹{price}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
