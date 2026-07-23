import { useNavigate } from "react-router-dom";
import { optimizeSupabaseImage } from "../utils/images";
import "../styles/productCard.css";

function ProductCard({ product }) {
  const navigate = useNavigate();

  const productImage =
    product.image_url ||
    product.image ||
    product.product_image ||
    product.main_image ||
    "";
  const productThumbnail = optimizeSupabaseImage(productImage, {
    width: 420,
    height: 420,
    quality: 70,
  });

  const formatProductName = (name, category) => {
    const normalizedName = String(name || "").trim();
    const lowerName = normalizedName.toLowerCase();

    if (["t=shirt", "t-shirt", "tshirt", "t shirt"].includes(lowerName)) {
      return category === "Men Clothing" ? "Men's T-Shirt" : "T-Shirt";
    }

    if (lowerName === "official-wear") return "Official Wear";
    if (lowerName === "swearter") return "Sweater";

    return normalizedName || category || "Product";
  };

  const displayName = formatProductName(product.name, product.category);
  const currentPrice = Number(product.price || 0);
  const oldPrice = Number(
    product.old_price || product.original_price || product.compare_at_price || 0
  );
  const hasOldPrice = oldPrice > currentPrice && currentPrice > 0;
  const discountPercent = hasOldPrice
    ? Math.round(((oldPrice - currentPrice) / oldPrice) * 100)
    : 0;

  const openDetails = () => {
    navigate(`/product/${product.id}`);
  };

  const openDetailsFromAction = (event) => {
    event.stopPropagation();
    openDetails();
  };

  return (
    <div className="universal-product-card" onClick={openDetails}>
      <div className="product-image-wrap">
        {hasOldPrice && (
          <span className="universal-discount-badge">-{discountPercent}%</span>
        )}
        <img
          src={productThumbnail || productImage}
          alt={displayName}
          loading="lazy"
          decoding="async"
          width="420"
          height="420"
          sizes="(max-width: 768px) 50vw, 220px"
        />
      </div>

      <div className="universal-product-info">
        <h3 title={displayName}>{displayName}</h3>
        <div className="universal-price-row">
          <span className="universal-price">GHC {product.price}</span>
          {hasOldPrice && <del>GHC {oldPrice}</del>}
        </div>
        <div className="product-action-row" aria-label={`${displayName} actions`}>
          <button type="button" className="universal-cart-btn" onClick={openDetailsFromAction}>
            Cart
          </button>
          <button type="button" className="universal-order-btn" onClick={openDetailsFromAction}>
            Order
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
