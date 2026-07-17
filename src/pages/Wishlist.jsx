import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import "../styles/wishlist.css";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);

  const loadWishlist = () => {
    const savedWishlist =
      JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];
    setWishlist(savedWishlist);
  };

  useEffect(() => {
    loadWishlist();

    window.addEventListener("wishlistUpdated", loadWishlist);
    window.addEventListener("storage", loadWishlist);

    return () => {
      window.removeEventListener("wishlistUpdated", loadWishlist);
      window.removeEventListener("storage", loadWishlist);
    };
  }, []);

  const clearWishlist = () => {
    if (!window.confirm("Clear all wishlist items?")) return;

    localStorage.removeItem("streetbois-wishlist");
    setWishlist([]);
    window.dispatchEvent(new Event("wishlistUpdated"));
  };

  if (wishlist.length === 0) {
    return (
      <>
        <Navbar />

        <section className="wishlist-page">
          <div className="wishlist-header">
            <h1>My Wishlist</h1>
            <p>Your saved StreetBois Fashion favourites.</p>
          </div>

          <div className="wishlist-empty">
            <h2>Your wishlist is empty.</h2>
            <p>Save products you love and come back to them later.</p>
          </div>
        </section>

        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />

      <section className="wishlist-page">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
          <p>{wishlist.length} saved product{wishlist.length > 1 ? "s" : ""}.</p>

          <button className="clear-wishlist-btn" onClick={clearWishlist}>
            Clear Wishlist
          </button>
        </div>

        <div className="product-grid-universal">
          {wishlist.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showWishlist={true}
              showWhatsApp={true}
            />
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Wishlist;
