import { Link } from "react-router-dom";
import "../styles/footer.css";

function Footer() {
  return (
    <footer>
      <div className="footer-grid">

        <div>
          <h2>STREETBOIS FASHION</h2>

          <p>
            Ghana's premium fashion destination for quality clothing,
            footwear, bags and accessories.
          </p>

          <a
            href="https://wa.me/233202430406"
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

          <p>📍 Accra (Tudu), Ghana</p>
          <p>📞 +233 20 243 0406</p>
          <p>✉️ apodeijoshuaagudey1@gmail.com</p>

          <p><strong>Business Hours</strong></p>
          <p>Mon - Sat: 8:00 AM - 7:00 PM</p>
        </div>

      </div>

      <div className="copyright">
        © {new Date().getFullYear()} STREETBOIS FASHION. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;