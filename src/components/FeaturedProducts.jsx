import { useState } from "react";
import "../styles/home.css";

import armles from "../assets/products/armles.png";
import tshirt from "../assets/products/tshirt.png";
import caps from "../assets/products/caps.png";
import hoodies from "../assets/products/hoodies.png";
import jeans from "../assets/products/jeans.png";
import joggers from "../assets/products/joggers.png";
import shirt from "../assets/products/shirt.png";
import shorts from "../assets/products/shorts.png";
import sweater from "../assets/products/sweater.png";
import trousers from "../assets/products/trousers.png";
import shoes from "../assets/products/shoes.png";
import slides from "../assets/products/slides.png";

function FeaturedProducts() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  const products = [
    { name: "Armles", image: armles },
    { name: "T-Shirt", image: tshirt },
    { name: "Caps", image: caps },
    { name: "Hoodies", image: hoodies },
    { name: "Jeans", image: jeans },
    { name: "Joggers", image: joggers },
    { name: "Shirt", image: shirt },
    { name: "Shorts", image: shorts },
    { name: "Sweater", image: sweater },
    { name: "Trousers", image: trousers },
    { name: "Shoes", image: shoes },
    { name: "Slides", image: slides },
  ];

  return (
    <section className="featured-products">
      <h2>Featured Products</h2>

      <div className="product-grid">
        {products.map((product, index) => (
          <div className="product-card" key={index}>
            <img src={product.image} alt={product.name} className="product-img" />

            <div className="product-info">
              <h3>{product.name}</h3>
              <p>Available in Store</p>
              <button onClick={() => setSelectedProduct(product)}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div className="modal-overlay">
          <div className="product-modal simple-modal">
            <button className="close-modal" onClick={() => setSelectedProduct(null)}>
              ×
            </button>

            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="modal-product-img"
            />

            <div className="modal-details">
              <h2>{selectedProduct.name}</h2>
              <h3>Available in Store</h3>

              <a
                href={`https://wa.me/233202430406?text=Hello%20StreetBois%20Fashion,%20I%20am%20interested%20in%20${encodeURIComponent(
                  selectedProduct.name
                )}`}
                target="_blank"
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