'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Link as LinkIcon, 
  UploadCloud, 
  Type, 
  Globe, 
  FileText, 
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lock,
  Building2
} from 'lucide-react';

export default function SuggestResourcePage() {
  const [submissionType, setSubmissionType] = useState('link'); // 'link' or 'file'
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'Tools',
    visibility: 'private', // Default: Private (College only)
  });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      let endpoint = '/api/resources';
      let res;

      if (submissionType === 'file') {
        if (!file) {
          setError('Please select a file to upload.');
          setLoading(false);
          return;
        }

        const data = new FormData();
        data.append('title', formData.title);
        data.append('category', formData.category);
        if (formData.description) data.append('description', formData.description);
        data.append('visibility', formData.visibility);
        data.append('file', file);

        endpoint = '/api/resources/upload';

        res = await fetch(endpoint, {
          method: 'POST',
          credentials: 'include',
          body: data,
        });
      } else {
        if (!formData.url.trim()) {
          setError('Please enter a valid URL.');
          setLoading(false);
          return;
        }

        res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.msg || 'Submission failed.');

      setMessage('Resource submitted successfully for moderation!');
      setTimeout(() => router.push('/resources'), 1800);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 selection:bg-indigo-500/30 flex flex-col">
      <div className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Navigation */}
        <Link 
          href="/resources" 
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Resource Hub
        </Link>

        {/* Card */}
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-8">
          
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles size={13} /> Institutional Knowledge Base
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Contribute a Resource
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Share development templates, design assets, PPT boilerplates, or APIs with your college peers.
            </p>
          </div>

          {message && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-sm flex items-center gap-3">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-sm flex items-center gap-3">
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Format Selector */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSubmissionType('link')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  submissionType === 'link'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <LinkIcon size={16} /> External Web Link
              </button>
              <button
                type="button"
                onClick={() => setSubmissionType('file')}
                className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all ${
                  submissionType === 'file'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <UploadCloud size={16} /> Upload Document / File
              </button>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Type size={14} className="text-indigo-500" /> Resource Title *
              </label>
              <input
                type="text"
                name="title"
                required
                placeholder="e.g. SIH 2026 Pitch Deck Architecture Template"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Layers size={14} className="text-indigo-500" /> Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
              >
                <option value="Tools">Tools &amp; SDKs</option>
                <option value="Documentation">Documentation &amp; Guides</option>
                <option value="Datasets">Datasets &amp; Models</option>
                <option value="Templates">Templates &amp; PPT Formats</option>
                <option value="UI Kits">UI Kits &amp; Design Assets</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Visibility Selector: Default is Private */}
            <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                <Lock size={14} /> Sharing &amp; Visibility Policy (Default: Private)
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label 
                  onClick={() => setFormData({...formData, visibility: 'private'})}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    formData.visibility === 'private'
                      ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="private"
                    checked={formData.visibility === 'private'}
                    onChange={handleChange}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      🔒 Private (My College Only) <span className="text-[10px] px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded font-black">Default</span>
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Only verified students, mentors, and SPOCs from your college campus can view this.
                    </span>
                  </div>
                </label>

                <label 
                  onClick={() => setFormData({...formData, visibility: 'public'})}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    formData.visibility === 'public'
                      ? 'border-indigo-600 bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm ring-1 ring-indigo-500/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    value="public"
                    checked={formData.visibility === 'public'}
                    onChange={handleChange}
                    className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      🌐 Public (All Institutions)
                    </span>
                    <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Visible to all verified students across all partner colleges. Editable only by your college admin.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* URL or File upload input */}
            {submissionType === 'link' ? (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Globe size={14} className="text-indigo-500" /> Resource URL Link *
                </label>
                <input
                  type="url"
                  name="url"
                  required={submissionType === 'link'}
                  placeholder="https://github.com/example/sih-starter or https://figma.com/..."
                  value={formData.url}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono text-xs sm:text-sm"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <UploadCloud size={14} className="text-indigo-500" /> Attach File (PDF, PPTX, ZIP, DOCX) *
                </label>
                <input
                  type="file"
                  required={submissionType === 'file'}
                  onChange={handleFileChange}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-xs file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <FileText size={14} className="text-indigo-500" /> Description &amp; Usage Notes
              </label>
              <textarea
                name="description"
                rows={3}
                placeholder="Explain what this resource contains and how team leaders can use it..."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50"
            >
              {loading ? 'Publishing Resource...' : 'Submit Resource for Verification'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
