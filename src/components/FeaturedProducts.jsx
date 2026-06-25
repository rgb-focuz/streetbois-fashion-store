import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/home.css";

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

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
      setProducts(data);
    }
  };

  return (
    <section className="featured-products">
      <h2>Featured Products</h2>

      <div className="product-grid">
        {products.map((product) => (
          <div className="product-card" key={product.id}>
            <img
              src={product.image_url}
              alt={product.name}
              className="product-img"
            />

            <div className="product-info">
              <h3>{product.name}</h3>
              <p>GH₵ {product.price}</p>

              <button onClick={() => setSelectedProduct(product)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div className="modal-overlay">
          <div className="product-modal">
            <button
              className="close-modal"
              onClick={() => setSelectedProduct(null)}
            >
              ×
            </button>

            <img
              src={selectedProduct.image_url}
              alt={selectedProduct.name}
              className="modal-product-img"
            />

            <div className="modal-details">
              <h2>{selectedProduct.name}</h2>

              <h3>GH₵ {selectedProduct.price}</h3>

              <p>{selectedProduct.description}</p>

              <a
                href={`https://wa.me/233202430406?text=Hello StreetBois Fashion, I am interested in ${selectedProduct.name}`}
                target="_blank"
                rel="noopener noreferrer"
                className="whatsapp-order"
              >
                Order on WhatsApp
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default FeaturedProducts;