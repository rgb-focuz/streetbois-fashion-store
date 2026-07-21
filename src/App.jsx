import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const RecentlyViewed = lazy(() => import("./pages/RecentlyViewed"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Cart = lazy(() => import("./pages/Cart"));
const Account = lazy(() => import("./pages/Account"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const CustomerDashboard = lazy(() => import("./pages/CustomerDashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const AdminResetPassword = lazy(() => import("./pages/AdminResetPassword"));
const RiderTracking = lazy(() => import("./pages/RiderTracking"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/recently-viewed" element={<RecentlyViewed />} />
          <Route path="/account" element={<Account />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/customer-dashboard" element={<CustomerDashboard />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-reset-password" element={<AdminResetPassword />} />
          <Route path="/rider-tracking/:orderId/:token" element={<RiderTracking />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
