import { useState, useRef } from 'react';
import { FileText, Upload, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, ShieldCheck } from 'lucide-react';
import { uploadResume, analyzeResume } from '../services/authService';

const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

function fmt(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ATS Score ring
function ATSRing({ score }) {
  const R = 52;
  const CIRC = 2 * Math.PI * R;
  const filled = (score / 100) * CIRC;
  const colour =
    score >= 75 ? '#34D399'   // emerald/success
    : score >= 50 ? '#FBBF24' // warning
    : '#F87171';               // error

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex flex-col items-center justify-center">
        <svg width="136" height="136" viewBox="0 0 136 136" className="rotate-[-90deg]">
          {/* Track */}
          <circle cx="68" cy="68" r={R} fill="none" stroke="#1F2633" strokeWidth="10" />
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
        <div className="absolute flex flex-col items-center justify-center inset-0 pointer-events-none pb-2">
          <span className="text-3xl font-extrabold text-[#F8FAFC] leading-none">{score}</span>
          <span className="text-[11px] font-medium text-[#64748B] mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: colour }}>
        {score >= 75 ? 'Strong ATS Match ✓' : score >= 50 ? 'Average Match' : 'Needs Optimization'}
      </p>
    </div>
  );
}

// Tag pill
function Pill({ label, colour }) {
  const styles = {
    green:  'bg-[#34D399]/10 text-[#34D399] border-[#34D399]/20',
    red:    'bg-[#F87171]/10 text-[#F87171] border-[#F87171]/20',
    amber:  'bg-[#FBBF24]/10 text-[#FBBF24] border-[#FBBF24]/20',
    purple: 'bg-[#7C5CFC]/10 text-[#9B7CFF] border-[#7C5CFC]/20',
  };
  return (
    <span className={`inline-block border rounded-lg px-3 py-1 text-xs font-semibold ${styles[colour] ?? styles.purple}`}>
      {label}
    </span>
  );
}

// Bulleted list card
function BulletCard({ title, items, dotColour }) {
  const dot = {
    red:    'bg-[#F87171]',
    purple: 'bg-[#7C5CFC]',
    amber:  'bg-[#FBBF24]',
  }[dotColour] ?? 'bg-[#64748B]';

  return (
    <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 sm:p-6 space-y-3 shadow-card">
      <h3 className="text-sm font-bold text-[#F8FAFC]">{title}</h3>
      <ul className="space-y-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Analysis results panel
function AnalysisPanel({ data, onReanalyze, analyzing }) {
  const { atsScore, strengths, weakPoints, missingSkills, recommendations } = data;

  return (
    <div className="space-y-5 pt-2 animate-fadeIn">
      {/* ATS Score card */}
      <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-2 relative shadow-card">
        <p className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">Applicant Tracking System (ATS) Score</p>
        <ATSRing score={atsScore} />
        <p className="text-xs text-[#94A3B8] text-center max-w-sm mt-1">
          Simulated recruiter ATS evaluation measuring technical keyword density, formatting, and structural clarity.
        </p>
      </div>

      {/* Strengths */}
      <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 sm:p-6 space-y-3 shadow-card">
        <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#34D399]" />
          Highlighted Technical Strengths
        </h3>
        <div className="flex flex-wrap gap-2">
          {strengths.map((s, i) => <Pill key={i} label={s} colour="green" />)}
        </div>
      </div>

      {/* Missing skills */}
      <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 sm:p-6 space-y-3 shadow-card">
        <h3 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
          <span className="inline-block h-2 w-2 rounded-full bg-[#F87171]" />
          Missing Critical Keywords
        </h3>
        <div className="flex flex-wrap gap-2">
          {missingSkills.map((s, i) => <Pill key={i} label={s} colour="red" />)}
        </div>
      </div>

      {/* Weak points */}
      <BulletCard title="⚠️ Areas for Structural Improvement" items={weakPoints} dotColour="amber" />

      {/* Recommendations */}
      <BulletCard title="💡 Recruiter Next Steps" items={recommendations} dotColour="purple" />

      {/* Re-analyze button */}
      <button
        onClick={onReanalyze}
        disabled={analyzing}
        className="w-full py-2.5 text-xs sm:text-sm font-semibold text-[#F8FAFC] bg-[#181D27] hover:bg-[#1F2633] border border-[#1F2633] rounded-xl transition duration-150 shadow-soft disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <RefreshCw className={`h-4 w-4 text-[#7C5CFC] ${analyzing ? 'animate-spin' : ''}`} />
        <span>{analyzing ? 'Re-analyzing document…' : 'Re-run AI Analysis'}</span>
      </button>
    </div>
  );
}

// Upload area
function UploadArea({ file, isDragging, onClick, onDrop, onDragOver, onDragLeave, onFileChange, inputRef }) {
  return (
    <div
      onClick={onClick}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 sm:p-12 cursor-pointer transition-all duration-200 select-none shadow-card
        ${isDragging
          ? 'border-[#7C5CFC] bg-[#7C5CFC]/10 scale-[1.01]'
          : file
            ? 'border-[#34D399] bg-[#34D399]/5'
            : 'border-[#1F2633] bg-[#141821] hover:border-[#2E384D] hover:bg-[#181D27]'}`}
    >
      <input ref={inputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={onFileChange} />

      {file ? (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/20 shadow-sm">
            <FileText className="h-7 w-7" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-[#F8FAFC] text-sm truncate max-w-xs">{file.name}</p>
            <p className="text-xs text-[#94A3B8]">{fmt(file.size)} · PDF Document</p>
            <p className="text-xs text-[#7C5CFC] font-semibold mt-1">Click to select another file</p>
          </div>
        </>
      ) : (
        <>
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all shadow-sm ${isDragging ? 'bg-[#7C5CFC] text-white' : 'bg-[#181D27] text-[#94A3B8] border border-[#1F2633]'}`}>
            <Upload className="h-7 w-7 text-[#7C5CFC]" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-bold text-[#F8FAFC] text-sm">
              {isDragging ? 'Drop your resume PDF here' : 'Drop your resume PDF here, or browse files'}
            </p>
            <p className="text-xs text-[#64748B]">PDF format · Maximum {MAX_MB} MB</p>
          </div>
        </>
      )}
    </div>
  );
}

