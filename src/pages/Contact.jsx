import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import "../styles/contact.css";

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);
  const [formMessage, setFormMessage] = useState("");
  const [formStatus, setFormStatus] = useState("");

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormMessage("");
    setFormStatus("");

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setFormStatus("error");
      setFormMessage("Please fill your name, email, subject and message.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("contact_messages").insert({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      is_read: false,
    });

    if (error) {
      setFormStatus("error");
      setFormMessage(error.message || "Message could not be sent. Please try again.");
      setLoading(false);
      return;
    }

    setFormStatus("success");
    setFormMessage("Message sent successfully. StreetBois Fashion will get back to you soon.");
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setLoading(false);
  };

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
              rel="noreferrer"
              className="contact-whatsapp"
            >
              Chat on WhatsApp
            </a>
          </div>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />

            <input
              type="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />

            <input
              type="tel"
              placeholder="Phone Number / WhatsApp (optional)"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />

            <input
              type="text"
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
            />

            <textarea
              placeholder="Your Message"
              value={formData.message}
              onChange={(e) => handleChange("message", e.target.value)}
            ></textarea>

            {formMessage && (
              <div className={`contact-alert ${formStatus}`}>
                {formMessage}
              </div>
            )}

            <button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Send Message"}
            </button>
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
