import "../styles/home.css";

function Stats() {
  return (
    <section className="stats-wrapper">
      <div className="stats-slider">

        <div className="stat-item">
          <h3>10K+</h3>
          <p>Products Sold</p>
        </div>

        <div className="stat-item">
          <h3>2.5K+</h3>
          <p>Happy Customers</p>
        </div>

        <div className="stat-item">
          <h3>500+</h3>
          <p>Fashion Styles</p>
        </div>

        <div className="stat-item">
          <h3>24/7</h3>
          <p>Customer Support</p>
        </div>

        {/* Duplicate for seamless scrolling */}

        <div className="stat-item">
          <h3>10K+</h3>
          <p>Products Sold</p>
        </div>

        <div className="stat-item">
          <h3>2.5K+</h3>
          <p>Happy Customers</p>
        </div>

        <div className="stat-item">
          <h3>500+</h3>
          <p>Fashion Styles</p>
        </div>

        <div className="stat-item">
          <h3>24/7</h3>
          <p>Customer Support</p>
        </div>

      </div>
    </section>
  );
}

export default Stats;