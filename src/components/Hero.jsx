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
  const banners = [
    banner1,
    banner2,
    banner3,
    banner4,
    banner5,
    banner6,
  ];

  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
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
    setCurrent((prev) =>
      prev === 0 ? banners.length - 1 : prev - 1
    );
  };

  return (
    <section
      className="hero"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.55), rgba(0,0,0,0.55)), url(${banners[current]})`,
      }}
    >
      <button className="arrow left" onClick={prevSlide}>
        ❮
      </button>

      <div className="hero-content">
        <span>Premium Ghanaian Fashion Store</span>
        <h1>Style Beyond Trends.</h1>
        <p>
          Quality clothing, shoes, bags, belts and accessories for modern
          fashion lovers.
        </p>

        <div className="hero-buttons">
          <button onClick={() => navigate("/shop")}>
  Shop Collection
</button>
          <button
  className="outline"
  onClick={() => navigate("/contact")}
>
  Contact Us
</button>
        </div>
      </div>

      <button className="arrow right" onClick={nextSlide}>
        ❯
      </button>
    </section>
  );
}

export default Hero;