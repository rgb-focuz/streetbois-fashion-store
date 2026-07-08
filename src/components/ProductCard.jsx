import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SalesRepModal from "./SalesRepModal";
import "../styles/productCard.css";

function ProductCard({ product, showWhatsApp = true }) {
  const navigate = useNavigate();
  const [showSalesModal, setShowSalesModal] = useState(false);

  const productImage =
    product.image_url ||
    product.image ||
    product.product_image ||
    product.main_image ||
    "";

  const openDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const addToCart = (e) => {
    e.stopPropagation();

    const cart = JSON.parse(localStorage.getItem("streetbois-cart")) || [];
    const existingProduct = cart.find((item) => item.id === product.id);

    let updatedCart;

    if (existingProduct) {
      updatedCart = cart.map((item) =>
        item.id === product.id
          ? {
              ...item,
              quantity: Number(item.quantity || 1) + 1,
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
${productImage || "No image available"}

Please assist me with this order.`;

  return (
    <div className="universal-product-card" onClick={openDetails}>
      <div className="product-image-wrap">
        <img src={productImage} alt={product.name} />
      </div>

      <div className="universal-product-info">
        <div className="product-title-row">
          <h3>{product.name}</h3>
          <span className="universal-price">GH₵ {product.price}</span>
        </div>

        <div className="product-action-row">
          <button
            type="button"
            className="universal-cart-btn"
            onClick={addToCart}
          >
            🛒 Cart
          </button>

          {showWhatsApp && (
            <button
              type="button"
              className="universal-whatsapp-btn"
              onClick={(e) => {
                e.stopPropagation();
                setShowSalesModal(true);
              }}
            >
              WhatsApp
            </button>
          )}
        </div>
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