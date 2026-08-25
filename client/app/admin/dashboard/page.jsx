'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, Loader2, Users, CheckCircle, Users2, RefreshCcw, ArrowRight, Trophy, FileSpreadsheet, Megaphone, Lightbulb, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ title, value, icon: Icon, accent }) => {
  const accentColors = {
    indigo: 'border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10',
    green: 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10',
    cyan: 'border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10',
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentColors[accent]}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">{value}</p>
    </div>
  );
};

const ActionCard = ({ title, description, buttonText, onClick, icon: Icon }) => (
  <div
    onClick={onClick}
    className="group relative flex items-start justify-between gap-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm hover:shadow-md hover:border-indigo-500/50 transition-all cursor-pointer"
  >
    <div>
      <div className="flex items-center gap-2.5 mb-1.5">
        {Icon && <Icon className="text-indigo-600 dark:text-indigo-400 h-5 w-5" />}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </div>
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="shrink-0 flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white hover:bg-indigo-500 transition shadow-sm"
    >
      {buttonText}
      <ArrowRight className="h-3.5 w-3.5" />
    </button>
  </div>
);

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const router = useRouter();

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/metrics', { credentials: 'include' });
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

  const isSuperAdmin = user?.role === 'admin' && !user?.college;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isSuperAdmin ? 'Platform Super Dashboard' : 'College Management Console'}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time metrics, onboarding controls, roster management, and event governance.
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          className="self-start sm:self-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh Metrics
        </button>
      </div>

      {/* Metrics Grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 animate-pulse">
           {[1,2,3].map(i => <div key={i} className="h-32 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800"></div>)}
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Registered Users" value={metrics.users?.total ?? 0} icon={Users} accent="indigo" />
          <StatCard title="Auto / Verified Students" value={metrics.users?.verified ?? 0} icon={CheckCircle} accent="green" />
          <StatCard title="Total Teams Formed" value={metrics.teams?.total ?? 0} icon={Users2} accent="cyan" />
        </div>
      ) : (
        <p className="text-red-500 text-sm">Failed to load metrics.</p>
      )}

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Admin Controls & Workflows</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {isSuperAdmin && (
            <ActionCard
              title="Colleges Governance & Onboarding"
              description="Verify new colleges, add SPOC email access, and create their initial credentials."
              buttonText="Manage"
              icon={Building2}
              onClick={() => router.push('/admin/colleges')}
            />
          )}

          <ActionCard
            title="Approved Students (Bulk Upload)"
            description="Upload spreadsheets of approved roll numbers. Duplicate records are skipped automatically."
            buttonText="Rosters"
            icon={FileSpreadsheet}
            onClick={() => router.push('/admin/approved-students')}
          />
          
          <ActionCard
            title="Manage Internal Hackathons"
            description="Create college editions, set active events, and configure team size and gender constraints."
            buttonText="Configure"
            icon={Trophy}
            onClick={() => router.push('/admin/hackathons')}
          />

          <ActionCard
            title="Manage Teams & SIH Export"
            description="Inspect team compositions, lock/unlock submissions, and export SPOC Excel sheets for SIH."
            buttonText="Open"
            icon={Users2}
            onClick={() => router.push('/admin/teams')}
          />

          {user?.role !== 'spoc' && (
            <ActionCard
              title="User Directory & Verification"
              description="Search, verify, promote to admin, or export registered student profiles."
              buttonText="View"
              icon={Users}
              onClick={() => router.push('/admin/users')}
            />
          )}

          <ActionCard
            title="Official Announcements & Updates"
            description="Post official hackathon updates, clean scraped SIH notifications, and manage alerts."
            buttonText="Updates"
            icon={Megaphone}
            onClick={() => router.push('/admin/updates')}
          />

          <ActionCard
            title="Moderate Resource Library"
            description="Review, approve, or reject user-submitted documentation and study material."
            buttonText="Moderate"
            icon={FileText}
            onClick={() => router.push('/admin/resources')}
          />

          <ActionCard
            title="Idea Repository"
            description="Inspect submitted student ideas, feedback, and collaboration proposals."
            buttonText="Review"
            icon={Lightbulb}
            onClick={() => router.push('/admin/ideas')}
          />
        </div>
      </div>
    </div>
  );
}
