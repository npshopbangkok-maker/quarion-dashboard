'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';
import TopBar from '@/components/TopBar';
import { 
  Upload, 
  FileImage, 
  FileText, 
  X, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Scan,
  Sparkles
} from 'lucide-react';
import { User, Category, TransactionType } from '@/types/database';
import { isSupabaseConfigured } from '@/lib/supabase';
import { createTransaction, fetchCategories } from '@/lib/database';
import { getCategories, saveTransactions, getTransactions, initializeUser, generateId } from '@/lib/storage';

type UploadStatus = 'idle' | 'scanning' | 'scanned' | 'uploading' | 'success' | 'error';

interface OcrResult {
  amount: number | null;
  date: string | null;
  time: string | null;
  bankName: string | null;
  refNumber: string | null;
  rawText: string;
}

interface FilePreview {
  file: File;
  preview: string;
  type: 'image' | 'pdf';
}

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Upload state
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
  const [isDragActive, setIsDragActive] = useState(false);
  
  // OCR result
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [ocrError, setOcrError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    type: 'income' as TransactionType,
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Load user and categories
  useEffect(() => {
    const loadData = async () => {
      const loadedUser = initializeUser();
      setUser(loadedUser);

      let loadedCategories: Category[] = [];
      if (isSupabaseConfigured()) {
        loadedCategories = await fetchCategories();
      }
      if (loadedCategories.length === 0) {
        loadedCategories = getCategories();
      }
      setCategories(loadedCategories);
    };
    loadData();
  }, []);

  const handleLogout = () => router.push('/login');

  // Handle file selection and OCR
  const handleFileSelect = useCallback(async (file: File) => {
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

    // Only process images with OCR
    if (isImage) {
      setUploadStatus('scanning');
      setOcrError(null);
      
      try {
        const formDataOcr = new FormData();
        formDataOcr.append('image', file);

        const response = await fetch('/api/ocr', {
          method: 'POST',
          body: formDataOcr,
        });

        if (!response.ok) {
          throw new Error('OCR failed');
        }

        const result = await response.json();
        
        if (result.success && result.data) {
          setOcrResult(result.data);
          
          // Auto-fill form with OCR data
          if (result.data.amount) {
            setFormData(prev => ({ ...prev, amount: result.data.amount.toString() }));
          }
          if (result.data.date) {
            setFormData(prev => ({ ...prev, date: result.data.date }));
          }
          if (result.data.bankName) {
            setFormData(prev => ({ 
              ...prev, 
              description: `${result.data.bankName}${result.data.refNumber ? ` (${result.data.refNumber})` : ''}`
            }));
          }
          
          setUploadStatus('scanned');
        } else {
          // OCR didn't find data, but still allow manual entry
          setOcrError('ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณากรอกข้อมูลเอง');
          setUploadStatus('scanned');
        }
      } catch (error) {
        console.error('OCR Error:', error);
        setOcrError('ไม่สามารถอ่านข้อมูลจากสลิปได้ กรุณากรอกข้อมูลเอง');
        setUploadStatus('scanned');
      }
    } else {
      setUploadStatus('scanned');
    }
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
    setOcrResult(null);
    setOcrError(null);
  };

  // Available categories based on type
  const availableCategories = categories.filter(c => c.type === formData.type);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!filePreview) {
      alert('กรุณาอัปโหลดสลิปก่อน');
      return;
    }

    if (!formData.category) {
      alert('กรุณาเลือกหมวดหมู่');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('กรุณากรอกจำนวนเงิน');
      return;
    }

    setUploadStatus('uploading');

    try {
      const transactionData = {
        type: formData.type,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        date: formData.date,
        created_by: user?.id || '',
        slip_url: null, // TODO: Upload to Supabase Storage
      };

      if (isSupabaseConfigured()) {
        await createTransaction(transactionData);
      } else {
        // Save to localStorage
        const existingTransactions = getTransactions();
        const newTransaction = {
          id: generateId(),
          ...transactionData,
          created_at: new Date().toISOString(),
          user: user || undefined,
        };
        saveTransactions([newTransaction, ...existingTransactions]);
      }
      
      setUploadStatus('success');
      
      // Reset form after success
      setTimeout(() => {
        setFormData({
          type: 'income',
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

      <main className="lg:ml-64 min-h-screen transition-all duration-300 mobile-content-pt">
        <TopBar user={user} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-800">Upload Slip</h1>
            <p className="text-sm lg:text-base text-gray-500">
              อัปโหลดสลิปแล้วระบบจะอ่านข้อมูลอัตโนมัติ
            </p>
          </div>

          {/* OCR Feature Banner */}
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">สแกนสลิปอัตโนมัติ</h3>
                <p className="text-sm text-white/80">
                  อัปโหลดรูปสลิป ระบบจะอ่านจำนวนเงินและวันที่ให้อัตโนมัติ คุณแค่เลือกหมวดหมู่
                </p>
              </div>
            </div>
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
                      <Scan className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-700">
                        ลากสลิปมาวางที่นี่
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        หรือคลิกเพื่อเลือกไฟล์
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      รองรับไฟล์ JPG, PNG (สูงสุด 10MB)
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
                      disabled={uploadStatus === 'uploading' || uploadStatus === 'scanning'}
                      className="absolute top-3 right-3 p-2 bg-red-500 text-white 
                                 rounded-full hover:bg-red-600 transition-colors
                                 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    {/* Status Overlay */}
                    {(uploadStatus === 'scanning' || uploadStatus === 'uploading' || 
                      uploadStatus === 'success' || uploadStatus === 'error') && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        {uploadStatus === 'scanning' && (
                          <div className="text-center text-white">
                            <Scan className="w-12 h-12 animate-pulse mx-auto mb-2" />
                            <p>กำลังอ่านข้อมูลจากสลิป...</p>
                          </div>
                        )}
                        {uploadStatus === 'uploading' && (
                          <div className="text-center text-white">
                            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                            <p>กำลังบันทึก...</p>
                          </div>
                        )}
                        {uploadStatus === 'success' && (
                          <div className="text-center text-white">
                            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
                            <p>บันทึกสำเร็จ!</p>
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

                  {/* OCR Result */}
                  {uploadStatus === 'scanned' && ocrResult && (
                    <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>อ่านข้อมูลสำเร็จ</span>
                      </div>
                      <div className="text-sm text-green-600 space-y-1">
                        {ocrResult.amount && (
                          <p>จำนวนเงิน: ฿{ocrResult.amount.toLocaleString()}</p>
                        )}
                        {ocrResult.date && <p>วันที่: {ocrResult.date}</p>}
                        {ocrResult.bankName && <p>ธนาคาร: {ocrResult.bankName}</p>}
                      </div>
                    </div>
                  )}

                  {/* OCR Error */}
                  {ocrError && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <div className="flex items-center gap-2 text-yellow-700">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm">{ocrError}</span>
                      </div>
                    </div>
                  )}

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
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                ข้อมูลรายการ
                {ocrResult?.amount && (
                  <span className="ml-2 text-sm font-normal text-green-600">
                    (ข้อมูลจากสลิป)
                  </span>
                )}
              </h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ประเภท
                  </label>
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
                </div>

                {/* Amount - Auto-filled from OCR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนเงิน (บาท)
                    {ocrResult?.amount && (
                      <span className="ml-2 text-xs text-green-600">✓ อ่านจากสลิป</span>
                    )}
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0.00"
                    required
                    step="0.01"
                    className={`w-full px-4 py-3 border rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                               focus:border-purple-500
                               ${ocrResult?.amount ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>

                {/* Category - REQUIRED - User must select */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมวดหมู่ <span className="text-red-500">*</span>
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

                {/* Date - Auto-filled from OCR */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    วันที่
                    {ocrResult?.date && (
                      <span className="ml-2 text-xs text-green-600">✓ อ่านจากสลิป</span>
                    )}
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                    className={`w-full px-4 py-3 border rounded-xl
                               focus:outline-none focus:ring-2 focus:ring-purple-500/20 
                               focus:border-purple-500
                               ${ocrResult?.date ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={uploadStatus === 'uploading' || uploadStatus === 'scanning' || !filePreview}
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
                  ) : uploadStatus === 'scanning' ? (
                    <>
                      <Scan className="w-5 h-5 animate-pulse" />
                      <span>กำลังอ่านสลิป...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      <span>บันทึกรายการ</span>
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
