import { useState, useEffect, useRef } from 'react';
import { getProfile, updateProfile } from '../services/authService';

// ── Small reusable sub-components ─────────────────────────────────────────────

function SectionCard({ title, children }) {
  return (
    <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 sm:p-7 space-y-5 shadow-soft">
      <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E5E0] text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition text-sm shadow-soft';

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
      className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-white border border-[#E5E5E0] focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-600 cursor-text min-h-[46px] shadow-soft transition"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold shadow-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-indigo-400 hover:text-rose-600 transition-colors leading-none ml-0.5"
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
        className="flex-1 min-w-[130px] bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none"
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
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Profile & Career Goals</h1>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">
          Keep your profile and target companies up to date to personalize your AI roadmap and mock interviews.
        </p>
      </div>

      {/* Feedback banners */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <SectionCard title="Basic Information">
          <Field label="Full name">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Jane Doe"
              className={inputCls}
            />
          </Field>
          <Field label="Education / University">
            <input
              name="education"
              value={form.education}
              onChange={handleChange}
              placeholder="e.g. B.Tech Computer Science, IIT Delhi (2026)"
              className={inputCls}
            />
          </Field>
          <Field label="Career Goals & Aspirations">
            <textarea
              name="goals"
              value={form.goals}
              onChange={handleChange}
              rows={3}
              placeholder="e.g. Target Software Engineer roles at tier-1 product companies by mid-2026."
              className={`${inputCls} resize-none`}
            />
          </Field>
        </SectionCard>

        {/* Skills */}
        <SectionCard title="Skill Keywords">
          <Field label="Skills (press Enter or comma to add)">
            <TagInput
              tags={form.skills}
              onChange={setField('skills')}
              placeholder="e.g. React, Python, Distributed Systems, SQL…"
            />
          </Field>
        </SectionCard>

        {/* Target companies */}
        <SectionCard title="Target Companies & Availability">
          <Field label="Dream Companies (press Enter or comma to add)">
            <TagInput
              tags={form.targetCompanies}
              onChange={setField('targetCompanies')}
              placeholder="e.g. Google, Stripe, Microsoft, Notion…"
            />
          </Field>
          <Field label="Available Study Hours Per Week">
            <div className="relative">
              <input
                name="availableStudyHours"
                type="number"
                min="0"
                max="168"
                value={form.availableStudyHours}
                onChange={handleChange}
                placeholder="e.g. 15"
                className={`${inputCls} pr-20`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 text-xs font-semibold select-none pointer-events-none">
                hrs / week
              </span>
            </div>
          </Field>
        </SectionCard>

        {/* Save */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 bg-[#171717] hover:bg-black disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold rounded-xl transition duration-150 shadow-sm flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                <span>Saving profile…</span>
              </>
            ) : (
              'Save Profile'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
