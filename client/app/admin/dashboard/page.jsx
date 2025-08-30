'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, CheckCircle, Users2, RefreshCcw, ArrowRight } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, accent }) => {
  const accentColors = {
    indigo: 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10',
    green: 'border-green-500/50 text-green-400 bg-green-500/10',
    cyan: 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10',
  };

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg hover:shadow-xl transition-all group">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentColors[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-4xl font-bold tracking-tight text-white">{value}</p>
    </div>
  );
};

const ActionCard = ({ title, description, buttonText, onClick }) => (
  <div
    onClick={onClick}
    className="group relative flex items-start justify-between gap-6 rounded-2xl border border-slate-700 bg-slate-900/80 p-6 shadow-lg hover:shadow-xl transition-all"
  >
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-slate-400">{description}</p>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation(); // prevents double navigation
        onClick();
      }}
      className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
    >
      {buttonText}
      <ArrowRight className="h-4 w-4" />
    </button>
    <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent group-hover:ring-indigo-500/50 transition pointer-events-none" />
  </div>
);

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/admin/metrics`, { credentials: 'include' });
      if (res.ok) setMetrics(await res.json());
    } catch (error) {
      console.error('Failed to fetch metrics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="space-y-12 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-white">Admin Dashboard</h1>
        <button
          onClick={fetchMetrics}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 transition"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {/* Metrics */}
      {loading ? (
        <p className="text-slate-400">Loading metrics...</p>
      ) : metrics ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Users" value={metrics.users.total} icon={Users} accent="indigo" />
          <StatCard title="Verified Users" value={metrics.users.verified} icon={CheckCircle} accent="green" />
          <StatCard title="Teams" value={metrics.teams.total} icon={Users2} accent="cyan" />
        </div>
      ) : (
        <p className="text-red-400">Failed to load metrics.</p>
      )}

      {/* Quick Actions */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-white">Quick Actions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <ActionCard
            title="Manage Users"
            description="View, search, verify, and export all users."
            buttonText="Go"
            onClick={() => router.push('/admin/users')}
          />
          <ActionCard
            title="Manage Teams"
            description="View details for all created teams."
            buttonText="Go"
            onClick={() => router.push('/admin/teams')}
          />
          <ActionCard
            title="Moderate Resources"
            description="Approve or reject user-submitted resources."
            buttonText="Go"
            onClick={() => router.push('/admin/resources')}
          />
          <ActionCard
            title="Review Ideas"
            description="View and delete idea submissions."
            buttonText="Go"
            onClick={() => router.push('/admin/ideas')}
          />
          <ActionCard
            title="Manage Updates"
            description="Create, edit, pin, or delete official announcements."
            buttonText="Go"
            onClick={() => router.push('/admin/updates')}
          />
        </div>
      </div>
    </div>
  );
}
