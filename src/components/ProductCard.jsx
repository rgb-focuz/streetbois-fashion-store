import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SalesRepModal from "./SalesRepModal";
import "../styles/productCard.css";

function ProductCard({ product, showWhatsApp = true }) {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState("");
  const [showSalesModal, setShowSalesModal] = useState(false);

  const sizes =
    Array.isArray(product.sizes) && product.sizes.length > 0
      ? product.sizes
      : ["S", "M", "L", "XL", "2XL"];

  const whatsappMessage = `Hello StreetBois Fashion,

🛍 New Customer Enquiry

Product: ${product.name}
Price: GH₵ ${product.price}
Category: ${product.category || "Not provided"}
Size: ${selectedSize || "Not selected"}
Quantity: 1

📷 Product Image:
${product.image_url || "No image available"}

Please assist me with this order.`;

  const addToCart = () => {
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      size: selectedSize,
      quantity: 1,
    };

    const existingCart =
      JSON.parse(localStorage.getItem("streetbois-cart")) || [];

    const existingItem = existingCart.find(
      (item) => item.id === product.id && item.size === selectedSize
    );

    const updatedCart = existingItem
      ? existingCart.map((item) =>
          item.id === product.id && item.size === selectedSize
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...existingCart, cartItem];

    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Product added to cart.");
  };

  const openSalesModal = () => {
    if (!selectedSize) {
      alert("Please select a size.");
      return;
    }

    setShowSalesModal(true);
  };

  return (
    <div className="universal-product-card">
      <div className="product-image-wrap">
        <img
          src={product.image_url}
          alt={product.name}
          onClick={() => navigate(`/product/${product.id}`)}
        />
      </div>

      <div className="universal-product-info">
        <p className="universal-price">GH₵ {product.price}</p>

        {product.category && (
          <p className="universal-category">{product.category}</p>
        )}

        <div className="product-size-box">
          <p>Size:</p>

          <div className="product-size-options">
            {sizes.map((size) => (
              <button
                key={size}
                type="button"
                className={selectedSize === size ? "size-active" : ""}
                onClick={() => setSelectedSize(size)}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        <button className="universal-cart-btn" onClick={addToCart}>
          🛒 Add to Cart
        </button>

        <button
          className="universal-buy-btn"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          🛍 Buy Now
        </button>

        {showWhatsApp && (
          <button
            type="button"
            className="universal-whatsapp-btn"
            onClick={openSalesModal}
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