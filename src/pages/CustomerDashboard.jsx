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
        <div className="customer-mobile-top">
          <h2>My StreetBois</h2>
        </div>

        <div className="customer-profile-head">
          <div className="customer-avatar">👤</div>
          <div>
            <h1>{name}</h1>
            <p>{user?.email}</p>
          </div>
        </div>

        <div className="customer-menu-list">
          <Link to="/customer-dashboard" className="customer-menu-item">
            <span>📋</span>
            <p>Manage Orders</p>
            <strong>{orders.length}</strong>
            <b>›</b>
          </Link>

          <Link to="/cart" className="customer-menu-item">
            <span>🛒</span>
            <p>Shopping Cart</p>
            <b>›</b>
          </Link>

          <Link to="/wishlist" className="customer-menu-item">
            <span>♡</span>
            <p>My Favorites</p>
            <strong>{wishlist.length}</strong>
            <b>›</b>
          </Link>

          <button className="customer-menu-item" type="button">
            <span>🎟</span>
            <p>My Coupons</p>
            <b>›</b>
          </button>

          <button className="customer-menu-item" type="button">
            <span>📍</span>
            <p>Delivery Address</p>
            <b>›</b>
          </button>

          <Link to="/reset-password" className="customer-menu-item">
            <span>⚙</span>
            <p>Account Settings</p>
            <b>›</b>
          </Link>

          <button className="customer-menu-item logout-mobile" onClick={logout}>
            <span>🚪</span>
            <p>Logout</p>
            <b>›</b>
          </button>
        </div>

        <div className="customer-orders-card">
          <h2>Recent Orders</h2>

          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            orders.slice(0, 3).map((order) => (
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
        </div>
      </section>

      <Footer />
    </>
  );
}

export default CustomerDashboard;