import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SalesRepModal from "./SalesRepModal";
import "../styles/productCard.css";

function ProductCard({ product, showWhatsApp = true }) {
  const navigate = useNavigate();
  const [showSalesModal, setShowSalesModal] = useState(false);

  const whatsappMessage = `Hello StreetBois Fashion,

🛍 New Customer Enquiry

Product: ${product.name}
Price: GH₵ ${product.price}

📷 Product Image:
${product.image_url || "No image available"}

Please assist me with this order.`;

  return (
    <div className="universal-product-card">
      <div className="product-image-wrap">
        <img
          src={product.image_url}
          alt={product.name}
          onClick={() => navigate(`/product/${product.id}`)}
        />

        <div className="quick-view-overlay">
          <button onClick={() => navigate(`/product/${product.id}`)}>
            Quick View
          </button>
        </div>
      </div>

      <div className="universal-product-info">
        <h3 onClick={() => navigate(`/product/${product.id}`)}>
          {product.name}
        </h3>

        <p className="universal-price">GH₵ {product.price}</p>

        <button
          className="universal-cart-btn"
          onClick={() => navigate(`/product/${product.id}`)}
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