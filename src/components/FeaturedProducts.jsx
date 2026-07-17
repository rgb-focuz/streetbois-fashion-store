import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import "../styles/home.css";

const getSupabase = async () => {
  const module = await import("../supabaseClient");
  return module.supabase;
};

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 24;

  useEffect(() => {
    fetchProducts({ page: 0, append: false });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const nearBottom =
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 500;

      if (nearBottom && products.length < totalProducts && !loadingMore) {
        fetchProducts({ page: currentPage + 1, append: true });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [currentPage, loadingMore, products.length, totalProducts]);

  const fetchProducts = async ({ page = 0, append = false } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    const supabase = await getSupabase();
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("status", "Active")
      .order("created_at", { ascending: false })
      .range(from, to);

    if (!error) {
      setProducts((previous) => (append ? [...previous, ...(data || [])] : data || []));
      setTotalProducts(count || 0);
      setCurrentPage(page);
    }

    setLoading(false);
    setLoadingMore(false);
  };

  return (
    <section className="home-products-feed">
      <div className="home-feed-header">
        <div>
          <h2>Flash Sales</h2>
          <p>Time Left: 00h : 00m : 00s</p>
        </div>
        <a href="/shop">See All</a>
      </div>

      {loading ? (
        <div className="home-feed-message">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="home-feed-message">No products available.</div>
      ) : (
        <div className="product-grid-universal">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}

export default FeaturedProducts;
