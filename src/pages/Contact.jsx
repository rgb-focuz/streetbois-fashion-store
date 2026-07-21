import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import {
  defaultStoreSettings,
  fetchStoreSettings as loadStoreSettings,
  getWhatsAppLink,
} from "../utils/storeSettings";
import "../styles/contact.css";

function Contact() {
  const [searchParams] = useSearchParams();

  const [storeSettings, setStoreSettings] = useState(defaultStoreSettings);

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

  async function fetchStoreSettings() {
    const settings = await loadStoreSettings();
    setStoreSettings(settings);
  }

  useEffect(() => {
    fetchStoreSettings();
  }, []);

  useEffect(() => {
    const subject = searchParams.get("subject");
    const message = searchParams.get("message");

    if (!subject && !message) return;

    setFormData((current) => ({
      ...current,
      subject: subject || current.subject,
      message: message || current.message,
    }));
  }, [searchParams]);

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
      console.error("Contact message failed:", error);
      setFormStatus("error");
      setFormMessage("Message could not be sent. Please try again.");
      setLoading(false);
      return;
    }

    setFormStatus("success");
    setFormMessage(`Message sent successfully. ${storeSettings.store_name} will get back to you soon.`);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setLoading(false);
  };

  const locations = [
    {
      title: storeSettings.location_name || "Main Location",
      text: storeSettings.address || defaultStoreSettings.address,
    },
    {
      title: "Business Hours",
      text: storeSettings.business_hours || defaultStoreSettings.business_hours,
    },
    {
      title: "Delivery Coverage",
      text: storeSettings.delivery_note || defaultStoreSettings.delivery_note,
    },
  ];

  const shopBranches = Array.isArray(storeSettings.shop_locations)
    ? storeSettings.shop_locations.filter(
        (shop) => shop?.name || shop?.area || shop?.address
      )
    : [];

  const mapQuery = encodeURIComponent(
    `${storeSettings.location_name || ""} ${
      storeSettings.address || defaultStoreSettings.address
    }`.trim()
  );
  const mapEmbedUrl = `https://www.google.com/maps?q=${mapQuery}&output=embed`;
  const mapLink =
    storeSettings.google_map ||
    `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

  return (
    <>
      <Navbar />

      <section className="contact-hero">
        <div className="contact-hero-overlay">
          <span>Contact Us</span>
          <h1>Explore Our Locations</h1>
          <p>
            Reach StreetBois Fashion for wholesale enquiries, orders,
            delivery support and product availability.
          </p>
        </div>
      </section>

      <section className="contact-locations-section">
        <span className="contact-small-title">How to Contact Us</span>
        <h2>Rooted in Accra, serving everywhere</h2>
        <p className="contact-intro">
          Great fashion happens when quality products meet trusted service.
          Here is where StreetBois Fashion connects with customers, retailers,
          resellers and fashion lovers.
        </p>

        <div className="locations-grid">
          {locations.map((item, index) => (
            <div className="location-item" key={index}>
              <h3>→ {item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        {shopBranches.length > 0 && (
          <div className="shop-branches-section">
            <div className="shop-branches-header">
              <span className="contact-small-title">Our Branches</span>
              <h2>Visit any StreetBois shop near you</h2>
            </div>

            <div className="shop-branches-grid">
              {shopBranches.map((shop, index) => (
                <article className="shop-branch-card" key={shop.id || index}>
                  <div>
                    <h3>{shop.name || `Shop ${index + 1}`}</h3>
                    {shop.category && <span>{shop.category}</span>}
                  </div>

                  {shop.area && (
                    <p>
                      <strong>Area:</strong> {shop.area}
                    </p>
                  )}
                  {shop.address && (
                    <p>
                      <strong>Address:</strong> {shop.address}
                    </p>
                  )}
                  {shop.phone && (
                    <p>
                      <strong>Phone:</strong> {shop.phone}
                    </p>
                  )}
                  {shop.email && (
                    <p>
                      <strong>Email:</strong> {shop.email}
                    </p>
                  )}
                  {shop.business_hours && (
                    <p>
                      <strong>Hours:</strong> {shop.business_hours}
                    </p>
                  )}

                  <div className="shop-branch-actions">
                    {shop.whatsapp && (
                      <a
                        href={getWhatsAppLink(shop.whatsapp)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        WhatsApp
                      </a>
                    )}
                    {shop.google_map && (
                      <a href={shop.google_map} target="_blank" rel="noreferrer">
                        Google Maps
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="contact-main-section">
        <div className="contact-info-panel">
          <h2>Get In Touch</h2>

          <div className="info-card">
            <strong>Phone / WhatsApp</strong>
            <p>{storeSettings.phone}</p>
          </div>

          <div className="info-card">
            <strong>Email Address</strong>
            <p>{storeSettings.email}</p>
          </div>

          <div className="info-card">
            <strong>Main Location</strong>
            <p>{storeSettings.address}</p>
          </div>

          <div className="info-card">
            <strong>Business Hours</strong>
            <p>{storeSettings.business_hours}</p>
          </div>

          <a
            href={getWhatsAppLink(storeSettings.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="contact-whatsapp"
          >
            Chat on WhatsApp
          </a>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <h2>Send Us a Message</h2>

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
            <div className={`contact-alert ${formStatus}`}>{formMessage}</div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>

      <section className="contact-map-section">
        <div className="contact-map-shell">
          <div className="contact-map-copy">
            <span>Store Location</span>
            <h2>{storeSettings.store_name || "StreetBois Fashion"}</h2>
            <p>{storeSettings.address || defaultStoreSettings.address}</p>
            <a href={mapLink} target="_blank" rel="noreferrer">
              Open in Google Maps
            </a>
          </div>

          <div className="contact-map-frame" aria-label="StreetBois Fashion map">
            <iframe
              title="StreetBois Fashion Google Map"
              src={mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Contact;
