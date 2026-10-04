import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { login } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = form;

    if (!email.trim() || !password) {
      setError('Email and password are required.');
      return;
    }

    try {
      setLoading(true);
      const data = await login({ email, password });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B10] flex flex-col items-center justify-center px-4 py-12 selection:bg-[#7C5CFC]/30 selection:text-[#F8FAFC] font-sans">
      {/* Brand logo header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#7C5CFC] to-[#22D3EE] p-[1px] shadow-glow-purple">
          <div className="h-full w-full bg-[#0F1219] rounded-[11px] flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-[#22D3EE]" />
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold text-[#F8FAFC] tracking-tight leading-none">Ativance</span>
          <span className="text-[10px] font-semibold text-[#7C5CFC] tracking-wider uppercase mt-1">AI Career Copilot</span>
        </div>
      </div>

      <div className="w-full max-w-md bg-[#141821] rounded-3xl shadow-card p-8 sm:p-10 border border-[#1F2633] animate-fadeIn space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">Welcome back</h1>
          <p className="text-[#94A3B8] text-xs sm:text-sm">Sign in to access your AI career platform</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="px-4 py-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition text-sm shadow-soft"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition text-sm shadow-soft"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition duration-150 shadow-glow-purple flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Signing in…</span>
              </>
            ) : (
              <>
                <span>Sign in</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-center text-xs sm:text-sm text-[#94A3B8]">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[#7C5CFC] hover:text-[#9B7CFF] font-semibold transition">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
