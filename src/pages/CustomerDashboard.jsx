import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import "../styles/customerDashboard.css";

const accountLinks = [
  { view: "overview", label: "My Account", icon: "A" },
  { view: "orders", label: "Orders", icon: "O" },
  { view: "inbox", label: "Inbox", icon: "I" },
  { view: "reviews", label: "Pending Reviews", icon: "R" },
  { view: "vouchers", label: "Vouchers", icon: "V" },
  { view: "wishlist", label: "Wishlist", icon: "W" },
  { view: "recently-viewed", label: "Recently Viewed", icon: "H" },
];

const managementLinks = [
  { view: "profile", label: "Account Management" },
  { view: "payment", label: "Payment Settings" },
  { view: "address", label: "Address Book" },
  { view: "newsletter", label: "Newsletter Preferences" },
  { view: "close", label: "Close Account" },
];

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

const formatOrderReference = (order) => {
  const firstItemName = order?.items?.[0]?.name || "ORDER";
  const productCode =
    String(firstItemName)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 16) || "ORDER";
  const numericCode =
    String(order?.id || "")
      .replace(/\D/g, "")
      .slice(-6)
      .padStart(6, "0") || "000000";

  return `${productCode}-${numericCode}`;
};

function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeView = searchParams.get("view") || "overview";

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadCustomerAccount = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!currentUser) {
        navigate("/account");
        return;
      }

      setUser(currentUser);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name,email,phone,address")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!active) return;

      setProfile(profileData || null);

      const email = currentUser.email?.toLowerCase();

      if (email) {
        const { data: orderData } = await supabase
          .from("orders")
          .select("id,items,total,status,created_at,customer_phone,delivery_address")
          .eq("customer_email", email)
          .order("created_at", { ascending: false });

        if (active) setOrders(orderData || []);
      }

      try {
        setWishlist(JSON.parse(localStorage.getItem("streetbois-wishlist")) || []);
        setRecentlyViewed(
          JSON.parse(localStorage.getItem("streetbois-recently-viewed")) || []
        );
      } catch {
        setWishlist([]);
        setRecentlyViewed([]);
      }

      if (active) setLoading(false);
    };

    loadCustomerAccount();

    return () => {
      active = false;
    };
  }, [navigate]);

  const customerName = useMemo(() => {
    const name =
      profile?.full_name ||
      user?.user_metadata?.full_name ||
      user?.user_metadata?.name ||
      user?.email?.split("@")[0] ||
      "Customer";

    return String(name).trim();
  }, [profile, user]);

  const defaultOrder = orders[0];
  const customerPhone = defaultOrder?.customer_phone || profile?.phone || "Not set";
  const deliveryAddress = defaultOrder?.delivery_address || profile?.address || "No default address yet.";
  const pendingOrders = orders.filter((order) => order.status === "Pending").length;

  const changeView = (view) => {
    navigate(`/customer-dashboard?view=${view}`);
  };

  const renderOverview = () => (
    <div className="account-overview-grid">
      <article className="overview-card">
        <header>
          <h3>Account Details</h3>
        </header>
        <div>
          <strong>{customerName}</strong>
          <p>{user?.email}</p>
        </div>
      </article>

      <article className="overview-card">
        <header>
          <h3>Address Book</h3>
          <button type="button" onClick={() => changeView("address")}>Edit</button>
        </header>
        <div>
          <strong>Your default shipping address:</strong>
          <p>{customerName}</p>
          <p>{deliveryAddress}</p>
          <p>{customerPhone}</p>
        </div>
      </article>

      <article className="overview-card">
        <header>
          <h3>StreetBois Store Credit</h3>
        </header>
        <div>
          <strong>Balance: GH₵ 0</strong>
          <p>Store credit will appear here when available.</p>
        </div>
      </article>

      <article className="overview-card">
        <header>
          <h3>Newsletter Preferences</h3>
        </header>
        <div>
          <p>Manage your email communications and product updates.</p>
          <button type="button" onClick={() => changeView("newsletter")}>
            Edit Newsletter Preferences
          </button>
        </div>
      </article>
    </div>
  );

  const renderOrders = () => (
    <div className="dashboard-panel">
      <h3>Orders</h3>
      {orders.length === 0 ? (
        <p className="dashboard-empty">You have not placed an order yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <article key={order.id} className="order-row">
              <div>
                <strong>{formatOrderReference(order)}</strong>
                <p>{formatDate(order.created_at)} • {(order.items || []).length} item(s)</p>
              </div>
              <div>
                <b>GH₵ {Number(order.total || 0).toFixed(2)}</b>
                <span>{order.status || "Pending"}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderWishlist = () => (
    <div className="dashboard-panel">
      <h3>Wishlist</h3>
      {wishlist.length === 0 ? (
        <p className="dashboard-empty">Your wishlist is empty.</p>
      ) : (
        <div className="compact-product-list">
          {wishlist.map((item) => (
            <Link to={`/product/${item.id}`} key={item.id}>
              <img src={item.image_url} alt={item.name} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const renderRecent = () => (
    <div className="dashboard-panel">
      <h3>Recently Viewed</h3>
      {recentlyViewed.length === 0 ? (
        <p className="dashboard-empty">No recently viewed products yet.</p>
      ) : (
        <div className="compact-product-list">
          {recentlyViewed.map((item) => (
            <Link to={`/product/${item.id}`} key={item.id}>
              <img src={item.image_url} alt={item.name} />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const renderSimplePanel = (title, body) => (
    <div className="dashboard-panel">
      <h3>{title}</h3>
      <p className="dashboard-empty">{body}</p>
    </div>
  );

  const renderActiveContent = () => {
    if (activeView === "orders") return renderOrders();
    if (activeView === "wishlist") return renderWishlist();
    if (activeView === "recently-viewed") return renderRecent();
    if (activeView === "address") {
      return renderSimplePanel(
        "Address Book",
        deliveryAddress === "No default address yet."
          ? "Your delivery address will appear here after your first successful order."
          : deliveryAddress
      );
    }
    if (activeView === "profile") {
      return renderSimplePanel("Account Management", `${customerName} • ${user?.email}`);
    }
    if (activeView === "payment") {
      return renderSimplePanel("Payment Settings", "Online payment setup is not enabled yet.");
    }
    if (activeView === "newsletter") {
      return renderSimplePanel("Newsletter Preferences", "You are subscribed to store updates.");
    }
    if (activeView === "close") {
      return renderSimplePanel("Close Account", "Contact support if you want to close your account.");
    }
    if (activeView === "inbox") {
      return renderSimplePanel("Inbox", "You have no messages yet.");
    }
    if (activeView === "reviews") {
      return renderSimplePanel("Pending Reviews", "Products waiting for review will appear here.");
    }
    if (activeView === "vouchers") {
      return renderSimplePanel("Vouchers", "You have no active vouchers.");
    }

    return renderOverview();
  };

  if (loading) {
    return <div className="customer-loading">Loading account...</div>;
  }

  return (
    <>
      <Navbar />

      <main className="customer-dashboard">
        <aside className="customer-sidebar">
          {accountLinks.map((item) => (
            <button
              key={item.view}
              type="button"
              className={activeView === item.view ? "active" : ""}
              onClick={() => changeView(item.view)}
            >
              <span>{item.icon}</span>
              {item.label}
              {item.view === "orders" && pendingOrders > 0 && <em>{pendingOrders}</em>}
              {item.view === "wishlist" && wishlist.length > 0 && <em>{wishlist.length}</em>}
            </button>
          ))}

          <div className="sidebar-divider"></div>

          {managementLinks.map((item) => (
            <button
              key={item.view}
              type="button"
              className={activeView === item.view ? "active text-only" : "text-only"}
              onClick={() => changeView(item.view)}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <section className="customer-account-content">
          <header className="customer-account-header">
            <h1>
              {activeView === "overview"
                ? "Account Overview"
                : [...accountLinks, ...managementLinks].find((item) => item.view === activeView)?.label ||
                  "Account"}
            </h1>
          </header>

          {renderActiveContent()}
        </section>
      </main>

      <Footer />
    </>
  );
}

export default CustomerDashboard;
