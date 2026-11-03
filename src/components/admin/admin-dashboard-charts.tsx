"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface DailyUserData {
  date: string;
  users: number;
}

interface DailyTripData {
  date: string;
  trips: number;
}

interface StatusData {
  status: string;
  count: number;
}

interface AdminDashboardChartsProps {
  usersByDay: DailyUserData[];
  tripsByDay: DailyTripData[];
  tagStatuses: StatusData[];
  tripStatuses: StatusData[];
}

const TAG_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  APPROVED: "#22c55e",
  REJECTED: "#ef4444",
};

const TRIP_COLORS: Record<string, string> = {
  IDEA: "#64748b",
  SCHEDULED: "#3b82f6",
  COMPLETED: "#22c55e",
};

const TAG_LABELS: Record<string, string> = {
  PENDING: "Chờ duyệt",
  APPROVED: "Đã duyệt",
  REJECTED: "Từ chối",
};

const TRIP_LABELS: Record<string, string> = {
  IDEA: "Ý tưởng",
  SCHEDULED: "Đã lên lịch",
  COMPLETED: "Hoàn thành",
};

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getDate()}/${date.getMonth() + 1}`;
}

export function AdminDashboardCharts({ usersByDay, tripsByDay, tagStatuses, tripStatuses }: AdminDashboardChartsProps) {
  const tagData = tagStatuses.map((item) => ({ ...item, name: TAG_LABELS[item.status] ?? item.status }));
  const tripData = tripStatuses.map((item) => ({ ...item, name: TRIP_LABELS[item.status] ?? item.status }));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* USER CHART */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="font-semibold">Người dùng mới</h3>
          <p className="text-muted-foreground mt-1 text-sm">Số tài khoản đăng ký trong 30 ngày gần nhất.</p>
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={usersByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="date" tickFormatter={formatDate} tickLine={false} axisLine={false} fontSize={11} minTickGap={25} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                labelFormatter={(value) => `Ngày ${formatDate(String(value))}`}
                formatter={(value) => [Number(value), "Người dùng"]}
                contentStyle={{ borderRadius: "12px" }}
              />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TRIP CHART */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="font-semibold">Trip được tạo</h3>
          <p className="text-muted-foreground mt-1 text-sm">Số chuyến đi mới trong 30 ngày gần nhất.</p>
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={tripsByDay} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.2} />
              <XAxis dataKey="date" tickFormatter={formatDate} tickLine={false} axisLine={false} fontSize={11} minTickGap={25} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip
                labelFormatter={(value) => `Ngày ${formatDate(String(value))}`}
                formatter={(value) => [Number(value), "Trip"]}
                contentStyle={{ borderRadius: "12px" }}
              />
              <Bar dataKey="trips" fill="#8b5cf6" radius={[5, 5, 0, 0]} maxBarSize={22} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TAG STATUS */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div>
          <h3 className="font-semibold">Trạng thái Tag & Tip</h3>
          <p className="text-muted-foreground mt-1 text-sm">Phân bố trạng thái xét duyệt địa điểm cộng đồng.</p>
        </div>

        <div className="grid min-h-[280px] items-center sm:grid-cols-[1fr_180px]">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value, _name, props) => [Number(value), props.payload.name]} contentStyle={{ borderRadius: "12px" }} />
                <Pie data={tagData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {tagData.map((item) => <Cell key={item.status} fill={TAG_COLORS[item.status] ?? "#64748b"} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {tagData.map((item) => (
              <div key={item.status} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: TAG_COLORS[item.status] ?? "#64748b" }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TRIP STATUS */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div>
          <h3 className="font-semibold">Trạng thái chuyến đi</h3>
          <p className="text-muted-foreground mt-1 text-sm">Phân bố Trip theo tiến độ hiện tại.</p>
        </div>

        <div className="grid min-h-[280px] items-center sm:grid-cols-[1fr_180px]">
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip formatter={(value, _name, props) => [Number(value), props.payload.name]} contentStyle={{ borderRadius: "12px" }} />
                <Pie data={tripData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={3}>
                  {tripData.map((item) => <Cell key={item.status} fill={TRIP_COLORS[item.status] ?? "#64748b"} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            {tripData.map((item) => (
              <div key={item.status} className="flex items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: TRIP_COLORS[item.status] ?? "#64748b" }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}