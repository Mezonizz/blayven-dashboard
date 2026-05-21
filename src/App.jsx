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

const ALLOWED_GUILD_ID = "1400389862464426084";

const ALLOWED_DASHBOARD_ROLES = [
  "1400390306427441165", // CC / СС
  "1400390289339842610", // Recruiter / Рекрутер
  "1400390286164758599", // Leader
  "1400390287041499288", // Deputy 
];

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
const [session, setSession] = useState(null);
const [discordUser, setDiscordUser] = useState(null);
const [authLoading, setAuthLoading] = useState(true);
const [hasAccess, setHasAccess] = useState(false);
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

const [vacationsPage, setVacationsPage] = useState({
  active: 0,
  pending: 0,
  approved: 0,
  total: 0,
});

const [vacationsList, setVacationsList] = useState([]);

const [voiceStats, setVoiceStats] = useState({
  totalHours: 0,
  todayHours: 0,
  activeSessions: 0,
});

const [punishmentsPage, setPunishmentsPage] = useState({
  active: 0,
  removed: 0,
  total: 0,
});

const [punishmentsList, setPunishmentsList] = useState([]);

const [topVoiceUsers, setTopVoiceUsers] = useState([]);

const [apStats, setApStats] = useState({
  totalBalance: 0,
  totalEarned: 0,
  totalSpent: 0,
  pendingRequests: 0,
});
const [apPendingRequests, setApPendingRequests] = useState([]);
const [searchQuery, setSearchQuery] = useState("");
const [profileStatusFilter, setProfileStatusFilter] = useState("ALL");

const [currentPage, setCurrentPage] = useState(1);
const [sortBy, setSortBy] = useState("ap");
const [sortDirection, setSortDirection] = useState("desc");
const [selectedProfile, setSelectedProfile] = useState(null);
const [selectedProfileTab, setSelectedProfileTab] = useState("overview");
const [selectedProfileData, setSelectedProfileData] = useState({
  apHistory: [],
  punishments: [],
  voiceSessions: [],
  contracts: [],
});
const profilesPerPage = 15;

useEffect(() => {
  setCurrentPage(1);
}, [searchQuery, profileStatusFilter]);

const [activePage, setActivePage] = useState("Главная");

const stats = [
  { title: "Участников", value: statsLive.members, icon: Users, note: "в базе members" },
  { title: "AP выдано", value: statsLive.totalAp, icon: Coins, note: "total earned" },
  { title: "Voice часов", value: `${statsLive.voiceHours}ч`, icon: Mic, note: "всего" },
  { title: "Активных наказаний", value: statsLive.activePunishments, icon: ShieldAlert, note: "status ACTIVE" },
];

const filteredProfiles = profiles.filter((m) => {
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
});

filteredProfiles.sort((a, b) => {
  let aValue = a[sortBy] || 0;
  let bValue = b[sortBy] || 0;

  if (typeof aValue === "string") {
    aValue = aValue.toLowerCase();
    bValue = String(bValue).toLowerCase();
  }

  if (sortDirection === "asc") {
    return aValue > bValue ? 1 : -1;
  }

  return aValue < bValue ? 1 : -1;
});

const totalPages = Math.ceil(
  filteredProfiles.length / profilesPerPage
);

const paginatedProfiles = filteredProfiles.slice(
  (currentPage - 1) * profilesPerPage,
  currentPage * profilesPerPage
);

