import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await resetPassword(email);
      setMessage('Password reset link sent to your email. Check your inbox and spam folder.');
    } catch (err) {
      console.error(err);
      setError('Failed to send reset link. Please check the email address provided.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade">
        <div className="login-header">
           <Link to="/login" className="back-link">
             <ArrowLeft size={16} /> Back to login
           </Link>
          <h2>Forgot Password?</h2>
          <p>Don't worry, it happens. Enter your email to reset your password.</p>
        </div>

        {message ? (
          <div className="success-container animate-fade">
            <CheckCircle size={48} />
            <h3>Link Sent!</h3>
            <p>{message}</p>
            <Link to="/login" className="login-submit">Go to Login</Link>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="error-alert">{error}</div>}
            
            <div className="input-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input 
                  type="email" 
                  placeholder="name@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? 'Sending link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="login-footer">
          <p>Need help? <Link to="/contact">Contact Support</Link></p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-page { padding: 80px 0; background: var(--secondary); display: flex; justify-content: center; align-items: center; min-height: 80vh; }
        .login-card { background: white; padding: 48px; border-radius: var(--radius-lg); width: 100%; max-width: 480px; box-shadow: 0 40px 100px rgba(0,0,0,0.05); border: 1px solid var(--border); }
        .login-header { text-align: center; margin-bottom: 32px; position: relative; }
        .login-header h2 { font-size: 30px; margin-bottom: 8px; margin-top: 10px; }
        .login-header p { color: var(--text-muted); font-size: 15px; }
        
        .back-link { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 700; color: var(--text-muted); margin-bottom: 20px; transition: var(--transition); }
        .back-link:hover { color: var(--primary-dark); }

        .input-group { margin-bottom: 24px; }
        .input-group label { display: block; font-weight: 700; font-size: 14px; margin-bottom: 12px; text-align: left; }
        .input-with-icon { position: relative; }
        .input-with-icon svg:first-child { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .input-with-icon input { padding-left: 48px; height: 56px; border: 1px solid var(--border); border-radius: 12px; width: 100%; font-size: 15px; background: var(--secondary); transition: var(--transition); }
        .input-with-icon input:focus { border-color: var(--primary-dark); background: white; }

        .login-submit { width: 100%; height: 56px; background: var(--primary-dark); color: white; border-radius: 12px; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; transition: var(--transition); text-decoration: none; }
        .login-submit:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(251, 96, 144, 0.2); }

        .success-container { text-align: center; padding: 20px 0; }
        .success-container svg { color: #48bb78; margin-bottom: 20px; }
        .success-container h3 { font-size: 24px; margin-bottom: 12px; }
        .success-container p { color: var(--text-muted); margin-bottom: 30px; line-height: 1.6; }

        .error-alert { color: #fc8181; marginBottom: 20px; fontSize: 14px; textAlign: center; background: #fff5f5; padding: 12px; borderRadius: 8px; border: 1px solid #feb2b2; }
        .login-footer { margin-top: 32px; text-align: center; font-size: 15px; color: var(--text-muted); }
        .login-footer a { color: var(--primary-dark); font-weight: 700; }
      ` }} />
    </div>
  );
};

export default ForgotPassword;
