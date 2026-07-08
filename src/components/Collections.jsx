import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/collections.css";

function Collections() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .not("image_url", "is", null)
      .order("created_at", { ascending: false });

    if (!error) {
      setCategories(data || []);
    }
  };

  const openCategory = (categoryName) => {
  navigate("/shop", {
    state: {
      selectedCategory: categoryName,
    },
  });
};

  return (
    <section className="collections">
      <div className="section-title">
        <span>Shop By Category</span>
        <h2>Explore Our Collections</h2>
      </div>

      <div className="collection-grid">
        {categories.map((category) => (
          <div className="collection-card" key={category.id}>
            <div className="collection-image-box" onClick={() => openCategory(category.name)}>
              <img src={category.image_url} alt={category.name} />
            </div>

            <div className="collection-info">
              <h3>{category.name}</h3>
              <button onClick={() => openCategory(category.name)}>
                Shop Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Collections;