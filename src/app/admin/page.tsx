"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  Activity,
  MessageSquare,
  TrendingUp,
  Search,
  Filter,
  Clock,
  Mail,
  User as UserIcon,
  BarChart3,
  FileText,
  DollarSign,
  CreditCard,
  Pencil,
  Trash2,
  UserPlus,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  todaysRegistrations: number;
  totalEvents: number;
  activeSessions: number;
  planDistribution?: { plan: string; count: number }[];
  paidUsers?: number;
  estimatedMrr?: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: string;
  plan: string;
  subscriptionStatus: string;
  createdAt: string;
}

const ROLES = ["user", "admin"];
const PLANS = ["free", "pro", "enterprise"];

interface Feedback {
  id: number;
  name: string;
  email: string;
  type: string;
  message: string;
  status: string;
  createdAt: string;
}

interface AnalyticsEvent {
  id: number;
  userId: string | null;
  eventType: string;
  eventData: any;
  createdAt: string;
}

export default function AdminDashboard() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [analyticsEvents, setAnalyticsEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState<"overview" | "users" | "feedback" | "analytics">("overview");

  // User management dialogs
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: "", role: "user", plan: "free", emailVerified: false });
  const [savingEdit, setSavingEdit] = useState(false);

  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "user", plan: "free" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login?redirect=/admin");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (session?.user) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("bearer_token");
    
    try {
      setLoading(true);
      
      const [statsRes, usersRes, feedbackRes, analyticsRes] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/admin/users?limit=10", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/admin/feedback?limit=10", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch("/api/admin/analytics?limit=10", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }

      if (feedbackRes.ok) {
        const feedbackData = await feedbackRes.json();
        setFeedback(feedbackData.feedback);
      }

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalyticsEvents(analyticsData.events);
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
      setLoading(false);
    }
  };

  const updateFeedbackStatus = async (id: number, status: string) => {
    const token = localStorage.getItem("bearer_token");
    
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      if (res.ok) {
        toast.success("Feedback status updated!");
        fetchDashboardData();
      } else {
        toast.error("Failed to update feedback status");
      }
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error("An error occurred");
    }
  };

  const openEditDialog = (target: User) => {
    setEditingUser(target);
    setEditForm({
      name: target.name,
      role: target.role,
      plan: target.plan,
      emailVerified: target.emailVerified,
    });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    const token = localStorage.getItem("bearer_token");

    setSavingEdit(true);
    try {
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();

      if (res.ok) {
        toast.success("User updated");
        setEditingUser(null);
        fetchDashboardData();
      } else {
        toast.error(data.error || "Failed to update user");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("An error occurred");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    const token = localStorage.getItem("bearer_token");

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${deletingUser.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (res.ok) {
        toast.success(`${deletingUser.email} deleted`);
        setDeletingUser(null);
        fetchDashboardData();
      } else {
        toast.error(data.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  const submitCreate = async () => {
    const token = localStorage.getItem("bearer_token");

    setCreating(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.created && data.temporaryPassword) {
          navigator.clipboard?.writeText(data.temporaryPassword).catch(() => {});
          toast.success(
            `User created. Temporary password copied to clipboard: ${data.temporaryPassword}`,
            { duration: 15000 }
          );
        } else {
          toast.success("Existing user updated (upsert)");
        }
        setShowCreateDialog(false);
        setCreateForm({ name: "", email: "", role: "user", plan: "free" });
        fetchDashboardData();
      } else {
        toast.error(data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("An error occurred");
    } finally {
      setCreating(false);
    }
  };

  if (isPending || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-white text-xl">Loading dashboard...</div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "reviewed": return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
      case "resolved": return "bg-green-500/20 text-green-300 border-green-500/30";
      default: return "bg-gray-500/20 text-gray-300 border-gray-500/30";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "review": return "⭐";
      case "feature": return "💡";
      case "partnership": return "🤝";
      default: return "📝";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 animate-gradient-x" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.2),rgba(0,0,0,0))]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                Admin Dashboard
              </span>
            </h1>
            <p className="text-zinc-400">Monitor users, analytics, and feedback</p>
          </div>
          <Link href="/">
            <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Users</CardTitle>
                  <Users className="w-5 h-5 text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalUsers}</div>
                <p className="text-xs text-zinc-500 mt-2">+{stats.todaysRegistrations} today</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-zinc-400">Total Events</CardTitle>
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalEvents}</div>
                <p className="text-xs text-zinc-500 mt-2">All time analytics</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-zinc-400">Active Sessions</CardTitle>
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.activeSessions}</div>
                <p className="text-xs text-zinc-500 mt-2">Currently online</p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-zinc-400">Feedback Items</CardTitle>
                  <MessageSquare className="w-5 h-5 text-pink-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{feedback.length}</div>
                <p className="text-xs text-zinc-500 mt-2">Awaiting review</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview", icon: BarChart3 },
            { id: "users", label: "Users", icon: Users },
            { id: "feedback", label: "Feedback", icon: MessageSquare },
            { id: "analytics", label: "Analytics", icon: Activity }
          ].map((tab) => (
            <Button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              variant={selectedTab === tab.id ? "default" : "outline"}
              className={selectedTab === tab.id 
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                : "border-white/10 hover:bg-white/5 text-white"
              }
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === "overview" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-zinc-400">Estimated MRR</CardTitle>
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-white">
                    ${(stats.estimatedMrr ?? 0).toLocaleString()}
                    <span className="text-sm text-zinc-500 font-normal">/mo</span>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">
                    {stats.paidUsers ?? 0} paid subscriber{(stats.paidUsers ?? 0) === 1 ? "" : "s"} · Enterprise excluded (custom pricing)
                  </p>
                </CardContent>
              </Card>

              <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-zinc-400">Plan Distribution</CardTitle>
                    <CreditCard className="w-5 h-5 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {(stats.planDistribution ?? []).map((row) => {
                    const pct = stats.totalUsers > 0 ? Math.round((row.count / stats.totalUsers) * 100) : 0;
                    return (
                      <div key={row.plan} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white uppercase">{row.plan}</span>
                          <span className="text-zinc-500">{row.count} ({pct}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-zinc-400">Latest analytics events</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Activity className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{event.eventType.replace(/_/g, " ").toUpperCase()}</p>
                        <p className="text-xs text-zinc-500">{new Date(event.createdAt).toLocaleString()}</p>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                        {event.userId ? "User" : "Anonymous"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedTab === "users" && (
          <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">User Management</CardTitle>
                  <CardDescription className="text-zinc-400">All registered users</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64 bg-zinc-800/50 border-white/10 text-white"
                  />
                  <Button size="icon" variant="outline" className="border-white/10 hover:bg-white/5">
                    <Search className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    New User
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users
                  .filter((user) =>
                    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((target) => {
                    const isSelf = target.id === session?.user?.id;
                    return (
                      <div key={target.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full">
                          <UserIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-white truncate">{target.name}</p>
                            {isSelf && <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-[10px]">You</Badge>}
                          </div>
                          <p className="text-sm text-zinc-400 truncate">{target.email}</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2">
                          {target.role === "admin" && (
                            <Badge className="bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30 gap-1">
                              <ShieldCheck className="w-3 h-3" /> Admin
                            </Badge>
                          )}
                          <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/30 uppercase">
                            {target.plan}
                          </Badge>
                          <Badge className={target.emailVerified ? "bg-green-500/20 text-green-300 border-green-500/30" : "bg-yellow-500/20 text-yellow-300 border-yellow-500/30"}>
                            {target.emailVerified ? "Verified" : "Unverified"}
                          </Badge>
                          <span className="text-xs text-zinc-500">
                            {new Date(target.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="hover:bg-white/10 text-zinc-300"
                            onClick={() => openEditDialog(target)}
                            title="Edit user"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={isSelf}
                            className="hover:bg-red-500/10 text-red-400 disabled:opacity-20 disabled:cursor-not-allowed"
                            onClick={() => setDeletingUser(target)}
                            title={isSelf ? "You cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === "feedback" && (
          <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Feedback Management</CardTitle>
              <CardDescription className="text-zinc-400">User reviews, features, and partnerships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="p-5 bg-white/5 border border-white/10 rounded-lg hover:border-white/20 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getTypeIcon(item.type)}</span>
                        <div>
                          <p className="font-semibold text-white">{item.name}</p>
                          <p className="text-sm text-zinc-400">{item.email}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(item.status)}>
                        {item.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-zinc-300 mb-4">{item.message}</p>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateFeedbackStatus(item.id, "reviewed")}
                        className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/30"
                      >
                        Mark Reviewed
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => updateFeedbackStatus(item.id, "resolved")}
                        className="bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30"
                      >
                        Mark Resolved
                      </Button>
                      <span className="text-xs text-zinc-500 ml-auto">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTab === "analytics" && (
          <Card className="border-white/10 bg-zinc-900/80 backdrop-blur-xl">
            <CardHeader>
              <CardTitle className="text-white">Analytics Events</CardTitle>
              <CardDescription className="text-zinc-400">Recent user interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                    <div className="p-2 bg-blue-500/20 rounded-lg">
                      <Activity className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">{event.eventType.replace(/_/g, " ").toUpperCase()}</p>
                      <p className="text-xs text-zinc-500 mt-1">
                        {event.eventData && typeof event.eventData === "object" && Object.keys(event.eventData).length > 0
                          ? JSON.stringify(event.eventData).substring(0, 100)
                          : "No additional data"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge className={event.userId ? "bg-purple-500/20 text-purple-300" : "bg-gray-500/20 text-gray-300"}>
                        {event.userId ? "User" : "Anonymous"}
                      </Badge>
                      <p className="text-xs text-zinc-500 mt-1">
                        {new Date(event.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription className="text-zinc-400">{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="bg-zinc-800/50 border-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={(v) => setEditForm({ ...editForm, role: v })}
                  disabled={editingUser?.id === session?.user?.id}
                >
                  <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editingUser?.id === session?.user?.id && (
                  <p className="text-[10px] text-zinc-500">You can&apos;t change your own role.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Plan</Label>
                <Select value={editForm.plan} onValueChange={(v) => setEditForm({ ...editForm, plan: v })}>
                  <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {PLANS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <Label className="text-sm">Email Verified</Label>
              <Button
                size="sm"
                variant={editForm.emailVerified ? "default" : "outline"}
                className={editForm.emailVerified ? "bg-green-500/20 text-green-300 border border-green-500/30 hover:bg-green-500/30" : "border-white/10"}
                onClick={() => setEditForm({ ...editForm, emailVerified: !editForm.emailVerified })}
              >
                {editForm.emailVerified ? "Verified" : "Unverified"}
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10" onClick={() => setEditingUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={saveEdit}
              disabled={savingEdit}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {savingEdit && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent className="bg-zinc-900 border-white/10 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingUser?.email}?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This permanently deletes the account and all of its sessions. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-white/10 text-white hover:bg-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create User Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>New User</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Creates an account (or updates one that already exists with this email) and returns a
              one-time temporary password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Name</Label>
              <Input
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                className="bg-zinc-800/50 border-white/10 text-white"
                placeholder="Jane Doe"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400 text-xs">Email</Label>
              <Input
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                className="bg-zinc-800/50 border-white/10 text-white"
                placeholder="jane@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Role</Label>
                <Select value={createForm.role} onValueChange={(v) => setCreateForm({ ...createForm, role: v })}>
                  <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {ROLES.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-400 text-xs">Plan</Label>
                <Select value={createForm.plan} onValueChange={(v) => setCreateForm({ ...createForm, plan: v })}>
                  <SelectTrigger className="bg-zinc-800/50 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-white/10 text-white">
                    {PLANS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-white/10" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitCreate}
              disabled={creating || !createForm.name || !createForm.email}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white"
            >
              {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create / Upsert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
