import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fzyuewrawbnpqtvdkedh.supabase.co";
const supabaseKey = "sb_publishable_UOmRFPmqHnYq8ZcEkOiZEg_EOmOzJt0";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
