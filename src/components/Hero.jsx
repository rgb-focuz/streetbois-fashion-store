import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/hero.css";

import banner1 from "../assets/banner1.png";
import banner2 from "../assets/banner2.png";
import banner3 from "../assets/banner3.png";
import banner4 from "../assets/banner4.png";
import banner5 from "../assets/banner5.png";
import banner6 from "../assets/banner6.png";

function Hero() {
  const navigate = useNavigate();
  const banners = [banner1, banner2, banner3, banner4, banner5, banner6];
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

  useEffect(() => {
    const slider = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);

    return () => clearInterval(slider);
  }, [banners.length]);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

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
          <button
            className="arrow left"
            onClick={prevSlide}
            aria-label="Previous banner"
          >
            ‹
          </button>

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

          <button
            className="arrow right"
            onClick={nextSlide}
            aria-label="Next banner"
          >
            ›
          </button>
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
