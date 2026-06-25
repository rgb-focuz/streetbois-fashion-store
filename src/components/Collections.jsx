import "../styles/collections.css";

function Collections() {
  const categories = [
    {
      name: "Men's Official Wear",
      image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c"
    },
    {
      name: "Men's Casual Wear",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab"
    },
    {
      name: "Shoes",
      image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff"
    },
    {
      name: "Slippers",
      image: "https://images.unsplash.com/photo-1603487742131-4160ec999306"
    },
    {
      name: "Perfumes",
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601"
    },
    {
      name: "Caps",
      image: "https://images.unsplash.com/photo-1521369909029-2afed882baee"
    }
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