import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { supabase } from "../supabaseClient";
import "../styles/productDetails.css";

function ProductDetails() {
  const { id } = useParams();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

 useEffect(() => {
  fetchProduct();
  fetchReviews();
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

    localStorage.setItem(
      "streetbois-recently-viewed",
      JSON.stringify(updated)
    );
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

    if (error) {
      alert(error.message);
      return;
    }

    setReviewName("");
    setReviewRating(5);
    setReviewText("");
    fetchReviews();
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

  const handleAddToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity,
    };

    const existingCart =
      JSON.parse(localStorage.getItem("streetbois-cart")) || [];

    const existingItem = existingCart.find((item) => item.id === product.id);

    let updatedCart;

    if (existingItem) {
      updatedCart = existingCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      updatedCart = [...existingCart, cartItem];
    }

    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Product added to cart.");
  };

  const fetchRelatedProducts = async (category, productId) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .neq("id", productId)
      .eq("status", "Active")
      .limit(4);

    if (!error) setRelatedProducts(data || []);
  };

  if (loading) return <div className="product-details-message">Loading product...</div>;
  if (!product) return <div className="product-details-message">Product not found.</div>;

  return (
    <>
      <Navbar />

      <section className="product-details-page">
        <div className="product-details-image">
          <img src={product.image_url} alt={product.name} />
        </div>

        <div className="product-details-info">
          <p className="breadcrumb">Home / Shop / {product.name}</p>

          <h1>{product.name}</h1>

          <div className="rating-summary">
            <span>{"★".repeat(Math.round(Number(averageRating)))}</span>
            <p>{averageRating} ({reviews.length} reviews)</p>
          </div>

          <h2>GH₵ {product.price}</h2>
          <p className="product-category">{product.category}</p>

          <p className="product-description">
            {product.description ||
              "Quality fashion product available at StreetBois Fashion."}
          </p>

          <p className="stock-status">
            {product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}
          </p>

          <div className="quantity-box">
            <button onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>
              -
            </button>
            <span>{quantity}</span>
            <button onClick={() => setQuantity(quantity + 1)}>+</button>
          </div>

          <button className="add-cart-btn" onClick={handleAddToCart}>
            Add to Cart
          </button>

          <a
            href={`https://wa.me/233202430406?text=Hello StreetBois Fashion, I am interested in ${product.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="details-whatsapp-btn"
          >
            Order on WhatsApp
          </a>
        </div>
      </section>

      <section className="reviews-section">
        <h2>Customer Reviews</h2>

        <div className="reviews-overview">
          <div className="average-box">
            <h3>{averageRating}</h3>
            <p>{"★".repeat(Math.round(Number(averageRating)))}</p>
            <span>{reviews.length} reviews</span>
          </div>

          <div className="rating-bars">
            {[5, 4, 3, 2, 1].map((star) => (
              <div className="rating-bar-row" key={star}>
                <span>{star}★</span>
                <div className="rating-bar">
                  <div style={{ width: `${getRatingPercent(star)}%` }}></div>
                </div>
                <small>{getRatingCount(star)}</small>
              </div>
            ))}
          </div>
        </div>

        <form className="review-form" onSubmit={submitReview}>
          <input
            type="text"
            placeholder="Your name"
            value={reviewName}
            onChange={(e) => setReviewName(e.target.value)}
          />

          <div className="star-selector">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setReviewRating(star)}
                className={star <= reviewRating ? "active-star" : ""}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            placeholder="Write your review..."
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
          ></textarea>

          <button type="submit">Submit Review</button>
        </form>

        <div className="reviews-list">
          {reviews.length === 0 ? (
            <p className="no-reviews">No reviews yet. Be the first to review.</p>
          ) : (
            reviews.map((item) => (
              <div className="review-card" key={item.id}>
                <h3>{item.customer_name}</h3>
                <p className="review-stars">{"★".repeat(item.rating)}</p>
                <p>{item.review}</p>
                <small>{new Date(item.created_at).toLocaleDateString()}</small>
              </div>
            ))
          )}
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="related-products-section">
          <h2>Related Products</h2>

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