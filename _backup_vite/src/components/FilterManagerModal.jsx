import React, { useState } from 'react';
import { X, Plus, Trash2, Filter, ChevronDown, ChevronRight, Save } from 'lucide-react';
import { useProducts } from '../context/ProductContext';

const FilterManagerModal = ({ isOpen, onClose }) => {
  const { filters, addFilterGroup, updateFilterGroup, deleteFilterGroup } = useProducts();
  const [newGroupName, setNewGroupName] = useState('');
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [newOptionName, setNewOptionName] = useState('');

  if (!isOpen) return null;

  const handleAddGroup = (e) => {
    e.preventDefault();
    if (newGroupName.trim()) {
      addFilterGroup(newGroupName.trim());
      setNewGroupName('');
    }
  };

  const handleAddOption = (group) => {
    if (newOptionName.trim()) {
      const updatedOptions = [...group.options, newOptionName.trim()];
      updateFilterGroup(group.firestoreId, { options: updatedOptions });
      setNewOptionName('');
    }
  };

  const handleRemoveOption = (group, optionIndex) => {
    const updatedOptions = group.options.filter((_, i) => i !== optionIndex);
    updateFilterGroup(group.firestoreId, { options: updatedOptions });
  };

  const handleDeleteGroup = (group) => {
    if (window.confirm(`Are you sure you want to delete the filter group "${group.name}"? This will remove it from all products.`)) {
      deleteFilterGroup(group.firestoreId);
    }
  };

  return (
    <div className="admin-modal-overlay" style={{ zIndex: 10000 }}>
      <style>{`
        .filter-manager-modal {
          width: 95%;
          max-width: 600px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .filter-modal-header {
          padding: 20px 24px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .filter-modal-header h2 {
          font-size: 1.25rem;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }
        .filter-modal-content {
          padding: 24px;
          overflow-y: auto;
        }
        .add-group-form {
          margin-bottom: 24px;
          display: flex;
          gap: 12px;
        }
        .filter-input {
          flex: 1;
          padding: 10px 14px;
          border: 1px solid #cbd5e0;
          border-radius: 8px;
          font-size: 14px;
        }
        .filter-input:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
          outline: none;
        }
        .filter-groups-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .filter-group-item {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s;
        }
        .filter-group-header {
          padding: 14px 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          background: white;
        }
        .filter-group-header:hover {
          background: #f8fafc;
        }
        .filter-group-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
          color: #334155;
        }
        .filter-group-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .action-btn {
          padding: 6px;
          border-radius: 6px;
          color: #64748b;
          transition: all 0.2s;
        }
        .action-btn:hover {
          background: #f1f5f9;
        }
        .action-btn.delete:hover {
          color: #ef4444;
          background: #fee2e2;
        }
        .filter-group-details {
          padding: 16px;
          background: #f8fafc;
          border-top: 1px solid #e2e8f0;
        }
        .options-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 16px;
        }
        .option-pill {
          background: white;
          border: 1px solid #e2e8f0;
          padding: 6px 12px;
          border-radius: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #475569;
        }
        .remove-option {
          color: #94a3b8;
          cursor: pointer;
        }
        .remove-option:hover {
          color: #ef4444;
        }
        .add-option-row {
          display: flex;
          gap: 8px;
        }
      `}</style>

      <div className="filter-manager-modal" onClick={e => e.stopPropagation()}>
        <div className="filter-modal-header">
          <h2><Filter size={20} /> Manage Product Filters</h2>
          <button onClick={onClose} className="action-btn"><X size={20} /></button>
        </div>

        <div className="filter-modal-content">
          <form className="add-group-form" onSubmit={handleAddGroup}>
            <input 
              type="text" 
              className="filter-input"
              placeholder="E.g. Skin Concern, Product Type..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px' }}>
              <Plus size={18} /> Add Group
            </button>
          </form>

          <div className="filter-groups-list">
            {filters.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <p>No filter groups yet. Create one above.</p>
              </div>
            ) : (
              filters.map(group => (
                <div key={group.firestoreId} className="filter-group-item">
                  <div className="filter-group-header" onClick={() => setExpandedGroup(expandedGroup === group.firestoreId ? null : group.firestoreId)}>
                    <div className="filter-group-title">
                      {expandedGroup === group.firestoreId ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      <span>{group.name}</span>
                      <span style={{ fontSize: '11px', background: '#e2e8f0', padding: '2px 8px', borderRadius: '10px', color: '#64748b' }}>
                        {group.options.length} options
                      </span>
                    </div>
                    <div className="filter-group-actions">
                      <button 
                        className="action-btn delete"
                        onClick={(e) => { e.stopPropagation(); handleDeleteGroup(group); }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {expandedGroup === group.firestoreId && (
                    <div className="filter-group-details">
                      <div className="options-grid">
                        {group.options.length === 0 ? (
                          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 10px 0' }}>No options added yet.</p>
                        ) : (
                          group.options.map((option, idx) => (
                            <div key={idx} className="option-pill">
                              <span>{option}</span>
                              <X size={14} className="remove-option" onClick={() => handleRemoveOption(group, idx)} />
                            </div>
                          ))
                        )}
                      </div>
                      <div className="add-option-row">
                        <input 
                          type="text" 
                          className="filter-input"
                          style={{ fontSize: '13px', padding: '8px 12px' }}
                          placeholder="Add sub-filter (e.g. Acne)..."
                          value={newOptionName}
                          onChange={(e) => setNewOptionName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleAddOption(group)}
                        />
                        <button 
                          className="btn btn-secondary"
                          style={{ padding: '0 12px', fontSize: '13px', border: '1px solid #e2e8f0' }}
                          onClick={() => handleAddOption(group)}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilterManagerModal;
