'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar, { MobileSearchBar } from '@/components/TopBar';
import { 
  Upload, 
  FileImage, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2 
} from 'lucide-react';
import { User, Transaction, Category } from '@/types/database';

// Mock Data
const mockUser: User = {
  id: '1',
  name: 'สมชาย ใจดี',
  email: 'owner@demo.com',
  role: 'owner',
};

const mockCategories: Category[] = [
  { id: '1', name: 'ขายสินค้า', type: 'income' },
  { id: '2', name: 'บริการ', type: 'income' },
  { id: '3', name: 'ค่าเช่า', type: 'expense' },
  { id: '4', name: 'ค่าน้ำค่าไฟ', type: 'expense' },
  { id: '5', name: 'เงินเดือน', type: 'expense' },
  { id: '6', name: 'อุปกรณ์สำนักงาน', type: 'expense' },
];

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'pdf';
}

export default function UploadPage() {
  const router = useRouter();
  const [user] = useState<User>(mockUser);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload state
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [isDragActive, setIsDragActive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleLogout = () => router.push('/login');

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';

    if (!isImage && !isPdf) {
      alert('กรุณาอัปโหลดไฟล์รูปภาพหรือ PDF เท่านั้น');
      return;
    }

    const preview = isImage ? URL.createObjectURL(file) : '';
    setFilePreview({
      file,
      preview,
      type: isImage ? 'image' : 'pdf',
    });
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const removeFile = () => {
    if (filePreview?.preview) {
      URL.revokeObjectURL(filePreview.preview);
    }
    setFilePreview(null);
    setUploadStatus('idle');
  };

  // Available categories based on type
  const availableCategories = mockCategories.filter(c => c.type === formData.type);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!filePreview) {
      alert('กรุณาอัปโหลดสลิปก่อน');
      return;
    }

    setUploadStatus('uploading');

    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, upload to Supabase Storage here
      // const slipUrl = await uploadSlip(filePreview.file, transactionId);
      
      setUploadStatus('success');
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          type: 'expense',
          amount: '',
          category: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
        });
        removeFile();
      }, 2000);

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar user={user} onLogout={handleLogout} />
      <MobileNav user={user} onLogout={handleLogout} />

      <main className="lg:ml-64 min-h-screen transition-all duration-300 pt-20 lg:pt-0">
        <TopBar user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <MobileSearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Upload Slip</h1>
            <p className="text-sm lg:text-base text-gray-500">อัปโหลดสลิปและบันทึกรายการ</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Upload Area */}
            <div className="card">
              <h3 className="text-base lg:text-lg font-semibold text-gray-800 mb-4">อัปโหลดสลิป</h3>

              {!filePreview ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-2xl p-8 lg:p-12 text-center
                    transition-all duration-300 cursor-pointer
                    ${isDragActive
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    }
                  `}
                >
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="space-y-4">
                    <div className="inline-flex items-center justify-center w-12 h-12 lg:w-16 lg:h-16 
                                    bg-gradient-to-br from-pink-500 to-purple-500 
                                    rounded-2xl shadow-lg shadow-purple-500/25">
                      <Upload className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        ลากไฟล์มาวางที่นี่
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        หรือคลิกเพื่อเลือกไฟล์
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      รองรับไฟล์ JPG, PNG, PDF (สูงสุด 10MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Preview */}
                  <div className="relative rounded-2xl overflow-hidden bg-gray-100">
                    {filePreview.type === 'image' ? (
                      <img
                        src={filePreview.preview}
                        alt="Preview"
                        className="w-full h-64 object-contain"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 bg-gray-50">
                        <div className="text-center">
                          <FileText className="w-16 h-16 text-red-500 mx-auto mb-2" />
                          <p className="text-gray-600 font-medium">{filePreview.file.name}</p>
                          <p className="text-sm text-gray-400">
                            {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={removeFile}
                      disabled={uploadStatus === 'uploading'}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white 
                                 rounded-full hover:bg-red-600 transition-colors
                                 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Upload Status Overlay */}
                    {uploadStatus !== 'idle' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        {uploadStatus === 'uploading' && (
                          <div className="text-center text-white">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                            <p>กำลังอัปโหลด...</p>
                          </div>
                        )}
                        {uploadStatus === 'success' && (
                          <div className="text-center text-white">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                            <p>อัปโหลดสำเร็จ!</p>
                          </div>
                        )}
                        {uploadStatus === 'error' && (
                          <div className="text-center text-white">
                            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-2" />
                            <p>เกิดข้อผิดพลาด</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    {filePreview.type === 'image' ? (
                      <FileImage className="w-8 h-8 text-blue-500" />
                    ) : (
                      <FileText className="w-8 h-8 text-red-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-700 truncate">
                        {filePreview.file.name}
                      </p>
                      <p className="text-sm text-gray-400">
                        {(filePreview.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Transaction Form */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลรายการ</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div className="flex gap-2">
                  {(['income', 'expense'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, type, category: '' }))}
                      className={`
                        flex-1 py-3 rounded-xl font-medium transition-all
                        ${formData.type === type
                          ? type === 'income'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                            : 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      {type === 'income' ? 'รายรับ' : 'รายจ่าย'}
                    </button>
                  ))}
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนเงิน (บาท)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                               focus:border-purple-500"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมวดหมู่
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                               focus:border-purple-500"
                  >
                    <option value="">เลือกหมวดหมู่</option>
                    {availableCategories.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="รายละเอียดเพิ่มเติม..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                               focus:border-purple-500 resize-none"
                  />
                </div>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                               focus:border-purple-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploadStatus === 'uploading' || !filePreview}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 
                             text-white font-semibold rounded-xl shadow-lg 
                             shadow-purple-500/25 hover:shadow-purple-500/40 
                             transition-all disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {uploadStatus === 'uploading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>อัปโหลดและบันทึก</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
