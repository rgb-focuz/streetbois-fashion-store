import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/hero.css";

import banner1 from "../assets/banner1.webp";

function Hero() {
  const navigate = useNavigate();
  const banners = [banner1];
  const categories = [
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

  const [current, setCurrent] = useState(0);

  return (
    <section className="hero">
      <div className="hero-shell">
        <aside className="hero-category-panel">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                navigate(`/shop?category=${encodeURIComponent(category)}`)
              }
            >
              <span>{category.slice(0, 1)}</span>
              {category}
            </button>
          ))}
        </aside>

        <div
          className="hero-stage"
          style={{
            backgroundImage: `linear-gradient(90deg, rgba(0,0,0,.52), rgba(0,0,0,.1)), url(${banners[current]})`,
          }}
        >
          <div className="hero-content">
            <span>Premium Ghanaian Fashion Store</span>
            <h1>Crazy Fashion Deals</h1>
            <p>Clothing, shoes, bags and accessories for everyday style.</p>

            <div className="hero-quick-links">
              <button
                className="hero-quick-btn"
                onClick={() => navigate("/shop")}
              >
                <span className="hero-text">Shop Collection</span>
                <span className="hero-arrow">›</span>
              </button>

              <div className="hero-divider"></div>

              <button
                className="hero-quick-btn"
                onClick={() => navigate("/contact")}
              >
                <span className="hero-text">Contact Us</span>
                <span className="hero-arrow">›</span>
              </button>
            </div>
          </div>

          {banners.length > 1 && (
            <div className="hero-dots">
              {banners.map((banner, index) => (
                <button
                  key={banner}
                  type="button"
                  className={index === current ? "active" : ""}
                  aria-label={`Show banner ${index + 1}`}
                  onClick={() => setCurrent(index)}
                />
              ))}
            </div>
          )}
        </div>

        <aside className="hero-side-panel">
          <a href="tel:0202430406" className="hero-service-card">
            <strong>Call / WhatsApp</strong>
            <span>020 243 0406</span>
          </a>
          <button
            type="button"
            className="hero-service-card"
            onClick={() => navigate("/contact")}
          >
            <strong>Need Help?</strong>
            <span>Talk to support</span>
          </button>
          <button
            type="button"
            className="hero-promo-card"
            onClick={() => navigate("/shop")}
          >
            <strong>Shopping Spree</strong>
            <span>Up to 40% off</span>
          </button>
        </aside>
      </div>
    </section>
  );
}

export default Hero;
