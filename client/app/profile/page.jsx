'use client';
import { useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';

const PLATFORMS_META = {
  linkedin: { label: 'LinkedIn', placeholder: 'https://www.linkedin.com/in/your-id' },
  github: { label: 'GitHub', placeholder: 'https://github.com/your-id' },
  stackoverflow: { label: 'Stack Overflow', placeholder: 'https://stackoverflow.com/users/your-id'},
  devto: { label: 'Dev.to', placeholder: 'https://dev.to/your-id'},
  medium: { label: 'Medium', placeholder: 'https://medium.com/@your-id'},
  leetcode: { label: 'LeetCode', placeholder: 'https://leetcode.com/your-id'},
  geeksforgeeks: { label: 'GeeksforGeeks', placeholder: 'https://auth.geeksforgeeks.org/user/your-id'},
  kaggle: { label: 'Kaggle', placeholder: 'https://kaggle.com/your-id' },
  codeforces: { label: 'Codeforces', placeholder: 'https://codeforces.com/profile/your-id' },
  codechef: { label: 'CodeChef', placeholder: 'https://www.codechef.com/users/your-id' },
};

export default function ProfilePage() {
  const { user, recheckUser } = useAuth();
  const [tab, setTab] = useState('profile');

  // State for Forms
  const [file, setFile] = useState(null);
  const [links, setLinks] = useState({});
  const [profileData, setProfileData] = useState({ name: '', email: '', year: '' });
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
        year: user.year || '',
      });
      setLinks(user.socialProfiles || {});
    }
  }, [user]);

  // Profile & Password Handlers
  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMsg('');
    try {
      const res = await fetch(`${API}/api/users/profile`, {
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
      const res = await fetch(`${API}/api/users/change-password`, {
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

  // Photo Handlers
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
    if (validationError) { 
      setPhotoMsg(validationError); 
      return; 
    }
    setPhotoMsg('Uploading...');
    const fd = new FormData();
    fd.append('photo', file);
    
    try {
      const res = await fetch(`${API}/api/users/profile/photo`, {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.msg || 'Upload failed');
      setPhotoMsg('Photo updated successfully!');
      recheckUser();
    } catch (e) {
      setPhotoMsg('Upload failed. Please try again.');
    }
  }

  async function removePhoto() {
    setPhotoMsg('');
    if (!window.confirm('Are you sure you want to remove your photo?')) return;
    try {
      const res = await fetch(`${API}/api/users/profile/photo`, { method: 'DELETE', credentials: 'include' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.msg || 'Remove failed');
      setPhotoMsg('Photo removed.');
      recheckUser();
    } catch (e) {
      setPhotoMsg(e.message);
    }
  }

  // Social Links Handlers
  const onChangeLink = (key, v) => setLinks((prev) => ({ ...prev, [key]: v }));

  async function saveLinks() {
    setLinksMsg('');
    try {
      const res = await fetch(`${API}/api/users/social`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(links),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.msg || 'Save failed');
      setLinksMsg('Links saved successfully!');
    } catch(e) {
      setLinksMsg(e.message);
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6 text-slate-200 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Edit Profile</h1>
      
      <div className="mb-6 flex gap-2 border-b border-slate-700">
        <button className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'profile' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`} onClick={() => setTab('profile')}>Profile</button>
        <button className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'photo' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`} onClick={() => setTab('photo')}>Photo</button>
        <button className={`border-b-2 px-4 py-2 text-sm font-medium ${tab === 'links' ? 'border-purple-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`} onClick={() => setTab('links')}>Social Links</button>
      </div>

      {tab === 'profile' && (
        <section className="space-y-8">
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold">Account Details</h2>
            {profileMsg && <div className={`rounded p-3 text-sm ${profileMsg.includes('success') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{profileMsg}</div>}
            
            <div>
              <label className="block text-sm text-slate-300 mb-1">Name</label>
              <input name="name" value={profileData.name} onChange={handleProfileChange} disabled={user?.nameUpdateCount >= 2} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm disabled:opacity-50" />
              <p className="text-xs text-slate-500 mt-1">Changes remaining: {Math.max(0, 2 - (user?.nameUpdateCount || 0))}</p>
            </div>
            
            <div>
              <label className="block text-sm text-slate-300 mb-1">Email</label>
              <input name="email" value={profileData.email} onChange={handleProfileChange} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">Academic Year</label>
              <select name="year" value={profileData.year} onChange={handleProfileChange} disabled={user?.yearUpdateCount >= 4} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white disabled:opacity-50">
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
              <p className="text-xs text-slate-500 mt-1">Changes remaining: {Math.max(0, 4 - (user?.yearUpdateCount || 0))}</p>
            </div>

            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95">Save Profile</button>
          </form>

          <form onSubmit={handlePasswordSubmit} className="space-y-4 border-t border-slate-700 pt-8">
            <h2 className="text-xl font-semibold">Change Password</h2>
            {passwordMsg && <div className={`rounded p-3 text-sm ${passwordMsg.includes('success') ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>{passwordMsg}</div>}

            <div>
              <label className="block text-sm text-slate-300 mb-1">Current Password</label>
              <input name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1">New Password</label>
              <div className="relative">
                <input name="newPassword" type={showPassword ? 'text' : 'password'} value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95">Change Password</button>
          </form>
        </section>
      )}

      {tab === 'photo' && (
        <section>
          {photoMsg && <div className="mb-4 rounded p-3 text-sm bg-slate-700 text-white">{photoMsg}</div>}
          <div className="flex items-center gap-4">
            <Avatar name={user?.name} src={user?.photoUrl} size={72} />
            <div>
                <p className="font-medium text-white">Upload a new photo</p>
                <p className="text-xs text-slate-400 mt-1">JPG, PNG, or WEBP. Max size of 2MB.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-gray-400 file:mr-4 file:rounded-md file:border-0 file:bg-slate-700 file:px-4 file:py-2 file:text-white hover:file:bg-slate-600" />
          </div>
           <div className="mt-4 flex items-center gap-2">
                <button onClick={uploadPhoto} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">Save Photo</button>
                <button onClick={removePhoto} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Remove</button>
            </div>
        </section>
      )}

      {tab === 'links' && (
        <section>
          {linksMsg && <div className="mb-4 rounded p-3 text-sm bg-green-500/20 text-green-300">{linksMsg}</div>}
          <p className="text-slate-400 mb-4">Add your professional social media handles to display on your team profile.</p>
          <div className="space-y-4">
            {Object.entries(PLATFORMS_META).map(([key, { label, placeholder }]) => (
              <div key={key}>
                <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
                <input value={links[key] || ''} onChange={(e) => onChangeLink(key, e.target.value)} placeholder={placeholder} className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
              </div>
            ))}
            <button onClick={saveLinks} className="rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white transition-transform duration-200 hover:scale-105 active:scale-95">Save Links</button>
          </div>
        </section>
      )}
    </div>
  );
}