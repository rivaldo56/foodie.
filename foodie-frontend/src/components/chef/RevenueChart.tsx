'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
    data: Array<{ date: string; revenue: number }>;
}

export default function RevenueChart({ data }: RevenueChartProps) {
    // Format data for chart
    const chartData = data.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: item.revenue
    }));

    return (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <h3 className="text-lg font-semibold text-white">Revenue Trend (Last 30 Days)</h3>
            <div className="mt-6 h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                        />
                        <YAxis
                            stroke="rgba(255,255,255,0.5)"
                            tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12 }}
                            tickFormatter={(value) => `KSh ${value.toLocaleString()}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(0,0,0,0.8)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                color: '#fff'
                            }}
                            formatter={(value: number) => [`KSh ${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#ff9e5a"
                            strokeWidth={3}
                            dot={{ fill: '#ff9e5a', r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
