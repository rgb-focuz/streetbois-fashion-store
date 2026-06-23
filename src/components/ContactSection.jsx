import "../styles/home.css";

function ContactSection() {
  return (
    <section className="contact-section">
      <div>
        <span>Contact Us</span>
        <h2>Let's Connect</h2>
        <p>
          Looking to explore our latest fashion collections, wholesale
          opportunities, or partnership options? Send us a message.
        </p>
      </div>

      <form>
        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="Email Address" />
        <textarea placeholder="Your Message"></textarea>
        <button type="submit">Send Message</button>
      </form>
    </section>
  );
}

export default ContactSection;