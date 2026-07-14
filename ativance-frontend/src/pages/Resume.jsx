import { useState, useRef } from 'react';
import { uploadResume } from '../services/authService';

const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
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
            : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
        }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={onFileChange}
      />

      {/* Icon */}
      {file ? (
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      ) : (
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${isDragging ? 'bg-indigo-500/20' : 'bg-slate-700/60'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 transition-colors ${isDragging ? 'text-indigo-400' : 'text-slate-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
      )}

      {/* Text */}
      {file ? (
        <div className="text-center">
          <p className="font-semibold text-emerald-400 text-sm truncate max-w-xs">{file.name}</p>
          <p className="text-xs text-slate-400 mt-0.5">{formatBytes(file.size)} · PDF</p>
          <p className="text-xs text-slate-500 mt-1">Click to choose a different file</p>
        </div>
      ) : (
        <div className="text-center">
          <p className="font-semibold text-slate-200 text-sm">
            {isDragging ? 'Drop your PDF here' : 'Drop your PDF here, or click to browse'}
          </p>
          <p className="text-xs text-slate-500 mt-1">PDF only · max {MAX_MB} MB</p>
        </div>
      )}
    </div>
  );
}

function ProgressBar({ percent }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-400">
        <span>Uploading…</span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function Resume() {
  const inputRef = useRef(null);
  const [file, setFile]           = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [result, setResult]       = useState(null);  // { success, warning?, textExtracted }
  const [error, setError]         = useState('');

  // ── File selection helpers ─────────────────────────────────────────────────
  const selectFile = (f) => {
    setResult(null);
    setError('');

    if (!f) return;
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are accepted. Please choose a .pdf file.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setError(`File is too large (${formatBytes(f.size)}). Please upload a PDF under ${MAX_MB} MB.`);
      return;
    }
    setFile(f);
  };

  const handleFileChange = (e) => selectFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    selectFile(e.dataTransfer.files[0]);
  };

  // ── Upload ─────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    setError('');
    setResult(null);

    try {
      const data = await uploadResume(file, (loaded, total) => {
        setProgress(total ? Math.round((loaded / total) * 100) : 0);
      });
      setProgress(100);
      setResult(data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setError('');
    setProgress(0);
    if (inputRef.current) inputRef.current.value = '';
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Resume Analyzer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Upload your resume and get an AI-powered analysis of your strengths and areas for improvement.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">

        {/* Upload area — hidden once upload succeeded */}
        {!result?.success && (
          <UploadArea
            file={file}
            isDragging={isDragging}
            onClick={() => !uploading && inputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onFileChange={handleFileChange}
            inputRef={inputRef}
          />
        )}

        {/* Client-side validation error */}
        {error && (
          <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Progress bar */}
        {uploading && <ProgressBar percent={progress} />}

        {/* ── Success state ─────────────────────────────────────────────── */}
        {result?.success && (
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
                <p className="text-xs text-slate-400 mt-0.5">
                  {file?.name} · {formatBytes(file?.size ?? 0)}
                </p>
              </div>
            </div>

            {/* Text-extraction warning (non-blocking) */}
            {result.warning && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                {result.warning}
              </div>
            )}

            {/* Analyze Resume button */}
            <button
              type="button"
              disabled={!result.textExtracted}
              title={!result.textExtracted ? 'Text extraction failed — please re-upload a readable PDF.' : ''}
              className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-indigo-900/30 transition-all duration-200 flex items-center justify-center gap-2"
              onClick={() => {/* AI analysis wired in next task */}}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyze Resume
            </button>

            {/* Upload a different file */}
            <button
              type="button"
              onClick={handleReset}
              className="w-full py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Upload a different file
            </button>
          </div>
        )}

        {/* Upload button — shown only when file selected & not yet uploaded */}
        {file && !result?.success && !uploading && (
          <button
            type="button"
            onClick={handleUpload}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition duration-200"
          >
            Upload Resume
          </button>
        )}
      </div>

      {/* Info card */}
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
