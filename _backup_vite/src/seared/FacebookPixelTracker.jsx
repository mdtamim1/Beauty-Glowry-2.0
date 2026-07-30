import { useEffect, useRef } from "react";
import { useLocation } from "react-router";

const FacebookPixelTracker = () => {
  const location = useLocation();
  const pixelId = import.meta.env.VITE_FB_PIXEL_ID;
  const pageStartTime = useRef(Date.now());
  const scrollTracked = useRef(false);

  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;
    if (window.fbq) return;

    ((f, b, e, v, n, t, s) => {
      if (f.fbq) return;
      n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      };
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      t = b.createElement(e);
      t.async = true;
      t.src = v;
      s = b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t, s);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");

    // Disable automatic tracking of button clicks and other interactions to prevent false positives
    window.fbq('set', 'autoConfig', false, pixelId);
    window.fbq("init", pixelId);
  }, [pixelId]);

  useEffect(() => {
    if (!pixelId || typeof window === "undefined" || !window.fbq) return;
    window.fbq("track", "PageView");
    pageStartTime.current = Date.now();
    scrollTracked.current = false;
  }, [location.pathname, location.search, pixelId]);

  useEffect(() => {
    if (!pixelId || typeof window === "undefined" || !window.fbq) return;

    const handleScroll = () => {
      if (scrollTracked.current) return;

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollTop + windowHeight >= documentHeight * 0.5) { // 50% scroll
        window.fbq("track", "PageScroll", { scroll_depth: 50 });
        scrollTracked.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pixelId]);

  useEffect(() => {
    if (!pixelId || typeof window === "undefined" || !window.fbq) return;

    const handleBeforeUnload = () => {
      const timeSpent = Math.floor((Date.now() - pageStartTime.current) / 1000);
      window.fbq("track", "TimeOnPage", { time_spent: timeSpent });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [pixelId]);

  // Expose tracking functions globally or via context if needed
  useEffect(() => {
    window.trackPurchase = (value, currency = 'USD') => {
      const numericValue = Number(value);
      if (!isNaN(numericValue) && numericValue > 0) {
        window.fbq("track", "Purchase", { value: numericValue, currency });
      } else {
        console.warn("Facebook Pixel: Invalid Purchase value", value);
      }
    };

    window.trackViewContent = (contentName, contentCategory) => {
      window.fbq("track", "ViewContent", { content_name: contentName, content_category: contentCategory });
    };

    window.trackAddToCart = (contentName, value, currency = 'BDT') => {
      const numericValue = Number(value);
      if (!isNaN(numericValue) && numericValue > 0) {
        window.fbq("track", "AddToCart", { content_name: contentName, value: numericValue, currency });
      } else {
        window.fbq("track", "AddToCart", { content_name: contentName });
      }
    };

    window.trackInitiateCheckout = (value, currency = 'BDT') => {
      const numericValue = Number(value);
      if (!isNaN(numericValue) && numericValue > 0) {
        window.fbq("track", "InitiateCheckout", { value: numericValue, currency });
      } else {
        window.fbq("track", "InitiateCheckout");
      }
    };

    return () => {
      delete window.trackPurchase;
      delete window.trackViewContent;
      delete window.trackAddToCart;
      delete window.trackInitiateCheckout;
    };
  }, []);

  return null;
};

export default FacebookPixelTracker;
