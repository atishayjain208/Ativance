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
    score >= 75 ? '#10B981'   // emerald
    : score >= 50 ? '#F59E0B' // amber
    : '#EF4444';               // rose

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="136" height="136" viewBox="0 0 136 136" className="rotate-[-90deg]">
        {/* Track */}
        <circle cx="68" cy="68" r={R} fill="none" stroke="#E5E5E0" strokeWidth="10" />
        {/* Progress */}
        <circle
          cx="68" cy="68" r={R}
          fill="none"
          stroke={colour}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRC}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      {/* Score label in the centre */}
      <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none pb-5">
        <span className="text-3xl font-extrabold text-zinc-900 leading-none">{score}</span>
        <span className="text-[11px] font-medium text-zinc-400 mt-0.5">/ 100</span>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: colour }}>
        {score >= 75 ? 'Strong Match ✓' : score >= 50 ? 'Average Match' : 'Needs Optimization'}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tag pill
// ─────────────────────────────────────────────────────────────────────────────
function Pill({ label, colour }) {
  const styles = {
    green:  'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    red:    'bg-rose-50    text-rose-700    border-rose-200/80',
    amber:  'bg-amber-50   text-amber-700   border-amber-200/80',
    indigo: 'bg-indigo-50  text-indigo-700  border-indigo-200/80',
  };
  return (
    <span className={`inline-block border rounded-lg px-3 py-1 text-xs font-semibold ${styles[colour] ?? styles.indigo}`}>
      {label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bulleted list card
// ─────────────────────────────────────────────────────────────────────────────
function BulletCard({ title, items, dotColour }) {
  const dot = {
    red:    'bg-rose-500',
    indigo: 'bg-indigo-500',
    amber:  'bg-amber-500',
  }[dotColour] ?? 'bg-zinc-400';

  return (
    <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 sm:p-6 space-y-3 shadow-soft">
      <h3 className="text-sm font-bold text-zinc-900">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-zinc-600 leading-relaxed">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span>{item}</span>
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
    <div className="space-y-5 pt-2 animate-fadeIn">
      {/* ATS Score card */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-2 relative shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">Applicant Tracking Score</p>
        <div className="relative flex flex-col items-center">
          <ATSRing score={atsScore} />
        </div>
        <p className="text-xs text-zinc-500 text-center max-w-sm mt-1">
          Simulated ATS evaluation measuring technical keyword density, formatting, and structural clarity.
        </p>
      </div>

      {/* Strengths */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 sm:p-6 space-y-3 shadow-soft">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Highlighted Strengths
        </h3>
        <div className="flex flex-wrap gap-2">
          {strengths.map((s, i) => <Pill key={i} label={s} colour="green" />)}
        </div>
      </div>

      {/* Missing skills */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 sm:p-6 space-y-3 shadow-soft">
        <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-500" />
          Missing Skill Keywords
        </h3>
        <div className="flex flex-wrap gap-2">
          {missingSkills.map((s, i) => <Pill key={i} label={s} colour="red" />)}
        </div>
      </div>

      {/* Weak points */}
      <BulletCard title="⚠️ Areas for Improvement" items={weakPoints} dotColour="amber" />

      {/* Recommendations */}
      <BulletCard title="💡 Actionable Next Steps" items={recommendations} dotColour="indigo" />

      {/* Re-analyze button */}
      <button
        onClick={onReanalyze}
        disabled={analyzing}
        className="w-full py-2.5 text-xs sm:text-sm font-semibold text-zinc-700 hover:text-zinc-900 bg-white hover:bg-zinc-50 border border-[#E5E5E0] hover:border-zinc-300 rounded-xl transition-all shadow-soft disabled:opacity-50"
      >
        {analyzing ? 'Re-analyzing…' : '↺ Re-run AI Analysis'}
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
      className={`relative flex flex-col items-center justify-center gap-3.5 rounded-2xl border-2 border-dashed p-10 sm:p-12 cursor-pointer transition-all duration-200 select-none shadow-soft
        ${isDragging
          ? 'border-indigo-600 bg-indigo-50/50 scale-[1.01]'
          : file
            ? 'border-emerald-300 bg-emerald-50/20'
            : 'border-[#E5E5E0] bg-white hover:border-indigo-300 hover:bg-zinc-50/50'}`}
    >
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onFileChange} />

      {file ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-zinc-900 text-sm truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-zinc-500">{fmt(file.size)} · PDF Document</p>
            <p className="text-xs text-indigo-600 font-semibold mt-1">Click to select another file</p>
          </div>
        </>
      ) : (
        <>
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all shadow-sm ${isDragging ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-zinc-900 text-sm">
              {isDragging ? 'Drop your resume PDF here' : 'Drop your resume PDF here, or browse files'}
            </p>
            <p className="text-xs text-zinc-500">PDF format · Maximum {MAX_MB} MB</p>
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
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Resume Analyzer</h1>
        <p className="text-zinc-500 text-xs sm:text-sm mt-1">
          Upload your PDF resume to compute your ATS score, discover missing keywords, and get recruiter-level recommendations.
        </p>
      </div>

      {/* ── Main card ── */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl p-6 sm:p-7 space-y-5 shadow-soft">
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
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{uploadError}</span>
          </div>
        )}

        {/* Upload progress bar */}
        {uploading && (
          <div className="space-y-2 py-1">
            <div className="flex justify-between text-xs font-semibold text-zinc-600">
              <span>Uploading document…</span><span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {/* ── Success state ── */}
        {uploadResult?.success && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className="flex items-start gap-3.5 px-4 py-3.5 rounded-xl bg-emerald-50 border border-emerald-200/80">
              <div className="mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-emerald-600 text-white shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-bold text-emerald-800">Resume uploaded successfully</p>
                <p className="text-xs text-emerald-700/80 mt-0.5">{file?.name} · {fmt(file?.size ?? 0)}</p>
              </div>
            </div>

            {/* Extraction warning */}
            {uploadResult.warning && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>{uploadResult.warning}</span>
              </div>
            )}

            {/* Analysis error */}
            {analysisError && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{analysisError}</span>
              </div>
            )}

            {/* Analyze button / spinner (shown when no results yet) */}
            {!analysis && (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !uploadResult.textExtracted}
                title={!uploadResult.textExtracted ? 'Text extraction failed — please re-upload a readable PDF.' : ''}
                className="w-full py-3 px-4 bg-[#171717] hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 text-sm"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <span>Analyzing your resume with AI…</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Run AI Resume Analysis</span>
                  </>
                )}
              </button>
            )}

            {/* Results panel */}
            {analysis && (
              <AnalysisPanel
                data={analysis}
                analyzing={analyzing}
                onReanalyze={handleAnalyze}
              />
            )}

            {/* Upload different file */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Upload a different resume PDF
            </button>
          </div>
        )}

        {/* Upload button — shown when file selected and not yet uploaded */}
        {file && !uploadResult?.success && !uploading && (
          <button
            type="button"
            onClick={handleUpload}
            className="w-full py-3 px-4 bg-[#171717] hover:bg-black text-white text-sm font-semibold rounded-xl transition duration-150 shadow-sm"
          >
            Upload Resume
          </button>
        )}
      </div>

      {/* Tips card */}
      <div className="bg-white border border-[#E5E5E0] rounded-2xl p-5 flex gap-4 items-start shadow-soft">
        <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-xs text-zinc-600 space-y-1">
          <p className="font-bold text-zinc-900 text-sm">Tips for best evaluation results</p>
          <ul className="space-y-1 list-disc list-inside text-zinc-500">
            <li>Use a clean, single-column or standard text PDF rather than a scanned image</li>
            <li>Include measurable metrics (e.g. "improved latency by 30%")</li>
            <li>Ensure target keywords from your desired job description are represented</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
