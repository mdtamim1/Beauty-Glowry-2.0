import React from 'react';
import { useSettings } from '../context/SettingsContext';

const SupportPage = ({ title, type }) => {
  const { settings } = useSettings();

  const getContent = () => {
    switch (type) {
      case 'contact': return settings.contactContent;
      case 'track': return settings.trackContent;
      case 'shipping': return settings.shippingContent;
      case 'returns': return settings.returnsContent;
      case 'faq': return settings.faqContent;
      case 'privacy': return settings.privacyContent;
      case 'terms': return settings.termsContent;
      default: return '';
    }
  };

  const content = getContent();

  return (
    <div className="support-page container">
      <div className="support-header">
        <h1>{title}</h1>
        <div className="title-underline"></div>
      </div>
      
      <div className="support-content-card">
        {content ? (
          <div className="content-rendered">
            {content.split('\n').map((line, index) => (
              <React.Fragment key={index}>
                {line}
                <br />
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="empty-content">
            <p>Content is currently being updated. Please check back later.</p>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .support-page {
          padding: 80px 20px;
          min-height: 70vh;
          max-width: 900px !important;
          margin: 0 auto;
        }

        .support-header {
          text-align: center;
          margin-bottom: 50px;
        }

        .support-header h1 {
          font-size: 42px;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 16px;
        }

        .title-underline {
          width: 80px;
          height: 4px;
          background: var(--primary-dark);
          margin: 0 auto;
          border-radius: 2px;
        }

        .support-content-card {
          background: white;
          padding: 50px;
          border-radius: 24px;
          border: 1px solid var(--border);
          box-shadow: 0 10px 30px rgba(0,0,0,0.03);
        }

        .content-rendered {
          font-size: 17px;
          line-height: 1.8;
          color: var(--text-main);
          white-space: pre-wrap;
          font-family: 'Inter', sans-serif;
        }

        .empty-content {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .support-page { padding: 40px 16px; }
          .support-header h1 { font-size: 32px; }
          .support-content-card { padding: 30px 20px; }
        }
      ` }} />
    </div>
  );
};

export default SupportPage;
