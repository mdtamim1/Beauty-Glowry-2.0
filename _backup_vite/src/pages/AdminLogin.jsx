import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect straight to Admin Dashboard without password
    navigate('/admin', { replace: true });
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '100px 20px', fontSize: '18px', color: 'var(--dark-text)' }}>
      Redirecting to Admin Control Panel...
    </div>
  );
};

export default AdminLogin;
