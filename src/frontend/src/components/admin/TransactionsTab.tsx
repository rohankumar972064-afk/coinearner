import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useActor } from "@caffeineai/core-infrastructure";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState } from "react";
import { createActor } from "../../backend";
import type { Transaction } from "../../backend.d";
import { TransactionMethod } from "../../backend.d";

const PAGE_SIZE = 20;

const METHOD_BADGE: Record<TransactionMethod, { label: string; cls: string }> =
  {
    [TransactionMethod.ad]: {
      label: "Ad",
      cls: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    },
    [TransactionMethod.daily]: {
      label: "Daily",
      cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    },
    [TransactionMethod.referral]: {
      label: "Referral",
      cls: "bg-green-500/20 text-green-400 border-green-500/30",
    },
    [TransactionMethod.task]: {
      label: "Task",
      cls: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    },
    [TransactionMethod.admin]: {
      label: "Admin",
      cls: "bg-gray-500/20 text-gray-300 border-gray-500/30",
    },
    [TransactionMethod.withdrawal]: {
      label: "Withdrawal",
      cls: "bg-red-500/20 text-red-400 border-red-500/30",
    },
  };

export function TransactionsTab() {
  const { actor, isFetching } = useActor(createActor);
  const [methodFilter, setMethodFilter] = useState<TransactionMethod | "all">(
    "all",
  );
  const [userSearch, setUserSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);

  const offset = BigInt(page * PAGE_SIZE);

  const { data, isLoading } = useQuery<{
    total: bigint;
    transactions: Transaction[];
  }>({
    queryKey: ["admin-transactions", methodFilter, fromDate, toDate, page],
    queryFn: async () => {
      if (!actor) return { total: BigInt(0), transactions: [] };
      const method = methodFilter === "all" ? null : methodFilter;
      const from = fromDate
        ? BigInt(new Date(fromDate).getTime() * 1_000_000)
        : null;
      const to = toDate ? BigInt(new Date(toDate).getTime() * 1_000_000) : null;
      return actor.adminGetAllTransactions(
        null,
        method,
        from,
        to,
        BigInt(PAGE_SIZE),
        offset,
      );
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });

  const transactions = data?.transactions ?? [];
  const total = Number(data?.total ?? 0);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = userSearch
    ? transactions.filter((t) =>
        t.userId.toText().toLowerCase().includes(userSearch.toLowerCase()),
      )
    : transactions;

  function exportCSV() {
    const rows = [
      [
        "Date",
        "User",
        "Type",
        "Amount",
        "₹ Value",
        "Credit/Debit",
        "Description",
      ],
      ...filtered.map((t) => [
        new Date(Number(t.createdAt) / 1_000_000).toLocaleString("en-IN"),
        t.userId.toText(),
        t.method,
        Number(t.amount).toString(),
        (Number(t.amount) / 100).toFixed(2),
        t.isCredit ? "Credit" : "Debit",
        `"${t.note.replace(/"/g, '""')}"`,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4" data-ocid="transactions-tab">
      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-wrap gap-3 items-end">
        <div className="space-y-1 min-w-[140px]">
          <Label className="text-gray-400 text-xs">Type</Label>
          <select
            data-ocid="tx-method-filter"
            value={methodFilter}
            onChange={(e) => {
              setMethodFilter(e.target.value as TransactionMethod | "all");
              setPage(0);
            }}
            className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Types</option>
            {Object.values(TransactionMethod).map((m) => (
              <option key={m} value={m}>
                {METHOD_BADGE[m].label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">From Date</Label>
          <Input
            data-ocid="tx-from-date"
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(0);
            }}
            className="bg-gray-700 border-gray-600 text-gray-200 text-sm"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-gray-400 text-xs">To Date</Label>
          <Input
            data-ocid="tx-to-date"
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(0);
            }}
            className="bg-gray-700 border-gray-600 text-gray-200 text-sm"
          />
        </div>
        <div className="space-y-1 flex-1 min-w-[160px]">
          <Label className="text-gray-400 text-xs">User (Principal)</Label>
          <Input
            data-ocid="tx-user-search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            placeholder="Search principal..."
            className="bg-gray-700 border-gray-600 text-gray-200 placeholder:text-gray-500 text-sm"
          />
        </div>
        <Button
          data-ocid="export-csv"
          onClick={exportCSV}
          variant="outline"
          className="border-gray-600 text-gray-300 hover:bg-gray-700 text-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="text-xs text-gray-500">
        {total.toLocaleString("en-IN")} total transactions
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-700">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-900 border-b border-gray-700">
              {["Date", "User", "Type", "Amount", "₹ Value", "Description"].map(
                (h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-gray-500 font-medium text-xs uppercase tracking-wider
                    ${["Amount", "₹ Value"].includes(h) ? "text-right" : "text-left"}
                    ${["Date", "User"].includes(h) ? "hidden sm:table-cell" : ""}
                    ${["₹ Value"].includes(h) ? "hidden md:table-cell" : ""}`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              [1, 2, 3, 4, 5].map((k) => (
                <tr key={k} className="border-b border-gray-800">
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-5 rounded bg-gray-800" />
                  </td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-12 text-gray-500 text-sm"
                  data-ocid="transactions-empty"
                >
                  No transactions found
                </td>
              </tr>
            ) : (
              filtered.map((tx, i) => {
                const badge = METHOD_BADGE[tx.method];
                return (
                  <tr
                    key={tx.id.toString()}
                    data-ocid={`tx-row-${i}`}
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                      {new Date(
                        Number(tx.createdAt) / 1_000_000,
                      ).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-gray-400 max-w-[120px]">
                      <span className="truncate block">
                        {tx.userId.toText().slice(0, 16)}…
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium border ${badge.cls}`}
                      >
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={
                          tx.isCredit
                            ? "text-green-400 font-bold"
                            : "text-red-400 font-bold"
                        }
                      >
                        {tx.isCredit ? "+" : "-"}
                        {Number(tx.amount).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-right text-gray-400 text-xs">
                      ₹{(Number(tx.amount) / 100).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[200px]">
                      <span className="truncate block">{tx.note || "—"}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              data-ocid="prev-page"
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <Button
              data-ocid="next-page"
              size="sm"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="border-gray-600 text-gray-400 hover:bg-gray-800"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
