import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { supabase } from "../supabaseClient";
import { optimizeSupabaseImage } from "../utils/images";
import "../styles/productDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    if (product) {
      const viewedProduct = {
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
      };

      const existing =
        JSON.parse(localStorage.getItem("streetbois-recently-viewed")) || [];

      const filtered = existing.filter((item) => item.id !== product.id);
      const updated = [viewedProduct, ...filtered].slice(0, 8);

      localStorage.setItem("streetbois-recently-viewed", JSON.stringify(updated));
    }
  }, [product]);

  const fetchRelatedProducts = useCallback(async (category, productId) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .neq("id", productId)
      .eq("status", "Active")
      .limit(12);

    if (!error) setRelatedProducts(data || []);
  }, []);

  const fetchProduct = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setProduct(data);
      fetchRelatedProducts(data.category, data.id);
    }

    setLoading(false);
  }, [fetchRelatedProducts, id]);

  const fetchReviews = useCallback(async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (!error) setReviews(data || []);
  }, [id]);

  useEffect(() => {
    fetchProduct();
    fetchReviews();
  }, [fetchProduct, fetchReviews]);

  const sizeStock = product?.size_stock || {};
  const availableSizes = Object.keys(sizeStock);
  const hasSizeStock = availableSizes.length > 0;

  const selectedSizeStock = selectedSize
    ? Number(sizeStock[selectedSize] || 0)
    : Number(product?.stock || 0);

  const availableStock = hasSizeStock
    ? selectedSize
      ? selectedSizeStock
      : 0
    : Number(product?.stock || 0);

  const isOutOfStock = hasSizeStock
    ? selectedSize
      ? availableStock <= 0
      : false
    : availableStock <= 0 ||
      product?.in_stock === false ||
      product?.status === "Out of Stock";

  const canBuy = hasSizeStock ? Boolean(selectedSize) && availableStock > 0 : !isOutOfStock;

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

  const displayName = product
    ? formatProductName(product.name, product.category)
    : "Product";
  const productDetailImage = optimizeSupabaseImage(product?.image_url, {
    width: 1100,
    height: 825,
    quality: 78,
    resize: "contain",
  });

  const storeSettings = { store_name: "StreetBois Fashion" };

  const whatsappMessage = product
    ? `Hello ${storeSettings.store_name || "StreetBois Fashion"},

I am interested in this product:

Product: ${displayName}
Price: GH₵ ${product.price}
Category: ${product.category || "Not provided"}
Size: ${selectedSize || "Not selected"}
Quantity: ${quantity}

📷 Product Image:
${product.image_url || "No image available"}

Please assist me with this order.`
    : "";

  void whatsappMessage;

  const submitReview = async (e) => {
    e.preventDefault();

    if (!reviewName.trim() || !reviewText.trim()) {
      alert("Please enter your name and review.");
      return;
    }

    if (reviewText.trim().length < 10) {
      alert("Review must be at least 10 characters.");
      return;
    }

    const alreadyReviewed = reviews.find(
      (review) =>
        review.customer_name.toLowerCase() === reviewName.trim().toLowerCase()
    );

    if (alreadyReviewed) {
      alert("You have already reviewed this product.");
      return;
    }

    const { error } = await supabase.from("reviews").insert({
      product_id: id,
      customer_name: reviewName.trim(),
      rating: reviewRating,
      review: reviewText.trim(),
    });

    if (error) {
      console.error("Review submission failed:", error);
      alert("We could not submit your review. Please try again.");
      return;
    }

    setReviewName("");
    setReviewRating(5);
    setReviewText("");

    await fetchReviews();
    alert("Review submitted successfully.");
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, review) => sum + review.rating, 0) /
          reviews.length
        ).toFixed(1)
      : "0.0";

  const getRatingCount = (star) =>
    reviews.filter((review) => review.rating === star).length;

  const getRatingPercent = (star) =>
    reviews.length > 0 ? (getRatingCount(star) / reviews.length) * 100 : 0;

  void getRatingPercent;

  const validateOrder = () => {
    if (!product || isOutOfStock) {
      alert("This product is currently out of stock.");
      return false;
    }

    if (hasSizeStock && !selectedSize) {
      alert("Please select a size.");
      return false;
    }

    if (hasSizeStock && selectedSizeStock <= 0) {
      alert(`${selectedSize} is out of stock.`);
      return false;
    }

    if (hasSizeStock && quantity > selectedSizeStock) {
      alert("Selected quantity is above available stock for this size.");
      return false;
    }

    if (!hasSizeStock && quantity > availableStock) {
      alert("Selected quantity is above available stock.");
      return false;
    }

    return true;
  };

  const addSelectedProductToCart = ({ showAlert = true } = {}) => {
    if (!validateOrder()) return false;

    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      size: selectedSize || null,
      quantity,
    };

    const existingCart =
      JSON.parse(localStorage.getItem("streetbois-cart")) || [];

    const existingItem = existingCart.find(
      (item) => item.id === product.id && item.size === cartItem.size
    );

    const existingQuantity = existingItem ? Number(existingItem.quantity || 1) : 0;
    const nextQuantity = existingQuantity + quantity;

    if (nextQuantity > availableStock) {
      alert("Selected quantity is above available stock.");
      return false;
    }

    const updatedCart = existingItem
      ? existingCart.map((item) =>
          item.id === product.id && item.size === cartItem.size
            ? { ...item, quantity: nextQuantity }
            : item
        )
      : [...existingCart, cartItem];

    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));

    if (showAlert) {
      alert("Product added to cart.");
    }

    return true;
  };

  const handleAddToCart = () => {
    addSelectedProductToCart();
  };

  const handlePlaceOrder = () => {
    if (addSelectedProductToCart({ showAlert: false })) {
      navigate("/cart");
    }
  };

  if (loading) {
    return <div className="product-details-message">Loading product...</div>;
  }

  if (!product) {
    return <div className="product-details-message">Product not found.</div>;
  }

  return (
    <>
      <Navbar />

      <section className="product-details-page">
        <div className="product-details-image">
          <img
            src={productDetailImage || product.image_url}
            alt={displayName}
            decoding="async"
            fetchPriority="high"
            width="1100"
            height="825"
            sizes="(max-width: 900px) 100vw, 50vw"
          />
        </div>

        <div className="product-details-info">
        
          <h1>{displayName}</h1>


          <h2>GH₵ {product.price}</h2>
          <p className="product-category">{product.category}</p>

          <div className="details-rating-inline">
            <strong>{averageRating}</strong>
            <span>★★★★★</span>
            <small>{reviews.length} reviews</small>
          </div>

          {hasSizeStock && (
            <div className="details-size-box">
              <p>Size:</p>

              <div className="details-size-options">
                {availableSizes.map((size) => {
                  const stock = Number(sizeStock[size] || 0);
                  const isOut = stock <= 0;

                  return (
                    <button
                      key={size}
                      type="button"
                      disabled={isOut}
                      className={selectedSize === size ? "active-size" : ""}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                      }}
                    >
                      {size}
                      {isOut && <small>Out</small>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className={`stock-status ${isOutOfStock ? "out" : canBuy ? "in" : ""}`}>
            {hasSizeStock
              ? selectedSize
                ? availableStock > 0
                  ? `In stock for size ${selectedSize}`
                  : `Out of stock for size ${selectedSize}`
                : "Select a size to check availability"
              : isOutOfStock
              ? "Out of stock"
              : "In stock"}
          </p>

          <div className="quantity-box">
            <button
              disabled={!canBuy || quantity <= 1}
              onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}
            >
              -
            </button>

            <span>{quantity}</span>

            <button
              disabled={!canBuy || quantity >= availableStock}
              onClick={() => {
                if (quantity >= availableStock) {
                  alert("You have reached the available stock limit.");
                  return;
                }

                setQuantity(quantity + 1);
              }}
            >
              +
            </button>
          </div>

          <form className="details-review-form" onSubmit={submitReview}>
            <div className="details-review-head">
              <strong>Rate this product</strong>
              <span>{reviewRating} / 5</span>
            </div>

            <input
              type="text"
              placeholder="Your name"
              value={reviewName}
              onChange={(e) => setReviewName(e.target.value)}
            />

            <div className="details-review-stars" aria-label="Select rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={star <= reviewRating ? "active-star" : ""}
                  onClick={() => setReviewRating(star)}
                  aria-label={`Rate ${star} star${star === 1 ? "" : "s"}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              placeholder="Write a short review"
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />

            <button type="submit">Submit Review</button>
          </form>

          <div className="product-details-actions">
  <button className="add-cart-btn" onClick={handleAddToCart} disabled={!canBuy}>
    🛒 Cart
  </button>

  <button
    type="button"
    className="details-whatsapp-btn"
    onClick={handlePlaceOrder}
    disabled={!canBuy}
  >
    {isOutOfStock ? "Out of Stock" : "💬 Order"}
  </button>
</div>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="related-products-section">
          <h2>You May Also Like</h2>

          <div className="product-grid-universal">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

export default ProductDetails;
