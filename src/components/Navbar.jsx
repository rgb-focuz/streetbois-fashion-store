import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/logo.png";
import {
  defaultStoreSettings,
  fetchStoreSettings,
  getLogoUrl,
  getSalesWhatsApp,
  getWhatsAppLink,
} from "../utils/storeSettings";

const getSupabase = async () => {
  const module = await import("../supabaseClient");
  return module.supabase;
};

const Icon = ({ name }) => {
  const icons = {
    menu: (
      <>
        <path d="M4 7h16" />
        <path d="M4 12h16" />
        <path d="M4 17h16" />
      </>
    ),
    close: (
      <>
        <path d="M18 6 6 18" />
        <path d="m6 6 12 12" />
      </>
    ),
    user: (
      <>
        <path d="M20 21a8 8 0 0 0-16 0" />
        <circle cx="12" cy="7" r="4" />
      </>
    ),
    cart: (
      <>
        <path d="M6 6h15l-2 9H8L6 3H3" />
        <circle cx="9" cy="20" r="1.5" />
        <circle cx="18" cy="20" r="1.5" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    order: (
      <>
        <path d="M5 7h14v13H5Z" />
        <path d="M8 7a4 4 0 0 1 8 0" />
      </>
    ),
    heart: (
      <path d="M20.5 8.5c0 6-8.5 11-8.5 11s-8.5-5-8.5-11A4.7 4.7 0 0 1 12 5a4.7 4.7 0 0 1 8.5 3.5Z" />
    ),
    phone: (
      <>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <path d="M11 18h2" />
      </>
    ),
    shirt: (
      <path d="M9 4h6l2 3 4 1-2 5-3-1v8H8v-8l-3 1-2-5 4-1Z" />
    ),
    help: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.8 9a2.5 2.5 0 1 1 4.2 1.8c-1.2.9-2 1.4-2 3.2" />
        <path d="M12 17h.01" />
      </>
    ),
  };

  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      {icons[name]}
    </svg>
  );
};

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mobileSearch, setMobileSearch] = useState("");
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);
  const navigate = useNavigate();

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem("streetbois-cart")) || [];
    setCartCount(cart.reduce((total, item) => total + item.quantity, 0));
  };

  const updateWishlistCount = () => {
    const wishlist = JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];
    setWishlistCount(wishlist.length);
  };

  useEffect(() => {
    let isMounted = true;
    let authSubscription = null;

    updateCartCount();
    updateWishlistCount();

    fetchStoreSettings().then((settings) => {
      if (isMounted) setStoreSettings(settings);
    });

    const loadAuthState = async () => {
      const supabase = await getSupabase();

      if (!isMounted) return;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isMounted) {
        setUser(user || null);
      }

      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (isMounted) {
          setUser(session?.user || null);
        }
      });

      authSubscription = data.subscription;
    };

    loadAuthState();

    window.addEventListener("storage", updateCartCount);
    window.addEventListener("storage", updateWishlistCount);
    window.addEventListener("cartUpdated", updateCartCount);
    window.addEventListener("wishlistUpdated", updateWishlistCount);

    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
      window.removeEventListener("storage", updateCartCount);
      window.removeEventListener("storage", updateWishlistCount);
      window.removeEventListener("cartUpdated", updateCartCount);
      window.removeEventListener("wishlistUpdated", updateWishlistCount);
    };
  }, []);

  const customerName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Customer";

  const firstName = customerName.split(" ")[0];
  const brandName = storeSettings.store_name || defaultStoreSettings.store_name;
  const brandWords = brandName.trim().split(/\s+/);
  const firstBrandWords = brandWords.slice(0, -1).join(" ") || brandName;
  const lastBrandWord =
    brandWords.length > 1 ? brandWords[brandWords.length - 1] : "";
  const displayedPhone = storeSettings.phone || defaultStoreSettings.phone;
  const cleanTel = displayedPhone.replace(/\D/g, "");
  const helpWhatsAppMessage =
    `Hello ${brandName}, I need help with my order.`;

  const closeMenu = () => setMenuOpen(false);

  const closeDesktopMenus = () => {
    setAccountOpen(false);
    setHelpOpen(false);
  };

  const handleLogout = async () => {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    setUser(null);
    setAccountOpen(false);
    setHelpOpen(false);
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
      <div className="desktop-top-strip">
        <Link to="/admin-login">Sell on StreetBois</Link>
        <div>
          <strong>STREETBOIS</strong>
          <span>PAY</span>
          <span>DELIVERY</span>
        </div>
      </div>

      <nav className="navbar">
        <button
          type="button"
          className="hamburger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <Icon name={menuOpen ? "close" : "menu"} />
        </button>

        <Link to="/" className="logo" onClick={closeMenu}>
          <img src={getLogoUrl(storeSettings) || logo} alt={`${brandName} Logo`} />
          <h2>
            {firstBrandWords} {lastBrandWord && <span>{lastBrandWord}</span>}
          </h2>
        </Link>

        <ul className="desktop-nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/shop">Shop</Link></li>
          <li><Link to="/contact">Contact</Link></li>
          <li><Link to="/faq">FAQ</Link></li>
        </ul>

        <form
          className="desktop-search-bar"
          onSubmit={(event) => {
            event.preventDefault();
            handleMobileSearch();
          }}
        >
          <Icon name="search" />
          <input
            type="text"
            placeholder="Search products, brands and categories"
            value={mobileSearch}
            onChange={(event) => setMobileSearch(event.target.value)}
          />
          <button type="submit">Search</button>
        </form>

        <div className="desktop-icons">
          <div className="desktop-menu-wrap">
            <button
              type="button"
              className={`desktop-action-link desktop-menu-button ${accountOpen ? "active" : ""}`}
              onClick={() => {
                setAccountOpen((open) => !open);
                setHelpOpen(false);
              }}
            >
              <Icon name="user" />
              <span>Account</span>
              <span className="desktop-caret">{accountOpen ? "⌃" : "⌄"}</span>
            </button>

            {accountOpen && (
              <div className="desktop-popover account-popover">
                <Link
                  to="/account"
                  className="desktop-popover-primary"
                  onClick={closeDesktopMenus}
                >
                  {user ? `Hi, ${firstName}` : "Sign In"}
                </Link>

                <Link to="/customer-dashboard" onClick={closeDesktopMenus}>
                  <Icon name="user" />
                  <span>My Account</span>
                </Link>

                <Link to="/customer-dashboard" onClick={closeDesktopMenus}>
                  <Icon name="order" />
                  <span>Orders</span>
                </Link>

                <Link to="/wishlist" onClick={closeDesktopMenus}>
                  <Icon name="heart" />
                  <span>Wishlist</span>
                </Link>

                {user && (
                  <button type="button" onClick={handleLogout}>
                    <Icon name="user" />
                    <span>Logout</span>
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="desktop-menu-wrap">
            <button
              type="button"
              className={`desktop-action-link desktop-menu-button ${helpOpen ? "active" : ""}`}
              onClick={() => {
                setHelpOpen((open) => !open);
                setAccountOpen(false);
              }}
            >
              <Icon name="help" />
              <span>Help</span>
              <span className="desktop-caret">{helpOpen ? "⌃" : "⌄"}</span>
            </button>

            {helpOpen && (
              <div className="desktop-popover help-popover">
                <Link to="/faq" onClick={closeDesktopMenus}>Help Center</Link>
                <Link to="/shop" onClick={closeDesktopMenus}>Place an Order</Link>
                <Link to="/cart" onClick={closeDesktopMenus}>Pay For Your Order</Link>
                <Link to="/customer-dashboard" onClick={closeDesktopMenus}>Track Your Order</Link>
                <Link
                  to="/contact?subject=Cancel%20an%20Order"
                  onClick={closeDesktopMenus}
                >
                  Cancel an Order
                </Link>
                <Link to="/faq" onClick={closeDesktopMenus}>Returns & Refunds</Link>

                <Link
                  to="/contact?subject=Live%20Chat"
                  className="desktop-help-live"
                  onClick={closeDesktopMenus}
                >
                  Live Chat
                </Link>

                <a
                  href={getWhatsAppLink(
                    getSalesWhatsApp(storeSettings),
                    helpWhatsAppMessage
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="desktop-help-whatsapp"
                  onClick={closeDesktopMenus}
                >
                  WhatsApp
                </a>
              </div>
            )}
          </div>

          <Link to="/cart" className="desktop-action-link desktop-cart-link" aria-label="Cart">
            <Icon name="cart" />
            <span>Cart</span>
            {cartCount > 0 && <em>{cartCount}</em>}
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
                <Icon name="user" /> Hi, {firstName}
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
              <Icon name="user" /> Sign In / Up
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
            aria-label="Sign in or create account"
            onClick={() => {
              setMenuOpen(false);
              navigate("/account");
            }}
          >
            <Icon name="user" />
          </button>

          <Link to="/cart" className="mobile-icon-link" aria-label="Cart">
            <Icon name="cart" />
            {cartCount > 0 && <span>{cartCount}</span>}
          </Link>
        </div>
      </nav>

      <div className="mobile-search-bar">
        <Icon name="search" />
        <input
          type="text"
          placeholder="Search products, brands and categories"
          value={mobileSearch}
          onChange={(e) => setMobileSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleMobileSearch()}
        />
        <button onClick={handleMobileSearch}>Search</button>
      </div>

      <a className="mobile-call-strip" href={`tel:${cleanTel}`}>
        Call to Order: {displayedPhone}
      </a>

      <aside className={`mobile-account-drawer ${menuOpen ? "active" : ""}`}>
        <div className="drawer-head">
          <button
            type="button"
            className="drawer-close"
            onClick={closeMenu}
            aria-label="Close menu"
          >
            <Icon name="close" />
          </button>

          <Link to="/" className="drawer-logo" onClick={closeMenu}>
            <img src={getLogoUrl(storeSettings) || logo} alt={`${brandName} Logo`} />
            <strong>{brandName}</strong>
          </Link>

          <Link to="/cart" className="drawer-cart" onClick={closeMenu} aria-label="Cart">
            <Icon name="cart" />
          </Link>
        </div>

        <Link onClick={closeMenu} to="/contact" className="drawer-section-link">
          <span>Need Help?</span>
          <Icon name="chevron" />
        </Link>

        <Link onClick={closeMenu} to="/account" className="drawer-section-link">
          <span>My StreetBois Account</span>
          <Icon name="chevron" />
        </Link>

        <Link onClick={closeMenu} to="/customer-dashboard" className="drawer-row">
          <Icon name="order" />
          <span>Orders</span>
        </Link>

        <Link onClick={closeMenu} to="/faq" className="drawer-row">
          <Icon name="help" />
          <span>Help & FAQ</span>
        </Link>

        <Link onClick={closeMenu} to="/wishlist" className="drawer-row">
          <Icon name="heart" />
          <span>Wishlist</span>
          {wishlistCount > 0 && <em>{wishlistCount}</em>}
        </Link>

        <Link onClick={closeMenu} to="/cart" className="drawer-row">
          <Icon name="cart" />
          <span>Shopping Cart</span>
          {cartCount > 0 && <em>{cartCount}</em>}
        </Link>

        <div className="drawer-category-head">
          <span>Our Categories</span>
          <Link to="/shop" onClick={closeMenu}>See All</Link>
        </div>

        <Link onClick={closeMenu} to="/shop?category=Men%20Clothing" className="drawer-row">
          <Icon name="shirt" />
          <span>Men Clothing</span>
        </Link>

        <Link onClick={closeMenu} to="/shop?category=Kids%20Wear" className="drawer-row">
          <span className="drawer-letter">K</span>
          <span>Kids Wear</span>
        </Link>

        <Link onClick={closeMenu} to="/shop?category=Sneakers" className="drawer-row">
          <span className="drawer-letter">S</span>
          <span>Sneakers</span>
        </Link>

        <Link onClick={closeMenu} to="/shop?category=Bags" className="drawer-row">
          <span className="drawer-letter">B</span>
          <span>Bags</span>
        </Link>

        <Link onClick={closeMenu} to="/shop?category=Perfumes" className="drawer-row">
          <span className="drawer-letter">P</span>
          <span>Perfumes</span>
        </Link>

        <Link onClick={closeMenu} to="/shop?category=Accessories" className="drawer-row">
          <span className="drawer-letter">A</span>
          <span>Accessories</span>
        </Link>

        <Link onClick={closeMenu} to="/contact" className="drawer-row">
          <Icon name="phone" />
          <span>Contact Us</span>
        </Link>

        {user ? (
          <button type="button" onClick={handleLogout} className="drawer-row logout-drawer-row">
            <Icon name="user" />
            <span>Logout</span>
          </button>
        ) : (
          <Link onClick={closeMenu} to="/account" className="drawer-row">
            <Icon name="user" />
            <span>Sign In / Up</span>
          </Link>
        )}
      </aside>

      {menuOpen && <button className="drawer-overlay" onClick={closeMenu} aria-label="Close menu"></button>}
    </header>
  );
}

export default Navbar;
