export interface MenuItem {
  Name?: string;
  Description?: string;
  Price?: number;
  Category?: string;
  ImageUrl?: string;
  Variations?: { id: string; name: string; price: number }[];
  Options?: { id: string; name: string; price: number }[];
}

export interface DrinkItem {
  AlcoholicStatus?: string;
  Category?: string;
  Name?: string;
  Unknown?: string;
  Price?: number;
}

export function jsonToCsv(items: MenuItem[]): string {
  const headers = ['Name', 'Description', 'Price', 'Category', 'Image URL', 'Variations (JSON)', 'Options (JSON)'];
  const rows = items.map(item => {
    return [
      item.Name || '',
      item.Description || '',
      item.Price ?? '',
      item.Category || '',
      item.ImageUrl || 'https://picsum.photos/400/300',
      JSON.stringify(item.Variations || []),
      JSON.stringify(item.Options || [])
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

export function drinksJsonToCsv(items: DrinkItem[]): string {
  const headers = ['Alcohol/Non Alcohol', 'Category', 'Item Name', 'Unknown', 'Price'];
  const rows = items.map(item => {
    return [
      item.AlcoholicStatus || '',
      item.Category || '',
      item.Name || '',
      item.Unknown || 'Unknown',
      item.Price ?? ''
    ].map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}
