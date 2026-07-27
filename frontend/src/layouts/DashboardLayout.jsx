import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { useEffect, useState } from "react";
import { seekerAPI, messageAPI, notificationAPI } from "../api/index.js";
import { Icons } from "../components/ui/icons";

const SEEKER_NAV = [
  { to: "/seeker", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/seeker/listings", label: "My Listings", icon: "listings" },
  {
    to: "/seeker/inbox",
    label: "Interest Inbox",
    icon: "inbox",
    interestBadge: true,
  },
  { to: "/seeker/documents", label: "Documents", icon: "documents" },
  { to: "/seeker/updates", label: "Post Updates", icon: "updates" },
  { to: "/seeker/score", label: "Scores & Reports", icon: "scores" },
  { to: "/seeker/access-logs", label: "Doc Access Logs", icon: "logs" },
  {
    to: "/connections",
    label: "Deal Pipeline",
    icon: "pipeline",
    messageBadge: true,
  },
  { to: "/seeker/profile", label: "Profile", icon: "profile" },
];

const INVESTOR_NAV = [
  { to: "/investor", label: "Dashboard", icon: "dashboard", end: true },
  { to: "/investor/discover", label: "Discover", icon: "discover" },
  { to: "/investor/saved", label: "Saved Deals", icon: "saved" },
  { to: "/investor/interests", label: "Sent Interests", icon: "interests" },
  {
    to: "/connections",
    label: "Deal Pipeline",
    icon: "pipeline",
    messageBadge: true,
  },
  { to: "/investor/profile", label: "Profile", icon: "profile" },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: "dashboard", end: true },
  { to: "/admin/listings", label: "Listings", icon: "listings" },
  { to: "/admin/users", label: "Users", icon: "users" },
  { to: "/admin/interests", label: "Interests", icon: "interests" },
  { to: "/admin/review-center", label: "Review Center", icon: "shield" },
];

