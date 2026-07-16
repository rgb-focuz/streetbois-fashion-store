import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/faq.css";

function FAQ() {
  return (
    <>
      <Navbar />

      <section className="faq-page">
        <div className="faq-header">
          <h1>Frequently Asked Questions</h1>
          <p>Answers to common questions from our customers.</p>
        </div>

        <div className="faq-container">
          <div className="faq-item">
            <h3>Do you offer wholesale services?</h3>
            <p>Yes. StreetBois Fashion supplies products to retailers and resellers across Ghana.</p>
          </div>

          <div className="faq-item">
            <h3>Do you deliver nationwide?</h3>
            <p>Yes. We deliver products to customers across Ghana.</p>
          </div>

          <div className="faq-item">
            <h3>Can I order through WhatsApp?</h3>
            <p>Yes. Simply click any WhatsApp order button and our team will assist you.</p>
          </div>

          <div className="faq-item">
            <h3>Do you have physical shops?</h3>
            <p>Yes. We operate multiple retail outlets in Tudu, Accra.</p>
          </div>

          <div className="faq-item">
            <h3>What payment methods do you accept?</h3>
            <p>We accept Mobile Money, Bank Transfer and other approved payment methods.</p>
          </div>

          <div className="faq-item">
            <h3>How do I place an order?</h3>
            <p>Go to the Shop page, choose your product, add it to cart and complete your order details.</p>
          </div>

          <div className="faq-item">
            <h3>How do I track my order?</h3>
            <p>Sign in to your account and open your customer dashboard to view order updates.</p>
          </div>

          <div className="faq-item">
            <h3>Can I cancel an order?</h3>
            <p>Contact us as soon as possible with your order details so our team can assist before delivery is processed.</p>
          </div>

          <div className="faq-item">
            <h3>What is your return policy?</h3>
            <p>Returns are reviewed by our team. Contact us with your order details and reason for return.</p>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default FAQ;
