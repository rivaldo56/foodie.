
interface Ingredient {
  id: number;
  name: string;
  category: string;
  shelf_life_days?: number;
}

interface InventoryItem {
  id: number;
  ingredient: number;
  ingredient_details: Ingredient;
  quantity: number;
  unit: string;
  is_essential: boolean;
}

interface RecipeRecommendation {
  id: number;
  title: string;
  match_score: number;
  total_time: number;
  missing_ingredients_count: number;
  image_url: string;
}

export const kitchenService = {
  async getInventory(): Promise<InventoryItem[]> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/kitchen/inventory/`, {
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch inventory');
    return res.json();
  },

  async addToInventory(item: { ingredient_name: string; quantity: number; unit: string }) {
    // For MVP, we need to handle "creating" ingredients if they don't exist, 
    // or searching. The backend expects an ID. 
    // Ideally we have a search endpoint. For this mock, we'll assume we pass ID if known, 
    // or maybe the backend is upgraded to accept names. 
    // Let's stick to the spec: sync accepts generic data, but create needs ID.
    // We will implement a simple "add by name" helper in backend or just use sync.
    // Let's use the sync endpoint as it's more flexible for "scanned" style input.
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/kitchen/inventory/sync/`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: [item] }), 
    });
    // Note: The backend sync endpoint was a placeholder in the plan. 
    // We might need to implement a real "search and add" flow.
    // For now, let's assume we use the standard POST to inventory if we have ID, 
    // but the UI likely only has text input.
    // I'll stick to a simple GET implementation first.
    return res.json();
  },

  async getRecommendations(timeLimit: number = 30): Promise<RecipeRecommendation[]> {
    const token = localStorage.getItem('token');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/kitchen/recommendations/?time_limit=${timeLimit}`, {
      headers: {
        'Authorization': `Token ${token}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch recommendations');
    return res.json();
  }
};
