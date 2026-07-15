import { useState, useRef } from 'react';
import { uploadResume, analyzeResume } from '../services/authService';

const MAX_MB    = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// Tiny helpers
// ─────────────────────────────────────────────────────────────────────────────
function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─────────────────────────────────────────────────────────────────────────────
// ATS Score ring
// ─────────────────────────────────────────────────────────────────────────────
function ATSRing({ score }) {
  const R        = 52;
  const CIRC     = 2 * Math.PI * R;
  const filled   = (score / 100) * CIRC;
  const colour   =
    score >= 75 ? '#34d399'   // emerald
    : score >= 50 ? '#fbbf24' // amber
    : '#f87171';               // red

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="136" height="136" viewBox="0 0 136 136" className="rotate-[-90deg]">
        {/* Track */}
        <circle cx="68" cy="68" r={R} fill="none" stroke="#1e293b" strokeWidth="12" />
        {/* Progress */}
        <circle
          cx="68" cy="68" r={R}
          fill="none"
          stroke={colour}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRC}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      {/* Score label in the centre */}
      <div className="absolute flex flex-col items-center" style={{ marginTop: '-82px' }}>
        <span className="text-3xl font-extrabold text-white leading-none">{score}</span>
        <span className="text-xs text-slate-400 mt-0.5">/ 100</span>
      </div>
      <p className="text-sm font-semibold" style={{ color: colour }}>
        {score >= 75 ? 'Strong ✓' : score >= 50 ? 'Average' : 'Needs Work'}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag pill
