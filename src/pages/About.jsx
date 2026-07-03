import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/about.css";

import heroImage from "../assets/about-hero.png";
import pants from "../assets/about-pants.png";
import shirt from "../assets/about-shirt.png";
import jersey from "../assets/about-jersey.png";
import tee from "../assets/about-tee.png";
import jeans from "../assets/about-jeans.png";

function About() {
  return (
    <>
      <Navbar />

      <div className="about-page">

        {/* HERO */}
        <section
          className="about-hero"
          style={{
            backgroundImage: `linear-gradient(rgba(0,0,0,.55), rgba(0,0,0,.65)), url(${heroImage})`,
          }}
        >
          <div className="about-hero-content">

            <span>ABOUT STREETBOIS FASHION</span>

            <h1>
              Where Fashion
              <br />
              Meets Quality
            </h1>

            <p>
              StreetBois Fashion is one of Ghana's fastest-growing fashion
              destinations, supplying premium clothing, footwear and
              accessories through our wholesale warehouse and retail shops
              across Accra.
            </p>

            <a href="/shop">
              <button>Shop Collection</button>
            </a>

          </div>
        </section>

        {/* WHO WE ARE */}

        <section className="about-section">

          <div className="about-text">

            <span>WHO WE ARE</span>

            <h2>Leading Fashion Across Ghana</h2>

            <p>
              Since our establishment, StreetBois Fashion has become one of
              Ghana's trusted fashion brands, offering carefully selected
              clothing, shoes, slides, perfumes, caps and accessories for
              individuals and businesses.
            </p>

            <p>
              With a large warehouse, multiple retail branches and a growing
              online presence, we continue delivering authentic fashion that
              combines quality, affordability and style.
            </p>

          </div>

          <div className="about-image">
            <img src={heroImage} alt="" />
          </div>

        </section>

        {/* STORY */}

        <section className="story-section">

          <div className="story-card">

            <h2>Our Story</h2>

            <p>
              StreetBois Fashion started with a simple mission:
              provide fashionable clothing at wholesale prices while giving
              customers exceptional service.
            </p>

            <p>
              Today, we proudly serve thousands of customers through our shops
              located in Accra (Tudu), offering premium fashion collections for
              men, women and kids.
            </p>

          </div>

        </section>

        {/* STATS */}

        <section className="about-stats">

          <div className="stat">
            <h2>10K+</h2>
            <p>Products Sold</p>
          </div>

          <div className="stat">
            <h2>2.5K+</h2>
            <p>Happy Customers</p>
          </div>

          <div className="stat">
            <h2>10</h2>
            <p>Retail Shops</p>
          </div>

          <div className="stat">
            <h2>24/7</h2>
            <p>Customer Support</p>
          </div>

        </section>

        {/* WHY US */}

        <section className="why-section">

          <span>WHY STREETBOIS</span>

          <h2>Why Customers Choose Us</h2>

          <div className="why-grid">

            <div className="why-card">
              <h3>Premium Quality</h3>
              <p>
                Carefully selected fashion products with premium finishing.
              </p>
            </div>

            <div className="why-card">
              <h3>Affordable Prices</h3>
              <p>
                Wholesale and retail pricing that suits every customer.
              </p>
            </div>

            <div className="why-card">
              <h3>Fast Delivery</h3>
              <p>
                Reliable nationwide delivery across Ghana.
              </p>
            </div>

            <div className="why-card">
              <h3>Latest Fashion</h3>
              <p>
                New arrivals every week from top international suppliers.
              </p>
            </div>

            <div className="why-card">
              <h3>Trusted Brand</h3>
              <p>
                Thousands of satisfied customers continue shopping with us.
              </p>
            </div>

            <div className="why-card">
              <h3>Excellent Support</h3>
              <p>
                Friendly customer service before and after every purchase.
              </p>
            </div>

          </div>

        </section>

        {/* PRODUCT SHOWCASE */}

        <section className="showcase">

          <span>OUR COLLECTIONS</span>

          <h2>Premium Fashion Collection</h2>

          <div className="showcase-grid">

            <img src={pants} alt="" />

            <img src={shirt} alt="" />

            <img src={jersey} alt="" />

            <img src={tee} alt="" />

            <img src={jeans} alt="" />

          </div>

        </section>

        {/* CTA */}

        <section className="about-cta">

          <h2>
            Ready To Upgrade Your Style?
          </h2>

          <p>
            Discover thousands of premium fashion products available both
            wholesale and retail.
          </p>

          <a href="/shop">
            <button>Start Shopping</button>
          </a>

        </section>

      </div>

      <Footer />

    </>
  );
}

export default About;