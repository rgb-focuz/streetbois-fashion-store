import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    updateCartCount();

    window.addEventListener("storage", updateCartCount);
    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("streetbois-cart")) || [];
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    setCartCount(count);
  };

  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logo} alt="StreetBois Fashion Logo" />
        <h2>StreetBois Fashion</h2>
      </div>

      <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        ☰
      </div>

      <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
        <li><Link to="/">Home</Link></li>
        <li><Link to="/shop">Shop</Link></li>
        <li><Link to="/about">About</Link></li>
        <li><Link to="/contact">Contact</Link></li>
        <li><Link to="/faq">FAQ</Link></li>
        <li><Link to="/wishlist">Wishlist</Link></li>

        <li>
          <Link to="/cart" className="cart-link">
            Cart
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </Link>
        </li>

        <li><Link to="/account">Account</Link></li>
      </ul>

      <Link to="/shop">
        <button className="shop-btn">Shop Now</button>
      </Link>
    </nav>
  );
}

export default Navbar;