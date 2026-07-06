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

    const savedWishlist =
      JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];

    setWishlist(savedWishlist);
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
    { id: "profile", label: "👤 Profile" },
    { id: "orders", label: "📦 Orders" },
    { id: "wishlist", label: "❤ Wishlist" },
    { id: "addresses", label: "📍 Addresses" },
    { id: "payments", label: "💳 Payments" },
    { id: "coupons", label: "🎁 Coupons" },
    { id: "rewards", label: "⭐ Rewards" },
    { id: "settings", label: "⚙ Settings" },
  ];

  if (loading) return <div className="customer-loading">Loading...</div>;

  return (
    <>
      <Navbar />

      <section className="customer-dashboard">
        <div className="customer-header">
          <div>
            <h1>Welcome, {name}</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="customer-cards">
          <div className="customer-card">
            <h3>Total Orders</h3>
            <h2>{orders.length}</h2>
          </div>

          <div className="customer-card">
            <h3>Wishlist Items</h3>
            <h2>{wishlist.length}</h2>
          </div>

          <div className="customer-card">
            <h3>Account Status</h3>
            <h2>Active</h2>
          </div>
        </div>

        <div
          className="customer-grid"
          style={{ gridTemplateColumns: "280px 1fr" }}
        >
          <div className="customer-panel">
            <h2>My Account</h2>

            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: "100%",
                  padding: "15px",
                  marginBottom: "10px",
                  borderRadius: "12px",
                  border:
                    activeTab === tab.id
                      ? "1px solid #d4af37"
                      : "1px solid #333",
                  background:
                    activeTab === tab.id ? "#d4af37" : "transparent",
                  color: activeTab === tab.id ? "#000" : "#fff",
                  fontWeight: "800",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={logout}
              style={{
                width: "100%",
                padding: "15px",
                borderRadius: "12px",
                border: "1px solid #ff4d4d",
                background: "transparent",
                color: "#ff4d4d",
                fontWeight: "800",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              🚪 Logout
            </button>
          </div>

          <div className="customer-panel">
            {activeTab === "profile" && (
              <>
                <h2>👤 Profile</h2>
                <p>
                  <strong>Name:</strong> {name}
                </p>
                <p>
                  <strong>Email:</strong> {user?.email}
                </p>
                <p>
                  <strong>Status:</strong> Active
                </p>

                <Link to="/reset-password">
                  Change Password
                </Link>
              </>
            )}

            {activeTab === "orders" && (
              <>
                <h2>📦 My Orders</h2>

                {orders.length === 0 ? (
                  <p>No orders yet.</p>
                ) : (
                  orders.map((order) => (
                    <div className="customer-order" key={order.id}>
                      <div>
                        <strong>
                          Order #{String(order.id).slice(0, 8)}
                        </strong>
                        <p>
                          {new Date(
                            order.created_at
                          ).toLocaleString()}
                        </p>
                      </div>

                      <div>
                        <strong>
                          GH₵{" "}
                          {Number(order.total || 0).toFixed(2)}
                        </strong>
                        <span>{order.status || "Pending"}</span>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === "wishlist" && (
              <>
                <h2>❤ Wishlist</h2>
                <p>You have {wishlist.length} item(s) saved.</p>
                <Link to="/wishlist">View Wishlist</Link>
              </>
            )}

            {activeTab === "addresses" && (
              <>
                <h2>📍 Saved Addresses</h2>
                <p>No saved delivery address yet.</p>

                <button className="customer-header button">
                  Add Address
                </button>
              </>
            )}

            {activeTab === "payments" && (
              <>
                <h2>💳 Payment Methods</h2>
                <p>No payment method saved yet.</p>
                <p>Paystack / Mobile Money setup can be added later.</p>
              </>
            )}

            {activeTab === "coupons" && (
              <>
                <h2>🎁 Coupons</h2>
                <p>No active coupons yet.</p>
                <p>Available promo codes will appear here.</p>
              </>
            )}

            {activeTab === "rewards" && (
              <>
                <h2>⭐ Loyalty Rewards</h2>
                <p>Street Points: 0</p>
                <p>Shop more to earn rewards.</p>
              </>
            )}

            {activeTab === "settings" && (
              <>
                <h2>⚙ Account Settings</h2>

                <Link to="/reset-password">
                  Change Password
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default CustomerDashboard;