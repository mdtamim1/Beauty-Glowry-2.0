import { create } from 'zustand';

export interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  link: string;
  isVideo?: boolean;
}

export interface HomepageSectionConfig {
  id: string;
  type: 'hero_slider' | 'categories' | 'featured' | 'bestsellers' | 'new_arrivals' | 'quiz_cta' | 'testimonials' | 'instagram' | 'countdown';
  title: string;
  is_active: boolean;
  position: number;
  config?: any;
}

interface SettingsState {
  heroSlides: HeroSlide[];
  sections: HomepageSectionConfig[];
  flashSaleEnd: string | null; // ISO Date String
  newsletterActive: boolean;
  setHeroSlides: (slides: HeroSlide[]) => void;
  setSections: (sections: HomepageSectionConfig[]) => void;
  setFlashSale: (endDate: string | null) => void;
  setNewsletterActive: (active: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  heroSlides: [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=2000&auto=format&fit=crop',
      title: 'Precision Clinical Skincare',
      subtitle: 'Dermatological formulations engineered with active concentrations targeting barrier repair.',
      link: '/products',
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=2000&auto=format&fit=crop',
      title: '100% Formulation Transparency',
      subtitle: 'Declaring every active percentage directly on our label for honest skin results.',
      link: '/products',
    }
  ],
  sections: [
    { id: 'sec_1', type: 'hero_slider', title: 'Main Banner', is_active: true, position: 1 },
    { id: 'sec_2', type: 'categories', title: 'Shop By Concern', is_active: true, position: 2 },
    { id: 'sec_3', type: 'countdown', title: 'Exclusive Flash Sale', is_active: true, position: 3 },
    { id: 'sec_4', type: 'bestsellers', title: 'Bestselling Formulations', is_active: true, position: 4 },
    { id: 'sec_5', type: 'quiz_cta', title: 'Dermatological Assessment', is_active: true, position: 5 },
    { id: 'sec_6', type: 'new_arrivals', title: 'New Arrivals', is_active: true, position: 6 },
    { id: 'sec_7', type: 'testimonials', title: 'Clinical Proof & Reviews', is_active: true, position: 7 },
  ],
  flashSaleEnd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48 hours from now
  newsletterActive: true,
  setHeroSlides: (slides) => set({ heroSlides: slides }),
  setSections: (sections) => set({ sections: sections }),
  setFlashSale: (endDate) => set({ flashSaleEnd: endDate }),
  setNewsletterActive: (active) => set({ newsletterActive: active }),
}));
