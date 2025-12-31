'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { agentClient } from '@/services/agentClient';
import { useAuthStore } from '@/store/authStore';
import { UsageStatsResponse, UserUsageStats } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

interface DjangoUser {
    id: number;
    email: string;
    username: string; // Ensure username is included in the type
    role: {
        id: number;
        name: string;
    } | null;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const { user, accessToken, isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<UsageStatsResponse | null>(null);

    useEffect(() => {
        // 1. Check Auth & Role
        if (isAuthLoading) return;

        if (!isAuthenticated || !user) {
            router.push('/login');
            return;
        }

        // Role check - assuming role is nested object or string on user object
        // Based on checked authStore.ts, user object comes from UserReadSerializer response
        // We need to verify how role is stored in frontend user object.
        // Assuming user.role.name based on previous context, but let's be safe.
        // If role is missing or not admin/superuser, redirect.
        // Note: The backend also enforces this, but frontend redirect provides better UX.
        const roleName = (user as any).role?.name?.toLowerCase();

        if (roleName !== 'admin' && roleName !== 'superuser') {
            router.push('/'); // Redirect non-admins to home
            return;
        }

        fetchData();
    }, [user, isAuthenticated, isAuthLoading, router]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (!accessToken) throw new Error("No access token");

            // 2. Fetch Users from Auth Service
            // We need to list all users to filter for 'guest' roles.
            // Since there isn't a direct "get all guests" endpoint in auth service apparent yet,
            // we'll fetch all users (paginated or limit) using the UserViewSet if accessible.
            // Based on views.py, UserViewSet is at /api/users/ and strictly for SuperUserOrAdmin.

            const res = await fetch(`${API_URL}/api/users/`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (!res.ok) {
                throw new Error("Failed to fetch users from Auth Service");
            }

            const users: DjangoUser[] = await res.json();

            // 3. Filter for Guest Users
            const guestUsernames = users
                .filter(u => {
                    console.log(`DEBUG: Checking user ${u.username}`, u.role);
                    return u.role?.name === 'guest';
                })
                .map(u => u.username);

            console.log("DEBUG: Filtered Guest Usernames:", guestUsernames);

            // 4. Fetch Usage Stats from Backend
            if (guestUsernames.length > 0) {
                const usageStats = await agentClient.getUsageStats(guestUsernames);
                setStats(usageStats);
            } else {
                setStats({
                    total_guest_users: 0,
                    total_tokens: 0,
                    total_messages: 0,
                    user_stats: []
                });
            }

        } catch (err: any) {
            console.error(err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    if (isAuthLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-600">
                <h2 className="text-xl font-bold mb-2">Error</h2>
                <p>{error}</p>
                <button
                    onClick={fetchData}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Guest Usage Dashboard</h1>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatCard
                        title="Total Guest Users"
                        value={stats?.total_guest_users || 0}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Total Messages"
                        value={stats?.total_messages || 0}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Estimated Tokens"
                        value={stats?.total_tokens.toLocaleString() || 0}
                        color="bg-purple-500"
                    />
                </div>

                {/* User Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-xl font-semibold text-gray-800">Guest User Details</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages Count</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estimated Tokens</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conversations</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {stats?.user_stats.map((user) => (
                                    <tr key={user.username}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {user.username}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.total_messages}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.estimated_tokens.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {user.conversation_count}
                                        </td>
                                    </tr>
                                ))}
                                {stats?.user_stats.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                            No guest usage data found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, color }: { title: string, value: number | string, color: string }) {
    return (
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-transparent hover:border-l-blue-500 transition-all duration-200">
            <div className="flex items-center">
                <div className={`p-3 rounded-full ${color} bg-opacity-10 mr-4`}>
                    {/* You can add icons here based on title if desired */}
                    <div className={`w-6 h-6 ${color.replace('bg-', 'text-')}`}></div>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
            </div>
        </div>
    );
}
