import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { supabase } from "../supabaseClient";
import "../styles/shop.css";

const PAGE_SIZE = 48;

const CATEGORIES = [
  "All",
  "Men Clothing",
  "Kids Wear",
  "Bags",
  "Belts",
  "Caps",
  "Watches",
  "Perfumes",
  "Accessories",
  "Sneakers",
  "Slides",
];

const MEN_SUBCATEGORIES = [
  { label: "All Men Clothing", value: "All", keywords: [] },
  { label: "Armless", value: "Armless", keywords: ["armless", "sleeveless", "singlet", "vest"] },
  { label: "Jeans", value: "Jeans", keywords: ["jeans", "denim"] },
  { label: "Joggers", value: "Joggers", keywords: ["jogger", "joggers"] },
  { label: "Shorts", value: "Shorts", keywords: ["short", "shorts"] },
  { label: "T-Shirt", value: "T-Shirt", keywords: ["t=shirt", "t-shirt", "tshirt", "tee", "t shirt"] },
  {
    label: "Official Wear",
    value: "Official Wear",
    keywords: [
      "official",
      "office wear",
      "formal",
      "church",
      "work wear",
      "suit",
      "blazer",
      "kaftan",
      "senator",
      "agbada",
    ],
  },
  { label: "Sweater", value: "Sweater", keywords: ["sweater", "sweatshirt"] },
  { label: "Hoodie", value: "Hoodie", keywords: ["hoodie", "hooded"] },
  { label: "Trousers", value: "Trousers", keywords: ["trouser", "trousers", "pants"] },
  { label: "Top & Down", value: "Top & Down", keywords: ["top and down", "top & down", "set", "two piece", "2 piece"] },
];

function Shop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryQuery = searchParams.get("category") || "All";
  const subcategoryQuery = searchParams.get("subcategory") || "All";
  const [activeCategory, setActiveCategory] = useState(categoryQuery);
  const [activeSubcategory, setActiveSubcategory] = useState(subcategoryQuery);
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const getSubcategoryKeywords = useCallback((subcategoryValue) => {
    const selectedSubcategory = MEN_SUBCATEGORIES.find(
      (subcategory) => subcategory.value === subcategoryValue
    );

    return selectedSubcategory?.keywords || [];
  }, []);

  const buildProductQuery = useCallback(() => {
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false });

    if (activeCategory !== "All") {
      query = query.eq("category", activeCategory);
    }

    if (searchQuery.trim()) {
      const term = searchQuery.trim().replace(/[%_]/g, "");
      query = query.or(
        `name.ilike.%${term}%,category.ilike.%${term}%,description.ilike.%${term}%`
      );
    }

    const subcategoryKeywords =
      activeCategory === "Men Clothing" && activeSubcategory !== "All"
        ? getSubcategoryKeywords(activeSubcategory)
        : [];

    if (subcategoryKeywords.length > 0) {
      query = query.or(
        subcategoryKeywords
          .map((keyword) => {
            const safeKeyword = keyword.replace(/[%_]/g, "");
            return `name.ilike.%${safeKeyword}%,description.ilike.%${safeKeyword}%`;
          })
          .join(",")
      );
    }

    return query;
  }, [activeCategory, activeSubcategory, getSubcategoryKeywords, searchQuery]);

  const fetchProducts = useCallback(async ({ page = 0, append = false } = {}) => {
    append ? setLoadingMore(true) : setLoading(true);

    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error, count } = await buildProductQuery().range(from, to);

    if (error) {
      console.log("Error fetching products:", error);
    } else {
      setProducts((previous) => (append ? [...previous, ...(data || [])] : data || []));
      setTotalProducts(count || 0);
      setCurrentPage(page);
    }

    setLoading(false);
    setLoadingMore(false);
  }, [buildProductQuery]);

  useEffect(() => {
    fetchProducts({ page: 0, append: false });
  }, [fetchProducts]);

  useEffect(() => {
    setActiveCategory(categoryQuery);
  }, [categoryQuery]);

  useEffect(() => {
    setActiveSubcategory(subcategoryQuery);
  }, [subcategoryQuery]);

  useEffect(() => {
    if (activeCategory !== "Men Clothing") {
      setActiveSubcategory("All");
    }
  }, [activeCategory]);

  const hasMoreProducts = products.length < totalProducts;

  return (
    <>
      <Navbar />

      <section className="shop-page">
        <div className="shop-header">
          <h1>Shop StreetBois Fashion</h1>

          {searchQuery ? (
            <>
              <p>Search results for: "{searchQuery}"</p>
              <button
                className="clear-search-btn"
                onClick={() => navigate("/shop")}
              >
                Clear Search
              </button>
            </>
          ) : (
            <p>Browse our latest products.</p>
          )}
        </div>

        <div className="filter-container">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              className={
                activeCategory === category
                  ? "filter-btn active-filter"
                  : "filter-btn"
              }
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {activeCategory === "Men Clothing" && (
          <div className="subcategory-panel">
            <div className="subcategory-panel-head">
              <h2>Men Clothing Options</h2>
              <p>Choose a style to find what you need faster.</p>
            </div>

            <div className="subcategory-grid">
              {MEN_SUBCATEGORIES.map((subcategory) => (
                <button
                  key={subcategory.value}
                  type="button"
                  className={
                    activeSubcategory === subcategory.value
                      ? "subcategory-btn active-subcategory"
                      : "subcategory-btn"
                  }
                  onClick={() => setActiveSubcategory(subcategory.value)}
                >
                  {subcategory.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {loading ? (
          <div className="shop-message">Loading products...</div>
        ) : products.length === 0 ? (
          <div className="shop-message">
            No products found in this category.
          </div>
        ) : (
          <>
            <div className="product-grid-universal">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasMoreProducts && (
              <div className="shop-load-more">
                <button
                  type="button"
                  onClick={() =>
                    fetchProducts({ page: currentPage + 1, append: true })
                  }
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More Products"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </>
  );
}

export default Shop;
