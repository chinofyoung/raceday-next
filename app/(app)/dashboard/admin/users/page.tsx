"use client";

import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Users, Search, Filter, ArrowLeft, Loader2,
    Mail, Calendar, Trophy, ChevronRight, User as UserIcon,
    MoreVertical, Shield, UserCog, Ban
} from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { collection, query, getDocs, orderBy, doc, updateDoc, where } from "firebase/firestore";
import { RaceEvent } from "@/types/event";
import { User } from "@/types/user";
import { cn, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/hooks/useAuth";
import { logAdminAction } from "@/lib/admin/audit";
import { exportToCSV } from "@/lib/admin/export";
import { Download } from "lucide-react";

export default function UserManagementPage() {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            setUsers(snap.docs.map(d => ({ ...d.data() })) as User[]);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (uid: string, newRole: User["role"]) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        setProcessing(uid);
        try {
            await updateDoc(doc(db, "users", uid), { role: newRole });

            // Log action
            const targetUser = users.find(u => u.uid === uid);
            if (currentUser && targetUser) {
                await logAdminAction(
                    currentUser.uid,
                    currentUser.displayName,
                    "change_user_role",
                    uid,
                    targetUser.displayName,
                    `Changed role to ${newRole}`
                );
            }

            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u));
        } catch (error) {
            console.error("Error changing role:", error);
            alert("Failed to update role.");
        } finally {
            setProcessing(null);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || u.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const handleExport = () => {
        const exportData = filteredUsers.map(u => ({
            Name: u.displayName,
            Email: u.email,
            Role: u.role,
            Joined: formatDate(u.createdAt),
            ProfileCompletion: `${u.profileCompletion}%`,
            Registrations: 0
        }));
        exportToCSV(exportData, `raceday-users-${formatDate(new Date())}`);
    };

    if (loading) {
        return (
            <PageWrapper className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper className="pt-8 pb-12 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Link href="/dashboard/admin" className="text-primary hover:underline flex items-center gap-1 text-[10px] font-black uppercase italic tracking-widest">
                            <ArrowLeft size={12} /> Dashboard
                        </Link>
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                        User <span className="text-primary">Management</span>
                    </h1>
                    <p className="text-text-muted font-medium italic">Track and moderate all platform participants.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                    <Button variant="outline" onClick={handleExport} className="gap-2 shrink-0">
                        <Download size={18} /> Export CSV
                    </Button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 justify-between items-center bg-surface/50 p-4 rounded-2xl border border-white/5">
                <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar pb-2 lg:pb-0">
                    {["all", "runner", "organizer", "admin"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setRoleFilter(s)}
                            className={cn(
                                "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0",
                                roleFilter === s ? "bg-primary text-white shadow-lg shadow-primary/20" : "bg-white/5 text-text-muted hover:bg-white/10"
                            )}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="relative w-full lg:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-background border border-white/5 rounded-xl text-sm italic font-medium focus:outline-none focus:border-primary transition-all text-white placeholder:text-text-muted/50"
                    />
                </div>
            </div>

            {/* User List */}
            <div className="grid grid-cols-1 gap-2">
                {/* Header Row (Desktop) */}
                <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-[10px] font-black uppercase italic tracking-widest text-text-muted">
                    <div className="col-span-4">User Details</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-2">Joined Date</div>
                    <div className="col-span-2">Profile</div>
                    <div className="col-span-2 text-right">Actions</div>
                </div>

                {filteredUsers.length === 0 ? (
                    <Card className="p-12 text-center bg-surface/30 border-dashed border-2 border-white/5 space-y-4">
                        <Users className="mx-auto text-text-muted opacity-20" size={48} />
                        <p className="text-text-muted italic font-medium uppercase tracking-widest text-xs">No users found matching your search.</p>
                    </Card>
                ) : (
                    filteredUsers.map((user) => (
                        <Card key={user.uid} className="p-4 lg:p-6 bg-surface/40 border-white/5 hover:bg-surface/60 transition-all group">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                                {/* Details */}
                                <div className="col-span-4 flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl border border-primary/20 bg-surface overflow-hidden shrink-0">
                                        {user.photoURL ? (
                                            <img src={user.photoURL} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-primary bg-primary/10 italic font-bold">
                                                {user.displayName[0]}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h4 className="font-bold italic uppercase text-white truncate leading-tight">{user.displayName}</h4>
                                        <div className="flex items-center gap-1.5 text-text-muted text-[10px] font-bold italic truncate">
                                            <Mail size={12} className="text-primary/60" /> {user.email}
                                        </div>
                                    </div>
                                </div>

                                {/* Role */}
                                <div className="col-span-2">
                                    <Badge
                                        variant={user.role === "admin" ? "destructive" : user.role === "organizer" ? "cta" : "secondary"}
                                        className="text-[8px] font-black uppercase italic tracking-widest px-3"
                                    >
                                        {user.role}
                                    </Badge>
                                </div>

                                {/* Joined */}
                                <div className="col-span-2 text-[10px] font-bold italic text-text-muted flex items-center gap-2">
                                    <Calendar size={14} className="text-blue-500/60" />
                                    {formatDate(user.createdAt)}
                                </div>

                                {/* Profile Completion */}
                                <div className="col-span-2">
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary transition-all duration-1000"
                                                style={{ width: `${user.profileCompletion}%` }}
                                            />
                                        </div>
                                        <span className="text-[10px] font-black italic text-white shrink-0">{user.profileCompletion}%</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="col-span-2 flex justify-end items-center gap-2">
                                    <div className="flex items-center gap-1 p-1 bg-background/50 rounded-lg border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
                                            title="Promote/Demote"
                                            onClick={() => handleRoleChange(user.uid, user.role === "runner" ? "organizer" : "runner")}
                                            disabled={processing === user.uid}
                                        >
                                            <UserCog size={14} />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 hover:bg-red-500/20 hover:text-red-500"
                                            title="Ban User"
                                        >
                                            <Ban size={14} />
                                        </Button>
                                    </div>
                                    <Button size="sm" variant="outline" className="h-8 w-8 p-0 font-black italic uppercase border-white/10">
                                        <MoreVertical size={14} />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </PageWrapper>
    );
}
