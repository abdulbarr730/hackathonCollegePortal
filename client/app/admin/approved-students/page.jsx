'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Upload, FileSpreadsheet, Plus, Trash2, Search, Filter, 
  CheckCircle, AlertCircle, RefreshCw, Loader2, Users, 
  Building2, GraduationCap, X, CheckSquare, Square, Download
} from 'lucide-react';

export default function ApprovedStudentsAdminPage() {
  const { user } = useAuth();

  // Data states
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });
  const [colleges, setColleges] = useState([]);
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Selection states for bulk delete
  const [selectedIds, setSelectedIds] = useState([]);

  // Upload states
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCollegeId, setUploadCollegeId] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  // Single Add modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [singleRoll, setSingleRoll] = useState('');
  const [singleName, setSingleName] = useState('');
  const [singleEmail, setSingleEmail] = useState('');
  const [singleCourse, setSingleCourse] = useState('B.Tech');
  const [singleYear, setSingleYear] = useState('1');
  const [singleDept, setSingleDept] = useState('');
  const [singleCollegeId, setSingleCollegeId] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Fetch colleges for filtering/assigning
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch('/api/colleges/public');
        const data = await res.json();
        if (res.ok) setColleges(data.items || []);
      } catch (err) {
        console.error('Failed to load colleges', err);
      }
    };
    fetchColleges();
  }, []);

  // Fetch approved students list
  const loadStudents = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        q: searchQuery,
      });
      if (selectedCollegeFilter !== 'all') {
        params.append('collegeId', selectedCollegeFilter);
      }

      const res = await fetch(`/api/admin/approved-students?${params.toString()}`, {
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.items || []);
        setPagination(data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      }
    } catch (err) {
      console.error('Failed to load approved students', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCollegeFilter]);

  useEffect(() => {
    loadStudents(1);
  }, [loadStudents]);

  // Handle Bulk Upload
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append('file', uploadFile);
    if (uploadCollegeId) {
      formData.append('collegeId', uploadCollegeId);
    }

    try {
      const res = await fetch('/api/admin/approved-students/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Upload failed');

      setUploadResult(data);
      setUploadFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      loadStudents(1);
    } catch (err) {
      setUploadResult({ errors: [err.message] });
    } finally {
      setUploading(false);
    }
  };

  // Handle Single Student Add
  const handleSingleAdd = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddLoading(true);

    try {
      const res = await fetch('/api/admin/approved-students/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({
          rollNumber: singleRoll,
          name: singleName,
          email: singleEmail,
          course: singleCourse,
          year: singleYear,
          department: singleDept,
          collegeId: singleCollegeId || user?.college
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to add student');

      setShowAddModal(false);
      setSingleRoll('');
      setSingleName('');
      setSingleEmail('');
      setSingleDept('');
      loadStudents(1);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAddLoading(false);
    }
  };

  // Handle Delete Single Record
  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this student from the approved list?')) return;

    try {
      const res = await fetch(`/api/admin/approved-students/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (res.ok) {
        setSelectedIds(prev => prev.filter(item => item !== id));
        loadStudents(pagination.page);
      }
    } catch (err) {
      alert('Delete failed');
    }
  };

  // Handle Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} approved student records?`)) return;

    try {
      const res = await fetch('/api/admin/approved-students/bulk-delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token') || ''}`
        },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setSelectedIds([]);
        loadStudents(pagination.page);
      }
    } catch (err) {
      alert('Bulk delete failed');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === students.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(students.map(s => s._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet size={26} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Approved Students Engine
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Bulk upload roll number rosters. Duplicates are automatically skipped. Matches auto-verify on signup.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all"
          >
            <Plus size={18} /> Add Single Student
          </button>
        </div>
      </div>

      {/* Upload Zone Card */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-indigo-500/5">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4">
          <Upload size={20} className="text-indigo-600 dark:text-indigo-400" />
          Bulk Upload Spreadsheet (Excel / CSV)
        </h2>

        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* File Input */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Select .xlsx, .xls, or .csv File
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                required
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 dark:file:bg-indigo-950 file:text-indigo-600 dark:file:text-indigo-400 hover:file:bg-indigo-100 cursor-pointer rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-2"
              />
            </div>

            {/* College Assignment (for Super Admins) */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Assign to College
              </label>
              <select
                value={uploadCollegeId}
                onChange={(e) => setUploadCollegeId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Default / General Roster</option>
                {colleges.map((c) => (
                  <option key={c._id} value={c._id}>{c.name} {c.shortName ? `(${c.shortName})` : ''}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-slate-400">
              Columns recognized: <span className="font-semibold text-slate-600 dark:text-slate-300">Roll Number, Name, Email, Course, Year, Department</span>.
            </p>
            <button
              type="submit"
              disabled={!uploadFile || uploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-md shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Processing & Deduplicating...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Upload & Deduplicate
                </>
              )}
            </button>
          </div>
        </form>

        {/* Upload Results Feedback */}
        {uploadResult && (
          <div className="mt-6 p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-500" />
                Upload Processing Complete
              </h3>
              <button onClick={() => setUploadResult(null)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center my-3">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-bold text-slate-400">Total in Sheet</div>
                <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">{uploadResult.totalRows ?? 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Newly Added</div>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">{uploadResult.addedCount ?? 0}</div>
              </div>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400">Duplicates Skipped</div>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">{uploadResult.skippedCount ?? 0}</div>
              </div>
            </div>

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="mt-2 text-xs text-red-600 dark:text-red-400 space-y-1">
                <div className="font-bold">Warnings / Skipped Rows:</div>
                {uploadResult.errors.slice(0, 5).map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roster Table Section */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-xl overflow-hidden">
        
        {/* Table Filters Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-grow max-w-xl">
            <div className="relative flex-grow min-w-[200px]">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roll number, name, dept..."
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <select
              value={selectedCollegeFilter}
              onChange={(e) => setSelectedCollegeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Colleges</option>
              {colleges.map((c) => (
                <option key={c._id} value={c._id}>{c.shortName || c.name}</option>
              ))}
            </select>

            <button
              onClick={() => loadStudents(1)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Refresh Roster"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md shadow-red-500/20 flex items-center gap-1.5 transition-all"
            >
              <Trash2 size={14} /> Delete Selected ({selectedIds.length})
            </button>
          )}
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/60 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll} className="text-slate-400 hover:text-slate-600">
                    {selectedIds.length === students.length && students.length > 0 ? (
                      <CheckSquare size={18} className="text-indigo-600" />
                    ) : (
                      <Square size={18} />
                    )}
                  </button>
                </th>
                <th className="p-4">Roll Number</th>
                <th className="p-4">Student Name</th>
                <th className="p-4">College</th>
                <th className="p-4">Course & Year</th>
                <th className="p-4">Department</th>
                <th className="p-4">Email</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Loader2 size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                    Loading approved student list...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    <Users size={32} className="mx-auto mb-2 text-slate-300 dark:text-slate-700" />
                    No pre-approved students found. Upload an Excel sheet above to add records.
                  </td>
                </tr>
              ) : (
                students.map((st) => (
                  <tr key={st._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <button onClick={() => toggleSelectOne(st._id)} className="text-slate-400 hover:text-slate-600">
                        {selectedIds.includes(st._id) ? (
                          <CheckSquare size={18} className="text-indigo-600" />
                        ) : (
                          <Square size={18} />
                        )}
                      </button>
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {st.rollNumber}
                    </td>
                    <td className="p-4 font-bold text-slate-900 dark:text-white">
                      {st.name}
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      {st.college?.shortName || st.college?.name || 'General / Global'}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {st.course || 'B.Tech'} {st.year ? `- Year ${st.year}` : ''}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400">
                      {st.department || 'N/A'}
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 text-xs">
                      {st.email || 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(st._id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                        title="Remove student"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing {students.length} of {pagination.total} records (Page {pagination.page} of {pagination.pages})
            </div>
            <div className="flex gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadStudents(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => loadStudents(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Single Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Add Approved Student</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              Individual student record for automatic verification on registration.
            </p>

            {addError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-xs text-red-600 border border-red-200 dark:border-red-800">
                {addError}
              </div>
            )}

            <form onSubmit={handleSingleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Roll Number *</label>
                <input
                  type="text"
                  required
                  value={singleRoll}
                  onChange={(e) => setSingleRoll(e.target.value)}
                  placeholder="e.g. 210056010001"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Student Name *</label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  placeholder="Student full name"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Course</label>
                  <select
                    value={singleCourse}
                    onChange={(e) => setSingleCourse(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="BCA">BCA</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Year</label>
                  <select
                    value={singleYear}
                    onChange={(e) => setSingleYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                  >
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Department / Branch</label>
                <input
                  type="text"
                  value={singleDept}
                  onChange={(e) => setSingleDept(e.target.value)}
                  placeholder="CSE, IT, ECE..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">College</label>
                <select
                  value={singleCollegeId}
                  onChange={(e) => setSingleCollegeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-white"
                >
                  <option value="">Default / General Roster</option>
                  {colleges.map((c) => (
                    <option key={c._id} value={c._id}>{c.name} {c.shortName ? `(${c.shortName})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  {addLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
