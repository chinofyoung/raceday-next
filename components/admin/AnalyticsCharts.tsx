"use client";

import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line
} from "recharts";

export function RevenueBarChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.2} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontStyle: 'italic', fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontStyle: 'italic', fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="revenue" fill="url(#revenueGradient)" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}

export function UsersPieChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}

export function RegistrationsLineChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <defs>
                    <linearGradient id="lineOverlay" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-cta)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-cta)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontStyle: 'italic', fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }}
                />
                <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontStyle: 'italic', fontWeight: 'bold', fill: 'rgba(255,255,255,0.5)' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        color: '#fff'
                    }}
                    itemStyle={{ color: '#fff' }}
                />
                <Line
                    type="monotone"
                    dataKey="registrations"
                    stroke="var(--color-cta)"
                    strokeWidth={4}
                    dot={{ fill: 'var(--color-cta)', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
