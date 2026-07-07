import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "../styles/customerDashboard.css";

function CustomerDashboard() {
  return (
    <>
      <Navbar />

      <section className="customer-dashboard empty-customer-page"></section>

      <Footer />
    </>
  );
}

export default CustomerDashboard;