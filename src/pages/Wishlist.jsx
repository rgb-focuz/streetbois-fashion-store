import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import "../styles/wishlist.css";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const savedWishlist =
      JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];
    setWishlist(savedWishlist);
  }, []);

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
          <p>Your saved StreetBois Fashion favourites.</p>
        </div>

        <div className="product-grid-universal">
          {wishlist.map((product) => (
            <ProductCard key={product.id} product={product} showWishlist={false} />
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Wishlist;