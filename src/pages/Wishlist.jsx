import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/wishlist.css";

function Wishlist() {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const savedWishlist =
      JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];
    setWishlist(savedWishlist);
  }, []);

  const removeFromWishlist = (id) => {
    const updatedWishlist = wishlist.filter((item) => item.id !== id);
    setWishlist(updatedWishlist);
    localStorage.setItem(
      "streetbois-wishlist",
      JSON.stringify(updatedWishlist)
    );
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
          <p>Your saved StreetBois Fashion favourites.</p>
        </div>

        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <div className="wishlist-card" key={item.id}>
              <img src={item.image_url} alt={item.name} />

              <h3>{item.name}</h3>
              <p>GH₵ {item.price}</p>
              <span>{item.category}</span>

              <button onClick={() => removeFromWishlist(item.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Wishlist;