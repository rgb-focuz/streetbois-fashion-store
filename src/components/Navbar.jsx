import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/navbar.css";
import logo from "../assets/logo.png";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="logo">
        <img src={logo} alt="StreetBois Fashion Logo" />
        <h2>StreetBois Fashion</h2>
      </div>

      <div
        className="hamburger"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </div>

      <ul className={`nav-links ${menuOpen ? "active" : ""}`}>
        <li><Link to="/">Home</Link></li>

        <li><Link to="/shop">Shop</Link></li>

        <li><Link to="/about">About</Link></li>

        <li><Link to="/contact">Contact</Link></li>

        <li><Link to="/faq">FAQ</Link></li>

        <li><Link to="/cart">Cart</Link></li>

        <li><Link to="/account">Account</Link></li>
      </ul>

      <Link to="/shop">
        <button className="shop-btn">Shop Now</button>
      </Link>
    </nav>
  );
}

export default Navbar;