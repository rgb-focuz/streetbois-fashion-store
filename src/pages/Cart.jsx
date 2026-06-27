import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/cart.css";

function Cart() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const savedCart =
      JSON.parse(localStorage.getItem("streetbois-cart")) || [];
    setCart(savedCart);
  }, []);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
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

  const checkoutOnWhatsApp = () => {
    const message = cart
      .map(
        (item) =>
          `• ${item.name}\nQty: ${item.quantity}\nPrice: GH₵ ${
            item.price
          }\nSubtotal: GH₵ ${item.price * item.quantity}`
      )
      .join("\n\n");

    const whatsappMessage = `Hello StreetBois Fashion,

I would like to order the following items:

${message}

Total: GH₵ ${total}

Please assist me with my order.`;

    window.open(
      `https://wa.me/233202430406?text=${encodeURIComponent(
        whatsappMessage
      )}`,
      "_blank"
    );
  };

  const clearCart = () => {
    if (!window.confirm("Clear all items from your cart?")) return;

    localStorage.removeItem("streetbois-cart");
    setCart([]);
    window.dispatchEvent(new Event("cartUpdated"));
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

        <div className="cart-items">
          {cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.image_url} alt={item.name} />

              <div className="cart-details">
                <h3>{item.name}</h3>
                <p className="cart-price">GH₵ {item.price}</p>

                <div className="cart-quantity">
                  <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                </div>
              </div>

              <div className="cart-subtotal">
                <span>Subtotal</span>
                <h4>GH₵ {item.price * item.quantity}</h4>

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

        <div className="cart-total">
          <div>
            <span>Total</span>
            <h2>GH₵ {total}</h2>
          </div>

          <div className="cart-total-actions">
            <button className="checkout-btn" onClick={checkoutOnWhatsApp}>
              Checkout on WhatsApp
            </button>

            <button className="clear-cart-btn" onClick={clearCart}>
              Clear Cart
            </button>
          </div>
        </div>

        <div className="continue-shopping">
          <div>
            <h3>Continue Shopping</h3>
            <p>Discover more StreetBois Fashion products.</p>
          </div>

          <Link to="/shop">Shop Now</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Cart;