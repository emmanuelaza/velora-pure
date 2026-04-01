import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Business {
  id: string;
  owner_id: string;
  business_name: string;
  owner_name: string;
  phone: string;
  city: string;
  state: string;
  zelle_info?: string;
  venmo_info?: string;
  cashapp_info?: string;
  subscription_status: 'pending' | 'trial' | 'active' | 'past_due' | 'canceled';
  lemonsqueezy_subscription_id?: string;
  trial_ends_at?: string;
  logo_url?: string;
}

interface BusinessContextType {
  business: Business | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchBusiness = async () => {
    if (!user) {
      setBusiness(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No business found
          setBusiness(null);
          // Auto redirect to onboarding if on a protected route
          if (!window.location.pathname.includes('/login')) {
            navigate('/onboarding');
          }
        } else {
          console.error('Error fetching business:', error);
        }
      } else {
        setBusiness(data);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchBusiness();
    }
  }, [user, authLoading]);

  return (
    <BusinessContext.Provider value={{ business, loading, refetch: fetchBusiness }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const context = useContext(BusinessContext);
  if (context === undefined) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
}
