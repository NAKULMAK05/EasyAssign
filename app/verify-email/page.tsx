'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import axios from 'axios';

const VerifyEmailPage = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<string>('Verifying...');

  useEffect(() => {
    if (!token) {
      setStatus('No token provided.');
      return;
    }

    const verifyEmail = async () => {
      try {
        // Pass the token in the header as a Bearer token so that authMiddleware can pick it up.
        const response = await axios.post(
          'http://localhost:5000/api/auth/verify-email',
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setStatus(response.data.message || 'Email verified successfully!');
      } catch (error: any) {
        console.error('Verification error:', error);
        setStatus(error.response?.data?.error || 'Failed to verify email.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <main>
      <h1>Email Verification</h1>
      <p>{status}</p>
    </main>
  );
};

export default VerifyEmailPage;