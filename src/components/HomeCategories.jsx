import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/homeCategories.css";

function HomeCategories() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const categories = [
    { icon: "👕", name: "Men Clothing" },
    { icon: "🧒", name: "Kids Wear" },
    { icon: "👜", name: "Bags" },
    { icon: "👔", name: "Belts" },
    { icon: "🧢", name: "Caps" },
    { icon: "⌚", name: "Watches" },
    { icon: "🌸", name: "Perfumes" },
    { icon: "🎒", name: "Accessories" },
    { icon: "👟", name: "Sneakers" },
    { icon: "🩴", name: "Slides" },
  ];

  return (
    <section className="home-categories">
      <div className="home-categories-head">
        <div>
          <span>SHOP BY CATEGORY</span>
          <h2>Explore StreetBois Fashion</h2>
        </div>

        <button type="button" onClick={() => setOpen(!open)}>
          {open ? "Hide Categories ▲" : "Browse Categories ▼"}
        </button>
      </div>

      {open && (
        <div className="home-category-grid">
          {categories.map((category) => (
            <button
              key={category.name}
              type="button"
              className="home-category-card"
              onClick={() =>
                navigate(`/shop?category=${encodeURIComponent(category.name)}`)
              }
            >
              <span>{category.icon}</span>
              <p>{category.name}</p>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export default HomeCategories;