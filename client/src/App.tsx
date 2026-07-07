import { useEffect, useState } from 'react';
import { api } from './api/client';

export default function App() {
  const [status, setStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    api
      .get('/health')
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-gray-800">Cash Flow</h1>
        <p className="mt-2 text-gray-500">
          API status:{' '}
          <span
            className={
              status === 'ok'
                ? 'text-green-600'
                : status === 'error'
                  ? 'text-red-600'
                  : 'text-gray-400'
            }
          >
            {status}
          </span>
        </p>
      </div>
    </div>
  );
}
