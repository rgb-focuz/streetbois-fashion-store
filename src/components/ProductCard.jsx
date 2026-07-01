import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/productCard.css";

function ProductCard({ product, showWishlist = true, showWhatsApp = true }) {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    checkWishlist();
    window.addEventListener("wishlistUpdated", checkWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", checkWishlist);
    };
  }, [product.id]);

  const checkWishlist = () => {
    const wishlist =
      JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];
    setIsWishlisted(wishlist.some((item) => item.id === product.id));
  };

  const addToCart = () => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
    };

    const existingCart =
      JSON.parse(localStorage.getItem("streetbois-cart")) || [];

    const existingItem = existingCart.find((item) => item.id === product.id);

    const updatedCart = existingItem
      ? existingCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...existingCart, cartItem];

    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Product added to cart.");
  };

  const toggleWishlist = () => {
    const wishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
    };

    const existingWishlist =
      JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];

    let updatedWishlist;

    if (existingWishlist.some((item) => item.id === product.id)) {
      updatedWishlist = existingWishlist.filter((item) => item.id !== product.id);
      setIsWishlisted(false);
    } else {
      updatedWishlist = [...existingWishlist, wishlistItem];
      setIsWishlisted(true);
    }

    localStorage.setItem("streetbois-wishlist", JSON.stringify(updatedWishlist));
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  return (
    <div className="universal-product-card">
      <div className="product-image-wrap">
        <img
          src={product.image_url}
          alt={product.name}
          onClick={() => navigate(`/product/${product.id}`)}
        />

        {showWishlist && (
          <button
            className={isWishlisted ? "wishlist-heart active" : "wishlist-heart"}
            onClick={toggleWishlist}
          >
            {isWishlisted ? "♥" : "♡"}
          </button>
        )}
      </div>

      <div className="universal-product-info">
        <h3 onClick={() => navigate(`/product/${product.id}`)}>
          {product.name}
        </h3>

        <p className="universal-price">GH₵ {product.price}</p>

        {product.category && (
          <p className="universal-category">{product.category}</p>
        )}

        <button className="universal-cart-btn" onClick={addToCart}>
          Add to Cart
        </button>

        {showWishlist && (
          <button className="universal-wishlist-btn" onClick={toggleWishlist}>
            {isWishlisted ? "♥ Remove from Wishlist" : "♡ Add to Wishlist"}
          </button>
        )}

        {showWhatsApp && (
          <a
            href={`https://wa.me/233202430406?text=Hello%20StreetBois%20Fashion,%20I%20am%20interested%20in%20${encodeURIComponent(product.name)}`}
            target="_blank"
            rel="noreferrer"
            className="universal-whatsapp-btn"
          >
            Order on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default ProductCard;