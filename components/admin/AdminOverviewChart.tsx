"use client";

import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

export default function AdminOverviewChart({ data }: { data: any[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontStyle: 'italic', fontWeight: 'bold' }}
                />
                <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontStyle: 'italic', fontWeight: 'bold' }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px'
                    }}
                    itemStyle={{
                        color: 'var(--color-primary)',
                        fontWeight: 'bold',
                        fontStyle: 'italic',
                        textTransform: 'uppercase',
                        fontSize: '10px'
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="registrations"
                    stroke="var(--color-primary)"
                    fillOpacity={1}
                    fill="url(#colorRegs)"
                    strokeWidth={4}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
