import { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile } from '../services/authService';

// ── Small reusable sub-components ─────────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-slate-300">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition text-sm';

// ── TagInput: renders a tag list with add/remove ──────────────────────────────
function TagInput({ tags, onChange, placeholder }) {
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const addTag = () => {
    const value = draft.trim();
    if (!value || tags.includes(value)) {
      setDraft('');
      return;
    }
    onChange([...tags, value]);
    setDraft('');
  };

  const removeTag = (tag) => onChange(tags.filter((t) => t !== tag));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
    if (e.key === 'Backspace' && !draft && tags.length) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-2 p-2.5 rounded-lg bg-slate-800 border border-slate-700 focus-within:ring-2 focus-within:ring-indigo-500 cursor-text min-h-[44px]"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-indigo-400 hover:text-red-400 transition-colors leading-none"
            aria-label={`Remove ${tag}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
      />
    </div>
  );
}

// ── Main Profile page ─────────────────────────────────────────────────────────
export default function Profile() {
  const [form, setForm] = useState({
    name: '',
    education: '',
    goals: '',
    skills: [],
    targetCompanies: [],
    availableStudyHours: '',
  });

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [success, setSuccess]   = useState('');
  const [error, setError]       = useState('');

  // ── Load profile on mount ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const { user } = await getProfile();
        setForm({
          name:                user.name                ?? '',
          education:           user.education           ?? '',
          goals:               user.goals               ?? '',
          skills:              user.skills              ?? [],
          targetCompanies:     user.targetCompanies     ?? [],
          availableStudyHours: user.availableStudyHours ?? '',
        });
      } catch (err) {
        setError('Failed to load profile. Please refresh.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccess('');
    setError('');
  };

  const setField = (key) => (value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSuccess('');
    setError('');
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      const { user } = await updateProfile({
        name:                form.name,
        education:           form.education,
        goals:               form.goals,
        skills:              form.skills,
        targetCompanies:     form.targetCompanies,
        availableStudyHours: form.availableStudyHours === '' ? 0 : Number(form.availableStudyHours),
      });
      // Keep localStorage in sync
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess('Profile saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="text-slate-400 text-sm mt-1">
          Keep your profile up to date so Ativance can give you the best recommendations.
        </p>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <SectionCard title="Basic Info">
          <Field label="Full name">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              className={inputCls}
            />
          </Field>
          <Field label="Education">
            <input
              name="education"
              value={form.education}
              onChange={handleChange}
              placeholder="e.g. B.Tech Computer Science, IIT Delhi (2026)"
              className={inputCls}
            />
          </Field>
          <Field label="Career goals">
            <textarea
              name="goals"
              value={form.goals}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Land a SWE role at a product company by mid-2026."
              className={`${inputCls} resize-none`}
            />
          </Field>
        </SectionCard>

        {/* Skills */}
        <SectionCard title="Skills">
          <Field label="Skills (press Enter or comma to add)">
            <TagInput
              tags={form.skills}
              onChange={setField('skills')}
              placeholder="e.g. React, Python, SQL…"
            />
          </Field>
        </SectionCard>

        {/* Target companies */}
        <SectionCard title="Job Search">
          <Field label="Target companies (press Enter or comma to add)">
            <TagInput
              tags={form.targetCompanies}
              onChange={setField('targetCompanies')}
              placeholder="e.g. Google, Stripe, Notion…"
            />
          </Field>
          <Field label="Available study hours per week">
            <div className="relative">
              <input
                name="availableStudyHours"
                type="number"
                min="0"
                max="168"
                value={form.availableStudyHours}
                onChange={handleChange}
                placeholder="e.g. 15"
                className={`${inputCls} pr-16`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm select-none pointer-events-none">
                hrs / wk
              </span>
            </div>
          </Field>
        </SectionCard>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition duration-200"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
