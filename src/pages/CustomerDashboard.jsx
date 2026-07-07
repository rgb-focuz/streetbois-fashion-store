import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/customerDashboard.css";

function CustomerDashboard() {
  const navigate = useNavigate();
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

  if (loading) return <div className="customer-loading">Loading...</div>;

  return (
    <>
      <Navbar />

      <section className="customer-dashboard">
        <div className="account-top-card">
          <div className="account-avatar">👤</div>
          <div>
            <h1>{name}</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="account-stats-row">
          <div>
            <strong>{orders.length}</strong>
            <span>Orders</span>
          </div>
          <div>
            <strong>{wishlist.length}</strong>
            <span>Wishlist</span>
          </div>
          <div>
            <strong>Active</strong>
            <span>Status</span>
          </div>
        </div>

        <div className="account-menu-card">
          <Link to="/customer-dashboard" className="account-menu-row">
            <span>📋</span>
            <p>Manage Orders</p>
            <b>{orders.length}</b>
            <i>›</i>
          </Link>

          <Link to="/cart" className="account-menu-row">
            <span>🛒</span>
            <p>Shopping Cart</p>
            <i>›</i>
          </Link>

          <Link to="/wishlist" className="account-menu-row">
            <span>❤️</span>
            <p>My Favorites</p>
            <b>{wishlist.length}</b>
            <i>›</i>
          </Link>

          <button type="button" className="account-menu-row">
            <span>🎟️</span>
            <p>My Coupons</p>
            <i>›</i>
          </button>

          <button type="button" className="account-menu-row">
            <span>📍</span>
            <p>Delivery Address</p>
            <i>›</i>
          </button>

          <Link to="/reset-password" className="account-menu-row">
            <span>⚙️</span>
            <p>Account Settings</p>
            <i>›</i>
          </Link>

          <button type="button" onClick={logout} className="account-menu-row logout-row">
            <span>🚪</span>
            <p>Logout</p>
            <i>›</i>
          </button>
        </div>

        <div className="recent-orders-card">
          <h2>Recent Orders</h2>

          {orders.length === 0 ? (
            <p className="empty-orders">No orders yet.</p>
          ) : (
            orders.slice(0, 3).map((order) => (
              <div className="recent-order-row" key={order.id}>
                <div>
                  <h3>Order #{String(order.id).slice(0, 8)}</h3>
                  <p>{new Date(order.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <strong>GH₵ {Number(order.total || 0).toFixed(2)}</strong>
                  <span>{order.status || "Pending"}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default CustomerDashboard;