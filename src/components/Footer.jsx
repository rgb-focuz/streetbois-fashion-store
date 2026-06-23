import "../styles/footer.css";

function Footer() {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <h2>STREETBOIS</h2>
          <p>Premium street fashion for confident individuals.</p>
          <small>Built in Ghana 🇬🇭</small>
        </div>

        <div>
          <h3>Quick Links</h3>
          <p>Home</p>
          <p>Shop</p>
          <p>About</p>
          <p>Contact</p>
        </div>

        <div>
          <h3>Customer Service</h3>
          <p>Delivery & Returns</p>
          <p>Track Order</p>
          <p>Wholesale</p>
          <p>FAQ</p>
        </div>

        <div>
          <h3>Contact</h3>
          <p>📍 Accra, Ghana</p>
          <p>📞 0202430406</p>
          <p>✉️ apodeijoshuaagudey1@gmail.com</p>
        </div>
      </div>

      <div className="copyright">
        © 2026 StreetBois Fashion. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;