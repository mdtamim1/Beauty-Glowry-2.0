import React, { useMemo } from 'react';
import { Clock, CheckCircle, ShoppingCart, Truck, AlertCircle } from 'lucide-react';

const OrderHistoryTimeline = ({ orderHistory = [], currentStatus = 'Processing', onStatusSuggest }) => {
  const statusFlow = [
    { id: 'Pending', label: 'Pending', icon: AlertCircle, color: '#f59e0b' },
    { id: 'Confirmed', label: 'Confirmed', icon: CheckCircle, color: '#3b82f6' },
    { id: 'Processing', label: 'Processing', icon: ShoppingCart, color: '#8b5cf6' },
    { id: 'Shipped', label: 'Shipped', icon: Truck, color: '#06b6d4' },
    { id: 'Delivered', label: 'Delivered', icon: CheckCircle, color: '#10b981' }
  ];

  const suggestedNextStatus = useMemo(() => {
    const currentIndex = statusFlow.findIndex(s => s.id === currentStatus);
    if (currentIndex === -1 || currentIndex === statusFlow.length - 1) return null;
    return statusFlow[currentIndex + 1];
  }, [currentStatus]);

  // Sort and limit history to last 5 items
  const displayHistory = useMemo(() => {
    if (!Array.isArray(orderHistory)) return [];
    return [...orderHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);
  }, [orderHistory]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const StatusIcon = suggestedNextStatus?.icon || CheckCircle;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .order-history-card {
          background: white;
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
        }

        .history-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          padding-bottom: 10px;
          border-bottom: 2px solid #f0f4f8;
        }

        .history-header-title {
          font-size: 12px;
          font-weight: 700;
          color: #1a365d;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          flex: 1;
        }

        .history-header-count {
          font-size: 11px;
          background: #e0ebf5;
          color: #1a365d;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 600;
        }

        .history-timeline {
          position: relative;
          padding-left: 24px;
        }

        .history-timeline::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 24px;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, #1a365d, #cbd5e0, transparent);
        }

        .history-item {
          position: relative;
          margin-bottom: 12px;
          padding-bottom: 12px;
        }

        .history-item:last-child {
          margin-bottom: 0;
          padding-bottom: 0;
        }

        .history-item::before {
          content: '';
          position: absolute;
          left: -20px;
          top: 4px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 0 0 2px #3b82f6;
        }

        .history-item.current::before {
          background: #10b981;
          box-shadow: 0 0 0 2px #10b981, 0 0 6px rgba(16, 185, 129, 0.3);
        }

        .history-content {
          font-size: 11px;
        }

        .history-status {
          font-weight: 700;
          color: #1a365d;
          margin-bottom: 2px;
        }

        .history-date {
          font-size: 10px;
          color: #718096;
        }

        .suggested-status-box {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border: 2px solid #10b981;
          border-radius: 8px;
          padding: 10px;
          margin-top: 12px;
        }

        .suggested-label {
          font-size: 10px;
          font-weight: 700;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 4px;
        }

        .suggested-status-content {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 6px;
          border-radius: 4px;
        }

        .suggested-status-content:hover {
          background: rgba(16, 185, 129, 0.1);
        }

        .suggested-icon {
          width: 18px;
          height: 18px;
          color: #10b981;
          flex-shrink: 0;
        }

        .suggested-text {
          flex: 1;
          font-size: 12px;
          font-weight: 600;
          color: #047857;
        }

        .suggested-arrow {
          font-size: 12px;
          color: #10b981;
        }

        .empty-history {
          text-align: center;
          padding: 12px;
          color: #a0aec0;
          font-size: 11px;
          font-style: italic;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f0f4f8;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
        }
      ` }} />

      <div className="order-history-card">
        <div className="history-header">
          <div className="history-header-title">
            <Clock size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'text-bottom' }} />
            Order History
          </div>
          <div className="history-header-count">{displayHistory.length} events</div>
        </div>

        {displayHistory.length > 0 ? (
          <div className="history-timeline">
            {displayHistory.map((item, index) => (
              <div key={index} className={`history-item ${item.status === currentStatus ? 'current' : ''}`}>
                <div className="history-content">
                  <div className="history-status">{item.status}</div>
                  <div className="history-date">{formatDate(item.date)}</div>
                  {item.note && (
                    <div style={{ fontSize: '10px', color: '#4a5568', marginTop: '2px', fontStyle: 'italic' }}>
                      {item.note}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-history">No history available</div>
        )}

        {suggestedNextStatus && (
          <div className="suggested-status-box">
            <div className="suggested-label">💡 Suggested Next Status</div>
            <div 
              className="suggested-status-content"
              onClick={() => onStatusSuggest && onStatusSuggest(suggestedNextStatus.id)}
              title="Click to update status"
            >
              <StatusIcon className="suggested-icon" />
              <span className="suggested-text">{suggestedNextStatus.label}</span>
              <span className="suggested-arrow">→</span>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
