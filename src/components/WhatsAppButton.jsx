import { useEffect, useState } from "react";
import {
  defaultStoreSettings,
  fetchStoreSettings,
  getSalesWhatsApp,
  getWhatsAppLink,
} from "../utils/storeSettings";
import "../styles/home.css";

function WhatsAppButton() {
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);

  useEffect(() => {
    fetchStoreSettings().then(setStoreSettings);
  }, []);

  return (
    <a
      href={getWhatsAppLink(getSalesWhatsApp(storeSettings))}
      className="whatsapp-btn"
      target="_blank"
      rel="noreferrer"
    >
      💬 WhatsApp
    </a>
  );
}

export default WhatsAppButton;
