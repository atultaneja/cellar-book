export type Bottle = {
  id: string;
  user_id: string;
  name: string;
  brand: string | null;
  category: string;
  size: string | null; // e.g. "750 ml", "1 L", "Unknown"
  level: number; // 0..5
  remaining_ml?: number | null; // fine-grained volume for pour tracking
  restock_ignore?: boolean; // dismissed from the restock list
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Party = {
  id: string;
  user_id: string;
  token: string;
  name: string;
  event_date: string | null;
  active: boolean;
  created_at: string;
};

export type PublicParty = {
  name: string;
  event_date: string | null;
  active: boolean;
  bottles: { name: string; brand: string | null; category: string }[];
  cocktails: string[];
  contributions: { guest_name: string; item: string }[];
};
