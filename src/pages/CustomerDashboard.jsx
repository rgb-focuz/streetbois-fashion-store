import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import { optimizeSupabaseImage } from "../utils/images";
import "../styles/customerDashboard.css";

const accountLinks = [
  { view: "overview", label: "My Account", icon: "A" },
  { view: "orders", label: "Orders", icon: "O" },
  { view: "inbox", label: "Inbox", icon: "I" },
  { view: "reviews", label: "Pending Reviews", icon: "R" },
  { view: "vouchers", label: "Vouchers", icon: "V" },
  { view: "recently-viewed", label: "Recently Viewed", icon: "H" },
];

const managementLinks = [
  { view: "profile", label: "Account Management" },
  { view: "address", label: "Address Book" },
  { view: "close", label: "Close Account" },
];

const createEmptyAddress = () => ({
  id: "",
  region: "Greater Accra",
  city: "Tudu",
  firstName: "",
  lastName: "",
  phone: "",
  additionalPhone: "",
  address: "",
  note: "",
  isDefault: false,
});

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

const orderStatusSteps = ["Pending", "Processing", "Shipped", "Delivered"];

const normalizeOrderStatus = (status) => {
  const cleanStatus = String(status || "Pending").toLowerCase();

  if (cleanStatus.includes("deliver")) return "Delivered";
  if (cleanStatus.includes("ship") || cleanStatus.includes("transit")) return "Shipped";
  if (cleanStatus.includes("process") || cleanStatus.includes("confirm")) return "Processing";
  if (cleanStatus.includes("cancel")) return "Cancelled";

  return "Pending";
};

function CustomerDashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeView = searchParams.get("view") || "overview";

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addressBook, setAddressBook] = useState([]);
  const [addressForm, setAddressForm] = useState(createEmptyAddress);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [addressMessage, setAddressMessage] = useState("");
  const [trackingInput, setTrackingInput] = useState("");
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [trackingMessage, setTrackingMessage] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);

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
        setRecentlyViewed(
          JSON.parse(localStorage.getItem("streetbois-recently-viewed")) || []
        );
        setAddressBook(
          JSON.parse(
            localStorage.getItem(`streetbois-address-book-${currentUser.id}`)
          ) || []
        );
      } catch {
        setRecentlyViewed([]);
        setAddressBook([]);
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
  const nameParts = customerName.split(" ").filter(Boolean);
  const defaultAddress =
    addressBook.find((address) => address.isDefault) || addressBook[0] || null;

  const changeView = (view) => {
    navigate(`/customer-dashboard?view=${view}`);
  };

  const saveAddressBook = (nextAddressBook) => {
    setAddressBook(nextAddressBook);

    if (user?.id) {
      localStorage.setItem(
        `streetbois-address-book-${user.id}`,
        JSON.stringify(nextAddressBook)
      );
    }
  };

  const updateProfileDefaultAddress = async (address) => {
    const fullName = `${address.firstName} ${address.lastName}`.trim();
    const fullAddress = `${address.address}, ${address.city}, ${address.region}`;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email?.toLowerCase(),
        full_name: fullName || customerName,
        phone: address.phone,
        address: fullAddress,
      },
      { onConflict: "id" }
    );

    if (!error) {
      setProfile((current) => ({
        ...(current || {}),
        full_name: fullName || customerName,
        phone: address.phone,
        address: fullAddress,
      }));
    }

    return error;
  };

  const startAddAddress = () => {
    setAddressMessage("");
    setEditingAddressId("new");
    setAddressForm({
      ...createEmptyAddress(),
      id: `addr-${Date.now()}`,
      firstName: nameParts[0] || "",
      lastName: nameParts.slice(1).join(" ") || "",
      phone: profile?.phone || defaultOrder?.customer_phone || "",
      address: profile?.address || defaultOrder?.delivery_address || "",
      isDefault: addressBook.length === 0,
    });
  };

  const startEditAddress = (address) => {
    setAddressMessage("");
    setEditingAddressId(address.id);
    setAddressForm({ ...address });
  };

  const cancelAddressForm = () => {
    setEditingAddressId("");
    setAddressForm(createEmptyAddress());
    setAddressMessage("");
  };

  const updateAddressField = (field, value) => {
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const saveAddress = async (event) => {
    event.preventDefault();
    setAddressMessage("");

    if (
      !addressForm.firstName.trim() ||
      !addressForm.phone.trim() ||
      !addressForm.address.trim()
    ) {
      setAddressMessage("Please add first name, phone number and address.");
      return;
    }

    const cleanAddress = {
      ...addressForm,
      id: addressForm.id || `addr-${Date.now()}`,
      firstName: addressForm.firstName.trim(),
      lastName: addressForm.lastName.trim(),
      phone: addressForm.phone.trim(),
      additionalPhone: addressForm.additionalPhone.trim(),
      address: addressForm.address.trim(),
      note: addressForm.note.trim(),
      isDefault: addressForm.isDefault || addressBook.length === 0,
    };

    let nextAddressBook = addressBook.some((address) => address.id === cleanAddress.id)
      ? addressBook.map((address) =>
          address.id === cleanAddress.id ? cleanAddress : address
        )
      : [...addressBook, cleanAddress];

    if (cleanAddress.isDefault) {
      nextAddressBook = nextAddressBook.map((address) => ({
        ...address,
        isDefault: address.id === cleanAddress.id,
      }));

      const error = await updateProfileDefaultAddress(cleanAddress);

      if (error) {
        setAddressMessage("Address saved, but profile update failed.");
      }
    }

    saveAddressBook(nextAddressBook);
    setEditingAddressId("");
    setAddressForm(createEmptyAddress());
    setAddressMessage("Address saved successfully.");
  };

  const makeDefaultAddress = async (address) => {
    const nextAddressBook = addressBook.map((item) => ({
      ...item,
      isDefault: item.id === address.id,
    }));

    saveAddressBook(nextAddressBook);
    await updateProfileDefaultAddress(address);
    setAddressMessage("Default address updated.");
  };

  const removeAddress = (addressId) => {
    if (!window.confirm("Remove this address?")) return;

    saveAddressBook(addressBook.filter((address) => address.id !== addressId));
    setAddressMessage("Address removed.");
  };

  const findOrderByReference = (value) => {
    const cleanValue = String(value || "").trim().toLowerCase();

    return orders.find((order) => {
      const rawId = String(order.id || "").toLowerCase();
      const reference = formatOrderReference(order).toLowerCase();

      return rawId === cleanValue || reference === cleanValue || rawId.includes(cleanValue);
    });
  };

  const handleTrackOrder = async (event) => {
    event.preventDefault();
    setTrackingMessage("");
    setTrackedOrder(null);

    const cleanInput = trackingInput.trim();

    if (!cleanInput) {
      setTrackingMessage("Enter your order ID to track your purchase.");
      return;
    }

    const localMatch = findOrderByReference(cleanInput);

    if (localMatch) {
      setTrackedOrder(localMatch);
      return;
    }

    setTrackingLoading(true);

    const { data, error } = await supabase
      .from("orders")
      .select("id,items,total,status,created_at,customer_phone,delivery_address,customer_email")
      .eq("id", cleanInput)
      .eq("customer_email", user.email?.toLowerCase())
      .maybeSingle();

    setTrackingLoading(false);

    if (error || !data) {
      setTrackingMessage(
        "We could not find that order for your account. Check the order ID and try again."
      );
      return;
    }

    setTrackedOrder(data);
  };

  const renderTrackingResult = (order) => {
    const status = normalizeOrderStatus(order.status);
    const statusIndex =
      status === "Cancelled" ? -1 : orderStatusSteps.indexOf(status);

    return (
      <article className={`tracking-result ${status.toLowerCase()}`}>
        <div className="tracking-result-head">
          <div>
            <span>Order ID</span>
            <strong>{formatOrderReference(order)}</strong>
            <small>{order.id}</small>
          </div>
          <mark>{status}</mark>
        </div>

        {status === "Cancelled" ? (
          <div className="tracking-cancelled">
            This order has been cancelled. If payment was made, contact support
            with your order ID.
          </div>
        ) : (
          <div className="tracking-steps">
            {orderStatusSteps.map((step, index) => (
              <div
                key={step}
                className={index <= statusIndex ? "complete" : ""}
              >
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        )}

        <div className="tracking-detail-grid">
          <p>
            <strong>Date:</strong> {formatDate(order.created_at)}
          </p>
          <p>
            <strong>Total:</strong> GH₵ {Number(order.total || 0).toFixed(2)}
          </p>
          <p>
            <strong>Items:</strong> {(order.items || []).length}
          </p>
          <p>
            <strong>Phone:</strong> {order.customer_phone || "Not provided"}
          </p>
          <p className="tracking-address">
            <strong>Delivery:</strong> {order.delivery_address || "Not provided"}
          </p>
        </div>
      </article>
    );
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
          <p>
            {defaultAddress
              ? `${defaultAddress.firstName} ${defaultAddress.lastName}`.trim()
              : customerName}
          </p>
          <p>
            {defaultAddress
              ? `${defaultAddress.address}, ${defaultAddress.city}, ${defaultAddress.region}`
              : deliveryAddress}
          </p>
          <p>{defaultAddress?.phone || customerPhone}</p>
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

    </div>
  );

  const renderOrders = () => (
    <div className="dashboard-panel">
      <div className="orders-panel-head">
        <div>
          <h3>Track Your Order</h3>
          <p>Enter your order ID to see the latest purchase status.</p>
        </div>
      </div>

      <form className="track-order-form" onSubmit={handleTrackOrder}>
        <input
          value={trackingInput}
          onChange={(event) => setTrackingInput(event.target.value)}
          placeholder="Enter order ID"
        />
        <button type="submit" disabled={trackingLoading}>
          {trackingLoading ? "Checking..." : "Track Order"}
        </button>
      </form>

      {trackingMessage && (
        <div className="tracking-message">{trackingMessage}</div>
      )}

      {trackedOrder && renderTrackingResult(trackedOrder)}

      <h3 className="order-history-title">Order History</h3>
      {orders.length === 0 ? (
        <p className="dashboard-empty">You have not placed an order yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((order) => (
            <button
              type="button"
              key={order.id}
              className="order-row"
              onClick={() => {
                setTrackingInput(formatOrderReference(order));
                setTrackedOrder(order);
                setTrackingMessage("");
              }}
            >
              <div>
                <strong>{formatOrderReference(order)}</strong>
                <p>{formatDate(order.created_at)} • {(order.items || []).length} item(s)</p>
              </div>
              <div>
                <b>GH₵ {Number(order.total || 0).toFixed(2)}</b>
                <span>{order.status || "Pending"}</span>
              </div>
            </button>
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
              <img
                src={optimizeSupabaseImage(item.thumbnail_url || item.image_url, {
                  width: 260,
                  height: 260,
                  quality: 70,
                })}
                alt={item.name}
                loading="lazy"
                decoding="async"
                width="260"
                height="260"
              />
              <span>{item.name}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  const renderAddressBook = () => (
    <div className="dashboard-panel address-book-panel">
      <div className="address-book-header">
        <div>
          <h3>Address Book</h3>
          <p>Manage delivery addresses for future orders.</p>
        </div>
        <button type="button" onClick={startAddAddress}>
          Add Address
        </button>
      </div>

      {addressMessage && <div className="address-alert">{addressMessage}</div>}

      {addressBook.length === 0 && !editingAddressId ? (
        <div className="address-empty-card">
          <p>No saved address yet.</p>
          <button type="button" onClick={startAddAddress}>
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="address-card-grid">
          {addressBook.map((address) => (
            <article className="saved-address-card" key={address.id}>
              <div>
                <strong>
                  {`${address.firstName} ${address.lastName}`.trim()}
                  {address.isDefault && <span>Default</span>}
                </strong>
                <p>{address.phone}</p>
                {address.additionalPhone && <p>{address.additionalPhone}</p>}
                <p>{address.address}</p>
                <p>
                  {address.city}, {address.region}
                </p>
                {address.note && <small>{address.note}</small>}
              </div>

              <div className="address-card-actions">
                {!address.isDefault && (
                  <button type="button" onClick={() => makeDefaultAddress(address)}>
                    Make Default
                  </button>
                )}
                <button type="button" onClick={() => startEditAddress(address)}>
                  Edit
                </button>
                <button type="button" onClick={() => removeAddress(address.id)}>
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {editingAddressId && (
        <form className="address-form" onSubmit={saveAddress}>
          <h4>{editingAddressId === "new" ? "Add Address" : "Edit Address"}</h4>

          <div className="address-form-grid">
            <label>
              Region
              <input
                value={addressForm.region}
                onChange={(e) => updateAddressField("region", e.target.value)}
              />
            </label>
            <label>
              City
              <input
                value={addressForm.city}
                onChange={(e) => updateAddressField("city", e.target.value)}
              />
            </label>
            <label>
              First Name
              <input
                value={addressForm.firstName}
                onChange={(e) => updateAddressField("firstName", e.target.value)}
              />
            </label>
            <label>
              Last Name
              <input
                value={addressForm.lastName}
                onChange={(e) => updateAddressField("lastName", e.target.value)}
              />
            </label>
            <label>
              Phone Number
              <input
                value={addressForm.phone}
                onChange={(e) => updateAddressField("phone", e.target.value)}
              />
            </label>
            <label>
              Additional Phone
              <input
                value={addressForm.additionalPhone}
                onChange={(e) =>
                  updateAddressField("additionalPhone", e.target.value)
                }
              />
            </label>
            <label className="address-wide">
              Address
              <input
                value={addressForm.address}
                onChange={(e) => updateAddressField("address", e.target.value)}
              />
            </label>
            <label className="address-wide">
              Additional Information
              <input
                value={addressForm.note}
                onChange={(e) => updateAddressField("note", e.target.value)}
              />
            </label>
          </div>

          <label className="default-address-check">
            <input
              type="checkbox"
              checked={addressForm.isDefault}
              onChange={(e) => updateAddressField("isDefault", e.target.checked)}
            />
            Use as default shipping address
          </label>

          <div className="address-form-actions">
            <button type="button" onClick={cancelAddressForm}>
              Cancel
            </button>
            <button type="submit">Save Address</button>
          </div>
        </form>
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
    if (activeView === "recently-viewed") return renderRecent();
    if (activeView === "address") {
      return renderAddressBook();
    }
    if (activeView === "profile") {
      return renderSimplePanel("Account Management", `${customerName} • ${user?.email}`);
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
