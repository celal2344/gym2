import {
  LogIn,
  Activity,
  CalendarCheck,
  Dumbbell,
  QrCode,
  ShieldCheck,
  Users,
  Waves,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { dashboardMetrics, demoServices } from "@repo/domain";
import { t } from "@repo/domain/i18n";
import { bookings, upcomingSlots } from "./constants";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="border-b border-border/70 bg-card/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-sm shadow-primary/20">
                  <Dumbbell className="size-5" />
                </div>
                <span className="text-lg font-semibold">{t("app.name")}</span>
              </div>
              <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-normal sm:text-4xl">
                Gym reservation operations for pool, PT, massage, and day-pass
                entry.
              </h1>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" render={<Link href="/login" />}>
                <LogIn className="size-4" />
                Login
              </Button>
              <Button variant="outline">
                <QrCode className="size-4" />
                Check-in
              </Button>
              <Button>
                <CalendarCheck className="size-4" />
                New booking
              </Button>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {dashboardMetrics.map((metric) => (
              <Card key={metric.labelKey}>
                <CardHeader className="pb-2">
                  <CardDescription>
                    {t(metric.labelKey as never)}
                  </CardDescription>
                  <CardTitle className="text-3xl">{metric.value}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{metric.delta}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:px-8">
        <Tabs defaultValue="reservations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="reservations">Reservations</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
          </TabsList>
          <TabsContent value="reservations" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Today&apos;s bookings</CardTitle>
                <CardDescription>
                  Operational view for front desk and staff schedules.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableCaption className="sr-only">
                    Today&apos;s bookings
                  </TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookings.map((booking) => (
                      <TableRow key={`${booking.member}-${booking.time}`}>
                        <TableCell className="font-medium">
                          {booking.member}
                        </TableCell>
                        <TableCell>{booking.service}</TableCell>
                        <TableCell>{booking.time}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === "checked_in"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {t(`booking.status.${booking.status}` as never)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="services" className="mt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {demoServices.map((service) => (
                <Card key={service.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-base">
                      {service.name}
                      <Badge variant="outline">
                        {t(`service.${service.kind}` as never)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {service.durationMin} min,{" "}
                      {service.capacityMode.replaceAll("_", " ")}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ShieldCheck className="size-4 text-emerald-700" />
                    Staff: {service.requiresStaff ? "required" : "optional"} -
                    Resource:{" "}
                    {service.requiresResource ? "required" : "optional"}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <TabsContent value="capacity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Slot inventory</CardTitle>
                <CardDescription>
                  Bookings consume slot capacity instead of writing raw calendar
                  events.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingSlots.map((slot) => (
                  <div
                    key={`${slot.time}-${slot.service}`}
                    className="flex items-center justify-between border-b border-border/70 pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {slot.time} - {slot.service}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {slot.capacity} reserved
                      </p>
                    </div>
                    <Badge
                      variant={
                        slot.status === "Full" ? "destructive" : "secondary"
                      }
                    >
                      {slot.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="size-5 text-emerald-700" />
                QR check-in
              </CardTitle>
              <CardDescription>
                Validate short-lived passes and static membership fallback
                codes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Pass or membership code</Label>
                <Input id="code" placeholder="SCAN-OR-TYPE-CODE" />
              </div>
              <Button className="w-full">
                <QrCode className="size-4" />
                Verify entry
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Operational priorities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex gap-3">
                <Waves className="mt-0.5 size-5 text-cyan-700" />
                <p>
                  Pool slots use shared capacity and can accept multiple
                  attendees.
                </p>
              </div>
              <Separator />
              <div className="flex gap-3">
                <Users className="mt-0.5 size-5 text-amber-700" />
                <p>
                  PT and massage bookings reserve staff time, and massage can
                  also reserve a room.
                </p>
              </div>
              <Separator />
              <div className="flex gap-3">
                <Activity className="mt-0.5 size-5 text-rose-700" />
                <p>
                  Payments are external inputs for now; no payment collection is
                  implemented here.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