// ─────────────────────────────────────────────────────────────────────────────
function Pill({ label, colour }) {
  const styles = {
    green:  'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
    red:    'bg-red-500/15    text-red-300    border-red-500/25',
    amber:  'bg-amber-500/15  text-amber-300  border-amber-500/25',
    indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  };
  return (
    <span className={`inline-block border rounded-full px-3 py-1 text-xs font-medium ${styles[colour] ?? styles.indigo}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulleted list card
// ─────────────────────────────────────────────────────────────────────────────
function BulletCard({ title, items, dotColour }) {
  const dot = {
    red:    'bg-red-400',
    indigo: 'bg-indigo-400',
    amber:  'bg-amber-400',
  }[dotColour] ?? 'bg-slate-400';

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-semibold text-slate-200">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Analysis results panel
// ─────────────────────────────────────────────────────────────────────────────
function AnalysisPanel({ data, onReanalyze, analyzing }) {
  const { atsScore, strengths, weakPoints, missingSkills, recommendations } = data;

  return (
    <div className="space-y-6 pt-2">
      {/* ATS Score */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center gap-1 relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">ATS Score</p>
        <div className="relative flex flex-col items-center">
          <ATSRing score={atsScore} />
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center max-w-xs">
          ATS (Applicant Tracking System) compatibility score out of 100.
        </p>
      </div>

      {/* Strengths */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
          Strengths
        </h3>
        <div className="flex flex-wrap gap-2">
          {strengths.map((s, i) => <Pill key={i} label={s} colour="green" />)}
        </div>
      </div>

      {/* Missing skills */}
      <div className="space-y-2.5">
        <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
          Missing Skills
        </h3>
        <div className="flex flex-wrap gap-2">
          {missingSkills.map((s, i) => <Pill key={i} label={s} colour="red" />)}
        </div>
      </div>

      {/* Weak points */}
      <BulletCard title="⚠️  Weak Points" items={weakPoints} dotColour="amber" />

      {/* Recommendations */}
      <BulletCard title="💡  Recommendations" items={recommendations} dotColour="indigo" />

      {/* Re-analyze */}
      <button
        onClick={onReanalyze}
        disabled={analyzing}
        className="w-full py-2.5 text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 rounded-xl transition-colors duration-150 disabled:opacity-50"
      >
        {analyzing ? 'Re-analyzing…' : '↺  Re-analyze'}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Upload area
// ─────────────────────────────────────────────────────────────────────────────
function UploadArea({ file, isDragging, onClick, onDrop, onDragOver, onDragLeave, onFileChange, inputRef }) {
  return (
    <div
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-all duration-200 select-none
        ${isDragging
          ? 'border-indigo-400 bg-indigo-500/10 scale-[1.01]'
          : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'}`}
    >
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onFileChange} />

      {file ? (
        <>
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-emerald-400 text-sm truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{fmt(file.size)} · PDF</p>
            <p className="text-xs text-slate-500 mt-1">Click to choose a different file</p>
          </div>
        </>
      ) : (
        <>
          <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${isDragging ? 'bg-indigo-500/20' : 'bg-slate-700/60'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-colors ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-200 text-sm">
              {isDragging ? 'Drop your PDF here' : 'Drop your PDF here, or click to browse'}
            </p>
            <p className="text-xs text-slate-500 mt-1">PDF only · max {MAX_MB} MB</p>
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function Resume() {
  const inputRef = useRef(null);

  // Upload state
  const [file, setFile]             = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);
  const [uploadResult, setUploadResult] = useState(null); // { success, warning?, textExtracted }
  const [uploadError, setUploadError]   = useState('');

  // Analysis state
  const [analyzing, setAnalyzing]   = useState(false);
  const [analysis, setAnalysis]     = useState(null);   // resumeAnalysis object
  const [analysisError, setAnalysisError] = useState('');

  // ── File helpers ────────────────────────────────────────────────────────────
  const selectFile = (f) => {
    setUploadResult(null); setUploadError(''); setAnalysis(null); setAnalysisError('');
    if (!f) return;
    if (f.type !== 'application/pdf') { setUploadError('Only PDF files are accepted.'); return; }
    if (f.size > MAX_BYTES)           { setUploadError(`File too large (${fmt(f.size)}). Max ${MAX_MB} MB.`); return; }
    setFile(f);
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); selectFile(e.dataTransfer.files[0]); };

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true); setProgress(0); setUploadError(''); setUploadResult(null); setAnalysis(null);
    try {
      const data = await uploadResume(file, (loaded, total) =>
        setProgress(total ? Math.round((loaded / total) * 100) : 0)
      );
      setProgress(100);
      setUploadResult(data);
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // ── Analyze ─────────────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    setAnalyzing(true); setAnalysisError(''); setAnalysis(null);
    try {
      const data = await analyzeResume();
      setAnalysis(data.resumeAnalysis);
    } catch (err) {
      setAnalysisError(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null); setUploadResult(null); setUploadError('');
    setAnalysis(null); setAnalysisError(''); setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Resume Analyzer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload your PDF resume and get an AI-powered analysis with ATS score, skill gaps, and actionable recommendations.
        </p>
      </div>

      {/* ── Upload card ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">

        {/* Upload area — hide once successfully uploaded */}
        {!uploadResult?.success && (
          <UploadArea
            file={file} isDragging={isDragging}
            inputRef={inputRef}
            onClick={() => !uploading && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onFileChange={(e) => selectFile(e.target.files[0])}
          />
        )}

        {/* Client / server upload error */}
        {uploadError && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {uploadError}
          </div>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Uploading…</span><span>{progress}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ── Success state ── */}
        {uploadResult?.success && (
          <div className="space-y-4">
            {/* Success banner */}
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
              <div className="mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">Resume uploaded successfully!</p>
                <p className="text-xs text-slate-400 mt-0.5">{file?.name} · {fmt(file?.size ?? 0)}</p>
              </div>
            </div>

            {/* Extraction warning */}
            {uploadResult.warning && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {uploadResult.warning}
              </div>
            )}

            {/* ── Analysis error ── */}
            {analysisError && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {analysisError}
              </div>
            )}

            {/* ── Analyze button / spinner (shown when no results yet) ── */}
            {!analysis && (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !uploadResult.textExtracted}
                title={!uploadResult.textExtracted ? 'Text extraction failed — please re-upload a readable PDF.' : ''}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/30 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Analyzing your resume…
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Analyze Resume
                  </>
                )}
              </button>
            )}

            {/* ── Results panel ── */}
            {analysis && (
              <AnalysisPanel
                data={analysis}
                analyzing={analyzing}
                onReanalyze={handleAnalyze}
              />
            )}

            {/* Upload different file */}
            <button type="button" onClick={handleReset} className="w-full py-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Upload a different file
            </button>
          </div>
        )}

        {/* Upload button — shown when file selected and not yet uploaded */}
        {file && !uploadResult?.success && !uploading && (
          <button
            type="button"
            onClick={handleUpload}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition duration-200"
          >
            Upload Resume
          </button>
        )}
      </div>

      {/* Tips card */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 flex gap-4 items-start">
        <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-sm text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">Tips for best results</p>
          <ul className="space-y-0.5 list-disc list-inside text-xs">
            <li>Use a text-based PDF, not a scanned image</li>
            <li>Keep the file under 5 MB</li>
            <li>Ensure your resume is in English for accurate AI analysis</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
