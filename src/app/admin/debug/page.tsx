"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Activity, Shield, Terminal, Server, AlertCircle, CheckCircle2, 
  Trash2, Download, RefreshCw, Cpu, HardDrive, Database, 
  Settings, Key, Bug, Trash
} from "lucide-react";
import { toast } from "sonner";
import { DebugLogger } from "@/lib/logger";

export default function AdminDebugDashboard() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState({
    cpu: "12%",
    memory: "256MB",
    storage: "1.2GB",
    database: "Connected",
    uptime: "48h 12m",
    recent_activity: [
      { id: 1, action: "Metadata Strip", status: "Success", time: "2m ago" },
      { id: 2, action: "ZIP Export", status: "Success", time: "5m ago" },
      { id: 3, action: "Auth Login", status: "Success", time: "12m ago" },
      { id: 4, action: "DB Query", status: "Error", time: "15m ago" },
    ]
  });

  useEffect(() => {
    // Initial logs from DebugLogger
    setLogs(DebugLogger.exportLogs().split("\n").filter(Boolean));
    
    // Auto-refresh every 5s for mock stats
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        cpu: `${Math.floor(Math.random() * 20 + 5)}%`,
        memory: `${Math.floor(Math.random() * 50 + 200)}MB`
      }));
    }, 5000);

    
    return () => clearInterval(interval);
  }, []);

  const refreshLogs = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLogs(DebugLogger.exportLogs().split("\n").filter(Boolean));
      setIsRefreshing(false);
      toast.success("Logs refreshed");
    }, 800);
  };

  const clearLogs = () => {
    // In a real app, this might call a clear method on DebugLogger
    setLogs([]);
    toast.success("Logs cleared locally");
  };

  const exportLogs = () => {
    const blob = new Blob([logs.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `filex-debug-logs-${Date.now()}.txt`;
    a.click();
    toast.success("Logs exported");
  };

  return (
    <div className="min-h-screen bg-background text-white p-8 font-sans selection:bg-purple-500/30">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full" />
      </div>

      <div className="relative max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/70">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center shadow-xl shadow-purple-600/20">
              <Bug className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Debug Dashboard</h1>
              <p className="text-[10px] text-muted-foreground font-bold tracking-[0.2em] uppercase mt-1">System Health & Diagnostics</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="border-border/70 bg-accent/50 hover:bg-accent rounded-xl px-4 h-10 font-bold" onClick={refreshLogs} disabled={isRefreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh System
            </Button>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/20 px-4 py-2 rounded-xl text-xs font-black tracking-widest uppercase">
              System Online
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {[
            { label: "CPU Usage", value: stats.cpu, icon: Cpu, color: "text-blue-400" },
            { label: "Memory Usage", value: stats.memory, icon: Activity, color: "text-purple-400" },
            { label: "Storage Used", value: stats.storage, icon: HardDrive, color: "text-green-400" },
            { label: "Database", value: stats.database, icon: Database, color: "text-yellow-400" },
            { label: "Uptime", value: stats.uptime, icon: Server, color: "text-muted-foreground" },
          ].map((stat) => (
            <Card key={stat.label} className="bg-card/80 border-border/70 backdrop-blur-xl rounded-3xl overflow-hidden group hover:border-border transition-all">
              <CardContent className="p-6 space-y-3">
                <div className={`p-2 w-fit rounded-xl bg-accent/50 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Logs Section */}
          <Card className="lg:col-span-2 bg-card/80 border-border/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl h-[600px] flex flex-col">
            <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Terminal className="w-6 h-6 text-purple-500" />
                <CardTitle className="text-xl font-bold">System Logs</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/50" onClick={exportLogs}>
                  <Download className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-red-500/10 group" onClick={clearLogs}>
                  <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-red-400" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
              <ScrollArea className="flex-1 bg-black/40 p-6 font-mono text-xs leading-relaxed">
                {logs.length > 0 ? (
                  <div className="space-y-2">
                    {logs.map((log, i) => (
                      <div key={i} className="flex gap-4 group">
                        <span className="text-muted-foreground shrink-0 select-none">[{i + 1}]</span>
                        <span className="text-foreground/80 break-all group-hover:text-foreground transition-colors">{log}</span>
                      </div>
                    ))}
                    <div className="h-4" />
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                    <Terminal className="w-12 h-12" />
                    <p className="font-bold">No logs detected</p>
                  </div>
                )}
              </ScrollArea>
              <div className="p-4 bg-black/60 border-t border-border/70 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>Total Logs: {logs.length}</span>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Live Log Streaming
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions & Tests */}
          <div className="space-y-8">
            <Card className="bg-card/80 border-border/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
              <CardHeader className="p-8 pb-4">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 pt-0 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start border-border/70 bg-accent/50 hover:bg-accent rounded-2xl h-14 font-bold text-foreground/80 hover:text-foreground group">
                    <Shield className="w-5 h-5 mr-3 text-green-400 group-hover:scale-110 transition-transform" />
                    Run Integrity Audit
                  </Button>
                  <Button variant="outline" className="justify-start border-border/70 bg-accent/50 hover:bg-accent rounded-2xl h-14 font-bold text-foreground/80 hover:text-foreground group">
                    <Trash className="w-5 h-5 mr-3 text-red-400 group-hover:scale-110 transition-transform" />
                    Purge Temp Files
                  </Button>
                  <Button variant="outline" className="justify-start border-border/70 bg-accent/50 hover:bg-accent rounded-2xl h-14 font-bold text-foreground/80 hover:text-foreground group">
                    <Key className="w-5 h-5 mr-3 text-yellow-400 group-hover:scale-110 transition-transform" />
                    Rotate Session Secrets
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-tr from-purple-600/10 to-blue-600/10 border border-border/70 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-accent/50 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold">Sanity Check</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Environment Status</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {[
                  { label: "Environment Vars", status: "success" },
                  { label: "API Connectivity", status: "success" },
                  { label: "Storage Buckets", status: "warning" },
                  { label: "Auth Provider", status: "success" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground/80">{item.label}</span>
                    <Badge className={
                      item.status === 'success' 
                      ? "bg-green-500/10 text-green-400 border-green-500/20" 
                      : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                    }>
                      {item.status.toUpperCase()}
                    </Badge>
                  </div>
                ))}
              </div>
              
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-black rounded-2xl h-12 text-xs uppercase tracking-widest">
                Re-Run All Checks
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
