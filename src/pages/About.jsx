import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/about.css";

function About() {
  return (
    <>
      <Navbar />

      <section className="about-page">
        <div className="about-hero">
          <h1>About StreetBois Fashion</h1>
          <p>
            StreetBois Fashion is one of Ghana's leading wholesale and retail
            fashion brands, providing premium clothing, shoes, slides,
            accessories, and lifestyle products for modern fashion lovers.
          </p>
        </div>

        <div className="about-content">
          <div className="about-card">
            <h2>Who We Are</h2>
            <p>
              We are a trusted fashion business with a large warehouse and
              multiple retail outlets in Accra. Our mission is to provide
              quality fashion products at affordable prices while delivering
              excellent customer service.
            </p>
          </div>

          <div className="about-card">
            <h2>What We Sell</h2>
            <ul>
              <li>Designer Clothing</li>
              <li>T-Shirts & Armles</li>
              <li>Jeans & Joggers</li>
              <li>Hoodies & Sweaters</li>
              <li>Shoes & Slides</li>
              <li>Caps & Accessories</li>
            </ul>
          </div>

          <div className="about-card">
            <h2>Our Vision</h2>
            <p>
              To become the most trusted fashion destination in Ghana by
              providing quality products, excellent customer service and
              affordable prices.
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default About;