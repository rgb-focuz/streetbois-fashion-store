import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import SalesRepModal from "../components/SalesRepModal";
import { supabase } from "../supabaseClient";
import {
  buildSalesRepsFromSettings,
  defaultStoreSettings,
  fetchStoreSettings,
} from "../utils/storeSettings";
import "../styles/productDetails.css";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("");
  const [showSalesModal, setShowSalesModal] = useState(false);
  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  useEffect(() => {
    fetchProduct();
    fetchReviews();
    fetchStoreSettings().then(setStoreSettings);
  }, [id]);

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

  const fetchProduct = async () => {
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
  };

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("product_id", id)
      .order("created_at", { ascending: false });

    if (!error) setReviews(data || []);
  };

  const sizeStock = product?.size_stock || {};
  const availableSizes = Object.keys(sizeStock);
  const hasSizeStock = availableSizes.length > 0;

  const selectedSizeStock = selectedSize
    ? Number(sizeStock[selectedSize] || 0)
    : Number(product?.stock || 0);

  const whatsappMessage = product
    ? `Hello ${storeSettings.store_name || "StreetBois Fashion"},

I am interested in this product:

Product: ${product.name}
Price: GH₵ ${product.price}
Category: ${product.category || "Not provided"}
Size: ${selectedSize || "Not selected"}
Quantity: ${quantity}

📷 Product Image:
${product.image_url || "No image available"}

Please assist me with this order.`
    : "";

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
      alert(error.message);
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

  const validateOrder = () => {
    if (hasSizeStock && !selectedSize) {
      alert("Please select a size.");
      return false;
    }

    if (hasSizeStock && selectedSizeStock <= 0) {
      alert(`${selectedSize} is out of stock.`);
      return false;
    }

    if (hasSizeStock && quantity > selectedSizeStock) {
      alert(`Only ${selectedSizeStock} item(s) available for size ${selectedSize}.`);
      return false;
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!validateOrder()) return;

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
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      : [...existingCart, cartItem];

    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Product added to cart.");
  };

  const handlePlaceOrder = () => {
    if (!validateOrder()) return;
    setShowSalesModal(true);
  };

  const fetchRelatedProducts = async (category, productId) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .neq("id", productId)
      .eq("status", "Active")
      .limit(12);

    if (!error) setRelatedProducts(data || []);
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
          <img src={product.image_url} alt={product.name} />
        </div>

        <div className="product-details-info">
        
          <h1>{product.name}</h1>


          <h2>GH₵ {product.price}</h2>
          <p className="product-category">{product.category}</p>

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

          <p className="stock-status">
            {hasSizeStock
              ? selectedSize
                ? selectedSizeStock > 0
                  ? `In stock: ${selectedSizeStock} for size ${selectedSize}`
                  : `${selectedSize} is out of stock`
                : "Select a size to see stock"
              : product.stock > 0
              ? `In stock: ${product.stock}`
              : "Out of stock"}
          </p>

          <div className="quantity-box">
            <button onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>
              -
            </button>

            <span>{quantity}</span>

            <button
              onClick={() => {
                if (hasSizeStock && selectedSize && quantity >= selectedSizeStock) {
                  alert(`Only ${selectedSizeStock} item(s) available.`);
                  return;
                }

                setQuantity(quantity + 1);
              }}
            >
              +
            </button>
          </div>

          <div className="product-details-actions">
  <button className="add-cart-btn" onClick={handleAddToCart}>
    🛒 Cart
  </button>

  <button
    type="button"
    className="details-whatsapp-btn"
    onClick={handlePlaceOrder}
  >
    💬 Order
  </button>
</div>
        </div>
      </section>

      <section className="reviews-section compact-reviews-section">
  <h2>Customer Rating</h2>

  <div className="compact-rating-box">
    <h3>{averageRating}</h3>
    <p>★★★★★</p>
    <span>{reviews.length} reviews</span>
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

      <SalesRepModal
        isOpen={showSalesModal}
        onClose={() => setShowSalesModal(false)}
        message={whatsappMessage}
        salesReps={buildSalesRepsFromSettings(storeSettings)}
      />

      <Footer />
    </>
  );
}

export default ProductDetails;
