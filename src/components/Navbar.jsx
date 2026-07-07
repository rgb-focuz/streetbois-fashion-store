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

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccountOpen(false);
    setMenuOpen(false);
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
        <button
          type="button"
          className="hamburger"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? "×" : "☰"}
        </button>

        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={logo} alt="StreetBois Fashion Logo" />
          <h2>STREETBOIS FASHION</h2>
        </Link>

        <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
          <li className="mobile-account-head">
            <div className="mobile-account-avatar">👤</div>

            <div>
              {user ? (
                <>
                  <h3>{customerName}</h3>
                  <p>{user.email}</p>
                </>
              ) : (
                <>
                  <h3>Welcome</h3>
                  <p>Please sign in to continue</p>
                </>
              )}
            </div>
          </li>

          <li>
            <Link onClick={closeMenu} to="/">
              Home
            </Link>
          </li>

          <li>
            <Link onClick={closeMenu} to="/shop">
              Shop
            </Link>
          </li>

          <li>
            <Link onClick={closeMenu} to="/contact">
              Contact
            </Link>
          </li>

          <li>
            <Link onClick={closeMenu} to="/faq">
              FAQ
            </Link>
          </li>

          <li className="mobile-menu-divider"></li>

          <li>
            <Link onClick={closeMenu} to="/cart" className="mobile-menu-row">
              <span>🛒</span>
              Shopping Cart
              {cartCount > 0 && <em>{cartCount}</em>}
              <b>›</b>
            </Link>
          </li>

          <li>
            <Link onClick={closeMenu} to="/wishlist" className="mobile-menu-row">
              <span>❤️</span>
              My Favorites
              {wishlistCount > 0 && <em>{wishlistCount}</em>}
              <b>›</b>
            </Link>
          </li>

          <li>
            <button type="button" className="mobile-menu-row">
              <span>🎟</span>
              My Coupons
              <b>›</b>
            </button>
          </li>

          <li>
            <button type="button" className="mobile-menu-row">
              <span>📍</span>
              Delivery Address
              <b>›</b>
            </button>
          </li>

          <li>
            <Link onClick={closeMenu} to="/reset-password" className="mobile-menu-row">
              <span>⚙</span>
              Settings
              <b>›</b>
            </Link>
          </li>

          <li className="mobile-menu-divider"></li>

          {user ? (
            <li>
              <button
                type="button"
                onClick={handleLogout}
                className="mobile-menu-row logout-mobile-row"
              >
                <span>🚪</span>
                Logout
                <b>›</b>
              </button>
            </li>
          ) : (
            <li>
              <Link onClick={closeMenu} to="/account" className="mobile-menu-row">
                <span>👤</span>
                Sign In / Up
                <b>›</b>
              </Link>
            </li>
          )}
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
            <Link to="/account" className="signin-btn">
              👤 Sign In / Up
            </Link>
          )}

          <Link to="/shop" className="desktop-shop-btn">
            <button className="shop-btn">Shop Now</button>
          </Link>
        </div>

        <div className="mobile-icons">
          <button
            type="button"
            className="mobile-icon-link account-mobile-icon"
            onClick={() => setMenuOpen(true)}
          >
            👤
          </button>

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