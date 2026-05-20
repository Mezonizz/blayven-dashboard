import React, { useEffect, useState } from "react";
import {
  Users,
  Mic,
  Coins,
  ShieldAlert,
  CalendarDays,
  ShoppingCart,
  TrendingUp,
  Clock,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const Card = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const CardContent = ({ children, className = "" }) => (
  <div className={className}>{children}</div>
);

const Button = ({ children, className = "", variant, size }) => (
  <button className={`px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white ${className}`}>
    {children}
  </button>
);

const stats = [
  { title: "Участников", value: "128", icon: Users, note: "+6 за неделю" },
  { title: "AP выдано", value: "24 850", icon: Coins, note: "+1 420 сегодня" },
  { title: "Voice часов", value: "1 936ч", icon: Mic, note: "за месяц" },
  { title: "Активных наказаний", value: "7", icon: ShieldAlert, note: "требуют контроля" },
];

const members = [
  { name: "BLAYVEN | Andrejs", rank: "Leader", ap: 4280, voice: "86ч 20м", status: "Активен" },
  { name: "BLAYVEN | Mark", rank: "Deputy", ap: 3110, voice: "72ч 45м", status: "Активен" },
  { name: "BLAYVEN | Alex", rank: "CC", ap: 2140, voice: "55ч 10м", status: "Отпуск" },
  { name: "BLAYVEN | Roman", rank: "OC", ap: 980, voice: "18ч 30м", status: "Риск неактива" },
];

const requests = [
  { type: "Повышение", user: "Alex", text: "Ожидает проверки", badge: "review" },
  { type: "Отпуск", user: "Roman", text: "До 26.05.2026", badge: "pending" },
  { type: "Магазин AP", user: "Mark", text: "Куплен DOUBLE_AP", badge: "shop" },
];

export default function BlayvenDashboardMockup() {
  const [profiles, setProfiles] = useState([]);
const [statsLive, setStatsLive] = useState({
  members: 0,
  totalAp: 0,
  voiceHours: 0,
  activePunishments: 0,
});

const stats = [
  { title: "Участников", value: statsLive.members, icon: Users, note: "в базе members" },
  { title: "AP выдано", value: statsLive.totalAp, icon: Coins, note: "total earned" },
  { title: "Voice часов", value: `${statsLive.voiceHours}ч`, icon: Mic, note: "всего" },
  { title: "Активных наказаний", value: statsLive.activePunishments, icon: ShieldAlert, note: "status ACTIVE" },
];
useEffect(() => {
  async function loadStats() {
    const { count: membersCount } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true });

    const { data: apRows } = await supabase
      .from("loyalty_profiles")
      .select("total_earned");

    const { data: voiceRows } = await supabase
      .from("voice_sessions")
      .select("duration_seconds")
      .eq("is_afk", false);

    const { count: punishmentsCount } = await supabase
      .from("punishments")
      .select("*", { count: "exact", head: true })
      .eq("status", "ACTIVE");

    const totalAp = (apRows || []).reduce(
      (sum, r) => sum + Number(r.total_earned || 0),
      0
    );

    const totalVoiceSeconds = (voiceRows || []).reduce(
      (sum, r) => sum + Number(r.duration_seconds || 0),
      0
    );

    setStatsLive({
      members: membersCount || 0,
      totalAp,
      voiceHours: Math.floor(totalVoiceSeconds / 3600),
      activePunishments: punishmentsCount || 0,
    });
  }

  loadStats();
}, []);
useEffect(() => {
  async function loadDashboard() {
    const { data: membersData, error: membersError } = await supabase
      .from("members")
      .select("id, username, display_name, rank, static_id")
      .order("rank", { ascending: false });

    if (membersError) {
      console.error("members error:", membersError);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from("loyalty_profiles")
      .select("user_id, points, total_earned, total_spent");

    if (profilesError) {
      console.error("profiles error:", profilesError);
      return;
    }

    const profilesMap = new Map(
      (profilesData || []).map((p) => [String(p.user_id), p])
    );

    const merged = (membersData || []).map((m) => {
      const profile = profilesMap.get(String(m.id));

      return {
        id: m.id,
        name: m.display_name || m.username || m.id,
        username: m.username || "—",
        rank: m.rank || "—",
        static_id: m.static_id || "—",
        ap: profile?.points || 0,
        total_earned: profile?.total_earned || 0,
        total_spent: profile?.total_spent || 0,
        status: profile ? "Активен" : "Нет AP профиля",
      };
    });

    setProfiles(merged);
  }

  loadDashboard();
}, []);
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        <aside className="col-span-12 lg:col-span-3 xl:col-span-2">
          <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
            <CardContent className="p-5">
              <div className="mb-8">
                <div className="text-2xl font-bold tracking-wide">BLAYVEN</div>
                <div className="text-sm text-slate-400">Family Control Panel</div>
              </div>

              <nav className="space-y-2 text-sm">
                {[
                  [TrendingUp, "Главная"],
                  [Users, "Состав"],
                  [Coins, "AP система"],
                  [Mic, "Voice активность"],
                  [ShieldAlert, "Наказания"],
                  [CalendarDays, "Отпуска"],
                  [ShoppingCart, "AP магазин"],
                ].map(([Icon, label]) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-800 cursor-pointer">
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </div>
                ))}
              </nav>
            </CardContent>
          </Card>
        </aside>

        <main className="col-span-12 lg:col-span-9 xl:col-span-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Панель управления семьёй</h1>
              <p className="text-slate-400 mt-1">Контроль состава, активности, AP, наказаний и заявок.</p>
            </div>
            <div className="flex gap-3">
              <Button className="rounded-xl">Обновить данные</Button>
              <Button variant="secondary" className="rounded-xl">Экспорт отчёта</Button>
            </div>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {stats.map((item) => (
              <Card key={item.title} className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-lg">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-slate-400">{item.title}</p>
                      <p className="text-3xl font-bold mt-2">{item.value}</p>
                      <p className="text-xs text-slate-500 mt-2">{item.note}</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-slate-800">
                      <item.icon className="w-5 h-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Card className="xl:col-span-2 bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Топ участников</h2>
                  <span className="text-sm text-slate-400">По AP и voice активности</span>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-800">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-slate-300">
                      <tr>
                        <th className="text-left p-3">Игрок</th>
                        <th className="text-left p-3">Ранг</th>
                        <th className="text-left p-3">AP</th>
                        <th className="text-left p-3">Static</th>
                        <th className="text-left p-3">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((m) => (
  <tr key={m.id} className="border-t border-slate-800 hover:bg-slate-800/40">
    <td className="p-3 font-medium">{m.name}</td>
    <td className="p-3 text-slate-300">{m.rank}</td>
    <td className="p-3">{m.ap}</td>
    <td className="p-3">#{m.static_id}</td>
    <td className="p-3">
      <span className="px-2 py-1 rounded-lg bg-slate-800 text-xs">
        {m.status}
      </span>
    </td>
  </tr>
))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
              <CardContent className="p-5">
                <h2 className="text-xl font-bold mb-4">Ожидают действий</h2>
                <div className="space-y-3">
                  {requests.map((r) => (
                    <div key={`${r.type}-${r.user}`} className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{r.type}</div>
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-sm text-slate-400 mt-1">{r.user} — {r.text}</div>
                      <Button size="sm" className="mt-3 rounded-xl w-full">Открыть</Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-bold mb-2">Voice сегодня</h3>
                <p className="text-4xl font-bold">214ч</p>
                <p className="text-sm text-slate-400 mt-2">Самый активный час: 21:00</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-bold mb-2">Контракты</h3>
                <p className="text-4xl font-bold">342</p>
                <p className="text-sm text-slate-400 mt-2">За текущий месяц</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-bold mb-2">Отпуска</h3>
                <p className="text-4xl font-bold">5</p>
                <p className="text-sm text-slate-400 mt-2">Активных заявок: 2</p>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
