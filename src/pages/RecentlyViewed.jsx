import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";

function RecentlyViewed() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const viewed =
      JSON.parse(localStorage.getItem("streetbois-recently-viewed")) || [];
    setProducts(viewed);
  }, []);

  return (
    <>
      <Navbar />

      <section className="shop-page">
        <div className="shop-header">
          <h1>Recently Viewed</h1>
          <p>Your recently viewed products.</p>
        </div>

        {products.length === 0 ? (
          <div className="shop-message">
            You haven't viewed any products yet.
          </div>
        ) : (
          <div className="product-grid-universal">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}

export default RecentlyViewed;