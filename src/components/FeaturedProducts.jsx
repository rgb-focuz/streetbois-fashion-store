import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductCard from "./ProductCard";
import "../styles/home.css";

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;

      if (nearBottom) {
        setVisibleCount((prev) => prev + 8);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchProducts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("status", "Active")
      .order("created_at", { ascending: false });

    if (!error) {
      setProducts(data || []);
    }

    setLoading(false);
  };

  return (
    <section className="home-products-feed">
      <div className="home-feed-header">
        <h2>Recommended For You</h2>
        <p>Keep scrolling to discover more StreetBois Fashion products.</p>
      </div>

      {loading ? (
        <div className="home-feed-message">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="home-feed-message">No products available.</div>
      ) : (
        <div className="product-grid-universal">
          {products.slice(0, visibleCount).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default FeaturedProducts;