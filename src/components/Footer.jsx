import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  defaultStoreSettings,
  fetchStoreSettings,
  getSalesWhatsApp,
  getWhatsAppLink,
} from "../utils/storeSettings";
import "../styles/footer.css";

function Footer() {
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);

  useEffect(() => {
    let isMounted = true;

    fetchStoreSettings().then((settings) => {
      if (isMounted) setStoreSettings(settings);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const storeName = storeSettings.store_name || defaultStoreSettings.store_name;

  return (
    <footer>
      <div className="footer-grid">

        <div>
          <h2>{storeName.toUpperCase()}</h2>

          <p>
            {storeSettings.about || defaultStoreSettings.about}
          </p>

          <a
            href={getWhatsAppLink(getSalesWhatsApp(storeSettings))}
            target="_blank"
            rel="noopener noreferrer"
            className="footer-whatsapp"
          >
            Chat on WhatsApp
          </a>
        </div>

        <div>
          <h3>Quick Links</h3>

          <Link to="/">Home</Link>
          <Link to="/shop">Shop</Link>
          <Link to="/wishlist">Wishlist</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/contact">Contact</Link>
        </div>

        <div>
          <h3>Shop Categories</h3>

          <Link to="/shop?category=Men%20Clothing">Men Clothing</Link>
          <Link to="/shop?category=Kids%20Wear">Kids Wear</Link>
          <Link to="/shop?category=Sneakers">Sneakers</Link>
          <Link to="/shop?category=Bags">Bags</Link>
          <Link to="/shop?category=Accessories">Accessories</Link>
        </div>

        <div>
          <h3>Contact Us</h3>

          <p>{storeSettings.location_name || "Accra (Tudu), Ghana"}</p>
          <p>{storeSettings.phone}</p>
          <p>{storeSettings.email}</p>

          <p><strong>Business Hours</strong></p>
          <p>{storeSettings.business_hours}</p>
        </div>

      </div>

      <div className="copyright">
        © {new Date().getFullYear()} {storeName.toUpperCase()}. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;
