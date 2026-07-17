import fallbackLogo from "../assets/logo.png";

const getSupabase = async () => {
  const module = await import("../supabaseClient");
  return module.supabase;
};

export const defaultStoreSettings = {
  store_name: "StreetBois Fashion",
  logo_url: "",
  phone: "0202430406",
  whatsapp: "233202430406",
  sales_whatsapp: "233202430406",
  mens_wear_sales_whatsapp: "233202430406",
  sneakers_sales_whatsapp: "233202430406",
  email: "apodeijoshuaagudey1@gmail.com",
  location_name: "Tudu, Accra",
  address: "Tudu, Accra - Ghana",
  business_hours: "Monday - Saturday, 8:30am - 6:00pm",
  about:
    "StreetBois Fashion is Ghana's premium wholesale destination for fashion, footwear and accessories.",
  facebook: "",
  instagram: "",
  tiktok: "",
  twitter: "",
  google_map: "",
  delivery_note: "Delivery available within Ghana.",
  currency: "GH₵",
  delivery_fee: "",
  free_shipping_threshold: "",
  tax_percentage: "",
};

export const getLogoUrl = (settings = defaultStoreSettings) =>
  settings.logo_url || fallbackLogo;

export const getSalesWhatsApp = (settings = defaultStoreSettings) =>
  settings.sales_whatsapp || settings.whatsapp || defaultStoreSettings.sales_whatsapp;

export const normalizeWhatsAppNumber = (number) =>
  String(number || "")
    .replace(/\D/g, "")
    .replace(/^0/, "233");

const parseWhatsAppNumbers = (value, fallback) => {
  const numbers = String(value || "")
    .split(/[\n,;]+/)
    .map((number) => normalizeWhatsAppNumber(number))
    .filter(Boolean);

  const uniqueNumbers = [...new Set(numbers)].slice(0, 3);

  if (uniqueNumbers.length > 0) return uniqueNumbers;

  return [normalizeWhatsAppNumber(fallback || defaultStoreSettings.sales_whatsapp)];
};

export const getWhatsAppLink = (number, message = "") => {
  const cleaned = normalizeWhatsAppNumber(number || defaultStoreSettings.whatsapp);
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${cleaned || defaultStoreSettings.whatsapp}${query}`;
};

let cachedSettings = null;
let settingsRequest = null;

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === "streetbois-store-settings-updated") {
      cachedSettings = null;
      settingsRequest = null;
    }
  });
}

export const fetchStoreSettings = async () => {
  if (cachedSettings) return cachedSettings;
  if (settingsRequest) return settingsRequest;

  settingsRequest = getSupabase()
    .then((supabase) =>
      supabase
        .from("store_settings")
        .select("*")
        .eq("id", 1)
        .maybeSingle()
    )
    .then(({ data, error }) => {
      cachedSettings =
        error || !data ? defaultStoreSettings : { ...defaultStoreSettings, ...data };
      return cachedSettings;
    })
    .finally(() => {
      settingsRequest = null;
    });

  return settingsRequest;
};

export const refreshStoreSettings = async () => {
  cachedSettings = null;
  settingsRequest = null;
  const supabase = await getSupabase();

  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  cachedSettings = error || !data ? defaultStoreSettings : { ...defaultStoreSettings, ...data };

  return cachedSettings;
};

const buildSalesReps = ({ initials, name, title, numbers }) =>
  numbers.map((phone, index) => ({
    initials,
    name: numbers.length > 1 ? `${name} ${index + 1}` : name,
    title,
    phone,
    status: "Online",
  }));

export const buildSalesRepsFromSettings = (settings = defaultStoreSettings) =>
  buildSalesReps({
    initials: "SB",
    name: `${settings.store_name || "StreetBois Fashion"} Sales`,
    title: "General Sales Representative",
    numbers: parseWhatsAppNumbers(getSalesWhatsApp(settings), settings.whatsapp),
  });

const getCategorySalesConfig = (category, settings = defaultStoreSettings) => {
  const normalizedCategory = String(category || "").trim().toLowerCase();

  if (normalizedCategory === "sneakers") {
    return {
      initials: "SN",
      name: "StreetBois Sneakers Shop",
      title: "Sneakers Sales Representative",
      numbers: parseWhatsAppNumbers(
        settings.sneakers_sales_whatsapp,
        getSalesWhatsApp(settings)
      ),
    };
  }

  if (normalizedCategory === "men clothing") {
    return {
      initials: "MW",
      name: "StreetBois Menswear Shop",
      title: "Menswear Sales Representative",
      numbers: parseWhatsAppNumbers(
        settings.mens_wear_sales_whatsapp,
        getSalesWhatsApp(settings)
      ),
    };
  }

  return {
    initials: "SB",
    name: `${settings.store_name || "StreetBois Fashion"} Sales`,
    title: "General Sales Representative",
    numbers: parseWhatsAppNumbers(getSalesWhatsApp(settings), settings.whatsapp),
  };
};

export const buildSalesRepsForCategory = (
  category,
  settings = defaultStoreSettings
) => {
  const rep = getCategorySalesConfig(category, settings);

  return buildSalesReps(rep);
};

export const buildSalesRepsForItems = (
  items = [],
  settings = defaultStoreSettings
) => {
  const categories = items.map((item) => item?.category).filter(Boolean);
  const hasSneakers = categories.some(
    (category) => String(category).trim().toLowerCase() === "sneakers"
  );
  const hasMenswear = categories.some(
    (category) => String(category).trim().toLowerCase() === "men clothing"
  );

  if (hasSneakers && !hasMenswear) {
    return buildSalesRepsForCategory("Sneakers", settings);
  }

  if (hasMenswear && !hasSneakers) {
    return buildSalesRepsForCategory("Men Clothing", settings);
  }

  return buildSalesRepsFromSettings(settings);
};
