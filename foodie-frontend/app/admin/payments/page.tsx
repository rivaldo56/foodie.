'use client';

import { useAdminPayments } from '@/hooks/useAdminPayments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    Loader2, 
    CreditCard, 
    TrendingUp, 
    ArrowUpRight, 
    ArrowDownRight,
    ShieldCheck,
    Banknote,
    History,
    ChefHat
} from 'lucide-react';

export default function AdminPaymentsPage() {
    const { escrowTransactions, payouts, loading, error } = useAdminPayments();

    const totalEscrowed = escrowTransactions.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
    const heldEscrow = escrowTransactions.filter(t => t.escrow_status === 'held').reduce((acc, curr) => acc + Number(curr.total_amount), 0);
    const totalPayouts = payouts.filter(p => p.status === 'paid').reduce((acc, curr) => acc + Number(curr.net_amount), 0);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#ff7642]" />
                <p className="text-gray-400 font-medium">Analyzing platform finances...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-[#f9fafb]">Payments & Escrow</h1>
                <p className="text-[#cbd5f5] mt-1">Monitor platform revenue, escrow status, and chef payouts.</p>
            </div>

            {/* KPI Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="bg-[#16181d] border-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <ShieldCheck className="h-5 w-5 text-blue-400" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-500">Currently Held</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-white">KES {heldEscrow.toLocaleString()}</h3>
                            <p className="text-xs text-gray-500 mt-1">Total in active escrow</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#16181d] border-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-emerald-400" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-500">Net Flow</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-white">KES {totalEscrowed.toLocaleString()}</h3>
                            <p className="text-xs text-gray-500 mt-1">Total volume processed</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#16181d] border-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Banknote className="h-5 w-5 text-purple-400" />
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-500">Chef Earnings</span>
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-white">KES {totalPayouts.toLocaleString()}</h3>
                            <p className="text-xs text-gray-500 mt-1">Total successful payouts</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Escrow Log */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#f9fafb]">
                        <History className="h-5 w-5 text-[#ff7642]" />
                        <h2 className="text-xl font-bold">Escrow Transactions</h2>
                    </div>
                    <Card className="bg-[#16181d] border-white/5">
                        <CardContent className="p-0">
                            {escrowTransactions.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">No transactions recorded.</div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {escrowTransactions.map((t) => (
                                        <div key={t.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-white">KES {Number(t.total_amount).toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-500 flex items-center gap-1">
                                                    <CreditCard className="h-3 w-3" /> Booking #{t.booking_id.slice(0, 8)}
                                                </p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    t.escrow_status === 'held' ? 'bg-blue-500/10 text-blue-400' :
                                                    t.escrow_status === 'released' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    'bg-gray-500/10 text-gray-400'
                                                }`}>
                                                    {t.escrow_status}
                                                </span>
                                                <p className="text-[10px] text-gray-500">{new Date(t.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Payout Log */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[#f9fafb]">
                        <ChefHat className="h-5 w-5 text-[#ff7642]" />
                        <h2 className="text-xl font-bold">Chef Payouts</h2>
                    </div>
                    <Card className="bg-[#16181d] border-white/5">
                        <CardContent className="p-0">
                             {payouts.length === 0 ? (
                                <div className="p-12 text-center text-gray-500">No payouts pending.</div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {payouts.map((p) => (
                                        <div key={p.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium text-white">KES {Number(p.net_amount).toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-500">Chef ID: {p.chef_id.slice(0, 8)}</p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                                    p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400' :
                                                    p.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                                                    'bg-red-500/10 text-red-400'
                                                }`}>
                                                    {p.status}
                                                </span>
                                                <p className="text-[10px] text-gray-500">Method: {p.payout_method}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
