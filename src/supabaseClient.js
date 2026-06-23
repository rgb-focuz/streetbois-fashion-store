import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://adkvmufuytxhgreasneb.supabase.co";
const supabaseKey = "sb_publishable_cUmCoYnwZU13T01PnTrsvg_EQ3FxSVt";

export const supabase = createClient(supabaseUrl, supabaseKey);