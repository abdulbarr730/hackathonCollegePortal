'use client';
import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { 
  Eye, EyeOff, User, Mail, BookOpen, Calendar, 
  Save, Upload, Trash2, Link as LinkIcon, 
  Github, Linkedin, Globe, Code, Terminal, Cpu, Database 
} from 'lucide-react';

const PLATFORMS_META = {
  linkedin: { label: 'LinkedIn', icon: Linkedin, placeholder: 'https://www.linkedin.com/in/your-id' },
  github: { label: 'GitHub', icon: Github, placeholder: 'https://github.com/your-id' },
  stackoverflow: { label: 'Stack Overflow', icon: Database, placeholder: 'https://stackoverflow.com/users/your-id'},
  devto: { label: 'Dev.to', icon: Code, placeholder: 'https://dev.to/your-id'},
  medium: { label: 'Medium', icon: BookOpen, placeholder: 'https://medium.com/@your-id'},
  leetcode: { label: 'LeetCode', icon: Terminal, placeholder: 'https://leetcode.com/your-id'},
  geeksforgeeks: { label: 'GeeksforGeeks', icon: Code, placeholder: 'https://auth.geeksforgeeks.org/user/your-id'},
  kaggle: { label: 'Kaggle', icon: Cpu, placeholder: 'https://kaggle.com/your-id' },
  codeforces: { label: 'Codeforces', icon: Terminal, placeholder: 'https://codeforces.com/profile/your-id' },
  codechef: { label: 'CodeChef', icon: Code, placeholder: 'https://www.codechef.com/users/your-id' },
  website: { label: 'Portfolio / Website', icon: Globe, placeholder: 'https://your-portfolio.com' },
};