useEffect(() => {
  async function loadStats() {
    const { count: membersCount } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true });

const { data: apRows } = await supabase
  .from("loyalty_profiles")
  .select("points, total_earned, total_spent");

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
 const totalBalance = (apRows || []).reduce(
  (sum, r) => sum + Number(r.points || 0),
  0
);

const totalSpent = (apRows || []).reduce(
  (sum, r) => sum + Number(r.total_spent || 0),
  0
);

const { count: pendingApRequests } = await supabase
  .from("loyalty_ap_requests")
  .select("*", { count: "exact", head: true })
  .eq("status", "PENDING");

const { data: pendingApRows } = await supabase
  .from("loyalty_ap_requests")
  .select("id, requester_tag, target_tag, amount, reason, status, created_at")
  .eq("status", "PENDING")
  .order("created_at", { ascending: false })
  .limit(10);

setApPendingRequests(pendingApRows || []);

setApStats({
  totalBalance,
  totalEarned: totalAp,
  totalSpent,
  pendingRequests: pendingApRequests || 0,
});
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

useEffect(() => {
  async function loadSelectedProfileData() {
    if (!selectedProfile) return;

    const { data: apHistoryData } = await supabase
      .from("loyalty_transactions")
      .select("id, amount, type, reason, created_at")
      .eq("user_id", selectedProfile.id)
      .order("created_at", { ascending: false })
      .limit(10);

    setSelectedProfileData((prev) => ({
      ...prev,
      apHistory: apHistoryData || [],
    }));
  }

  loadSelectedProfileData();
}, [selectedProfile]);

useEffect(() => {
  async function loadVoicePage() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

const weekStart = new Date();
const day = weekStart.getDay();
const diffToMonday = day === 0 ? 6 : day - 1;
weekStart.setDate(weekStart.getDate() - diffToMonday);
weekStart.setHours(0, 0, 0, 0);

const now = new Date();

const { data: voiceRows } = await supabase
  .from("voice_sessions")
  .select("user_id, duration_seconds, started_at, ended_at")
  .eq("is_afk", false)
  .gte("started_at", weekStart.toISOString());

const totalSeconds = (voiceRows || []).reduce((sum, r) => {
  const started = r.started_at ? new Date(r.started_at) : null;
  const ended = r.ended_at ? new Date(r.ended_at) : now;

  let seconds = Number(r.duration_seconds || 0);

  if (started && !r.ended_at) {
    seconds = Math.floor((now - started) / 1000);
  }

  return sum + Math.max(0, seconds);
}, 0);

    const todaySeconds = (voiceRows || [])
      .filter((r) => r.started_at && new Date(r.started_at) >= todayStart)
      .reduce((sum, r) => sum + Number(r.duration_seconds || 0), 0);

    const activeSessions = (voiceRows || []).filter((r) => !r.ended_at).length;

    const byUser = {};

    (voiceRows || []).forEach((r) => {
      const id = String(r.user_id);
      const started = r.started_at ? new Date(r.started_at) : null;
const ended = r.ended_at ? new Date(r.ended_at) : now;

let seconds = Number(r.duration_seconds || 0);

if (started && !r.ended_at) {
  seconds = Math.floor((now - started) / 1000);
}

byUser[id] = (byUser[id] || 0) + Math.max(0, seconds);
    });

    const topUsers = Object.entries(byUser)
      .map(([user_id, seconds]) => {
        const profile = profiles.find((p) => String(p.id) === String(user_id));

        return {
          user_id,
          name: profile?.name || user_id,
          static_id: profile?.static_id || "—",
          hours: Math.floor(seconds / 3600),
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10);

    setVoiceStats({
      totalHours: Math.floor(totalSeconds / 3600),
      todayHours: Math.floor(todaySeconds / 3600),
      activeSessions,
    });

    setTopVoiceUsers(topUsers);
  }

  loadVoicePage();
}, [profiles]);

useEffect(() => {
  async function loadPunishmentsPage() {
    const { data: punishmentRows } = await supabase
      .from("punishments")
      .select("message_id, punished_tag, punishment_type, comment, status, issued_at, expires_at, issuer_tag")
      .order("issued_at", { ascending: false })
      .limit(20);

    const active = (punishmentRows || []).filter((p) => p.status === "ACTIVE").length;
    const removed = (punishmentRows || []).filter((p) => p.status === "REMOVED").length;

    setPunishmentsPage({
      active,
      removed,
      total: (punishmentRows || []).length,
    });

    setPunishmentsList(punishmentRows || []);
  }

  loadPunishmentsPage();
}, []);

async function loginWithDiscord() {
  await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      scopes: "identify email guilds guilds.members.read",
      redirectTo: window.location.origin,
    },
  });
}

