export type ExperienceStatus = 'draft' | 'published' | 'archived';
export type MenuStatus = 'active' | 'inactive';
export type BookingStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'canceled';

export interface Experience {
  id: string;
  name: string;
  description: string | null;
  category: string;
  image_url: string | null;
  is_featured: boolean;
  status: ExperienceStatus;
  slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface Menu {
  id: string;
  experience_id: string;
  name: string;
  description: string | null;
  base_price: number;
  price_per_person: number;
  guest_min: number;
  guest_max: number;
  dietary_tags: string[];
  image_url: string | null;
  status: MenuStatus;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  client_id: string | null;
  menu_id: string | null;
  chef_id: string | null;
  experience_id: string | null;
  date_time: string;
  address: string;
  guests_count: number;
  status: BookingStatus;
  total_price: number;
  special_requests: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeaturedExperience extends Experience {
  startingPrice: number | null;
}

export interface ExperienceWithMenus extends Experience {
  menus: Menu[];
}

export type CreateExperienceInput = Pick<Experience, 'name' | 'description' | 'category' | 'image_url' | 'is_featured'> & { status?: ExperienceStatus; slug?: string | null };
export type UpdateExperienceInput = Partial<CreateExperienceInput>;

export type CreateMenuInput = Pick<Menu, 'name' | 'description' | 'base_price' | 'price_per_person' | 'guest_min' | 'guest_max' | 'image_url'> & { experience_id: string; dietary_tags?: string[]; status?: MenuStatus };
export type UpdateMenuInput = Partial<Omit<CreateMenuInput, 'experience_id'>>;
