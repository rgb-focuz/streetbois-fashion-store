import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

function SearchSection() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    const value = search.trim();

    if (!value) return;

    navigate(`/shop?search=${encodeURIComponent(value)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <section className="search-section">
      <h2>Search Products</h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <button onClick={handleSearch}>
          Search
        </button>
      </div>
    </section>
  );
}

export default SearchSection;