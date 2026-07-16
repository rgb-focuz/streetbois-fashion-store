import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { supabase } from "../supabaseClient";
import "../styles/shop.css";

function Shop() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const categoryQuery = searchParams.get("category") || "All";
  const subcategoryQuery = searchParams.get("subcategory") || "All";
  const [activeCategory, setActiveCategory] = useState(categoryQuery);
  const [activeSubcategory, setActiveSubcategory] = useState(subcategoryQuery);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const categories = [
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

  const menSubcategories = [
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

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.log("Error fetching products:", error);
      } else {
        setProducts(data || []);
      }

      setLoading(false);
    };

    fetchProducts();
  }, []);

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

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      activeCategory === "All" || product.category === activeCategory;

    const selectedSubcategory = menSubcategories.find(
      (subcategory) => subcategory.value === activeSubcategory
    );

    const productText = `${product.name || ""} ${product.description || ""} ${
      product.category || ""
    }`.toLowerCase();

    const matchesMenSubcategory =
      activeCategory !== "Men Clothing" ||
      activeSubcategory === "All" ||
      !selectedSubcategory ||
      selectedSubcategory.keywords.some((keyword) =>
        productText.includes(keyword.toLowerCase())
      );

    const matchesSearch =
      searchQuery === "" ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesMenSubcategory && matchesSearch;
  });

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
          {categories.map((category) => (
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
              {menSubcategories.map((subcategory) => (
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
        ) : filteredProducts.length === 0 ? (
          <div className="shop-message">
            No products found in this category.
          </div>
        ) : (
          <div className="product-grid-universal">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}

export default Shop;
