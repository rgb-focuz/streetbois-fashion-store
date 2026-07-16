import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import "../styles/contact.css";

function Contact() {
  const [searchParams] = useSearchParams();

  const defaultSettings = {
    store_name: "StreetBois Fashion",
    phone: "0202430406",
    whatsapp: "233202430406",
    email: "apodeijoshuaagudey1@gmail.com",
    address: "Tudu, Accra - Ghana",
    business_hours: "Monday - Saturday, 8:30am - 6:00pm",
    about:
      "StreetBois Fashion is Ghana's premium wholesale destination for fashion, footwear and accessories.",
    google_map: "",
  };

  const [storeSettings, setStoreSettings] = useState(defaultSettings);

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

  const fetchStoreSettings = async () => {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!error && data) {
      setStoreSettings({ ...defaultSettings, ...data });
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const formatWhatsAppLink = (number) => {
    const cleaned = String(number || "")
      .replace(/\D/g, "")
      .replace(/^0/, "233");

    return `https://wa.me/${cleaned || "233202430406"}`;
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
    setFormMessage(`Message sent successfully. ${storeSettings.store_name} will get back to you soon.`);
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setLoading(false);
  };

  const locations = [
    {
      title: "Our Main Location in Tudu, Accra",
      text: "Orange Building, 3rd Floor & Top Floor, Tudu - Accra, Ghana",
    },
    {
      title: "Street Electronics",
      text: "Orange Building, 3rd Floor, Tudu - Accra, Ghana",
    },
    {
      title: "STC Building Branch",
      text: "STC Building, 2nd & 3rd Floor, Tudu - Accra, Ghana",
    },
    {
      title: "Hisense Building Branch",
      text: "Hisense Building, Tudu - Accra, Ghana",
    },
    {
      title: "Wholesale Warehouse",
      text: "Large warehouse serving all StreetBois Fashion branches in Accra.",
    },
    {
      title: "More Branches Coming Soon",
      text: "As StreetBois Fashion grows, more locations will be added.",
    },
  ];

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
            href={formatWhatsAppLink(storeSettings.whatsapp)}
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
        {storeSettings.google_map ? (
          <a href={storeSettings.google_map} target="_blank" rel="noreferrer">
            Open Google Map Location
          </a>
        ) : (
          <div>
            <h2>StreetBois Fashion</h2>
            <p>Tudu, Accra - Ghana</p>
            <span>Google Map Location Coming Soon</span>
          </div>
        )}
      </section>

      <Footer />
    </>
  );
}

export default Contact;
