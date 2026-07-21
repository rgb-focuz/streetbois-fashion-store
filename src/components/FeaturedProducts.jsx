import { useCallback, useEffect, useRef, useState } from "react";
import ProductCard from "./ProductCard";
import "../styles/home.css";

const getSupabase = async () => {
  const module = await import("../supabaseClient");
  return module.supabase;
};

const PAGE_SIZE = 12;
const PRODUCT_CARD_FIELDS =
  "id,name,category,price,image_url,stock,in_stock,status,featured,created_at";

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [customerHasScrolled, setCustomerHasScrolled] = useState(false);
  const loadMoreRef = useRef(null);

  const fetchProducts = useCallback(async ({ page = 0, append = false } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);
    const supabase = await getSupabase();
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from("products")
      .select(PRODUCT_CARD_FIELDS, { count: "exact" })
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
  }, []);

  useEffect(() => {
    fetchProducts({ page: 0, append: false });
  }, [fetchProducts]);

  useEffect(() => {
    const markCustomerScroll = () => setCustomerHasScrolled(true);

    window.addEventListener("wheel", markCustomerScroll, { passive: true });
    window.addEventListener("touchmove", markCustomerScroll, { passive: true });
    window.addEventListener("keydown", markCustomerScroll);

    return () => {
      window.removeEventListener("wheel", markCustomerScroll);
      window.removeEventListener("touchmove", markCustomerScroll);
      window.removeEventListener("keydown", markCustomerScroll);
    };
  }, []);

  useEffect(() => {
    if (!customerHasScrolled || loading || loadingMore || products.length >= totalProducts) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchProducts({ page: currentPage + 1, append: true });
        }
      },
      {
        rootMargin: "240px",
      }
    );

    const node = loadMoreRef.current;

    if (node) observer.observe(node);

    return () => {
      if (node) observer.unobserve(node);
      observer.disconnect();
    };
  }, [
    currentPage,
    customerHasScrolled,
    fetchProducts,
    loading,
    loadingMore,
    products.length,
    totalProducts,
  ]);

  const hasMoreProducts = products.length < totalProducts;

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
        <div className="home-feed-skeleton" aria-label="Loading products">
          {Array.from({ length: 12 }).map((_, index) => (
            <div className="home-product-skeleton" key={index}></div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="home-feed-message">No products available.</div>
      ) : (
        <>
          <div className="product-grid-universal">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {hasMoreProducts && (
            <div className="home-load-more" ref={loadMoreRef}>
              <button
                type="button"
                disabled={loadingMore}
                onClick={() => {
                  setCustomerHasScrolled(true);
                  fetchProducts({ page: currentPage + 1, append: true });
                }}
              >
                {loadingMore ? "Loading..." : "Load More Products"}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default FeaturedProducts;
