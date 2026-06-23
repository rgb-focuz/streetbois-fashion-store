import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/cart.css";

function Cart() {
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
          <p>Start shopping and add your favourite StreetBois Fashion products.</p>
          <a href="/">Continue Shopping</a>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Cart;