export default function ProfilePage() {
  const { user, recheckUser } = useAuth();
  const [tab, setTab] = useState('profile');

  // State for Forms
  const [file, setFile] = useState(null);
  const [links, setLinks] = useState({});
  const [profileData, setProfileData] = useState({ name: '', email: '', year: '', course: '' });
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '' });
  const [showPassword, setShowPassword] = useState(false);

  // State for Messages
  const [photoMsg, setPhotoMsg] = useState('');
  const [linksMsg, setLinksMsg] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        course: user.course || '',
        year: user.year || '',
      });
      setLinks(user.socialProfiles || {});
    }
  }, [user]);

  // --- HANDLERS ---
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      const res = await fetch(`/api/users/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(profileData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to update profile.');
      setProfileMsg('Profile updated successfully!');
      recheckUser();
    } catch (err) {
      setProfileMsg(err.message);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMsg('');
    if (passwordData.newPassword.length < 6) {
      setPasswordMsg('New password must be at least 6 characters.');
      return;
    }
    try {
      const res = await fetch(`/api/users/change-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(passwordData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Failed to change password.');
      setPasswordMsg('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPasswordMsg(err.message);
    }
  };

  function validateFile(file) {
    if (!file) return 'Select a file.';
    const max = 2 * 1024 * 1024; // 2 MB
    if (file.size > max) return 'File too large. Maximum size is 2 MB.';
    const ok = ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.type);
    if (!ok) return 'Only JPG/PNG/WEBP allowed.';
    return '';
  }

  async function uploadPhoto() {
    const validationError = validateFile(file);
    if (validationError) { setPhotoMsg(validationError); return; }
    setPhotoMsg('Uploading...');
    const fd = new FormData();
    fd.append('photo', file);

    try {
      const res = await fetch(`/api/profile/photo`, { method: 'POST', credentials: 'include', body: fd });
      const j = await res.json();
      if (!res.ok) throw new Error(j.msg || 'Upload failed');
      setPhotoMsg('Photo updated successfully!');
      setFile(null); // Clear file input
      recheckUser();
    } catch (e) {
      setPhotoMsg(e.message || 'Upload failed. Please try again.');
    }
  }

  async function removePhoto() {
    setPhotoMsg('');
    if (!window.confirm('Are you sure you want to remove your photo?')) return;
    try {
      const res = await fetch(`/api/profile/photo`, { method: 'DELETE', credentials: 'include' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.msg || 'Remove failed');
      setPhotoMsg('Photo removed.');
      recheckUser();
    } catch (e) {
      setPhotoMsg(e.message);
    }
  }

  const onChangeLink = (key, v) => setLinks((prev) => ({ ...prev, [key]: v }));

  async function saveLinks() {
    setLinksMsg('');
    try {
      const res = await fetch(`/api/users/social/me`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ socialProfiles: links }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.msg || 'Save failed');
      setLinksMsg('Links saved successfully!');
    } catch(e) {
      setLinksMsg(e.message);
    }
  }

  // Helper for Messages
  const Message = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.toLowerCase().includes('success') || msg.toLowerCase().includes('saved');
    return (
      <div className={`rounded-xl p-3 text-sm font-medium border ${isSuccess ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400' : 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400'}`}>
        {msg}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 py-10">
      
      {/* Background Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6">
        
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-8">
          Edit Profile
        </h1>

        {/* TABS */}
        <div className="flex p-1 mb-8 gap-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 w-fit shadow-sm">
          {['profile', 'photo', 'links'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`
                px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all
                ${tab === t 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                }
              `}
            >
              {t === 'links' ? 'Social Links' : t}
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          
          {/* PROFILE TAB */}
          {tab === 'profile' && (
            <div className="p-6 sm:p-8 space-y-8">
              
              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Personal Details</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Update your basic information.</p>
                  <Message msg={profileMsg} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        name="name" 
                        value={profileData.name} 
                        onChange={handleProfileChange} 
                        disabled={user?.nameUpdateCount >= 2} 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none disabled:opacity-60" 
                      />
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                      Changes remaining: <span className="text-indigo-600 dark:text-indigo-400">{Math.max(0, 2 - (user?.nameUpdateCount || 0))}</span>
                    </p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        name="email" 
                        value={profileData.email} 
                        disabled
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed outline-none" 
                      />
                    </div>
                  </div>

                  {/* Course */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Course</label>
                    <div className="relative">
                      <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        name="course" 
                        value={profileData.course} 
                        onChange={handleProfileChange}
                        disabled={user?.courseUpdateCount >= 4}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-60"
                      >
                        <option value="B.Tech">B.Tech</option>
                        <option value="BCA">BCA</option>
                        <option value="Diploma">Diploma</option>
                      </select>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                      Changes remaining: <span className="text-indigo-600 dark:text-indigo-400">{Math.max(0, 4 - (user?.courseUpdateCount || 0))}</span>
                    </p>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Academic Year</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <select 
                        name="year" 
                        value={profileData.year} 
                        onChange={handleProfileChange} 
                        disabled={user?.yearUpdateCount >= 4} 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer disabled:opacity-60"
                      >
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    <p className="text-xs font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                      Changes remaining: <span className="text-indigo-600 dark:text-indigo-400">{Math.max(0, 4 - (user?.yearUpdateCount || 0))}</span>
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button type="submit" className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all">
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </form>

              <div className="border-t border-slate-100 dark:border-slate-800 my-8" />

              <form onSubmit={handlePasswordSubmit} className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Security</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Update your password.</p>
                  <Message msg={passwordMsg} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Current Password</label>
                    <input 
                      name="currentPassword" 
                      type="password" 
                      value={passwordData.currentPassword} 
                      onChange={handlePasswordChange} 
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">New Password</label>
                    <div className="relative">
                      <input 
                        name="newPassword" 
                        type={showPassword ? 'text' : 'password'} 
                        value={passwordData.newPassword} 
                        onChange={handlePasswordChange} 
                        className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none" 
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)} 
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" className="flex items-center gap-2 rounded-xl bg-slate-900 dark:bg-white px-6 py-2.5 font-bold text-white dark:text-slate-900 hover:opacity-90 active:scale-95 transition-all">
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* PHOTO TAB */}
          {tab === 'photo' && (
            <div className="p-6 sm:p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="mb-8 flex justify-center">
                  <div className="relative group">
                    <Avatar name={user?.name} src={user?.photoUrl} size={128} className="ring-4 ring-slate-100 dark:ring-slate-800 shadow-xl" />
                    <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Upload className="text-white opacity-80" size={32} />
                    </div>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Profile Photo</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  Upload a professional picture. <br/> Supported: JPG, PNG, WEBP (Max 2MB).
                </p>

                <Message msg={photoMsg} />

                <div className="mt-6 flex flex-col gap-4">
                  <div className="relative">
                     <input 
                      type="file" 
                      id="photo-upload"
                      accept="image/png,image/jpeg,image/webp" 
                      onChange={(e) => setFile(e.target.files?.[0] || null)} 
                      className="hidden" 
                    />
                    <label 
                      htmlFor="photo-upload"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all text-sm font-semibold text-slate-600 dark:text-slate-300"
                    >
                      {file ? file.name : 'Choose a file'}
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={uploadPhoto} 
                      disabled={!file}
                      className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Upload New Photo
                    </button>
                    <button 
                      onClick={removePhoto} 
                      className="px-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                      title="Remove Photo"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LINKS TAB */}
          {tab === 'links' && (
            <div className="p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                   <h2 className="text-xl font-bold text-slate-900 dark:text-white">Social Presence</h2>
                   <p className="text-sm text-slate-500 dark:text-slate-400">Add links to your profiles so teammates can find you.</p>
                </div>
                <button onClick={saveLinks} className="hidden sm:flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 active:scale-95 transition-all">
                  <Save size={18} /> Save All
                </button>
              </div>

              <Message msg={linksMsg} />

              <div className="mt-6 grid grid-cols-1 gap-4">
                {Object.entries(PLATFORMS_META).map(([key, { label, icon: Icon, placeholder }]) => (
                  <div key={key} className="group">
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                      {label}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                        {Icon ? <Icon size={18} /> : <LinkIcon size={18} />}
                      </div>
                      <input 
                        value={links[key] || ''} 
                        onChange={(e) => onChangeLink(key, e.target.value)} 
                        placeholder={placeholder} 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all outline-none text-sm placeholder:text-slate-400" 
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile Save Button */}
              <div className="mt-6 sm:hidden">
                 <button onClick={saveLinks} className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all">
                  <Save size={18} /> Save All
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}