export default function Resume() {
  const inputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState('');

  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');

  const selectFile = (f) => {
    setUploadResult(null); setUploadError(''); setAnalysis(null); setAnalysisError('');
    if (!f) return;
    if (f.type !== 'application/pdf') { setUploadError('Only PDF files are accepted.'); return; }
    if (f.size > MAX_BYTES) { setUploadError(`File too large (${fmt(f.size)}). Max ${MAX_MB} MB.`); return; }
    setFile(f);
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); selectFile(e.dataTransfer.files[0]); };

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

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">Resume Analyzer</h1>
        <p className="text-[#94A3B8] text-xs sm:text-sm mt-1">
          Upload your PDF resume to compute your ATS score, discover missing keywords, and get recruiter-level recommendations.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-6 sm:p-8 space-y-6 shadow-card">
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

        {uploadError && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploading && (
          <div className="space-y-2 py-1">
            <div className="flex justify-between text-xs font-semibold text-[#94A3B8]">
              <span>Uploading document…</span><span>{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-[#181D27] overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-[#7C5CFC] to-[#22D3EE] transition-all duration-200" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        {uploadResult?.success && (
          <div className="space-y-5">
            <div className="flex items-start gap-3.5 px-4 py-3.5 rounded-xl bg-[#34D399]/10 border border-[#34D399]/20">
              <div className="mt-0.5 shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-[#34D399] text-[#090B10] font-bold shadow-sm">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-bold text-[#34D399]">Resume uploaded successfully</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">{file?.name} · {fmt(file?.size ?? 0)}</p>
              </div>
            </div>

            {uploadResult.warning && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#FBBF24]/10 border border-[#FBBF24]/20 text-[#FBBF24] text-xs font-medium">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{uploadResult.warning}</span>
              </div>
            )}

            {analysisError && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-[#F87171]/10 border border-[#F87171]/20 text-[#F87171] text-xs font-medium">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}

            {!analysis && (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing || !uploadResult.textExtracted}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] hover:to-[#7C5CFC] disabled:opacity-50 text-white font-bold rounded-xl shadow-glow-purple transition duration-150 flex items-center justify-center gap-2 text-sm"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Analyzing your resume with AI…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Run AI Resume Analysis</span>
                  </>
                )}
              </button>
            )}

            {analysis && (
              <AnalysisPanel
                data={analysis}
                analyzing={analyzing}
                onReanalyze={handleAnalyze}
              />
            )}

            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 text-xs font-semibold text-[#64748B] hover:text-[#94A3B8] transition-colors"
            >
              Upload a different resume PDF
            </button>
          </div>
        )}

        {file && !uploadResult?.success && !uploading && (
          <button
            type="button"
            onClick={handleUpload}
            className="w-full py-3 px-4 bg-gradient-to-r from-[#7C5CFC] to-[#6344E2] hover:from-[#9B7CFF] text-white text-sm font-bold rounded-xl transition duration-150 shadow-glow-purple"
          >
            Upload Resume
          </button>
        )}
      </div>

      {/* Tips card */}
      <div className="bg-[#141821] border border-[#1F2633] rounded-2xl p-5 flex gap-4 items-start shadow-card">
        <div className="mt-0.5 shrink-0 flex h-8 w-8 items-center justify-center rounded-xl bg-[#7C5CFC]/10 text-[#7C5CFC] border border-[#7C5CFC]/20">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="text-xs text-[#94A3B8] space-y-1">
          <p className="font-bold text-[#F8FAFC] text-sm">Tips for best evaluation results</p>
          <ul className="space-y-1 list-disc list-inside text-[#64748B]">
            <li>Use a clean, single-column or standard text PDF rather than a scanned image</li>
            <li>Include measurable metrics (e.g. "improved latency by 30%")</li>
            <li>Ensure target keywords from your desired job description are represented</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
