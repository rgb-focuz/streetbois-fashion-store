import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SalesRepModal from "../components/SalesRepModal";
import { supabase } from "../supabaseClient";
import {
  buildSalesRepsForItems,
  defaultStoreSettings,
  fetchStoreSettings,
} from "../utils/storeSettings";
import { optimizeSupabaseImage } from "../utils/images";
import "../styles/cart.css";

function Cart() {
  const [cart, setCart] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderSalesReps, setOrderSalesReps] = useState([]);
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart =
          JSON.parse(localStorage.getItem("streetbois-cart")) || [];

        setCart(Array.isArray(savedCart) ? savedCart : []);
      } catch (error) {
        console.error("Unable to read cart:", error);
        setCart([]);
      }
    };

    loadCart();
    fetchStoreSettings().then(setStoreSettings);
  }, []);

  /*
   * This total is only a visual estimate.
   * The trusted final total is calculated inside PostgreSQL.
   */
  const estimatedTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum +
          Number(item.price || 0) *
            Math.max(1, Number(item.quantity || 1)),
        0
      ),
    [cart]
  );

  const getProductImage = (item) =>
    optimizeSupabaseImage(
      item?.thumbnail_url ||
        item?.image_url ||
        item?.image ||
        item?.product_image ||
        item?.main_image ||
        "",
      {
        width: 240,
        height: 240,
        quality: 70,
      }
    );

  const saveCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    saveCart(updatedCart);
  };

  const updateQuantity = (id, change) => {
    const updatedCart = cart.map((item) => {
      if (item.id !== id) return item;

      const currentQuantity = Math.max(1, Number(item.quantity || 1));
      const newQuantity = Math.max(1, currentQuantity + change);

      /*
       * This local stock check is only for user experience.
       * PostgreSQL performs the real stock validation.
       */
      const locallyKnownStock = Number(item.stock || 0);

      if (locallyKnownStock > 0 && newQuantity > locallyKnownStock) {
        alert(`Only ${locallyKnownStock} item(s) appear to be available.`);
        return item;
      }

      return {
        ...item,
        quantity: newQuantity,
      };
    });

    saveCart(updatedCart);
  };

  const clearCart = () => {
    if (!window.confirm("Clear all items from your cart?")) return;

    localStorage.removeItem("streetbois-cart");
    setCart([]);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const validateCheckoutForm = () => {
    const cleanName = customer.name.trim();
    const cleanPhone = customer.phone.trim();
    const cleanEmail = customer.email.trim();
    const cleanAddress = customer.address.trim();

    if (cleanName.length < 2) {
      return "Please enter your full name.";
    }

    if (cleanPhone.length < 7) {
      return "Please enter a valid phone number.";
    }

    if (cleanAddress.length < 3) {
      return "Please enter your delivery address.";
    }

    if (
      cleanEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return "Please enter a valid email address.";
    }

    if (cart.length === 0) {
      return "Your cart is empty.";
    }

    return "";
  };

  const formatOrderReference = (orderId, items = []) => {
    const firstItemName = items[0]?.name || "ORDER";
    const productCode =
      String(firstItemName)
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 16) || "ORDER";
    const numericCode =
      String(orderId || "")
        .replace(/\D/g, "")
        .slice(-6)
        .padStart(6, "0") || "000000";

    return `${productCode}-${numericCode}`;
  };

  const createWhatsAppMessage = ({
    trustedItems,
    trustedTotal,
    orderId,
  }) => {
    const orderReference = formatOrderReference(orderId, trustedItems);
    const itemMessage = trustedItems
      .map(
        (item, index) =>
          `Product ${index + 1}: ${item.name}
Qty: ${item.quantity}
Price: GH₵ ${Number(item.price).toFixed(2)}
Subtotal: GH₵ ${Number(item.subtotal).toFixed(2)}
Product Image: ${item.image_url || "No image available"}`
      )
      .join("\n\n");

    return `Hello ${storeSettings.store_name || "StreetBois Fashion"},

I have placed an order.

Order ID: ${orderReference}

Customer Details:
Name: ${customer.name.trim()}
Phone: ${customer.phone.trim()}
Email: ${customer.email.trim() || "Not provided"}
Address: ${customer.address.trim()}

Order Items:

${itemMessage}

Verified Total: GH₵ ${Number(trustedTotal).toFixed(2)}

Please confirm my order.`;
  };

  const placeOrder = async (event) => {
    event.preventDefault();

    const validationError = validateCheckoutForm();

    if (validationError) {
      alert(validationError);
      return;
    }

    setPlacingOrder(true);

    try {
      /*
       * Only product IDs and quantities are submitted.
       *
       * No client-supplied price, subtotal, total, stock or status is sent.
       */
      const secureItems = cart.map((item) => ({
        id: item.id,
        quantity: Math.max(1, Number(item.quantity || 1)),
      }));

      const { data, error } = await supabase.rpc(
        "create_secure_order",
        {
          p_customer_name: customer.name.trim(),
          p_customer_phone: customer.phone.trim(),
          p_customer_email: customer.email.trim() || null,
          p_delivery_address: customer.address.trim(),
          p_items: secureItems,
        }
      );

      if (error) {
        console.error("Secure order creation failed:", error);

        /*
         * Do not display raw database, table or policy details.
         */
        const safeMessages = [
          "Invalid customer name.",
          "Invalid phone number.",
          "Invalid delivery address.",
          "Invalid email address.",
          "The order contains no products.",
          "Too many products in one order.",
          "Invalid order item.",
          "Each item requires an id and quantity.",
          "Invalid product identifier.",
          "Invalid product quantity.",
          "Product quantity must be between 1 and 100.",
          "A selected product is no longer available.",
          "A selected product has an invalid price.",
        ];

        const matchedSafeMessage = safeMessages.find((message) =>
          error.message?.includes(message)
        );

        if (matchedSafeMessage) {
          throw new Error(matchedSafeMessage);
        }

        if (
          error.message?.includes("currently unavailable") ||
          error.message?.includes("are available")
        ) {
          throw new Error(error.message);
        }

        throw new Error(
          "We could not place your order. Please refresh and try again."
        );
      }

      if (!data?.success || !data?.order_id) {
        throw new Error(
          "The order could not be confirmed. Please try again."
        );
      }

      const trustedItems = Array.isArray(data.items) ? data.items : [];
      const trustedTotal = Number(data.total || 0);
      const orderCartSnapshot = [...cart];

      const whatsappMessage = createWhatsAppMessage({
        trustedItems,
        trustedTotal,
        orderId: data.order_id,
      });

      localStorage.removeItem("streetbois-cart");
      setCart([]);
      window.dispatchEvent(new Event("cartUpdated"));

      setOrderMessage(whatsappMessage);
      setOrderSalesReps(buildSalesRepsForItems(orderCartSnapshot, storeSettings));
      setShowSalesModal(true);

      alert(
        `Order placed successfully. Verified total: GH₵ ${trustedTotal.toFixed(
          2
        )}. Please choose a salesperson.`
      );
    } catch (error) {
      console.error("Checkout error:", error);

      alert(
        error instanceof Error
          ? error.message
          : "We could not place your order. Please try again."
      );
    } finally {
      setPlacingOrder(false);
    }
  };

  if (cart.length === 0 && !showSalesModal) {
    return (
      <>
        <Navbar />

        <section className="cart-page">
          <div className="cart-header">
            <h1>Your Cart</h1>
            <p>Review your selected products before checkout.</p>
          </div>

          <div className="cart-empty">
            <h2>Your cart is currently empty</h2>

            <p>
              Start shopping and add your favourite StreetBois Fashion
              products.
            </p>

            <Link to="/shop">Continue Shopping</Link>
          </div>
        </section>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <section className="cart-page">
        <div className="cart-header">
          <h1>Your Cart</h1>
          <p>Review your selected products before checkout.</p>
        </div>

        <div className="cart-layout">
          <div>
            <div className="cart-items">
              {cart.map((item) => {
                const quantity = Math.max(
                  1,
                  Number(item.quantity || 1)
                );

                const estimatedSubtotal =
                  Number(item.price || 0) * quantity;

                return (
                  <div className="cart-item" key={item.id}>
                    <img
                      src={getProductImage(item)}
                      alt={item.name || "Product"}
                      loading="lazy"
                      decoding="async"
                      width="240"
                      height="240"
                    />

                    <div className="cart-details">
                      <h3>{item.name}</h3>

                      <p className="cart-price">
                        GH₵ {Number(item.price || 0).toFixed(2)}
                      </p>

                      <div className="cart-quantity">
                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, -1)
                          }
                        >
                          -
                        </button>

                        <span>{quantity}</span>

                        <button
                          type="button"
                          onClick={() =>
                            updateQuantity(item.id, 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="cart-subtotal">
                      <span>Estimated subtotal</span>

                      <h4>
                        GH₵ {estimatedSubtotal.toFixed(2)}
                      </h4>

                      <button
                        type="button"
                        className="remove-cart-btn"
                        onClick={() => removeItem(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="continue-shopping">
              <div>
                <h3>Continue Shopping</h3>
                <p>Discover more StreetBois Fashion products.</p>
              </div>

              <Link to="/shop">Shop Now</Link>
            </div>
          </div>

          <form className="checkout-form" onSubmit={placeOrder}>
            <h2>Checkout Details</h2>

            <input
              type="text"
              placeholder="Full Name"
              maxLength={120}
              value={customer.name}
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  name: event.target.value,
                })
              }
              required
            />

            <input
              type="tel"
              placeholder="Phone Number"
              maxLength={30}
              value={customer.phone}
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  phone: event.target.value,
                })
              }
              required
            />

            <input
              type="email"
              placeholder="Email Address (optional)"
              maxLength={254}
              value={customer.email}
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  email: event.target.value,
                })
              }
            />

            <textarea
              placeholder="Delivery Address"
              maxLength={500}
              value={customer.address}
              onChange={(event) =>
                setCustomer({
                  ...customer,
                  address: event.target.value,
                })
              }
              required
            />

            <div className="cart-total">
              <span>Estimated total</span>

              <h2>GH₵ {estimatedTotal.toFixed(2)}</h2>
            </div>

            <p className="checkout-price-note">
              The final amount is verified using current product prices
              before your order is created.
            </p>

            <button
              className="checkout-btn"
              type="submit"
              disabled={placingOrder}
            >
              {placingOrder
                ? "Verifying and placing order..."
                : "Place Order"}
            </button>

            <button
              className="clear-cart-btn"
              type="button"
              onClick={clearCart}
              disabled={placingOrder}
            >
              Clear Cart
            </button>
          </form>
        </div>
      </section>

      <SalesRepModal
        isOpen={showSalesModal}
        onClose={() => setShowSalesModal(false)}
        message={orderMessage}
        salesReps={
          orderSalesReps.length > 0
            ? orderSalesReps
            : buildSalesRepsForItems(cart, storeSettings)
        }
      />

      <Footer />
    </>
  );
}

export default Cart;
