import fallbackLogo from "../assets/logo.png";
import { supabase } from "../supabaseClient";

export const defaultStoreSettings = {
  store_name: "StreetBois Fashion",
  logo_url: "",
  phone: "0202430406",
  whatsapp: "233202430406",
  sales_whatsapp: "233202430406",
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

export const getWhatsAppLink = (number, message = "") => {
  const cleaned = normalizeWhatsAppNumber(number || defaultStoreSettings.whatsapp);
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${cleaned || defaultStoreSettings.whatsapp}${query}`;
};

let cachedSettings = null;
let settingsRequest = null;

export const fetchStoreSettings = async () => {
  if (cachedSettings) return cachedSettings;
  if (settingsRequest) return settingsRequest;

  settingsRequest = supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle()
    .then(({ data, error }) => {
      cachedSettings = error || !data ? defaultStoreSettings : { ...defaultStoreSettings, ...data };
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

  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  cachedSettings = error || !data ? defaultStoreSettings : { ...defaultStoreSettings, ...data };

  return cachedSettings;
};

export const buildSalesRepsFromSettings = (settings = defaultStoreSettings) => [
  {
    initials: "SB",
    name: `${settings.store_name || "StreetBois Fashion"} Sales`,
    title: "Sales WhatsApp",
    phone: normalizeWhatsAppNumber(getSalesWhatsApp(settings)),
    status: "Online",
  },
];