async function logout() {
  await supabase.auth.signOut();
  setSession(null);
  setDiscordUser(null);
  setHasAccess(false);
}

useEffect(() => {
  async function checkAuth() {
    setAuthLoading(true);

    const { data } = await supabase.auth.getSession();
    const currentSession = data.session;

    setSession(currentSession);

    if (!currentSession?.provider_token) {
      setHasAccess(false);
      setAuthLoading(false);
      return;
    }

    const userRes = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${currentSession.provider_token}`,
      },
    });

    const userData = await userRes.json();
    setDiscordUser(userData);

    const memberRes = await fetch(
      `https://discord.com/api/users/@me/guilds/${ALLOWED_GUILD_ID}/member`,
      {
        headers: {
          Authorization: `Bearer ${currentSession.provider_token}`,
        },
      }
    );

    if (!memberRes.ok) {
      setHasAccess(false);
      setAuthLoading(false);
      return;
    }

    const memberData = await memberRes.json();

    const allowed = (memberData.roles || []).some((roleId) =>
      ALLOWED_DASHBOARD_ROLES.includes(roleId)
    );

    setHasAccess(allowed);
    setAuthLoading(false);
  }

  checkAuth();

  const { data: listener } = supabase.auth.onAuthStateChange(() => {
    checkAuth();
  });

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);

if (authLoading) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      Проверка доступа...
    </div>
  );
}

if (!session) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center">
        <h1 className="text-3xl font-bold mb-3">BLAYVEN Dashboard</h1>
        <p className="text-slate-400 mb-6">Вход только через Discord</p>

        <button
          onClick={loginWithDiscord}
          className="px-6 py-3 rounded-xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 hover:bg-cyan-500/30"
        >
          Войти через Discord
        </button>
      </div>
    </div>
  );
}

if (!hasAccess) {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="bg-slate-900 p-8 rounded-2xl border border-rose-500/30 text-center">
        <h1 className="text-3xl font-bold mb-3 text-rose-300">Доступ запрещён</h1>
        <p className="text-slate-400 mb-6">
          У тебя нет нужной роли для входа в BLAYVEN Dashboard.
        </p>

        <button
          onClick={logout}
          className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}

