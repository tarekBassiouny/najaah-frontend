"use client";

import { PageHeader } from "@/components/ui/page-header";
import { DashboardStats } from "@/features/dashboard/components/DashboardStats";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { RecentActivity } from "@/features/dashboard/components/RecentActivity";
import { AgentExecutionHistory } from "@/features/agents/components/AgentExecutionHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Mock stats data - in production, this would come from an API
const mockStats = {
  totalCourses: 24,
  totalStudents: 1250,
  activeEnrollments: 3420,
  pendingApprovals: 8,
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your learning management system"
      />

      <DashboardStats stats={mockStats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <QuickActions />
        <RecentActivity />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Agent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          <AgentExecutionHistory />
        </CardContent>
      </Card>
    </div>
  );
}
