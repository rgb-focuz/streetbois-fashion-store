import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileSearch, setMobileSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    updateCartCount();
    updateWishlistCount();
    loadUser();

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    window.addEventListener("storage", updateCartCount);
    window.addEventListener("storage", updateWishlistCount);
    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("wishlistUpdated", updateWishlistCount);

    return () => {
      data.subscription.unsubscribe();
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("storage", updateWishlistCount);
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("wishlistUpdated", updateWishlistCount);
    };
  }, []);

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    setUser(user || null);
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("streetbois-cart")) || [];
    setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
  };

  const updateWishlistCount = () => {
    const wishlist =
      JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];
    setWishlistCount(wishlist.length);
  };

  const customerName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Customer";

  const firstName = customerName.split(" ")[0];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccountOpen(false);
    navigate("/account");
  };

  const handleMobileSearch = () => {
    const value = mobileSearch.trim();
    if (!value) return;
    navigate(`/shop?search=${encodeURIComponent(value)}`);
    setMenuOpen(false);
  };

  return (
    <header className="mobile-header-wrap">
      <nav className="navbar">
        <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>

        <Link to="/" className="logo">
          <img src={logo} alt="StreetBois Fashion Logo" />
          <h2>STREETBOIS FASHION</h2>
        </Link>

        <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
          <li><Link onClick={() => setMenuOpen(false)} to="/">Home</Link></li>
          <li><Link onClick={() => setMenuOpen(false)} to="/shop">Shop</Link></li>
          <li><Link onClick={() => setMenuOpen(false)} to="/about">About</Link></li>
          <li><Link onClick={() => setMenuOpen(false)} to="/contact">Contact</Link></li>
          <li><Link onClick={() => setMenuOpen(false)} to="/faq">FAQ</Link></li>

          <li>
            <Link onClick={() => setMenuOpen(false)} to="/wishlist" className="cart-link">
              Wishlist
              {wishlistCount > 0 && <span className="cart-count">{wishlistCount}</span>}
            </Link>
          </li>

          <li>
            <Link onClick={() => setMenuOpen(false)} to="/cart" className="cart-link">
              Cart
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>
          </li>

          <li className="mobile-auth-link">
            {user ? (
              <Link onClick={() => setMenuOpen(false)} to="/customer-dashboard">
                👤 Hi, {firstName}
              </Link>
            ) : (
              <Link onClick={() => setMenuOpen(false)} to="/account">
                👤 Sign In / Up
              </Link>
            )}
          </li>
        </ul>

        <div className="navbar-actions">
          {user ? (
            <div className="account-dropdown-wrap">
              <button
                type="button"
                className="signin-btn"
                onClick={() => setAccountOpen(!accountOpen)}
              >
                👤 Hi, {firstName}
              </button>

              {accountOpen && (
                <div className="account-dropdown">
                  <Link onClick={() => setAccountOpen(false)} to="/customer-dashboard">
                    My Account
                  </Link>
                  <Link onClick={() => setAccountOpen(false)} to="/customer-dashboard">
                    My Orders
                  </Link>
                  <Link onClick={() => setAccountOpen(false)} to="/wishlist">
                    Wishlist
                  </Link>
                  <button type="button" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/account" className="signin-btn">👤 Sign In / Up</Link>
          )}

          <Link to="/shop" className="desktop-shop-btn">
            <button className="shop-btn">Shop Now</button>
          </Link>
        </div>

        <div className="mobile-icons">
          <Link
            to={user ? "/customer-dashboard" : "/account"}
            className="mobile-icon-link account-mobile-icon"
          >
            👤
          </Link>

          <Link to="/cart" className="mobile-icon-link">
            🛒
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>
        </div>
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