import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/contact.css";

function Contact() {
  return (
    <>
      <Navbar />

      <section className="contact-page">
        <div className="contact-header">
          <h1>Contact StreetBois Fashion</h1>
          <p>Reach us for orders, wholesale enquiries, delivery support and product availability.</p>
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <h2>Get In Touch</h2>
            <p><strong>Phone / WhatsApp:</strong> 0202430406</p>
            <p><strong>Email:</strong> apodeijoshuaagudey1@gmail.com</p>
            <p><strong>Location:</strong> Tudu, Accra - Ghana</p>
            <p><strong>Working Hours:</strong> Monday - Saturday, 8:30am - 6:00pm</p>

            <a
              href="https://wa.me/233202430406"
              target="_blank"
              className="contact-whatsapp"
            >
              Chat on WhatsApp
            </a>
          </div>

          <form className="contact-form">
            <input type="text" placeholder="Full Name" />
            <input type="email" placeholder="Email Address" />
            <input type="text" placeholder="Subject" />
            <textarea placeholder="Your Message"></textarea>
            <button type="submit">Send Message</button>
          </form>
        </div>

        <div className="map-box">
          Google Map Location Coming Soon
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Contact;