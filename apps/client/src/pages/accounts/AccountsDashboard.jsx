import React from 'react';
import {
  CreditCard,
  TrendingUp,
  Receipt,
  AlertCircle,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import Card from '../../components/common/Card';
import StatWidget from '../../components/common/StatWidget';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { useNavigate } from 'react-router-dom';

export const AccountsDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-navy-900 rounded-2xl p-6 text-white shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-500/30">
            <CreditCard className="w-3.5 h-3.5 mr-1" />
            <span>Finance & Accounts Office</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Institutional Fee Collection & Financial Ledgers</h1>
          <p className="mt-1 text-xs sm:text-sm text-navy-200 font-light">
            Semester tuition fee structures, student payment records, receipt numbering, outstanding dues, and bank reconciliations.
          </p>
        </div>
        <div>
          <Badge variant="teal" size="md">Accounts Active</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatWidget title="Total Fees Collected" value="₹ 4.28 Cr" subtitle="Academic Year 2025-26" icon={TrendingUp} color="emerald" trend="+8.4%" />
        <StatWidget title="Pending Dues" value="₹ 38.5 Lakhs" subtitle="74 Students with Dues" icon={AlertCircle} color="amber" />
        <StatWidget title="Receipts Issued" value="766 Receipts" subtitle="100% Tax Compliant" icon={Receipt} color="teal" />
        <StatWidget title="Bank Settlements" value="Up-To-Date" subtitle="Daily Gateway Sync" icon={CreditCard} color="navy" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Recent Fee Transactions"
          subtitle="Real-time collection feed across Cash, UPI, and NetBanking"
          className="lg:col-span-2"
        >
          <div className="space-y-3">
            {[
              { student: 'Aarav Sharma (24CSE042)', receipt: 'REC-2025-0891', amount: '₹ 51,000', method: 'UPI', date: 'Today, 10:14 AM', status: 'Completed' },
              { student: 'Priya Patel (24ECE018)', receipt: 'REC-2025-0890', amount: '₹ 51,000', method: 'NetBanking', date: 'Today, 09:45 AM', status: 'Completed' },
              { student: 'Rohan Verma (24ME009)', receipt: 'REC-2025-0889', amount: '₹ 25,000', method: 'DemandDraft', date: 'Yesterday', status: 'Completed' }
            ].map((tx, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-warm-50 border border-navy-100 flex items-center justify-between">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-navy-900">{tx.student}</h4>
                  <p className="text-[11px] text-navy-500 mt-0.5">{tx.receipt} &bull; {tx.method} &bull; {tx.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-navy-900 block">{tx.amount}</span>
                  <Badge variant="success" size="xs">{tx.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Finance Operations">
          <div className="space-y-2">
            <Button variant="teal" size="sm" className="w-full justify-start" onClick={() => navigate('/fees')} icon={Receipt}>
              Manage Fee Structures
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/reports')} icon={FileSpreadsheet}>
              Download Fee Collection Ledger
            </Button>
            <Button variant="secondary" size="sm" className="w-full justify-start" onClick={() => navigate('/notices')} icon={Download}>
              Send Defaulter Notice
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AccountsDashboard;