function Badge({ count }) {
  if (!count || count <= 0) return null;

  return (
    <span
      style={{
        background: "#EF4444",
        color: "#fff",
        fontSize: "10px",
        fontWeight: "700",
        minWidth: "18px",
        height: "18px",
        borderRadius: "9999px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 5px",
        flexShrink: 0,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [pendingInterests, setPendingInterests] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Pending interests
  useEffect(() => {
    if (user?.role !== "CAPITAL_SEEKER") return;

    const fetch = () => {
      seekerAPI
        .getPendingCount()
        .then((r) => setPendingInterests(r.data.data.count))
        .catch(() => {});
    };

    fetch();

    const i = setInterval(fetch, 30000);

    return () => clearInterval(i);
  }, [user]);

  // Unread messages
  useEffect(() => {
    if (!["CAPITAL_SEEKER", "INVESTOR"].includes(user?.role)) return;

    const fetch = () => {
      messageAPI
        .getUnreadCount()
        .then((r) => setUnreadMessages(r.data.data.count))
        .catch(() => {});
    };

    fetch();

    const i = setInterval(fetch, 15000);

    return () => clearInterval(i);
  }, [user]);

  // Notifications
  useEffect(() => {
    if (!user) return;

    const fetch = () => {
      notificationAPI
        .getUnread()
        .then((r) => setUnreadNotifs(r.data.data.count))
        .catch(() => {});
    };

    fetch();

    const i = setInterval(fetch, 20000);

    return () => clearInterval(i);
  }, [user]);

  const loadNotifications = async () => {
    try {
      const r = await notificationAPI.getAll();

      setNotifications(r.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };
  const nav =
    user?.role === "CAPITAL_SEEKER"
      ? SEEKER_NAV
      : user?.role === "INVESTOR"
        ? INVESTOR_NAV
        : ADMIN_NAV;

  const roleLabel =
    {
      CAPITAL_SEEKER: "Capital Seeker",
      INVESTOR: "Investor",
      ADMIN: "Admin",
    }[user?.role] || "";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-navy flex flex-col fixed h-screen z-30 shadow-navy">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <img
            src="/logo.png"
            alt="KuberList"
            className="w-8 h-8 object-contain flex-shrink-0"
          />

          <span className="font-display text-lg font-semibold text-white tracking-tight">
            KuberList
          </span>
        </div>

        {/* Role */}
        <div className="px-5 pt-4 pb-1">
          <p className="text-xs text-white/30 uppercase tracking-widest font-medium">
            {roleLabel}
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 pb-4 overflow-y-auto mt-1">
          {nav.map((item) => {
            const Icon = Icons[item.icon] || Icons.dashboard;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  isActive ? "nav-active" : "nav-link"
                }
              >
                <span className="w-5 flex items-center justify-center flex-shrink-0">
                  <Icon size={17} strokeWidth={1.8} />
                </span>

                <span className="flex-1">{item.label}</span>

                {item.interestBadge && <Badge count={pendingInterests} />}

                {item.messageBadge && <Badge count={unreadMessages} />}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-white/10">
          {/* Notification button */}
          <button
            onClick={async () => {
              await loadNotifications();

              if (notifications.length > 0) {
                try {
                  await notificationAPI.markRead(
                    notifications.map((n) => n.id),
                  );

                  setUnreadNotifs(0);
                } catch (err) {
                  console.error(err);
                }
              }

              setShowNotifications((prev) => !prev);
            }}
            className="
    w-full flex items-center
    gap-2 text-white/50
    hover:text-white
    text-xs transition-colors
    mb-3
  "
          >
            <Icons.alert size={15} />

            <span>Notifications</span>

            {unreadNotifs > 0 && (
              <span
                className="
      ml-auto bg-red-500
      text-white text-xs
      font-bold px-1.5
      py-0.5 rounded-full
    "
              >
                {unreadNotifs > 9 ? "9+" : unreadNotifs}
              </span>
            )}
          </button>
          {showNotifications && (
            <div
              className="
      mb-3 bg-white
      rounded-xl shadow-xl
      border border-border
      max-h-80 overflow-y-auto
    "
            >
              {notifications.length === 0 ? (
                <p
                  className="
              text-sm text-muted
              p-4 text-center
            "
                >
                  No notifications
                </p>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={async () => {
                      try {
                        await notificationAPI.markRead([n.id]);

                        setUnreadNotifs((prev) => Math.max(prev - 1, 0));

                        setNotifications((prev) =>
                          prev.map((x) =>
                            x.id === n.id
                              ? {
                                  ...x,
                                  is_read: true,
                                }
                              : x,
                          ),
                        );
                      } catch (err) {
                        console.error(err);
                      }

                      if (n.link) {
                        navigate(n.link);
                        setShowNotifications(false);
                      }
                    }}
                    className={`
  w-full text-left
  p-3 border-b
  hover:bg-gray-50

  ${!n.is_read ? "bg-blue-50" : "bg-white"}
`}
                  >
                    <p
                      className="
                text-sm font-semibold
                text-navy
              "
                    >
                      {n.title}
                    </p>

                    <p
                      className="
                text-xs text-muted
                mt-1
              "
                    >
                      {n.message}
                    </p>
                  </button>
                ))
              )}
            </div>
          )}

          {/* User */}
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 flex-shrink-0">
              {user?.profile_image_url ? (
                <img
                  src={`http://localhost:3001${user.profile_image_url}`}
                  alt={user?.name}
                  className="w-8 h-8 rounded-full object-cover border border-gold/40"
                />
              ) : (
                <div className="w-8 h-8 bg-gold/20 border border-gold/40 rounded-full flex items-center justify-center text-gold font-display font-bold text-sm">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate leading-tight">
                {user?.name}
              </p>

              <p className="text-xs text-white/30 truncate">{user?.email}</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="text-white/30 hover:text-white text-xs transition-colors w-full text-left"
          >
            Sign out →
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-56 min-h-screen">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
