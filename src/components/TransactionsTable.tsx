'use client';

import { useState } from 'react';
import { Eye, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction } from '@/types/database';

interface TransactionsTableProps {
  transactions: Transaction[];
  isLoading?: boolean;
  itemsPerPage?: number;
}

// Format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function TransactionsTable({ 
  transactions, 
  isLoading = false,
  itemsPerPage = 10 
}: TransactionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [previewSlip, setPreviewSlip] = useState<string | null>(null);

  // Pagination
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + itemsPerPage);

  // Loading Skeleton
  if (isLoading) {
    return (
      <div className="card">
        <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">รายการล่าสุด</h3>
        <span className="text-sm text-gray-500">
          {transactions.length} รายการ
        </span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>วันที่</th>
              <th>ประเภท</th>
              <th>หมวดหมู่</th>
              <th>จำนวนเงิน</th>
              <th>บันทึกโดย</th>
              <th>สลิป</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400">
                  ไม่มีรายการ
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((transaction) => (
                <tr 
                  key={transaction.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="font-medium text-gray-700">
                    {formatDate(transaction.date)}
                  </td>
                  <td>
                    <span
                      className={`
                        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                        ${transaction.type === 'income'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-red-100 text-red-700'
                        }
                      `}
                    >
                      {transaction.type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </span>
                  </td>
                  <td className="text-gray-600">{transaction.category}</td>
                  <td className={`font-semibold ${
                    transaction.type === 'income' ? 'text-purple-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td className="text-gray-500">
                    {transaction.user?.name || 'Unknown'}
                  </td>
                  <td>
                    {transaction.slip_url ? (
                      <button
                        onClick={() => setPreviewSlip(transaction.slip_url)}
                        className="p-2 text-gray-400 hover:text-blue-500 
                                   hover:bg-blue-50 rounded-lg transition-colors"
                        title="ดูสลิป"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    ) : (
                      <span className="text-gray-300 text-sm">-</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            แสดง {startIndex + 1}-{Math.min(startIndex + itemsPerPage, transactions.length)} 
            จาก {transactions.length} รายการ
          </p>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 
                         disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            
            <span className="text-sm text-gray-600 px-4">
              หน้า {currentPage} / {totalPages}
            </span>
            
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 
                         disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Slip Preview Modal */}
      {previewSlip && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center 
                     bg-black/50 backdrop-blur-sm"
          onClick={() => setPreviewSlip(null)}
        >
          <div 
            className="bg-white rounded-2xl p-4 max-w-lg max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-800">สลิปการโอน</h4>
              <div className="flex gap-2">
                <a
                  href={previewSlip}
                  download
                  className="p-2 text-gray-500 hover:text-blue-500 
                             hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setPreviewSlip(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl 
                             leading-none px-2"
                >
                  ×
                </button>
              </div>
            </div>
            <img
              src={previewSlip}
              alt="Transaction slip"
              className="w-full rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
