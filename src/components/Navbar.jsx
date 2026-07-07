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
    const wishlist = JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];
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

        <ul className="desktop-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/faq">FAQ</Link></li>
        </ul>

        <div className="desktop-icons">
          <button type="button" className="desktop-search-icon">⌕</button>

          <Link to="/cart" className="desktop-icon-link">
            🛒
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>

          <Link to="/wishlist" className="desktop-icon-link">
            ♡
            {wishlistCount > 0 && <span>{wishlistCount}</span>}
          </Link>
        </div>

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

      <aside className={`mobile-account-drawer ${menuOpen ? "active" : ""}`}>
        <div className="drawer-head">
          <div className="drawer-avatar">👤</div>
          <div>
            <h3>{user ? customerName : "Welcome"}</h3>
            <p>{user ? user.email : "Please sign in to continue"}</p>
          </div>
        </div>

        <Link onClick={closeMenu} to="/" className="drawer-row">
          <span>⌂</span> Home <b>›</b>
        </Link>

        <Link onClick={closeMenu} to="/shop" className="drawer-row">
          <span>▣</span> Shop <b>›</b>
        </Link>

        <Link onClick={closeMenu} to="/contact" className="drawer-row">
          <span>☎</span> Contact <b>›</b>
        </Link>

        <Link onClick={closeMenu} to="/faq" className="drawer-row">
          <span>?</span> FAQ <b>›</b>
        </Link>

        <div className="drawer-divider"></div>

        <Link onClick={closeMenu} to="/cart" className="drawer-row">
          <span>🛒</span> Shopping Cart
          {cartCount > 0 && <em>{cartCount}</em>}
          <b>›</b>
        </Link>

        <Link onClick={closeMenu} to="/wishlist" className="drawer-row">
          <span>♡</span> My Favorites
          {wishlistCount > 0 && <em>{wishlistCount}</em>}
          <b>›</b>
        </Link>

        <button type="button" className="drawer-row">
          <span>🎟</span> My Coupons <b>›</b>
        </button>

        <button type="button" className="drawer-row">
          <span>📍</span> Delivery Address <b>›</b>
        </button>

        <Link onClick={closeMenu} to="/reset-password" className="drawer-row">
          <span>⚙</span> Settings <b>›</b>
        </Link>

        <div className="drawer-divider"></div>

        {user ? (
          <button type="button" onClick={handleLogout} className="drawer-row logout-drawer-row">
            <span>⇥</span> Logout <b>›</b>
          </button>
        ) : (
          <Link onClick={closeMenu} to="/account" className="drawer-row">
            <span>👤</span> Sign In / Up <b>›</b>
          </Link>
        )}
      </aside>

      {menuOpen && <button className="drawer-overlay" onClick={closeMenu}></button>}
    </header>
  );
}

export default Navbar;