export type Product = {
  id: string; slug: string; name: string; description: string; material: string; price: string; demo: boolean;
  category: { id: string; name: string };
  photos: { url: string; alt: string; position: number }[];
  variants: { size: number; color: string; available: boolean }[];
};
export type Filters = { categories: { id: string; name: string }[]; sizes: number[] };
export async function api<T>(path: string): Promise<T> {
  const response = await fetch(`${process.env.API_INTERNAL_URL}${path}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error(`No se pudo consultar el catálogo (${response.status})`);
  return response.json();
}
export const price = (value: string) => `Bs ${Number(value).toLocaleString('es-BO', { maximumFractionDigits: 2 })}`;
