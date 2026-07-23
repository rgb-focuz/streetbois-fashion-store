import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { supabase } from "../supabaseClient";
import { optimizeSupabaseImage } from "../utils/images";
import "../styles/productDetails.css";

const GHANA_LOCATIONS = {
  Ahafo: ["Goaso", "Kenyasi", "Hwidiem", "Bechem", "Mim", "Kukuom"],
  Ashanti: ["Kumasi", "Obuasi", "Ejisu", "Mampong", "Konongo", "Bekwai", "Agogo", "Offinso"],
  Bono: ["Sunyani", "Berekum", "Dormaa Ahenkro", "Wenchi", "Drobo", "Sampa"],
  "Bono East": ["Techiman", "Kintampo", "Atebubu", "Nkoranza", "Yeji", "Prang"],
  Central: ["Cape Coast", "Kasoa", "Winneba", "Mankessim", "Swedru", "Elmina", "Dunkwa-On-Offin"],
  Eastern: ["Koforidua", "Akosombo", "Nkawkaw", "Suhum", "Nsawam", "Akim Oda", "Somanya"],
  "Greater Accra": ["Tudu", "Accra Central", "Osu", "Madina", "Tema", "Ashaiman", "Adenta", "East Legon", "Kasoa"],
  "North East": ["Nalerigu", "Walewale", "Gambaga", "Bunkpurugu", "Chereponi", "Yagaba"],
  Northern: ["Tamale", "Yendi", "Savelugu", "Gushegu", "Bimbilla", "Karaga"],
  Oti: ["Dambai", "Kete Krachi", "Nkwanta", "Jasikan", "Kadjebi", "Chinderi"],
  Savannah: ["Damongo", "Bole", "Salaga", "Buipe", "Sawla", "Daboya"],
  "Upper East": ["Bolgatanga", "Navrongo", "Bawku", "Zebilla", "Paga", "Sandema"],
  "Upper West": ["Wa", "Tumu", "Nandom", "Lawra", "Jirapa", "Gwollu"],
  Volta: ["Ho", "Hohoe", "Keta", "Aflao", "Sogakope", "Kpando", "Anloga"],
  Western: ["Takoradi", "Sekondi", "Tarkwa", "Axim", "Prestea", "Agona Nkwanta"],
  "Western North": ["Sefwi Wiawso", "Bibiani", "Juaboso", "Enchi", "Awaso", "Sefwi Bekwai"],
};

const DEFAULT_SNEAKER_SIZES = ["39", "40", "41", "42", "43", "44", "45"];

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
  const [selectedRegion, setSelectedRegion] = useState("Greater Accra");
  const [selectedTown, setSelectedTown] = useState("Tudu");

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
      .eq("status", "Active")
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

  useEffect(() => {
    const towns = GHANA_LOCATIONS[selectedRegion] || [];

    if (!towns.includes(selectedTown)) {
      setSelectedTown(towns[0] || "");
    }
  }, [selectedRegion, selectedTown]);

  const sizeStock = product?.size_stock || {};
  const adminSizeStockSizes =
    sizeStock && typeof sizeStock === "object" && !Array.isArray(sizeStock)
      ? Object.keys(sizeStock)
      : [];
  const adminListedSizes = Array.isArray(product?.sizes)
    ? product.sizes.map(String).filter(Boolean)
    : [];
  const isSneakerProduct = String(product?.category || "")
    .toLowerCase()
    .includes("sneaker");
  const availableSizes =
    adminSizeStockSizes.length > 0
      ? adminSizeStockSizes
      : adminListedSizes.length > 0
      ? adminListedSizes
      : isSneakerProduct
      ? DEFAULT_SNEAKER_SIZES
      : [];
  const hasSizeStock = availableSizes.length > 0;

  const isOutOfStock =
    product?.in_stock === false || product?.status === "Out of Stock";

  const canBuy = hasSizeStock ? Boolean(selectedSize) && !isOutOfStock : !isOutOfStock;

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

    const updatedCart = existingItem
      ? existingCart.map((item) =>
          item.id === product.id && item.size === cartItem.size
            ? { ...item, quantity: Number(item.quantity || 1) + quantity }
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
        <div className="product-gallery-panel">
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
          <div className="product-thumbnail-row">
            <button type="button" className="active-thumb">
              <img src={productDetailImage || product.image_url} alt={displayName} />
            </button>
          </div>
          <div className="product-share-strip">
            <strong>Share this product</strong>
            <div>
              <button type="button" aria-label="Share on Facebook">f</button>
              <button type="button" aria-label="Share on X">x</button>
              <button type="button" aria-label="Share on WhatsApp">w</button>
            </div>
          </div>
        </div>

        <div className="product-details-info">
        
          <div className="product-title-row">
            <h1>{displayName}</h1>
            <button type="button" aria-label="Save product">♡</button>
          </div>


          <h2>GH₵ {product.price}</h2>
          <p className="product-order-help">
            Need advice or assistance to place an order? Contact us at 0202430406
          </p>

          <div className="details-rating-inline">
            <strong>{averageRating}</strong>
            <span>★★★★★</span>
            <small>{reviews.length} verified ratings</small>
          </div>

          <p className="product-category">{product.category}</p>

          {product.description && (
            <p className="product-description">{product.description}</p>
          )}

          {hasSizeStock && (
            <div className="details-size-box">
              <p>Size:</p>

              <div className="details-size-options">
                {availableSizes.map((size) => {
                  return (
                    <button
                      key={size}
                      type="button"
                      className={selectedSize === size ? "active-size" : ""}
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                      }}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <p className={`stock-status ${isOutOfStock ? "out" : canBuy ? "in" : ""}`}>
            {hasSizeStock
              ? selectedSize
                ? `Selected size: ${selectedSize}`
                : "Select your preferred size"
              : isOutOfStock
              ? "Out of stock"
              : "Available for order"}
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
              disabled={!canBuy}
              onClick={() => {
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

        <aside className="product-service-panel">
          <section>
            <h3>Delivery & Returns</h3>

            <div className="service-choice">
              <strong>Choose your location</strong>
              <select
                aria-label="Region"
                value={selectedRegion}
                onChange={(event) => setSelectedRegion(event.target.value)}
              >
                {Object.keys(GHANA_LOCATIONS).map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
              <select
                aria-label="Town or area"
                value={selectedTown}
                onChange={(event) => setSelectedTown(event.target.value)}
              >
                {(GHANA_LOCATIONS[selectedRegion] || []).map((town) => (
                  <option key={town} value={town}>
                    {town}
                  </option>
                ))}
              </select>
            </div>

            <div className="service-row">
              <span>P</span>
              <div>
                <strong>Pickup Station</strong>
                <p>Pickup options will be confirmed for {selectedTown}, {selectedRegion}.</p>
              </div>
            </div>

            <div className="service-row">
              <span>D</span>
              <div>
                <strong>Door Delivery</strong>
                <p>Delivery fee to {selectedTown}, {selectedRegion} is confirmed after checkout.</p>
              </div>
            </div>

            <div className="service-row">
              <span>R</span>
              <div>
                <strong>Return Policy</strong>
                <p>Return requests are reviewed by the sales team.</p>
              </div>
            </div>
          </section>

          <section>
            <h3>Seller Information</h3>
            <div className="seller-card">
              <strong>StreetBois Fashion</strong>
              <p>{product.category || "Fashion"} specialist</p>
              <p>0202430406</p>
            </div>
          </section>
        </aside>
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
