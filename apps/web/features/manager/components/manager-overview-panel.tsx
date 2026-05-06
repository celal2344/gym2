import { Activity, BarChart3, Dumbbell, TrendingUp } from "lucide-react";
import { managerDashboardMetrics } from "@repo/domain/dashboard";
import { demoServices } from "@repo/domain/services";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { managerActivity, trainerPrograms } from "../constants";

export function ManagerOverviewPanel() {
  const trainerServices = demoServices.filter((service) => service.requiresStaff);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {managerDashboardMetrics.map((metric) => (
          <Card key={metric.label} className="rounded-md border-zinc-200 shadow-none">
            <CardHeader className="pb-2">
              <CardDescription>{metric.label}</CardDescription>
              <CardTitle className="text-3xl">{metric.value}</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="rounded-md">
                {metric.delta}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <Card className="rounded-md border-zinc-200 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Dumbbell className="size-5 text-cyan-800" />
              Trainer programs
            </CardTitle>
            <CardDescription>Program ownership, member count, and upcoming review windows.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Program</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trainerPrograms.map((program) => (
                  <TableRow key={`${program.trainer}-${program.program}`}>
                    <TableCell className="font-medium">{program.trainer}</TableCell>
                    <TableCell>{program.program}</TableCell>
                    <TableCell>{program.members}</TableCell>
                    <TableCell>
                      <Badge variant={program.status === "Needs review" ? "destructive" : "secondary"} className="rounded-md">
                        {program.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{program.nextReview}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="rounded-md border-zinc-200 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-cyan-800" />
                Staff-backed services
              </CardTitle>
              <CardDescription>Services currently requiring staff assignment.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {trainerServices.map((service) => (
                <div key={service.id} className="flex items-center justify-between border-b border-zinc-200 pb-3 last:border-0">
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <p className="text-sm text-zinc-600">{service.durationMin} min session</p>
                  </div>
                  <Badge variant="outline" className="rounded-md">
                    {service.kind.replaceAll("_", " ")}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-md border-zinc-200 shadow-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="size-5 text-emerald-700" />
                Recent activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {managerActivity.map((item) => (
                <div key={item}>
                  <div className="flex gap-3">
                    <TrendingUp className="mt-0.5 size-4 text-emerald-700" />
                    <p>{item}</p>
                  </div>
                  <Separator className="mt-3" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
