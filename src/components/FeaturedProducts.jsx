import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import ProductCard from "./ProductCard";
import "../styles/home.css";

function FeaturedProducts() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("featured", true)
      .eq("status", "Active")
      .order("created_at", { ascending: false });

    if (!error) {
      setProducts(data || []);
    }
  };

  return (
    <section className="featured-products">
      <h2>Featured Products</h2>

      <div className="product-grid-universal">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default FeaturedProducts;