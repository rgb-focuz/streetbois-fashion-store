import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HomeCategories from "../components/HomeCategories";
import FeaturedProducts from "../components/FeaturedProducts";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";

function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <HomeCategories />

      <FeaturedProducts />

      <ContactSection />

      <Footer />

      <WhatsAppButton />
    </>
  );
}

export default Home;