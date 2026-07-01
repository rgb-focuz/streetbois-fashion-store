import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import "../styles/cart.css";

function Cart() {
  const [cart, setCart] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  useEffect(() => {
    const savedCart =
      JSON.parse(localStorage.getItem("streetbois-cart")) || [];
    setCart(savedCart);
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );

  const removeItem = (id) => {
    const updatedCart = cart.filter((item) => item.id !== id);
    setCart(updatedCart);
    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const updateQuantity = (id, change) => {
    const updatedCart = cart.map((item) => {
      if (item.id === id) {
        return {
          ...item,
          quantity: Math.max(1, item.quantity + change),
        };
      }
      return item;
    });

    setCart(updatedCart);
    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const clearCart = () => {
    if (!window.confirm("Clear all items from your cart?")) return;

    localStorage.removeItem("streetbois-cart");
    setCart([]);
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const placeOrder = async (e) => {
    e.preventDefault();

    if (!customer.name || !customer.phone || !customer.address) {
      alert("Please enter your name, phone number and delivery address.");
      return;
    }

    setPlacingOrder(true);

    const orderItems = cart.map((item) => ({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      quantity: item.quantity,
      image_url: item.image_url,
      subtotal: Number(item.price) * item.quantity,
    }));

    const { error } = await supabase.from("orders").insert({
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_email: customer.email,
      delivery_address: customer.address,
      items: orderItems,
      total,
      status: "Pending",
    });

    if (error) {
      alert(error.message);
      setPlacingOrder(false);
      return;
    }

    const message = orderItems
      .map(
        (item) =>
          `• ${item.name}\nQty: ${item.quantity}\nPrice: GH₵ ${item.price}\nSubtotal: GH₵ ${item.subtotal}`
      )
      .join("\n\n");

    const whatsappMessage = `Hello StreetBois Fashion,

I have placed an order.

Customer Details:
Name: ${customer.name}
Phone: ${customer.phone}
Email: ${customer.email || "Not provided"}
Address: ${customer.address}

Order Items:

${message}

Total: GH₵ ${total}

Please confirm my order.`;

    localStorage.removeItem("streetbois-cart");
    setCart([]);
    window.dispatchEvent(new Event("cartUpdated"));

    window.open(
      `https://wa.me/233202430406?text=${encodeURIComponent(
        whatsappMessage
      )}`,
      "_blank"
    );

    alert("Order placed successfully.");
    setPlacingOrder(false);
  };

  if (cart.length === 0) {
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
              Start shopping and add your favourite StreetBois Fashion products.
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
              {cart.map((item) => (
                <div className="cart-item" key={item.id}>
                  <img src={item.image_url} alt={item.name} />

                  <div className="cart-details">
                    <h3>{item.name}</h3>
                    <p className="cart-price">GH₵ {item.price}</p>

                    <div className="cart-quantity">
                      <button onClick={() => updateQuantity(item.id, -1)}>
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)}>
                        +
                      </button>
                    </div>
                  </div>

                  <div className="cart-subtotal">
                    <span>Subtotal</span>
                    <h4>GH₵ {Number(item.price) * item.quantity}</h4>

                    <button
                      className="remove-cart-btn"
                      onClick={() => removeItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
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
              value={customer.name}
              onChange={(e) =>
                setCustomer({ ...customer, name: e.target.value })
              }
            />

            <input
              type="tel"
              placeholder="Phone Number"
              value={customer.phone}
              onChange={(e) =>
                setCustomer({ ...customer, phone: e.target.value })
              }
            />

            <input
              type="email"
              placeholder="Email Address optional"
              value={customer.email}
              onChange={(e) =>
                setCustomer({ ...customer, email: e.target.value })
              }
            />

            <textarea
              placeholder="Delivery Address"
              value={customer.address}
              onChange={(e) =>
                setCustomer({ ...customer, address: e.target.value })
              }
            ></textarea>

            <div className="cart-total">
              <span>Total</span>
              <h2>GH₵ {total}</h2>
            </div>

            <button className="checkout-btn" type="submit" disabled={placingOrder}>
              {placingOrder ? "Placing Order..." : "Place Order"}
            </button>

            <button
              className="clear-cart-btn"
              type="button"
              onClick={clearCart}
            >
              Clear Cart
            </button>
          </form>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Cart;