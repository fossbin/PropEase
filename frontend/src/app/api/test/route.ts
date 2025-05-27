import axios from 'axios';

export async function GET() {
    const res = await axios.get('http://localhost:8000/api/hello/');
    return new Response(JSON.stringify(res.data), {
        headers: { 'Content-Type': 'application/json' },
    });
}
