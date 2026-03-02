import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase';

const DEPARTMENTS = [
  'Computer Science and Engineering',
  'Information Technology',
  'Electronics and Communication Engineering',
  'Electrical and Electronics Engineering',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Biotechnology',
  'Biomedical Engineering',
  'Aeronautical Engineering',
  'Automobile Engineering',
  'Artificial Intelligence and Data Science',
  'Artificial Intelligence and Machine Learning',
  'Data Science',
  'Cyber Security',
  'Robotics and Automation',
  'Mechatronics Engineering',
  'Production Engineering',
  'Industrial Engineering',
  'Architecture',
  'Mathematics',
  'Physics',
  'Chemistry',
  'English',
  'Management Studies',
  'Humanities and Social Sciences'
];

const ORCID_REGEX = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [role, setRole] = useState('FACULTY');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [orcidId, setOrcidId] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const clearAlerts = () => {
    setMessage('');
    setErrorMessage('');
  };

  const switchMode = (loginMode) => {
    setIsLogin(loginMode);
    clearAlerts();
  };

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    clearAlerts();

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.user.id)
          .single();

        const userRole = profile?.role || data.user.user_metadata?.role;
        if (userRole === 'ADMIN') navigate('/admin');
        else navigate('/faculty');
      } else {
        if (orcidId && !ORCID_REGEX.test(orcidId)) {
          throw new Error('Enter a valid ORCID iD (e.g., 0000-0002-1825-0097)');
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, department, designation, role, orcid_id: orcidId }
          }
        });

        if (error) throw error;
        setMessage('Signup successful. Please check your email for verification.');
        setIsLogin(true);
      }
    } catch (error) {
      setErrorMessage(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page auth-force-light min-h-screen theme-surface-muted flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="auth-frame mx-auto grid w-full max-w-6xl overflow-hidden rounded-[2rem] lg:h-[85vh] lg:grid-cols-[1.2fr_1fr]">
        <div className="auth-hero relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="auth-hero-glow auth-hero-glow-left" />
          <div className="auth-hero-glow auth-hero-glow-right" />

          <div className="relative z-10">
            <span className="auth-badge inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]">
              Faculty Activity Portal
            </span>
            <h1 className="mt-8 text-5xl font-bold leading-[1.15] tracking-tight">
              Track research, publish faster,
              <br />
              <span className="auth-accent-text">showcase excellence.</span>
            </h1>
          </div>

          <div className="relative z-10 flex items-center justify-center">
            <img
              src="https://res.cloudinary.com/ddnzgizrv/image/upload/v1772457833/WhatsApp_Image_2026-03-02_at_18.47.03-Photoroom_mvkjyt.png"
              alt="Faculty Activity Illustration"
              className="w-full max-w-[620px] h-auto object-contain"
            />
          </div>

          <div className="h-0" />
        </div>

        <div className="theme-surface p-8 sm:p-12 lg:overflow-y-auto flex flex-col justify-center">
          <div className="mb-8">
            <div className="theme-segment flex rounded-2xl p-1.5">
              <button
                type="button"
                onClick={() => switchMode(true)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  isLogin ? 'theme-segment-active' : 'theme-text-secondary'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => switchMode(false)}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                  !isLogin ? 'theme-segment-active' : 'theme-text-secondary'
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="mb-6">
            <div className="mb-4 lg:hidden">
              <span className="auth-badge inline-block px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                Faculty Activity Portal
              </span>
              <h1 className="theme-text-primary mt-2 text-2xl font-bold leading-tight">
                Track research, publish faster, <span className="auth-accent-text">showcase excellence.</span>
              </h1>
            </div>
            <h2 className="theme-text-primary text-3xl font-bold">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
            <p className="theme-text-secondary mt-2 text-sm">
              {isLogin ? 'Login to continue to your dashboard.' : 'Register your account to start adding activities.'}
            </p>
          </div>

          {message ? <div className="theme-alert-success mb-4 rounded-lg px-4 py-3 text-sm">{message}</div> : null}
          {errorMessage ? <div className="theme-alert-error mb-4 rounded-lg px-4 py-3 text-sm">{errorMessage}</div> : null}

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin ? (
              <div className="space-y-4">
                <div>
                  <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    className="theme-input mt-2 block w-full rounded-xl px-4 py-3 outline-none transition"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                  />
                </div>
                <div>
                  <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">ORCID ID</label>
                  <input
                    type="text"
                    placeholder="0000-0002-1825-0097"
                    className="theme-input mt-2 block w-full rounded-xl px-4 py-3 outline-none transition"
                    value={orcidId}
                    onChange={(event) => setOrcidId(event.target.value)}
                  />
                </div>
              </div>
            ) : null}

            <div>
              <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                placeholder="Enter your email address"
                className="theme-input mt-2 block w-full rounded-xl px-4 py-3 outline-none transition"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">Password</label>
              <div className="relative mt-2">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="********"
                  className="theme-input block w-full rounded-xl px-4 py-3 pr-11 outline-none transition"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="theme-text-secondary absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80 focus:outline-none"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {!isLogin ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">Department</label>
                  <div className="relative mt-2">
                    <select
                      required
                      className="theme-input block w-full appearance-none rounded-xl px-4 py-3 pr-10 outline-none transition"
                      value={department}
                      onChange={(event) => setDepartment(event.target.value)}
                    >
                      <option value="" disabled>Select Department</option>
                      {DEPARTMENTS.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <svg viewBox="0 0 20 20" fill="none" className="theme-text-secondary pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>

                <div>
                  <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">Designation</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter designation"
                    className="theme-input mt-2 block w-full rounded-xl px-4 py-3 outline-none transition"
                    value={designation}
                    onChange={(event) => setDesignation(event.target.value)}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="theme-text-secondary block text-xs font-semibold uppercase tracking-wider">Role</label>
                  <div className="relative mt-2">
                    <select
                      className="theme-input block w-full appearance-none rounded-xl px-4 py-3 pr-10 outline-none transition"
                      value={role}
                      onChange={(event) => setRole(event.target.value)}
                    >
                      <option value="FACULTY">FACULTY</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                    <svg viewBox="0 0 20 20" fill="none" className="theme-text-secondary pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2">
                      <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="theme-btn-primary mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-4 text-base font-bold"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 theme-spinner rounded-full border-2 border-t-transparent animate-spin" />
                  Authenticating...
                </span>
              ) : isLogin ? (
                'Login to Portal'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="theme-text-secondary mt-8 text-center text-sm font-medium">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              type="button"
              onClick={() => switchMode(!isLogin)}
              className="ml-2 font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-primary-hover)]"
            >
              {isLogin ? 'Create one now' : 'Login here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
