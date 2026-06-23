import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import SearchSection from "../components/SearchSection";
import Collections from "../components/Collections";
import FeaturedProducts from "../components/FeaturedProducts";
import Stats from "../components/Stats";
import ContactSection from "../components/ContactSection";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <SearchSection />
      <Collections />
      <Stats />
      <FeaturedProducts />
      <ContactSection />
      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default Home;