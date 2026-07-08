import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Collections from "../components/Collections";
import FeaturedProducts from "../components/FeaturedProducts";
import Footer from "../components/Footer";
import WhatsAppButton from "../components/WhatsAppButton";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Collections />
      <FeaturedProducts />
      <Footer />
      <WhatsAppButton />
    </>
  );
}

export default Home;