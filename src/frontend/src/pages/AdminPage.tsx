import {
  AlertTriangle,
  BarChart3,
  Bell,
  DollarSign,
  GitBranch,
  List,
  Settings,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { AnnouncementsTab } from "../components/admin/AnnouncementsTab";
import { EarningsControlTab } from "../components/admin/EarningsControlTab";
import { FraudTab } from "../components/admin/FraudTab";
import { ReferralsTab } from "../components/admin/ReferralsTab";
import { SettingsTab } from "../components/admin/SettingsTab";
import { StatsTab } from "../components/admin/StatsTab";
import { TransactionsTab } from "../components/admin/TransactionsTab";
import { UsersTab } from "../components/admin/UsersTab";
import { WithdrawalsTab } from "../components/admin/WithdrawalsTab";

type AdminTab =
  | "overview"
  | "users"
  | "withdrawals"
  | "earnings"
  | "transactions"
  | "announcements"
  | "fraud"
  | "settings"
  | "referrals";

const TABS: {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "users", label: "Users", icon: ShieldCheck },
  { id: "withdrawals", label: "Withdrawals", icon: DollarSign },
  { id: "earnings", label: "Earnings Config", icon: Settings },
  { id: "transactions", label: "Transactions", icon: List },
  { id: "announcements", label: "Announcements", icon: Bell },
  { id: "fraud", label: "Fraud", icon: ShieldAlert },
  { id: "settings", label: "Settings", icon: AlertTriangle },
  { id: "referrals", label: "Referrals", icon: GitBranch },
];

/**
 * AdminPage — access is fully enforced by AuthGuard (adminOnly prop).
 * By the time this component renders, isAdmin is already verified.
 * No need for a local isCallerAdmin() check or "Access Denied" screen.
 */
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");

  const ActiveComponent = {
    overview: StatsTab,
    users: UsersTab,
    withdrawals: WithdrawalsTab,
    earnings: EarningsControlTab,
    transactions: TransactionsTab,
    announcements: AnnouncementsTab,
    fraud: FraudTab,
    settings: SettingsTab,
    referrals: ReferralsTab,
  }[activeTab];

  return (
    <div
      className="min-h-screen bg-gray-950 text-gray-100"
      data-ocid="admin-page"
    >
      {/* Admin Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-4 flex items-center gap-3 sticky top-0 z-20">
        <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4 text-gray-950" />
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-display font-black text-gray-100 leading-tight">
            CoinEarner Admin
          </h1>
          <p className="text-[10px] text-gray-500">
            1000 coins = ₹10 • Management Console
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <span className="rounded-full px-2 py-1 text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
            Admin
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div
        className="bg-gray-900 border-b border-gray-800 overflow-x-auto"
        data-ocid="admin-tab-switcher"
      >
        <div className="flex gap-0.5 px-4 sm:px-6 min-w-max">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                data-ocid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-400"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          <ActiveComponent />
        </motion.div>
      </div>
    </div>
  );
}
