'use client';

import React, { useState, useEffect } from 'react';

export default function WhatsAppButton() {
  const [phoneNumber, setPhoneNumber] = useState('8801700000000'); // default fallback

  useEffect(() => {
    // Fetch store contact number dynamically from config
    fetch('/api/admin/store-config')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        if (data.storePhone) {
          // Sanitize number: keep only digits (e.g., +880 1700 000000 -> 8801700000000)
          const cleanNum = data.storePhone.replace(/\D/g, '');
          if (cleanNum.length >= 10) {
            setPhoneNumber(cleanNum);
          }
        }
      })
      .catch(() => {
        setPhoneNumber('8801700000000');
      });
  }, []);

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent('Hello Beauty Glowry, I have a query.')}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        width: '52px',
        height: '52px',
        background: '#25D366', // Official WhatsApp green
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        textDecoration: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 211, 102, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.25)';
      }}
    >
      {/* Official WhatsApp SVG Icon */}
      <svg
        viewBox="0 0 24 24"
        width="28"
        height="28"
        fill="#FFFFFF"
      >
        <path d="M12.004 0C5.378 0 .004 5.374.004 12c0 2.112.55 4.17 1.594 5.98L.004 24l6.182-1.622c1.748.953 3.722 1.458 5.818 1.458 6.626 0 12-5.374 12-12S18.63 0 12.004 0zm0 21.84c-1.874 0-3.714-.492-5.334-1.428l-.382-.222-3.666.962.98-3.574-.244-.39c-1.026-1.642-1.57-3.542-1.57-5.518 0-5.74 4.672-10.412 10.412-10.412 5.74 0 10.412 4.672 10.412 10.412 0 5.74-4.672 10.412-10.412 10.412zm5.728-7.854c-.314-.156-1.856-.916-2.144-1.022-.288-.106-.498-.156-.708.156-.21.314-.814 1.022-1 1.232-.186.21-.372.236-.686.08-1.826-.912-3.04-1.508-4.24-3.572-.316-.544.316-.506.906-1.684.1-.208.05-.39-.026-.546-.076-.156-.708-1.704-.97-2.334-.256-.614-.516-.532-.708-.542-.184-.008-.394-.01-.604-.01-.21 0-.55.078-.838.39-.288.314-1.1 1.074-1.1 2.622 0 1.548 1.126 3.044 1.284 3.254.156.21 2.214 3.38 5.366 4.74.75.324 1.336.518 1.792.662.754.24 1.44.206 1.982.126.604-.09 1.856-.758 2.118-1.492.262-.734.262-1.364.184-1.492-.078-.128-.288-.208-.602-.364z"/>
      </svg>
    </a >
  );
}
