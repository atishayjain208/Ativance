import { useState, useEffect, useRef } from 'react';
import { User, GraduationCap, Target, Code, Building, Clock, CheckCircle2, AlertCircle, Save, RefreshCw, X } from 'lucide-react';
import { getProfile, updateProfile } from '../services/authService';

function SectionCard({ title, children, icon: Icon }) {
  return (
    <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 sm:p-7 space-y-5 shadow-card">
      <h2 className="text-sm font-bold text-[#F8FAFC] uppercase tracking-wider flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-[#7C5CFC]" />}
        <span>{title}</span>
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-bold uppercase tracking-wider text-[#94A3B8]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'w-full px-4 py-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] text-[#F8FAFC] placeholder:text-[#64748B] focus:outline-none focus:border-[#7C5CFC] transition text-sm shadow-soft';

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
      className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-[#181D27] border border-[#1F2633] focus-within:border-[#7C5CFC] cursor-text min-h-[46px] shadow-soft transition"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#9B7CFF] text-xs font-semibold shadow-sm"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="text-[#94A3B8] hover:text-[#F87171] transition-colors leading-none ml-0.5"
            aria-label={`Remove ${tag}`}
          >
            <X className="h-3 w-3" />
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
        className="flex-1 min-w-[130px] bg-transparent text-sm text-[#F8FAFC] placeholder:text-[#64748B] outline-none"
      />
    </div>
  );
}

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
      localStorage.setItem('user', JSON.stringify(user));
      setSuccess('Profile saved successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <RefreshCw className="h-8 w-8 text-[#7C5CFC] animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-12">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">Profile & Career Goals</h1>
        <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
          Keep your profile and target companies up to date to personalize your AI roadmap and mock interviews.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20 text-[#34D399] text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <SectionCard title="Basic Information" icon={User}>
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

        <SectionCard title="Skill Keywords" icon={Code}>
          <Field label="Skills (press Enter or comma to add)">
            <TagInput
              tags={form.skills}
              onChange={setField('skills')}
              placeholder="e.g. React, Python, Distributed Systems, SQL…"
            />
          </Field>
        </SectionCard>

        <SectionCard title="Target Companies & Availability" icon={Building}>
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
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] text-xs font-semibold select-none pointer-events-none">
                hrs / week
              </span>
            </div>
          </Field>
        </SectionCard>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-7 py-3 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-bold rounded-xl transition duration-150 shadow-glow-purple flex items-center justify-center gap-2"
          >
            {saving ? (
              <span>Saving profile…</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