useEffect(() => {
  async function loadVacationsPage() {
    const { data: vacationRows } = await supabase
      .from("vacations")
      .select(`
        id,
        user_tag,
        status,
        reason,
        requested_at,
        approved_at,
        start_at,
        end_at,
        reviewer_tag
      `)
      .order("requested_at", { ascending: false })
      .limit(20);

    const active = (vacationRows || []).filter(
      (v) => v.status === "ACTIVE"
    ).length;

    const pending = (vacationRows || []).filter(
      (v) => v.status === "PENDING"
    ).length;

    const approved = (vacationRows || []).filter(
      (v) => v.status === "APPROVED"
    ).length;

    setVacationsPage({
      active,
      pending,
      approved,
      total: (vacationRows || []).length,
    });

    setVacationsList(vacationRows || []);
  }

  loadVacationsPage();
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
    <p className="text-slate-400 mt-1">
      Контроль состава, активности, AP, наказаний и заявок.
    </p>
  </div>

  <div className="flex gap-3 items-center">
    {discordUser && (
      <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300">
        {discordUser.global_name || discordUser.username}
      </div>
    )}

    <Button className="rounded-xl">Обновить данные</Button>
    <Button variant="secondary" className="rounded-xl">Экспорт отчёта</Button>

    <button
      onClick={logout}
      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white"
    >
      Выйти
    </button>
  </div>
</div>
          
            {activePage === "Главная" && (
            <>
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
          Показано {paginatedProfiles.length} из {filteredProfiles.length}
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
                        <th
  onClick={() => {
    setSortBy("ap");
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  }}
  className="text-left p-3 cursor-pointer hover:text-cyan-300"
>
  AP
</th>
                        <th className="text-left p-3">Static</th>
                        <th className="text-left p-3">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedProfiles.map((m) => (
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
                <div className="flex items-center justify-between mt-5">
  <div className="text-sm text-slate-400">
    Страница {currentPage} из {totalPages || 1}
  </div>

  <div className="flex gap-2">
    <button
      onClick={() =>
        setCurrentPage((p) => Math.max(1, p - 1))
      }
      disabled={currentPage === 1}
      className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 disabled:opacity-40"
    >
      Назад
    </button>

    <button
      onClick={() =>
        setCurrentPage((p) =>
          Math.min(totalPages, p + 1)
        )
      }
      disabled={currentPage >= totalPages}
      className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 disabled:opacity-40"
    >
      Далее
    </button>
  </div>
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
            </>
)}
{activePage === "Состав" && (
  <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
    <CardContent className="p-5">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h2 className="text-2xl font-bold">Состав семьи</h2>
          <p className="text-slate-400 text-sm mt-1">
            Полный список участников BLAYVEN из Supabase.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3">
            <div className="text-2xl font-bold">{profiles.length}</div>
            <div className="text-xs text-slate-400">Всего</div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3">
            <div className="text-2xl font-bold">
              {profiles.filter((m) => m.status === "Активен").length}
            </div>
            <div className="text-xs text-slate-400">С AP</div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700 rounded-xl px-4 py-3">
            <div className="text-2xl font-bold">
              {profiles.filter((m) => m.status === "Нет AP профиля").length}
            </div>
            <div className="text-xs text-slate-400">Без AP</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
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
{selectedProfile && (
  <div className="mb-5 p-5 rounded-2xl bg-slate-800/70 border border-cyan-400/20 shadow-[0_0_24px_rgba(34,211,238,0.08)]">
    <div className="flex items-start justify-between gap-4">
      <div>
        <h3 className="text-xl font-bold text-cyan-300">
          {selectedProfile.name}
        </h3>
        <p className="text-sm text-slate-400 mt-1">
          @{selectedProfile.username} • #{selectedProfile.static_id}
        </p>
      </div>

      <button
        onClick={() => setSelectedProfile(null)}
        className="px-3 py-1 rounded-lg bg-slate-900 text-slate-300 hover:text-white"
      >
        Закрыть
      </button>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-5">
      <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-700">
        <div className="text-xs text-slate-400">Ранг</div>
        <div className="font-bold mt-1">{selectedProfile.rank}</div>
      </div>

      <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-700">
        <div className="text-xs text-slate-400">Баланс AP</div>
        <div className="font-bold mt-1 text-cyan-300">{selectedProfile.ap}</div>
      </div>

      <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-700">
        <div className="text-xs text-slate-400">Заработано</div>
        <div className="font-bold mt-1 text-emerald-300">{selectedProfile.total_earned}</div>
      </div>

      <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-700">
        <div className="text-xs text-slate-400">Потрачено</div>
        <div className="font-bold mt-1 text-rose-300">{selectedProfile.total_spent}</div>
      </div>

      <div className="bg-slate-900/70 rounded-xl p-3 border border-slate-700">
        <div className="text-xs text-slate-400">Статус</div>
        <div className="font-bold mt-1">{selectedProfile.status}</div>
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mt-5">
      {[
        ["overview", "Обзор"],
        ["ap", "История AP"],
        ["punishments", "Наказания"],
        ["voice", "Voice"],
        ["contracts", "Контракты"],
      ].map(([tab, label]) => (
        <button
          key={tab}
          onClick={() => setSelectedProfileTab(tab)}
          className={`px-4 py-2 rounded-xl border ${
            selectedProfileTab === tab
              ? "bg-cyan-500/15 text-cyan-300 border-cyan-400/30"
              : "bg-slate-900/70 border-slate-700 text-slate-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>

    <div className="mt-5 p-4 rounded-xl bg-slate-900/60 border border-slate-700 text-sm text-slate-400">
      {selectedProfileTab === "overview" && "Общая информация по выбранному участнику."}
      {selectedProfileTab === "ap" && (
  <div className="space-y-2">
    {selectedProfileData.apHistory.map((row) => (
      <div
        key={row.id}
        className="flex items-center justify-between rounded-lg bg-slate-800/70 border border-slate-700 px-3 py-2"
      >
        <div>
          <div className="font-medium text-slate-200">
            {row.reason || "AP операция"}
          </div>
          <div className="text-xs text-slate-500">
            {new Date(row.created_at).toLocaleString()}
          </div>
        </div>

        <div
          className={`font-bold ${
            Number(row.amount) >= 0 ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {Number(row.amount) >= 0 ? "+" : ""}
          {row.amount} AP
        </div>
      </div>
    ))}

    {selectedProfileData.apHistory.length === 0 && (
      <div className="text-slate-500">
        История AP для этого участника пока пустая.
      </div>
    )}
  </div>
)}
      {selectedProfileTab === "punishments" && "Здесь будут наказания участника."}
      {selectedProfileTab === "voice" && "Здесь будет voice активность участника."}
      {selectedProfileTab === "contracts" && "Здесь будут контракты участника."}
    </div>
  </div>
)}
  <div className="overflow-hidden rounded-xl border border-slate-800">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 text-slate-300">
            <tr>
              <th className="text-left p-3">Игрок</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Ранг</th>
              <th className="text-left p-3">Static</th>
              <th className="text-left p-3">AP</th>
              <th className="text-left p-3">Заработано</th>
              <th className="text-left p-3">Потрачено</th>
              <th className="text-left p-3">Статус</th>
            </tr>
          </thead>

          <tbody>
            {paginatedProfiles.map((m) => (
              <tr
                key={m.id}
                onClick={() => {
                  setSelectedProfile(m);
                  setSelectedProfileTab("overview");
                }}
                className="border-t border-slate-800 hover:bg-slate-800/40 transition-colors cursor-pointer"
              >
                <td className="p-3 font-medium">{m.name}</td>
                <td className="p-3 text-slate-400">{m.username}</td>
                <td className="p-3">
                  <span className="px-2 py-1 rounded-lg bg-slate-800 text-xs">
                    {m.rank}
                  </span>
                </td>
                <td className="p-3 text-slate-300">#{m.static_id}</td>
                <td className="p-3 font-bold text-cyan-300">{m.ap}</td>
                <td className="p-3 text-emerald-300">{m.total_earned}</td>
                <td className="p-3 text-rose-300">{m.total_spent}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs ${
                      m.status === "Активен"
                        ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                        : "bg-amber-500/15 text-amber-300 border border-amber-400/20"
                    }`}
                  >
                    {m.status}
                  </span>
                </td>
              </tr>
            ))}

            {filteredProfiles.length === 0 && (
              <tr>
                <td colSpan="8" className="p-6 text-center text-slate-400">
                  Ничего не найдено по выбранным фильтрам.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </CardContent>
  </Card>
)}
{activePage === "AP система" && (
  <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
    <CardContent className="p-5">
      <h2 className="text-2xl font-bold mb-4">AP система</h2>
      <p className="text-slate-400">
        Тут будет баланс AP, заявки, история начислений и бусты.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mt-6">

  <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
    <div className="text-sm text-slate-400">Баланс AP</div>
    <div className="text-3xl font-bold text-cyan-300 mt-2">
      {apStats.totalBalance}
    </div>
  </div>

  <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
    <div className="text-sm text-slate-400">Всего заработано</div>
    <div className="text-3xl font-bold text-emerald-300 mt-2">
      {apStats.totalEarned}
    </div>
  </div>

  <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
    <div className="text-sm text-slate-400">Всего потрачено</div>
    <div className="text-3xl font-bold text-rose-300 mt-2">
      {apStats.totalSpent}
    </div>
  </div>

  <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
    <div className="text-sm text-slate-400">Pending AP Requests</div>
    <div className="text-3xl font-bold text-amber-300 mt-2">
      {apStats.pendingRequests}
    </div>
  </div>

</div>
<div className="mt-6">
  <h3 className="text-xl font-bold mb-4">Заявки на выдачу AP</h3>

  <div className="space-y-3">
    {apPendingRequests.map((r) => (
      <div
        key={r.id}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 rounded-xl bg-slate-800/70 border border-slate-700 p-4"
      >
        <div>
          <div className="font-semibold">
            {r.requester_tag || "Unknown"} → {r.target_tag || "Unknown"}
          </div>
          <div className="text-sm text-slate-400 mt-1">
            {r.reason || "Без причины"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {new Date(r.created_at).toLocaleString()}
          </div>
        </div>

        <div className="text-2xl font-bold text-cyan-300">
          +{r.amount || 0} AP
        </div>
      </div>
    ))}

    {apPendingRequests.length === 0 && (
      <div className="rounded-xl bg-slate-800/70 border border-slate-700 p-4 text-slate-400">
        Сейчас нет pending заявок на AP.
      </div>
    )}
  </div>
</div>
    </CardContent>
  </Card>
)}
{activePage === "Voice активность" && (
  <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
    <CardContent className="p-5">
      <h2 className="text-2xl font-bold mb-2">Voice активность</h2>
      <p className="text-slate-400 mb-6">
        Статистика активности участников по voice_sessions.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">Всего часов</div>
          <div className="text-3xl font-bold text-cyan-300 mt-2">
            {voiceStats.totalHours}ч
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">Сегодня</div>
          <div className="text-3xl font-bold text-emerald-300 mt-2">
            {voiceStats.todayHours}ч
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">Активные сессии</div>
          <div className="text-3xl font-bold text-amber-300 mt-2">
            {voiceStats.activeSessions}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold mb-4">Топ voice активности за 7 дней</h3>

        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="text-left p-3">#</th>
                <th className="text-left p-3">Игрок</th>
                <th className="text-left p-3">Static</th>
                <th className="text-left p-3">Voice</th>
              </tr>
            </thead>

            <tbody>
              {topVoiceUsers.map((u, index) => (
                <tr key={u.user_id} className="border-t border-slate-800">
                  <td className="p-3 text-slate-400">{index + 1}</td>
                  <td className="p-3 font-medium">{u.name}</td>
                  <td className="p-3 text-slate-300">#{u.static_id}</td>
                  <td className="p-3 font-bold text-cyan-300">{u.hours}ч</td>
                </tr>
              ))}

              {topVoiceUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-slate-400">
                    Voice данные пока отсутствуют.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
)}
{activePage === "Наказания" && (
  <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
    <CardContent className="p-5">
      <h2 className="text-2xl font-bold mb-2">Наказания</h2>

      <p className="text-slate-400 mb-6">
        Активные и архивные наказания участников.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">Активные</div>
          <div className="text-3xl font-bold text-rose-300 mt-2">
            {punishmentsPage.active}
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">Снятые</div>
          <div className="text-3xl font-bold text-emerald-300 mt-2">
            {punishmentsPage.removed}
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">Всего</div>
          <div className="text-3xl font-bold text-cyan-300 mt-2">
            {punishmentsPage.total}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold mb-4">
          Последние наказания
        </h3>

        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="text-left p-3">Игрок</th>
                <th className="text-left p-3">Тип</th>
                <th className="text-left p-3">Комментарий</th>
                <th className="text-left p-3">Выдал</th>
                <th className="text-left p-3">Статус</th>
                <th className="text-left p-3">Истекает</th>
              </tr>
            </thead>

            <tbody>
              {punishmentsList.map((p) => (
                <tr
                  key={p.message_id}
                  className="border-t border-slate-800"
                >
                  <td className="p-3 font-medium">
                    {p.punished_tag || "Unknown"}
                  </td>

                  <td className="p-3 text-slate-300">
                    {p.punishment_type || "—"}
                  </td>

                  <td className="p-3 text-slate-400">
                    {p.comment || "Без комментария"}
                  </td>

                  <td className="p-3 text-slate-400">
                    {p.issuer_tag || "—"}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs ${
                        p.status === "ACTIVE"
                          ? "bg-rose-500/15 text-rose-300 border border-rose-400/20"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>

                  <td className="p-3 text-slate-400">
                    {p.expires_at
                      ? new Date(p.expires_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}

              {punishmentsList.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-6 text-center text-slate-400"
                  >
                    Наказаний пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
)}

{activePage === "Отпуска" && (
  <Card className="bg-slate-900/80 border-slate-800 rounded-2xl shadow-xl">
    <CardContent className="p-5">
      <h2 className="text-2xl font-bold mb-2">Отпуска</h2>

      <p className="text-slate-400 mb-6">
        Управление отпусками участников семьи.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">ACTIVE</div>
          <div className="text-3xl font-bold text-cyan-300 mt-2">
            {vacationsPage.active}
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">PENDING</div>
          <div className="text-3xl font-bold text-amber-300 mt-2">
            {vacationsPage.pending}
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">APPROVED</div>
          <div className="text-3xl font-bold text-emerald-300 mt-2">
            {vacationsPage.approved}
          </div>
        </div>

        <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5">
          <div className="text-sm text-slate-400">Всего</div>
          <div className="text-3xl font-bold text-rose-300 mt-2">
            {vacationsPage.total}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-bold mb-4">
          Последние отпуска
        </h3>

        <div className="overflow-hidden rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-800 text-slate-300">
              <tr>
                <th className="text-left p-3">Игрок</th>
                <th className="text-left p-3">Статус</th>
                <th className="text-left p-3">Причина</th>
                <th className="text-left p-3">Начало</th>
                <th className="text-left p-3">Конец</th>
                <th className="text-left p-3">Одобрил</th>
              </tr>
            </thead>

            <tbody>
              {vacationsList.map((v) => (
                <tr
                  key={v.id}
                  className="border-t border-slate-800"
                >
                  <td className="p-3 font-medium">
                    {v.user_tag || "Unknown"}
                  </td>

                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded-lg text-xs ${
                        v.status === "ACTIVE"
                          ? "bg-cyan-500/15 text-cyan-300 border border-cyan-400/20"
                          : v.status === "PENDING"
                          ? "bg-amber-500/15 text-amber-300 border border-amber-400/20"
                          : "bg-emerald-500/15 text-emerald-300 border border-emerald-400/20"
                      }`}
                    >
                      {v.status}
                    </span>
                  </td>

                  <td className="p-3 text-slate-400">
                    {v.reason || "Без причины"}
                  </td>

                  <td className="p-3 text-slate-400">
                    {v.start_at
                      ? new Date(v.start_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="p-3 text-slate-400">
                    {v.end_at
                      ? new Date(v.end_at).toLocaleDateString()
                      : "—"}
                  </td>

                  <td className="p-3 text-slate-400">
                    {v.reviewer_tag || "—"}
                  </td>
                </tr>
              ))}

              {vacationsList.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="p-6 text-center text-slate-400"
                  >
                    Отпусков пока нет.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </CardContent>
  </Card>
)}

        </main>
      </div>
    </div>
  );
}
