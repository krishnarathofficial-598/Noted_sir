import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qwtykbifeijesiaierun.supabase.co";
const supabaseKey = "sb_publishable_GENcXNQgbJQbInbXA5SDMQ_AsEKoCNJ";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);
