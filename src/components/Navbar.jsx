import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [mobileSearch, setMobileSearch] = useState("");
  const navigate = useNavigate();

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

  const handleMobileSearch = () => {
    const value = mobileSearch.trim();
    if (!value) return;
    navigate(`/shop?search=${encodeURIComponent(value)}`);
  };

  return (
    <header className="mobile-header-wrap">
      <nav className="navbar">
        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </div>

        <Link to="/" className="logo">
          <img src={logo} alt="StreetBois Fashion Logo" />
          <h2>StreetBois Fashion</h2>
        </Link>

        <Link to="/cart" className="mobile-cart">
          🛒
          {cartCount > 0 && <span>{cartCount}</span>}
        </Link>

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

          <li><Link to="/recently-viewed">Recently Viewed</Link></li>
          <li><Link to="/account">Account</Link></li>
        </ul>

        <Link to="/shop" className="desktop-shop-btn">
          <button className="shop-btn">Shop Now</button>
        </Link>
      </nav>

      <div className="mobile-search-bar">
        <input
          type="text"
          placeholder="Search StreetBois Fashion"
          value={mobileSearch}
          onChange={(e) => setMobileSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleMobileSearch()}
        />

        <button onClick={handleMobileSearch}>🔍</button>
      </div>
    </header>
  );
}

export default Navbar;