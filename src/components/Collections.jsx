import "../styles/collections.css";

import officialWear from "../assets/categories/official-wear.jpg";
import casualWear from "../assets/categories/casual-wear.jpg";
import shoes from "../assets/categories/shoes.jpg";
import slippers from "../assets/categories/slippers.jpg";
import perfumes from "../assets/categories/perfumes.jpg";
import caps from "../assets/categories/caps.jpg";

function Collections() {
  const categories = [
    { name: "Men's Official Wear", image: officialWear },
    { name: "Men's Casual Wear", image: casualWear },
    { name: "Shoes", image: shoes },
    { name: "Slippers", image: slippers },
    { name: "Perfumes", image: perfumes },
    { name: "Caps", image: caps },
  ];

  return (
    <section className="collections">
      <div className="section-title">
        <span>Shop By Category</span>
        <h2>Explore Our Collections</h2>
      </div>

      <div className="collection-grid">
        {categories.map((category, index) => (
          <div className="collection-card" key={index}>
            <img
              src={category.image}
              alt={category.name}
              className="category-image"
            />

            <div className="collection-info">
              <h3>{category.name}</h3>
              <button>Shop Now</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Collections;