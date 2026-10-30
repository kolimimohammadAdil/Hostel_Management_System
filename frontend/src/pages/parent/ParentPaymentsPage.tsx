import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  IndianRupee, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Receipt, 
  ArrowLeft, 
  QrCode, 
  Lock,
  Building,
  Smartphone,
  Info,
  Sparkles,
  PartyPopper
} from 'lucide-react';
import type { FeeTransaction } from '../../types';
import { PartyBomberConfetti } from '../../components/common/PartyBomberConfetti';

export const ParentPaymentsPage: React.FC = () => {
  const { activeStudent, activeParent, feeAccounts, makeDemoPayment } = useApp();

  const account = feeAccounts.find((f) => f.studentId === activeStudent.id) || feeAccounts[0];

  const [paymentAmount, setPaymentAmount] = useState<number>(() =>
    account.outstandingAmount > 0 ? Math.min(account.outstandingAmount, 15000) : 0
  );
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET_BANKING' | 'DEBIT_CARD' | 'CREDIT_CARD'>('UPI');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState<number>(0);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    message: string;
    transaction?: FeeTransaction;
  } | null>(null);

  const handlePay = () => {
    setIsProcessing(true);
    setLastResult(null);

    setTimeout(() => {
      const result = makeDemoPayment(
        account.studentId,
        paymentAmount,
        paymentMethod,
        simulateFailure
      );
      setIsProcessing(false);
      setLastResult(result);
      if (result.success) {
        setConfettiTrigger((prev) => prev + 1);
      }
    }, 900);
  };

  const setFullAmount = () => {
    setPaymentAmount(account.outstandingAmount);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Prominent Demo Mode Disclaimer Header */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 dark:bg-amber-950/20 border-2 border-amber-500/30 flex items-start gap-3.5 text-amber-900 dark:text-amber-200">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <p className="font-extrabold uppercase tracking-wide flex items-center gap-2">
            DEMO PAYMENT GATEWAY — NO REAL MONEY IS TRANSFERRED
          </p>
          <p className="mt-1 text-slate-600 dark:text-slate-300 text-xs">
            This module provides an interactive simulation of the fee clearance workflow. It demonstrates transaction ID generation, real-time balance reduction, ledger updating, and automated notification triggers. No real payment credentials or UPI PINs are ever collected or stored.
          </p>
        </div>
      </div>

      {lastResult ? (
        /* Result Screen */
        <>
          {lastResult.success && (
            <PartyBomberConfetti
              key={confettiTrigger}
              triggerKey={confettiTrigger}
              durationMs={5000}
            />
          )}

          <Card className="text-center p-6 sm:p-10 border-2 border-slate-200 dark:border-slate-800 relative overflow-hidden">
            {lastResult.success && (
              <div className="absolute top-0 inset-x-0 h-1.5 bg-linear-to-r from-amber-500 via-rose-500 to-indigo-600 animate-pulse" />
            )}

            <div className="max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center shadow-lg transition-transform animate-in zoom-in">
                {lastResult.success ? (
                  <div className="w-full h-full rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center relative">
                    <CheckCircle2 className="w-10 h-10" />
                    <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                ) : (
                  <div className="w-full h-full rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center justify-center">
                    <XCircle className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center justify-center gap-2">
                  {lastResult.success ? (
                    <>
                      <span>Payment Simulation Successful!</span>
                      <span className="text-2xl">🎉</span>
                    </>
                  ) : (
                    'Payment Simulation Declined'
                  )}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {lastResult.message}
                </p>
              </div>

              {lastResult.success && (
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setConfettiTrigger((prev) => prev + 1)}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-linear-to-r from-amber-500 via-rose-500 to-indigo-600 text-white font-bold text-xs shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    <PartyPopper className="w-3.5 h-3.5" />
                    Blast Party Bomber Again! 🎊
                  </button>
                </div>
              )}

              {lastResult.transaction && (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2 font-mono">
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">Transaction ID:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{lastResult.transaction.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">Digital Receipt No:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{lastResult.transaction.receiptNumber}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">Amount Processed:</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{lastResult.transaction.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500">Timestamp:</span>
                    <span>{lastResult.transaction.timestamp}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Updated Outstanding:</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      ₹{account.outstandingAmount.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  className="flex-1 justify-center"
                  onClick={() => {
                    setLastResult(null);
                    setPaymentAmount(Math.min(account.outstandingAmount, 10000));
                  }}
                >
                  Perform Another Test
                </Button>
                <Link to="/parent/fees" className="flex-1">
                  <Button variant="outline" className="w-full justify-center">
                    <Receipt className="w-4 h-4 mr-1.5" />
                    View Updated Ledger
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </>
      ) : (
        /* Payment Configuration Form */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader
                title="1. Select Payment Amount"
                subtitle={`Current total outstanding dues: ₹${account.outstandingAmount.toLocaleString('en-IN')}`}
              />
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Amount to Pay (INR ₹)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={account.outstandingAmount}
                      value={paymentAmount || ''}
                      onChange={(e) => setPaymentAmount(Math.max(0, Number(e.target.value)))}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-lg focus:ring-2 focus:ring-blue-500"
                      disabled={account.outstandingAmount === 0}
                    />
                  </div>
                  {paymentAmount > account.outstandingAmount && (
                    <p className="text-xs text-rose-500 font-medium mt-1">
                      Amount cannot exceed outstanding balance of ₹{account.outstandingAmount.toLocaleString('en-IN')}.
                    </p>
                  )}
                </div>

                {/* Preset Chips */}
                {account.outstandingAmount > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={setFullAmount}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                    >
                      Full Balance (₹{account.outstandingAmount.toLocaleString('en-IN')})
                    </button>
                    {account.outstandingAmount >= 10000 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(10000)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        ₹10,000 Installment
                      </button>
                    )}
                    {account.outstandingAmount >= 5000 && (
                      <button
                        type="button"
                        onClick={() => setPaymentAmount(5000)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 transition-colors"
                      >
                        ₹5,000 Installment
                      </button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader
                title="2. Select Simulated Payment Method"
                subtitle="Choose demonstration payment rails"
              />
              <CardContent className="space-y-3">
                {[
                  { id: 'UPI' as const, label: 'UPI / QR Code (Simulated PhonePe/GPay)', icon: <Smartphone className="w-4 h-4 text-emerald-500" /> },
                  { id: 'NET_BANKING' as const, label: 'Net Banking (SBI / HDFC / ICICI)', icon: <Building className="w-4 h-4 text-blue-500" /> },
                  { id: 'DEBIT_CARD' as const, label: 'RuPay / Visa Debit Card', icon: <CreditCard className="w-4 h-4 text-purple-500" /> },
                  { id: 'CREDIT_CARD' as const, label: 'Credit Card', icon: <CreditCard className="w-4 h-4 text-amber-500" /> },
                ].map((m) => (
                  <label
                    key={m.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === m.id
                        ? 'bg-blue-50/70 dark:bg-blue-950/20 border-blue-500/50 shadow-xs'
                        : 'bg-white dark:bg-[#0b1329] border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                        {m.icon}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {m.label}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === m.id}
                      onChange={() => setPaymentMethod(m.id)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                ))}
              </CardContent>
            </Card>

            {/* Test Simulation Controls */}
            <Card className="border-dashed border-2 border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30">
              <CardHeader
                title="3. Evaluator Workflow Testing Mode"
                subtitle="Toggle between simulated success and simulated decline to test failure behavior (Workflow A)"
              />
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-[#0b1329] border border-slate-200 dark:border-slate-800">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Simulate Transaction Outcome:
                    </span>
                    <p className="text-[11px] text-slate-400">
                      {simulateFailure
                        ? 'Decline mode: Balance will remain unchanged to test failure resilience.'
                        : 'Success mode: Generates receipt, decrements balance, adds notifications.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSimulateFailure(!simulateFailure)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                      simulateFailure
                        ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                    }`}
                  >
                    {simulateFailure ? 'FAILURE (DECLINE)' : 'SUCCESS (CLEAR)'}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Col: Summary & Pay Button */}
          <div className="space-y-6">
            <Card className="sticky top-20">
              <CardHeader title="Transaction Summary" subtitle="Simulated checkout summary" />
              <CardContent className="space-y-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Student:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{account.studentName}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Roll Number:</span>
                    <span className="font-mono">{account.studentRollNo}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Hostel / Room:</span>
                    <span>{account.hostelName} ({account.roomNumber})</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Payer Guardian:</span>
                    <span className="font-semibold">{activeParent.name}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span>Current Dues:</span>
                    <span className="font-bold">₹{account.outstandingAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Simulated Payment:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">
                      ₹{(paymentAmount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800 font-bold">
                    <span>Est. Remaining Balance:</span>
                    <span className="text-amber-600 dark:text-amber-400">
                      ₹{Math.max(0, account.outstandingAmount - (paymentAmount || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  className="w-full justify-center py-3 font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400"
                  disabled={
                    isProcessing ||
                    account.outstandingAmount === 0 ||
                    !paymentAmount ||
                    paymentAmount <= 0 ||
                    paymentAmount > account.outstandingAmount
                  }
                  onClick={handlePay}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {isProcessing
                    ? 'Processing Simulation...'
                    : account.outstandingAmount === 0
                    ? 'No Outstanding Dues'
                    : `Confirm Demo Payment (₹${(paymentAmount || 0).toLocaleString('en-IN')})`}
                </Button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Demo mode. No credit card or banking details are transmitted.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

