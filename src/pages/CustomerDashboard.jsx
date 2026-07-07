import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/customerDashboard.css";

function CustomerDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomer();
  }, []);

  const loadCustomer = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      navigate("/account");
      return;
    }

    setUser(user);

    const { data: orderData } = await supabase
      .from("orders")
      .select("*")
      .eq("customer_email", user.email)
      .order("created_at", { ascending: false });

    setOrders(orderData || []);
    setWishlist(JSON.parse(localStorage.getItem("streetbois-wishlist")) || []);
    setLoading(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/account");
  };

  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "Customer";

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "orders", label: "Orders" },
    { id: "wishlist", label: "Wishlist" },
    { id: "addresses", label: "Address" },
    { id: "settings", label: "Settings" },
  ];

  if (loading) return <div className="customer-loading">Loading...</div>;

  return (
    <>
      <Navbar />

      <section className="customer-dashboard">
        <div className="customer-hero">
          <p>My Account</p>
          <h1>Welcome, {name}</h1>
          <span>{user?.email}</span>
        </div>

        <div className="customer-stats">
          <div>
            <small>Orders</small>
            <strong>{orders.length}</strong>
          </div>
          <div>
            <small>Wishlist</small>
            <strong>{wishlist.length}</strong>
          </div>
          <div>
            <small>Status</small>
            <strong>Active</strong>
          </div>
        </div>

        <div className="customer-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="customer-content-card">
          {activeTab === "profile" && (
            <>
              <h2>Profile Details</h2>
              <div className="info-row"><span>Name</span><strong>{name}</strong></div>
              <div className="info-row"><span>Email</span><strong>{user?.email}</strong></div>
              <div className="info-row"><span>Status</span><strong>Active</strong></div>
              <Link to="/reset-password" className="customer-action-btn">Change Password</Link>
            </>
          )}

          {activeTab === "orders" && (
            <>
              <h2>My Orders</h2>
              {orders.length === 0 ? (
                <p className="empty-text">No orders yet.</p>
              ) : (
                orders.map((order) => (
                  <div className="customer-order" key={order.id}>
                    <div>
                      <strong>Order #{String(order.id).slice(0, 8)}</strong>
                      <p>{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                    <div>
                      <strong>GH₵ {Number(order.total || 0).toFixed(2)}</strong>
                      <span>{order.status || "Pending"}</span>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {activeTab === "wishlist" && (
            <>
              <h2>Wishlist</h2>
              <p className="empty-text">You have {wishlist.length} saved item(s).</p>
              <Link to="/wishlist" className="customer-action-btn">View Wishlist</Link>
            </>
          )}

          {activeTab === "addresses" && (
            <>
              <h2>Saved Address</h2>
              <p className="empty-text">No saved delivery address yet.</p>
              <button className="customer-action-btn">Add Address</button>
            </>
          )}

          {activeTab === "settings" && (
            <>
              <h2>Account Settings</h2>
              <Link to="/reset-password" className="customer-action-btn">Change Password</Link>
              <button onClick={logout} className="logout-action-btn">Logout</button>
            </>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default CustomerDashboard;