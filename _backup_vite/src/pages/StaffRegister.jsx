import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, UserPlus, LogIn, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../supabase/config';

const StaffRegister = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const [invitationValid, setInvitationValid] = useState(false);
  const [invitedRole, setInvitedRole] = useState('staff');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    const verifyInvitation = async () => {
      if (!email) {
        setError('No invitation email found in link.');
        setIsVerifying(false);
        return;
      }

      if (!isSupabaseConfigured) {
        setInvitationValid(true);
        setIsVerifying(false);
        return;
      }

      try {
        const { data: invite } = await supabase
          .from('invites')
          .select('role')
          .eq('email', email)
          .single();

        if (invite) {
          setInvitedRole(invite.role || 'staff');
          setInvitationValid(true);
        } else {
          setError('This invitation is invalid or has already been used.');
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError('Failed to verify invitation.');
      } finally {
        setIsVerifying(false);
      }
    };

    verifyInvitation();
  }, [email]);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!invitationValid) return;
    setError('');
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await register(email, password, { 
        name, 
        role: invitedRole 
      });

      if (isSupabaseConfigured) {
        try {
          await supabase.from('invites').delete().eq('email', email);
        } catch (e) {
          console.warn("Invite cleanup error", e);
        }
      }

      setTimeout(() => navigate('/admin'), 1000); 
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to create account. Please contact administrator.');
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  if (isVerifying) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ textAlign: 'center' }}>
          <div className="loading-spinner">Verifying invitation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card animate-fade">
        <div className="login-header">
          <h2>Staff Registration</h2>
          <p>Complete your BEAUTY GLOWRY staff profile</p>
        </div>

        <form className="login-form" onSubmit={handleRegister}>
          {error && <div style={{ color: '#fc8181', marginBottom: '16px', fontSize: '14px', textAlign: 'center', background: '#fff5f5', padding: '10px', borderRadius: '8px', border: '1px solid #feb2b2' }}>{error}</div>}
          
          <div className="input-group">
            <label>Full Name</label>
            <div className="input-with-icon">
              <User size={18} />
              <input 
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
                disabled={!invitationValid}
              />
            </div>
          </div>

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
                disabled={true} 
              />
            </div>
            <small style={{display: 'block', marginTop: '8px', color: '#718096', fontSize: '12px'}}>
              Email is locked to the invited address.
            </small>
          </div>

          <div className="input-group">
            <div className="label-row">
              <label>Create Password</label>
            </div>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
                disabled={!invitationValid}
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
                disabled={!invitationValid}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={loading || !invitationValid}>
            {loading ? 'Creating Account...' : 'Finish Registration'} <UserPlus size={18} />
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link to="/login">Login here <LogIn size={16} /></Link></p>
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
        .input-with-icon input:disabled { opacity: 0.6; cursor: not-allowed; }
        .eye-btn { position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .label-row { display: flex; justify-content: space-between; align-items: center; }
        .login-submit { width: 100%; height: 56px; background: var(--primary-dark); color: white; border-radius: 12px; font-weight: 800; font-size: 16px; display: flex; align-items: center; justify-content: center; gap: 12px; transition: var(--transition); }
        .login-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 24px rgba(251, 96, 144, 0.2); }
        .login-submit:disabled { opacity: 0.7; cursor: not-allowed; background: var(--text-muted); }
        .login-footer { margin-top: 32px; text-align: center; font-size: 15px; color: var(--text-muted); }
        .login-footer a { color: var(--primary-dark); font-weight: 700; display: inline-flex; align-items: center; gap: 4px; border-bottom: 1px solid transparent; }
        .login-footer a:hover { border-color: var(--primary-dark); }
      `}} />
    </div>
  );
};

export default StaffRegister;
