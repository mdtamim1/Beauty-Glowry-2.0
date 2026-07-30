import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../supabase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to sync Supabase Auth user with PostgreSQL 'users' table
  const fetchOrSyncUserProfile = async (supabaseUser) => {
    if (!supabaseUser) return null;

    let role = 'customer';
    let profileData = {};

    if (isSupabaseConfigured) {
      try {
        // 1. Fetch user from PostgreSQL 'users' table
        const { data: userDoc, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', supabaseUser.id)
          .single();

        if (userDoc) {
          profileData = userDoc;
          role = userDoc.role || 'customer';
          // Update online status
          await supabase
            .from('users')
            .update({ is_online: true, last_active: new Date().toISOString() })
            .eq('id', supabaseUser.id);
        } else {
          // Check invites table for staff/admin role
          const { data: invite } = await supabase
            .from('invites')
            .select('role')
            .eq('email', supabaseUser.email)
            .single();

          if (invite) {
            role = invite.role || 'staff';
            await supabase.from('invites').delete().eq('email', supabaseUser.email);
          } else {
            // Check if first user -> admin
            const { count } = await supabase
              .from('users')
              .select('*', { count: 'exact', head: true });
            
            if (count === 0) {
              role = 'admin';
            }
          }

          // Create new user profile in PostgreSQL
          profileData = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            display_name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || '',
            photo_url: supabaseUser.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.email || 'User')}&background=random`,
            role: role,
            is_online: true,
            last_active: new Date().toISOString(),
            created_at: new Date().toISOString()
          };

          await supabase.from('users').upsert(profileData);
        }
      } catch (err) {
        console.warn("PostgreSQL user profile sync error:", err);
      }
    }

    const sessionUser = {
      uid: supabaseUser.id,
      email: supabaseUser.email,
      displayName: profileData.display_name || supabaseUser.user_metadata?.full_name || '',
      photoURL: profileData.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(supabaseUser.email || 'User')}&background=random`,
      role: role || profileData.role || 'customer',
      ...profileData
    };

    return sessionUser;
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Initialize session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const sessionUser = await fetchOrSyncUserProfile(session.user);
        setUser(sessionUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for Auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const sessionUser = await fetchOrSyncUserProfile(session.user);
        setUser(sessionUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const handleBeforeUnload = async () => {
      if (user?.uid && isSupabaseConfigured) {
        await supabase
          .from('users')
          .update({ is_online: false, last_active: new Date().toISOString() })
          .eq('id', user.uid);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const login = async (email, password) => {
    if (!isSupabaseConfigured) {
      // Mock login fallback if environment keys are not configured yet
      const mockUser = { uid: 'admin-1', email, displayName: 'Admin User', role: 'admin' };
      setUser(mockUser);
      return { user: mockUser };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    if (user?.uid && isSupabaseConfigured) {
      try {
        await supabase
          .from('users')
          .update({ is_online: false, last_active: new Date().toISOString() })
          .eq('id', user.uid);
      } catch (e) {
        console.warn("Could not update online status during logout", e);
      }
    }

    if (isSupabaseConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
  };

  const register = async (email, password, additionalData = {}) => {
    const name = additionalData.name || additionalData.displayName || '';
    
    if (!isSupabaseConfigured) {
      const mockUser = { uid: 'user-' + Date.now(), email, displayName: name, role: 'customer', ...additionalData };
      setUser(mockUser);
      return { user: mockUser };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
        }
      }
    });

    if (error) throw error;

    if (data?.user) {
      const newUserProfile = {
        id: data.user.id,
        email: email,
        display_name: name,
        photo_url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email)}&background=random`,
        role: 'customer',
        is_online: true,
        last_active: new Date().toISOString(),
        ...additionalData
      };

      await supabase.from('users').upsert(newUserProfile);
    }

    return data;
  };

  const updateUser = async (uid, data) => {
    if (isSupabaseConfigured) {
      const updatePayload = {
        updated_at: new Date().toISOString()
      };
      if (data.displayName !== undefined) updatePayload.display_name = data.displayName;
      if (data.photoURL !== undefined) updatePayload.photo_url = data.photoURL;
      if (data.role !== undefined) updatePayload.role = data.role;
      if (data.isOnline !== undefined) updatePayload.is_online = data.isOnline;

      await supabase.from('users').update(updatePayload).eq('id', uid);
    }

    if (user && user.uid === uid) {
      setUser(prev => ({
        ...prev,
        ...data
      }));
    }
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) return;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });
    if (error) throw error;
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, resetPassword, signInWithGoogle }}>
      {children}
    </AuthContext.Provider>
  );
};
