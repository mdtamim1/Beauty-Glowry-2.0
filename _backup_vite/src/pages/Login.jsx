import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, LogIn, Globe, ArrowRight, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, signInWithGoogle, user: authUser } = useAuth();

  React.useEffect(() => {
    if (authUser) {
      if (authUser.role === 'admin' || authUser.role === 'staff') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [authUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      // Navigation is handled by the useEffect watching authUser
    } catch (err) {
      console.error(err);
      setError('Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card animate-fade">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p>Login to your BEAUTY GLOWRY account</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          {error && <div style={{ color: '#fc8181', marginBottom: '16px', fontSize: '14px', textAlign: 'center', background: '#fff5f5', padding: '10px', borderRadius: '8px', border: '1px solid #feb2b2' }}>{error}</div>}
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

          <div className="input-group">
            <div className="label-row">
              <label>Password</label>
              <Link to="/forgot-password">Forgot?</Link>
            </div>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="remember-me">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember">Keep me logged in</label>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'} <LogIn size={18} />
          </button>
        </form>

        <div className="social-login">
          <p>Or continue with</p>
          <button 
            className="google-btn" 
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
            </svg>
            {loading ? 'Processing...' : 'Login with Google'}
          </button>
        </div>

        <div className="login-footer">
          <p>New to BEAUTY GLOWRY? <Link to="/register">Create account <UserPlus size={16} /></Link></p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .login-page { padding: 80px 0; background: var(--secondary); display: flex; justify-content: center; align-items: center; min-height: 80vh; }
        
        .login-card { background: white; padding: 48px; border-radius: var(--radius-lg); width: 100%; max-width: 480px; box-shadow: 0 40px 100px rgba(0,0,0,0.05); border: 1px solid var(--border); }
        
        .login-header { text-align: center; margin-bottom: 40px; }
        .login-header h2 { font-size: 32px; margin-bottom: 8px; }
        .login-header p { color: var(--text-muted); font-size: 15px; }

        .input-group { margin-bottom: 24px; }
        .input-group label { display: block; font-weight: 700; font-size: 14px; margin-bottom: 12px; }
        
        .input-with-icon { position: relative; }
        .input-with-icon svg:first-child { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .input-with-icon input { padding-left: 48px; height: 56px; border: 1px solid var(--border); border-radius: 12px; width: 100%; font-size: 15px; background: var(--secondary); transition: var(--transition); }
        .input-with-icon input:focus { border-color: var(--primary-dark); background: white; box-shadow: 0 8px 16px rgba(251, 96, 144, 0.05); }

        .eye-btn { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }

        .label-row { display: flex; justify-content: space-between; align-items: center; }
        .label-row a { color: var(--primary-dark); font-size: 13px; font-weight: 700; }

        .remember-me { display: flex; align-items: center; gap: 8px; margin-bottom: 32px; }
        .remember-me label { font-size: 14px; color: var(--text-muted); cursor: pointer; }

        .login-submit { width: 100%; height: 56px; background: var(--primary-dark); color: white; border-radius: 12px; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; transition: var(--transition); }
        .login-submit:hover { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(251, 96, 144, 0.2); }

        .social-login { margin-top: 40px; text-align: center; border-top: 1px solid var(--border); padding-top: 32px; }
        .social-login p { font-size: 13px; color: var(--text-muted); margin-bottom: 20px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        
        .google-btn { width: 100%; height: 56px; border: 2px solid var(--border); border-radius: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 12px; transition: var(--transition); }
        .google-btn:hover { background: #f8f8f8; }

        .login-footer { margin-top: 32px; text-align: center; font-size: 15px; color: var(--text-muted); }
        .login-footer a { color: var(--primary-dark); font-weight: 700; display: inline-flex; align-items: center; gap: 4px; border-bottom: 1px solid transparent; }
        .login-footer a:hover { border-color: var(--primary-dark); }
      ` }} />
    </div>
  );
};

export default Login;
