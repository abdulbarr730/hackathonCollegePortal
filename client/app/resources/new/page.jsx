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
  AlertCircle
} from 'lucide-react';

export default function SuggestResourcePage() {
  const [submissionType, setSubmissionType] = useState('link'); // 'link' or 'file'
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    description: '',
    category: 'Tools',
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
        data.append('file', file);

        endpoint = '/api/resources/upload';

        res = await fetch(endpoint, {
          method: 'POST',
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
          body: JSON.stringify(formData),
        });
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.msg || 'Submission failed.');

      setMessage('Resource submitted successfully!');
      setTimeout(() => router.push('/resources'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // BREAKOUT UTILITY: Full screen width background
    <div className="relative w-screen left-[50%] right-[50%] -ml-[50vw] -mr-[50vw] min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 selection:bg-indigo-500/30 flex flex-col">
      
      {/* 1. BACKGROUND */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-indigo-500/5 dark:bg-indigo-500/10 blur-[120px] rounded-full" />
      </div>

      {/* MAIN CONTENT */}
      <div className="relative z-10 w-full max-w-3xl mx-auto px-6 py-12 flex-grow flex flex-col justify-center">
        
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/resources"
            className="group inline-flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Resource Hub
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-3">
            Contribute to the <span className="text-indigo-600 dark:text-indigo-400">Vault</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl">
            Share a helpful tool, library, or guide with the community. All submissions are reviewed before going live.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-black/20 p-8 md:p-10">
          
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Alerts */}
            {message && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
                <CheckCircle2 size={20} />
                <span className="font-medium">{message}</span>
              </div>
            )}
            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 flex items-center gap-3">
                <AlertCircle size={20} />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Submission Type Toggle */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                Resource Type
              </label>
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSubmissionType('link')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    submissionType === 'link'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <LinkIcon size={18} /> Submit Link
                </button>
                <button
                  type="button"
                  onClick={() => setSubmissionType('file')}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                    submissionType === 'file'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  <UploadCloud size={18} /> Upload File
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label htmlFor="title" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Type size={16} className="text-indigo-500" /> Resource Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  placeholder="e.g. Ultimate React Cheatsheet"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>

              {/* URL or File Input */}
              {submissionType === 'link' ? (
                <div className="space-y-2">
                  <label htmlFor="url" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <Globe size={16} className="text-indigo-500" /> Resource URL <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="url"
                    name="url"
                    id="url"
                    required
                    placeholder="https://example.com/resource"
                    value={formData.url}
                    onChange={handleChange}
                    className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="file" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                    <FileText size={16} className="text-indigo-500" /> Upload Document <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      name="file"
                      id="file"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-slate-500 dark:text-slate-400
                        file:mr-4 file:py-2.5 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-bold
                        file:bg-indigo-50 file:text-indigo-600
                        dark:file:bg-slate-800 dark:file:text-indigo-400
                        hover:file:bg-indigo-100 dark:hover:file:bg-slate-700
                        cursor-pointer transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-500 font-medium pl-1">
                    Max size: 10MB. Supported: PDF, DOCX, ZIP.
                  </p>
                </div>
              )}

              {/* Category Select */}
              <div className="space-y-2">
                <label htmlFor="category" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Layers size={16} className="text-indigo-500" /> Category
                </label>
                <div className="relative">
                  <select
                    name="category"
                    id="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full h-12 pl-4 pr-10 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none appearance-none cursor-pointer font-medium transition-all"
                  >
                    <option>Tools</option>
                    <option>Tutorials</option>
                    <option>API</option>
                    <option>Design</option>
                    <option>Development</option>
                    <option>Boilerplates</option>
                    <option>Other</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              {/* Description Textarea */}
              <div className="space-y-2">
                <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                  <Sparkles size={16} className="text-indigo-500" /> Description <span className="text-slate-400 font-normal text-xs">(Optional)</span>
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows="4"
                  placeholder="Briefly describe what makes this resource useful..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium resize-none"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-lg shadow-xl shadow-slate-900/10 hover:shadow-2xl hover:shadow-indigo-500/20 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit for Review
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}