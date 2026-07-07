import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { fetchSignupStatus, signup } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [signupOpen, setSignupOpen] = useState<boolean | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSignupStatus().then(setSignupOpen);
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await signup(email, password, name);
      setUser(user);
      navigate('/');
    } catch (err) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Could not create account';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  if (signupOpen === false) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white p-8 rounded-lg shadow">
        <h1 className="text-xl font-semibold text-gray-800 mb-6">Create the first account</h1>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <label className="block text-sm text-gray-600 mb-1">Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
        />
        <label className="block text-sm text-gray-600 mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded"
        />
        <label className="block text-sm text-gray-600 mb-1">Password</label>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-3 py-2 border border-gray-300 rounded"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gray-900 text-white py-2 rounded hover:bg-gray-800 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
