'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ForceLogoutPage() {
    const router = useRouter();
    const [status, setStatus] = useState('Clearing session...');

    useEffect(() => {
        async function clearSession() {
            try {
                // Clear all cookies
                document.cookie.split(";").forEach(function(c) {
                    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
                });

                // Clear localStorage
                localStorage.clear();

                // Clear sessionStorage
                sessionStorage.clear();

                setStatus('✓ Session cleared! Redirecting to login...');

                // Wait 2 seconds then redirect
                setTimeout(() => {
                    window.location.href = '/';
                }, 2000);

            } catch (error) {
                setStatus('Error: ' + (error as Error).message);
            }
        }

        clearSession();
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            fontFamily: 'Arial, sans-serif',
            background: '#f5f5f5'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '10px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                textAlign: 'center',
                maxWidth: '500px'
            }}>
                <h1 style={{ color: '#333', marginBottom: '20px' }}>🔄 Force Logout</h1>
                <p style={{ fontSize: '18px', color: '#666' }}>{status}</p>
                
                {status.includes('✓') && (
                    <div style={{ marginTop: '20px', padding: '15px', background: '#d4edda', borderRadius: '5px' }}>
                        <p style={{ color: '#155724', margin: 0 }}>
                            All cookies and storage cleared!<br/>
                            Redirecting to login page...
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
