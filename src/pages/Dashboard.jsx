import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserCheck, UserX, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const API = `${BACKEND_URL.replace(/\/+$/, '')}/api`;

console.log('Using backend API URL:', API);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, trendsRes] = await Promise.all([
        axios.get(`${API}/dashboard/stats`),
        axios.get(`${API}/dashboard/trends?days=7`)
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Total Employees',
      value: stats?.totalEmployees || 0,
      icon: Users,
      color: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      iconColor: 'text-indigo-500'
    },
    {
      label: 'Present Today',
      value: stats?.presentToday || 0,
      icon: UserCheck,
      color: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      iconColor: 'text-emerald-500'
    },
    {
      label: 'Absent Today',
      value: stats?.absentToday || 0,
      icon: UserX,
      color: 'bg-rose-50',
      textColor: 'text-rose-600',
      iconColor: 'text-rose-500'
    },
    {
      label: 'Attendance Rate',
      value: `${stats?.attendanceRate || 0}%`,
      icon: TrendingUp,
      color: 'bg-amber-50',
      textColor: 'text-amber-600',
      iconColor: 'text-amber-500'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="dashboard-loading">
        <div className="text-slate-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="dashboard-page">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">Overview of your HR metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              data-testid={`stat-card-${index}`}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                  <p className={`text-3xl font-semibold mt-2 ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className={stat.iconColor} size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Attendance Trends Chart */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Attendance Trends (Last 7 Days)</h2>
          <p className="text-sm text-slate-500 mt-1">Daily attendance overview</p>
        </div>
        {trends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={12}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <Legend />
              <Bar dataKey="present" fill="#10b981" name="Present" radius={[8, 8, 0, 0]} />
              <Bar dataKey="absent" fill="#f43f5e" name="Absent" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-500">
            No attendance data available
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;