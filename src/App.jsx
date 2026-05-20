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
  Search,
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
  const [requestsLive, setRequestsLive] = useState([]);
const [statsLive, setStatsLive] = useState({
  members: 0,
  totalAp: 0,
  voiceHours: 0,
  activePunishments: 0,
});
const [extraStats, setExtraStats] = useState({
  voiceTodayHours: 0,
  contractsMonth: 0,
  vacationsActive: 0,
});

const [searchQuery, setSearchQuery] = useState("");
const [profileStatusFilter, setProfileStatusFilter] = useState("ALL");
const [activePage, setActivePage] = useState("Главная");

const stats = [
  { title: "Участников", value: statsLive.members, icon: Users, note: "в базе members" },
  { title: "AP выдано", value: statsLive.totalAp, icon: Coins, note: "total earned" },
  { title: "Voice часов", value: `${statsLive.voiceHours}ч`, icon: Mic, note: "всего" },
  { title: "Активных наказаний", value: statsLive.activePunishments, icon: ShieldAlert, note: "status ACTIVE" },
];

const filteredProfiles = profiles
  .filter((m) => {
    const q = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !q ||
      String(m.name || "").toLowerCase().includes(q) ||
      String(m.username || "").toLowerCase().includes(q) ||
      String(m.static_id || "").toLowerCase().includes(q);

    const matchesStatus =
      profileStatusFilter === "ALL" ||
      m.status === profileStatusFilter;

    return matchesSearch && matchesStatus;
  })
  .slice(0, 20);

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
const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);

const monthStart = new Date();
monthStart.setDate(1);
monthStart.setHours(0, 0, 0, 0);

const { data: voiceTodayRows } = await supabase
  .from("voice_sessions")
  .select("duration_seconds")
  .eq("is_afk", false)
  .gte("started_at", todayStart.toISOString());

const { count: contractsMonthCount } = await supabase
  .from("contracts")
  .select("*", { count: "exact", head: true })
  .gte("logged_at", monthStart.toISOString());

const { count: vacationsActiveCount } = await supabase
  .from("vacations")
  .select("*", { count: "exact", head: true })
  .in("status", ["ACTIVE", "PENDING", "APPROVED"]);

const voiceTodaySeconds = (voiceTodayRows || []).reduce(
  (sum, r) => sum + Number(r.duration_seconds || 0),
  0
);

setExtraStats({
  voiceTodayHours: Math.floor(voiceTodaySeconds / 3600),
  contractsMonth: contractsMonthCount || 0,
  vacationsActive: vacationsActiveCount || 0,
});
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

      const { data: promotionsData } = await supabase
  .from("promotion_requests")
  .select("id, user_tag, desired_rank, status, created_at")
  .eq("status", "ACTIVE")
  .order("created_at", { ascending: false })
  .limit(5);

const { data: vacationsData } = await supabase
  .from("vacations")
  .select("id, user_tag, status, end_at, requested_at")
  .eq("status", "PENDING")
  .order("requested_at", { ascending: false })
  .limit(5);

const { data: purchasesData } = await supabase
  .from("loyalty_purchases")
  .select("id, user_tag, item_name, price, status, created_at")
  .eq("status", "PENDING")
  .order("created_at", { ascending: false })
  .limit(5);

const { data: apRequestsData } = await supabase
  .from("loyalty_ap_requests")
  .select("id, requester_tag, target_tag, amount, reason, status, created_at")
  .eq("status", "PENDING")
  .order("created_at", { ascending: false })
  .limit(5);


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

    const combinedRequests = [
  ...(promotionsData || []).map((r) => ({
    type: "Повышение",
    user: r.user_tag || "Unknown",
    text: `Желаемый ранг: ${r.desired_rank || "—"}`,
  })),

  ...(vacationsData || []).map((r) => ({
    type: "Отпуск",
    user: r.user_tag || "Unknown",
    text: "Ожидает рассмотрения",
  })),

  ...(purchasesData || []).map((r) => ({
    type: "Магазин AP",
    user: r.user_tag || "Unknown",
    text: `${r.item_name || "Покупка"} — ${r.price || 0} AP`,
  })),

  ...(apRequestsData || []).map((r) => ({
    type: "Выдача AP",
    user: r.requester_tag || "Unknown",
    text: `${r.target_tag || "Unknown"} +${r.amount || 0} AP`,
  })),
].slice(0, 8);

setRequestsLive(combinedRequests);
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
  <div
    key={label}
    onClick={() => setActivePage(label)}
    className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-all ${
      activePage === label
        ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/30 shadow-[0_0_18px_rgba(34,211,238,0.15)]"
        : "text-slate-300 hover:bg-slate-800 hover:text-white"
    }`}
  >
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
  <div className="flex flex-col gap-4 mb-4">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold">Состав семьи</h2>
        <p className="text-sm text-slate-400">
          Показано {filteredProfiles.length} из {profiles.length}
        </p>
      </div>

      <span className="text-sm text-slate-400">
        Live данные из Supabase
      </span>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="md:col-span-2 flex items-center gap-2 bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Поиск по имени, username или static..."
          className="w-full bg-transparent outline-none text-sm text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <select
        value={profileStatusFilter}
        onChange={(e) => setProfileStatusFilter(e.target.value)}
        className="bg-slate-800/70 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none"
      >
        <option value="ALL">Все профили</option>
        <option value="Активен">Есть AP профиль</option>
        <option value="Нет AP профиля">Нет AP профиля</option>
      </select>
    </div>
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
                      {filteredProfiles.map((m) => (
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
{filteredProfiles.length === 0 && (
  <tr>
    <td colSpan="5" className="p-6 text-center text-slate-400">
      Ничего не найдено по выбранным фильтрам.
    </td>
  </tr>
)}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
              <CardContent className="p-5">
                <h2 className="text-xl font-bold mb-4">Ожидают действий</h2>
                <div className="space-y-3">
                  {requestsLive.map((r) => (
                    <div key={`${r.type}-${r.user}`} className="p-4 rounded-xl bg-slate-800/70 border border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">{r.type}</div>
                        <Clock className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="text-sm text-slate-400 mt-1">{r.user} — {r.text}</div>
                      <Button size="sm" className="mt-3 rounded-xl w-full">Открыть</Button>
                    </div>
                  ))}
                  {requestsLive.length === 0 && (
  <div className="p-4 rounded-xl bg-slate-800/70 border border-slate-700 text-slate-400 text-sm">
    Сейчас нет активных заявок.
  </div>
)}
                </div>
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-bold mb-2">Voice сегодня</h3>
                <p className="text-4xl font-bold">
                  {extraStats.voiceTodayHours}ч
                </p>
                <p className="text-sm text-slate-400 mt-2">Самый активный час: 21:00</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-bold mb-2">Контракты</h3>
                <p className="text-4xl font-bold">
                  {extraStats.contractsMonth}
                </p>
                <p className="text-sm text-slate-400 mt-2">За текущий месяц</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-900/80 border-slate-800 rounded-2xl">
              <CardContent className="p-5">
                <h3 className="font-bold mb-2">Отпуска</h3>
                <p className="text-4xl font-bold">
                  {extraStats.vacationsActive}
                </p>
                <p className="text-sm text-slate-400 mt-2">Активных заявок: 2</p>
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
