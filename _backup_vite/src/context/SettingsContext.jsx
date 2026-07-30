import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/config';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    announcements: [],
    announcement: '',
    showAnnouncement: false,
    flashSaleTitle: 'Seasonal Sale',
    flashSaleEndsAt: '',
    showFlashSale: false,
    storeName: 'BeautyGlowry',
    storePhone: '',
    storeEmail: '',
    currency: '৳',
    deliveryDhaka: '60',
    deliveryOutside: '130',
    freeShippingThreshold: '1500',
    storeAddress: '',
    storeTagline: '',
    facebook: '',
    instagram: '',
    tiktok: '',
    storeLogo: '',
    storeFavicon: '',
    contactLink: '/contact',
    trackLink: '/track',
    shippingLink: '/shipping',
    returnsLink: '/returns',
    faqLink: '/faq',
    privacyLink: '/privacy-policy',
    termsLink: '/terms-of-service',
    contactContent: '',
    trackContent: '',
    shippingContent: '',
    returnsContent: '',
    faqContent: '',
    privacyContent: '',
    termsContent: '',
    coupons: []
  });

  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.from('cms').select('*');
      if (error) throw error;

      if (data) {
        let mergedSettings = {};
        data.forEach(row => {
          if (row.data && typeof row.data === 'object') {
            mergedSettings = { ...mergedSettings, ...row.data };
          }
        });
        setSettings(prev => ({ ...prev, ...mergedSettings }));
      }
    } catch (err) {
      console.warn("PostgreSQL CMS settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    let channel;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel('cms-channel')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'cms' }, () => fetchSettings())
        .subscribe();
    }

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const updateSettings = async (newSettings, category = 'marketing') => {
    const cleanSettings = Object.fromEntries(
      Object.entries(newSettings).filter(([_, v]) => v !== undefined)
    );

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('cms').upsert({
          id: category,
          data: cleanSettings,
          updated_at: new Date().toISOString()
        });

        if (error) throw error;
        await fetchSettings();
      } catch (error) {
        console.error(`Error updating ${category} settings in PostgreSQL:`, error);
        throw error;
      }
    } else {
      setSettings(prev => ({ ...prev, ...cleanSettings }));
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
