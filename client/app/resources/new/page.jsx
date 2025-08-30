'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

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
      const data = new FormData();
      data.append('title', formData.title);
      data.append('category', formData.category);
      if (formData.description) data.append('description', formData.description);

      let endpoint = `${API_BASE_URL}/api/resources`;

      if (submissionType === 'file') {
        if (!file) {
          setError('Please select a file to upload.');
          setLoading(false);
          return;
        }
        data.append('file', file); // ✅ backend expects "file"
        endpoint = `${API_BASE_URL}/api/resources/upload`;
      } else {
        if (!formData.url.trim()) {
          setError('Please enter a valid URL.');
          setLoading(false);
          return;
        }
        data.append('url', formData.url);
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.msg || 'Submission failed.');

      setMessage('✅ Thank you! Your resource has been submitted for review.');
      setTimeout(() => router.push('/resources'), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/resources"
            className="text-purple-400 hover:underline mb-4 inline-block"
          >
            &larr; Back to Resource Hub
          </Link>
          <h1 className="text-4xl font-bold text-white">Suggest a Resource</h1>
          <p className="text-slate-400 mt-2">
            Share a helpful link, tool, or document with the community!
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-lg border border-slate-700 bg-slate-800/70 p-8 shadow-xl backdrop-blur"
        >
          {message && (
            <p className="rounded p-3 text-sm bg-green-500/20 text-green-300">
              {message}
            </p>
          )}
          {error && (
            <p className="rounded p-3 text-sm bg-red-500/20 text-red-300">
              {error}
            </p>
          )}

          {/* Toggle between link / file */}
          <div className="flex gap-2 rounded-lg bg-slate-900 p-1">
            <button
              type="button"
              onClick={() => setSubmissionType('link')}
              className={`flex-1 rounded-md p-2 text-center text-sm font-medium transition-colors ${
                submissionType === 'link'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Submit a Link
            </button>
            <button
              type="button"
              onClick={() => setSubmissionType('file')}
              className={`flex-1 rounded-md p-2 text-center text-sm font-medium transition-colors ${
                submissionType === 'file'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Upload a File
            </button>
          </div>

          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              id="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* URL or File */}
          {submissionType === 'link' ? (
            <div>
              <label
                htmlFor="url"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                URL <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                name="url"
                id="url"
                value={formData.url}
                onChange={handleChange}
                placeholder="https://example.com"
                className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label
                htmlFor="file"
                className="block text-sm font-medium text-gray-300 mb-1"
              >
                File <span className="text-red-400">*</span>
              </label>
              <input
                type="file"
                name="file"
                id="file"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-white hover:file:bg-slate-600"
              />
            </div>
          )}

          {/* Description (optional) */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Description (optional)
            </label>
            <textarea
              name="description"
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white focus:ring-2 focus:ring-indigo-500"
            ></textarea>
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Category
            </label>
            <select
              name="category"
              id="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-700 bg-slate-900 p-3 text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option>Tools</option>
              <option>Tutorials</option>
              <option>API</option>
              <option>Design</option>
              <option>Development</option>
              <option>Other</option>
            </select>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-5 py-3 font-medium text-white transition-transform hover:scale-105 hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
