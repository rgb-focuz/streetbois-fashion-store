import { lazy, Suspense } from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import HomeCategories from "../components/HomeCategories";

const FeaturedProducts = lazy(() => import("../components/FeaturedProducts"));
const ContactSection = lazy(() => import("../components/ContactSection"));
const Footer = lazy(() => import("../components/Footer"));
const WhatsAppButton = lazy(() => import("../components/WhatsAppButton"));

function Home() {
  return (
    <>
      <Navbar />

      <Hero />

      <HomeCategories />

      <Suspense fallback={null}>
        <FeaturedProducts />

        <ContactSection />

        <Footer />

        <WhatsAppButton />
      </Suspense>
    </>
  );
}

export default Home;
