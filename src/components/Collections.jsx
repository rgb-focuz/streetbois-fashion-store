import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import "../styles/collections.css";

function Collections() {
  const [categories, setCategories] = useState([]);

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

  return (
    <section className="collections">
      <div className="section-title">
        <span>Shop By Category</span>
        <h2>Explore Our Collections</h2>
      </div>

      <div className="collection-grid">
        {categories.map((category) => (
          <div className="collection-card" key={category.id}>
            <img
              src={category.image_url}
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