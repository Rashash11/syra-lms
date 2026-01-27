'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Redirect based on role
        switch (data.user.role) {
          case 'ADMIN':
            router.push('/admin');
            break;
          case 'INSTRUCTOR':
          case 'SUPER_INSTRUCTOR':
            router.push('/instructor');
            break;
          case 'LEARNER':
            router.push('/learner');
            break;
          default:
            router.push('/login');
        }
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="loading-spinner"></div>
        <p>Loading Zedny LMS...</p>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Welcome to Zedny LMS</h1>
        </div>
        <p>Redirecting you to the appropriate dashboard...</p>
        {user && (
          <p>Hello, {user.firstName} {user.lastName}! ({user.role})</p>
        )}
      </div>
    </div>
  );
}