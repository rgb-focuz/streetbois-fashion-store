import { useState } from "react";
import SalesRepModal from "./SalesRepModal";
import "../styles/productCard.css";

function ProductCard({ product, showWhatsApp = true }) {
  const [showSalesModal, setShowSalesModal] = useState(false);

  const addToCart = () => {
    const cart = JSON.parse(localStorage.getItem("streetbois-cart")) || [];

    const productImage =
      product.image_url ||
      product.image ||
      product.product_image ||
      product.main_image ||
      "";

    const existingProduct = cart.find((item) => item.id === product.id);

    let updatedCart;

    if (existingProduct) {
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: item.quantity + 1,
              image_url: item.image_url || productImage,
            }
          : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          ...product,
          quantity: 1,
          image_url: productImage,
        },
      ];
    }

    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Product added to cart");
  };

  const whatsappMessage = `Hello StreetBois Fashion,

🛍 New Customer Enquiry

Product: ${product.name}
Price: GH₵ ${product.price}

📷 Product Image:
${product.image_url || product.image || product.product_image || product.main_image || "No image available"}

Please assist me with this order.`;

  return (
    <div className="universal-product-card">
      <div className="product-image-wrap">
        <img
          src={product.image_url || product.image || product.product_image || product.main_image}
          alt={product.name}
        />
      </div>

      <div className="universal-product-info">
        <h3>{product.name}</h3>

        <p className="universal-price">GH₵ {product.price}</p>

        <button
          type="button"
          className="universal-cart-btn"
          onClick={addToCart}
        >
          🛒 Add to Cart
        </button>

        {showWhatsApp && (
          <button
            type="button"
            className="universal-whatsapp-btn"
            onClick={() => setShowSalesModal(true)}
          >
            💬 Place Order
          </button>
        )}
      </div>

      <SalesRepModal
        isOpen={showSalesModal}
        onClose={() => setShowSalesModal(false)}
        message={whatsappMessage}
      />
    </div>
  );
}

export default ProductCard;