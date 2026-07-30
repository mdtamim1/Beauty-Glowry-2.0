import React from 'react';
import { AuthProvider } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { ProductProvider } from './context/ProductContext';
import { OrderProvider } from './context/OrderContext';
import { CartProvider } from './context/CartContext';

const AllProviders = ({ children }) => {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ProductProvider>
          <OrderProvider>
            <CartProvider>
              {children}
            </CartProvider>
          </OrderProvider>
        </ProductProvider>
      </SettingsProvider>
    </AuthProvider>
  );
};

export default AllProviders;
