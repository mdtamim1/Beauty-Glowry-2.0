import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import Login from './pages/Login';
import AdminLogin from './pages/AdminLogin';
import StaffRegister from './pages/StaffRegister';
import Products from './pages/Products';
import Wishlist from './pages/Wishlist';
import Offers from './pages/Offers';
import Blog from './pages/Blog';
import Invoice from './pages/Invoice';
import Register from './pages/Register';
import Account from './pages/Account';
import ForgotPassword from './pages/ForgotPassword';
import OrderSuccess from './pages/OrderSuccess';
import SupportPage from './pages/SupportPage';
import SkinQuiz from './pages/SkinQuiz';
import RoutineBuilder from './pages/RoutineBuilder';
import IngredientGlossary from './pages/IngredientGlossary';

import { useSettings } from './context/SettingsContext';
import ProtectedRoute from './components/ProtectedRoute';

// Scroll to top on every navigation
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App = () => {
  const location = useLocation();
  const { settings } = useSettings();
  const isAdmin = location.pathname.startsWith('/admin') || location.pathname.startsWith('/invoice');

  // Dynamic Title and Favicon
  useEffect(() => {
    const brandTitle = settings.storeName || "BEAUTY GLOWRY";
    document.title = `${brandTitle} | Dermatological Precision Skincare`;
    
    let ogSiteName = document.querySelector("meta[property='og:site_name']");
    if (!ogSiteName) {
      ogSiteName = document.createElement('meta');
      ogSiteName.setAttribute('property', 'og:site_name');
      document.head.appendChild(ogSiteName);
    }
    ogSiteName.content = brandTitle;

    const schemaId = 'website-schema';
    let script = document.getElementById(schemaId);
    if (!script) {
      script = document.createElement('script');
      script.id = schemaId;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": brandTitle,
      "url": window.location.origin
    });

    if (settings.storeFavicon) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = settings.storeFavicon;
    }
  }, [settings.storeName, settings.storeFavicon]);

  return (
    <>
      <ScrollToTop />
      {!isAdmin && <Navbar />}
      <main className={!isAdmin ? "site-content" : "admin-layout"}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/products" element={<Products />} />
          <Route path="/quiz" element={<SkinQuiz />} />
          <Route path="/routine" element={<RoutineBuilder />} />
          <Route path="/glossary" element={<IngredientGlossary />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success/:id" element={<OrderSuccess />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/blog" element={<Blog />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/account" element={
            <ProtectedRoute customerOnly={true}>
              <Account />
            </ProtectedRoute>
          } />
          <Route path="/staff-register" element={<StaffRegister />} />
          <Route path="/for-women" element={<Products />} />
          <Route path="/for-men" element={<Products />} />
          <Route path="/categories/:category" element={<Products />} />
          <Route path="/categories" element={<Products />} />
          
          {/* Support Pages */}
          <Route path="/contact" element={<SupportPage title="Contact Us" type="contact" />} />
          <Route path="/track" element={<SupportPage title="Track Order" type="track" />} />
          <Route path="/shipping" element={<SupportPage title="Shipping Policy" type="shipping" />} />
          <Route path="/returns" element={<SupportPage title="Return & Refund" type="returns" />} />
          <Route path="/faq" element={<SupportPage title="FAQs" type="faq" />} />
          <Route path="/privacy-policy" element={<SupportPage title="Privacy Policy" type="privacy" />} />
          <Route path="/terms-of-service" element={<SupportPage title="Terms of Service" type="terms" />} />
          
          <Route path="/invoice/:id" element={
            <ProtectedRoute adminOnly={true}>
              <Invoice />
            </ProtectedRoute>
          } />

          <Route path="/admin/*" element={
            <ProtectedRoute adminOnly={true}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<div className="container" style={{padding:'100px 0', textAlign: 'center'}}>404 Page Not Found</div>} />
        </Routes>
      </main>
      {!isAdmin && <Footer />}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .site-content { min-height: 80vh; }
        .admin-layout { height: 100vh; overflow: hidden; }
        .loading-spinner { display: flex; justify-content: center; align-items: center; height: 100vh; font-size: 1.5rem; color: var(--titrate-teal); }
      ` }} />
    </>
  );
};

export default App;
