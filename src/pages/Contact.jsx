import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../supabaseClient";
import "../styles/contact.css";

function Contact() {
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
    setFormMessage(
      `Message sent successfully. ${storeSettings.store_name} will get back to you soon.`
    );
    setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    setLoading(false);
  };

  return (
    <>
      <Navbar />

      <section className="contact-page">
        <div className="contact-header">
          <h1>Contact {storeSettings.store_name}</h1>
          <p>{storeSettings.about}</p>
        </div>

        <div className="contact-grid">
          <div className="contact-info">
            <h2>Get In Touch</h2>
            <p>
              <strong>Phone / WhatsApp:</strong> {storeSettings.phone}
            </p>
            <p>
              <strong>Email:</strong> {storeSettings.email}
            </p>
            <p>
              <strong>Location:</strong> {storeSettings.address}
            </p>
            <p>
              <strong>Working Hours:</strong> {storeSettings.business_hours}
            </p>

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
        </div>

        <div className="map-box">
          {storeSettings.google_map ? (
            <a href={storeSettings.google_map} target="_blank" rel="noreferrer">
              Open Google Map Location
            </a>
          ) : (
            "Google Map Location Coming Soon"
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Contact;
