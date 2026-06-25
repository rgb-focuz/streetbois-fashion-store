import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import "../styles/shop.css";

function Shop() {
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState("All");
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

  const addToCart = (product) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      quantity: 1,
    };

    const existingCart =
      JSON.parse(localStorage.getItem("streetbois-cart")) || [];

    const existingItem = existingCart.find((item) => item.id === product.id);

    let updatedCart;

    if (existingItem) {
      updatedCart = existingCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    } else {
      updatedCart = [...existingCart, cartItem];
    }

    localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("cartUpdated"));
    alert("Product added to cart.");
  };

  const addToWishlist = (product) => {
    const wishlistItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
    };

    const existingWishlist =
      JSON.parse(localStorage.getItem("streetbois-wishlist")) || [];

    const alreadyExists = existingWishlist.find(
      (item) => item.id === product.id
    );

    if (alreadyExists) {
      alert("Product already in wishlist.");
      return;
    }

    const updatedWishlist = [...existingWishlist, wishlistItem];

    localStorage.setItem(
      "streetbois-wishlist",
      JSON.stringify(updatedWishlist)
    );

    alert("Product added to wishlist.");
  };

  const filteredProducts =
    activeCategory === "All"
      ? products
      : products.filter((product) => product.category === activeCategory);

  return (
    <>
      <Navbar />

      <section className="shop-page">
        <div className="shop-header">
          <h1>Shop StreetBois Fashion</h1>
          <p>Browse our latest products.</p>
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

        {loading ? (
          <div className="shop-message">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="shop-message">No products found in this category.</div>
        ) : (
          <div className="shop-product-grid">
            {filteredProducts.map((product) => (
              <div className="shop-product-card" key={product.id}>
                <img
                  src={product.image_url}
                  alt={product.name}
                  onClick={() => navigate(`/product/${product.id}`)}
                />

                <div className="shop-product-info">
                  <h3 onClick={() => navigate(`/product/${product.id}`)}>
                    {product.name}
                  </h3>

                  <p className="shop-price">GH₵ {product.price}</p>
                  <p>{product.category}</p>

                  <button
                    className="shop-add-cart-btn"
                    onClick={() => addToCart(product)}
                  >
                    Add to Cart
                  </button>

                  <button
                    className="wishlist-btn"
                    onClick={() => addToWishlist(product)}
                  >
                    ❤ Add to Wishlist
                  </button>

                  <a
                    href={`https://wa.me/233202430406?text=Hello%20StreetBois%20Fashion,%20I%20am%20interested%20in%20${encodeURIComponent(
                      product.name
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Order on WhatsApp
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}

export default Shop;