'use client';
import { useState, useEffect } from 'react';
import { FileDown } from 'lucide-react';

const API_BASE_URL = '';
const TABS = ['pending', 'approved', 'rejected'];

export default function AdminResourcesPage() {
    const [resources, setResources] = useState([]);
    const [status, setStatus] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });

    // fetch resources by status
    const fetchResources = async (currentStatus) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/resources?status=${currentStatus}`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setResources(data.items || []);
            }
        } catch (error) {
            console.error("Failed to fetch resources", error);
        } finally {
            setLoading(false);
        }
    };

    // fetch counts separately
    const fetchCounts = async () => {
        try {
            const res = await fetch(`/api/admin/resources/counts`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                setCounts(data || { pending: 0, approved: 0, rejected: 0 });
            }
        } catch (error) {
            console.error("Failed to fetch counts", error);
        }
    };

    useEffect(() => {
        fetchResources(status);
        fetchCounts();
    }, [status]);

    const refreshData = () => {
        fetchResources(status);
        fetchCounts();
    };

    const handleUpdateStatus = async (id, newStatus) => {
        try {
            const endpoint =
                newStatus === "approved"
                    ? `/api/admin/resources/${id}/approve`
                    : `/api/admin/resources/${id}/reject`;

            await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(newStatus === "rejected" ? { reason: "Rejected by admin" } : {}),
            });

            refreshData();
        } catch (error) {
            alert(`Failed to ${newStatus} resource.`);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this resource permanently?")) return;
        try {
            await fetch(`/api/admin/resources/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            refreshData();
        } catch (error) {
            alert("Failed to delete resource.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-white">Moderate Resources</h1>

                {/* Tabs */}
                <div className="flex gap-2 rounded-lg bg-slate-900/80 p-1">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setStatus(tab)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                status === tab
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({counts[tab] || 0})
                        </button>
                    ))}
                </div>
            </div>

            {/* Resource List */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {loading ? (
                    <p className="text-slate-400">Loading resources...</p>
                ) : resources.length === 0 ? (
                    <p className="text-slate-400">No resources found in this category.</p>
                ) : (
                    resources.map(resource => (
                        <div key={resource._id} className="rounded-xl border border-slate-700 bg-slate-800 p-5 shadow hover:shadow-xl transition">
                            <h2 className="text-lg font-bold text-indigo-400 mb-1">{resource.title}</h2>

                            {/* Submitted By */}
                            <p className="text-xs text-slate-400 mb-2">
                                Submitted by:{" "}
                                {resource.addedBy?.name
                                    || resource.addedBy?.email
                                    || (typeof resource.addedBy === "string" ? resource.addedBy : "Unknown")}
                            </p>

                            {/* Description */}
                            <p className="text-sm text-slate-300 mb-2 line-clamp-3">{resource.description}</p>

                            {/* URL */}
                            {resource.url && (
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-cyan-400 hover:underline text-xs block truncate mb-2"
                                >
                                    {resource.url}
                                </a>
                            )}

                            {/* File Download */}
                            {resource.file?.path && (
                                <a
                                    href={`/api${resource.file.path}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-green-400 hover:text-green-300 text-xs mb-4"
                                >
                                    <FileDown className="w-4 h-4" /> Download File
                                </a>
                            )}

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-2">
                                {status === 'pending' && (
                                    <>
                                        <button
                                            onClick={() => handleUpdateStatus(resource._id, 'approved')}
                                            className="rounded-md bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 shadow"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleUpdateStatus(resource._id, 'rejected')}
                                            className="rounded-md bg-yellow-600 px-3 py-1 text-xs text-white hover:bg-yellow-700 shadow"
                                        >
                                            Reject
                                        </button>
                                    </>
                                )}
                                {status === 'approved' && (
                                    <button
                                        onClick={() => handleUpdateStatus(resource._id, 'rejected')}
                                        className="rounded-md bg-yellow-600 px-3 py-1 text-xs text-white hover:bg-yellow-700 shadow"
                                    >
                                        Reject
                                    </button>
                                )}
                                {status === 'rejected' && (
                                    <button
                                        onClick={() => handleUpdateStatus(resource._id, 'approved')}
                                        className="rounded-md bg-green-600 px-3 py-1 text-xs text-white hover:bg-green-700 shadow"
                                    >
                                        Approve
                                    </button>
                                )}
                                {/* Delete always visible */}
                                <button
                                    onClick={() => handleDelete(resource._id)}
                                    className="rounded-md bg-red-600 px-3 py-1 text-xs text-white hover:bg-red-700 shadow"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
