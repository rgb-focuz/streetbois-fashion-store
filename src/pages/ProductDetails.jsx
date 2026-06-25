import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import "../styles/productDetails.css";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      setProduct(data);
      fetchRelatedProducts(data.category, data.id);
    }

    setLoading(false);
  };


const handleAddToCart = () => {
  const cartItem = {
    id: product.id,
    name: product.name,
    price: product.price,
    image_url: product.image_url,
    quantity: quantity,
  };

  const existingCart = JSON.parse(localStorage.getItem("streetbois-cart")) || [];

  const existingItem = existingCart.find((item) => item.id === product.id);

  let updatedCart;

  if (existingItem) {
    updatedCart = existingCart.map((item) =>
      item.id === product.id
        ? { ...item, quantity: item.quantity + quantity }
        : item
    );
  } else {
    updatedCart = [...existingCart, cartItem];
  }

  localStorage.setItem("streetbois-cart", JSON.stringify(updatedCart));

  alert("Product added to cart.");
};

  const fetchRelatedProducts = async (category, productId) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category", category)
      .neq("id", productId)
      .eq("status", "Active")
      .limit(4);

    if (!error) {
      setRelatedProducts(data || []);
    }
  };

  if (loading) {
    return <div className="product-details-message">Loading product...</div>;
  }

  if (!product) {
    return <div className="product-details-message">Product not found.</div>;
  }

  return (
    <>
      <Navbar />

      <section className="product-details-page">
        <div className="product-details-image">
          <img src={product.image_url} alt={product.name} />
        </div>

        <div className="product-details-info">
          <p className="breadcrumb">Home / Shop / {product.name}</p>

          <h1>{product.name}</h1>
          <h2>GH₵ {product.price}</h2>

          <p className="product-category">{product.category}</p>

          <p className="product-description">
            {product.description ||
              "Quality fashion product available at StreetBois Fashion."}
          </p>

          <p className="stock-status">
            {product.stock > 0 ? `In stock: ${product.stock}` : "Out of stock"}
          </p>

          <div className="quantity-box">
  <button onClick={() => setQuantity(quantity > 1 ? quantity - 1 : 1)}>
    -
  </button>

  <span>{quantity}</span>

  <button onClick={() => setQuantity(quantity + 1)}>
    +
  </button>
</div>

<button className="add-cart-btn" onClick={handleAddToCart}>
  Add to Cart
</button>

          <a
            href={`https://wa.me/233202430406?text=Hello StreetBois Fashion, I am interested in ${product.name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="details-whatsapp-btn"
          >
            Order on WhatsApp
          </a>
        </div>
      </section>

      {relatedProducts.length > 0 && (
        <section className="related-products-section">
          <h2>Related Products</h2>

          <div className="related-products-grid">
            {relatedProducts.map((item) => (
              <div
                className="related-product-card"
                key={item.id}
                onClick={() => navigate(`/product/${item.id}`)}
              >
                <img src={item.image_url} alt={item.name} />
                <h3>{item.name}</h3>
                <p>GH₵ {item.price}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </>
  );
}

export default ProductDetails;