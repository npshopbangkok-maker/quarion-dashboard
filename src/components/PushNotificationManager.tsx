'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

interface PushNotificationManagerProps {
  onSubscriptionChange?: (isSubscribed: boolean) => void;
}

export default function PushNotificationManager({ onSubscriptionChange }: PushNotificationManagerProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      
      // Check current permission
      setPermission(Notification.permission);
      
      // Check if already subscribed
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub);
          onSubscriptionChange?.(!!sub);
        });
      });
    }

    // Show prompt after 5 seconds if not subscribed
    const timer = setTimeout(() => {
      const hasSeenPrompt = localStorage.getItem('push-prompt-seen');
      if (!hasSeenPrompt && isSupported && permission === 'default') {
        setShowPrompt(true);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [isSupported, permission, onSubscriptionChange]);

  const subscribeToPush = async () => {
    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);

      if (permissionResult === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        // Create a subscription
        // Note: In production, use your own VAPID keys
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            // This is a demo key - replace with your own VAPID public key
            'BLBx-hf2WrL2qEa0XYsZ7MfQfRRpI8QZ8QhfAwhSIvxszeQrcQWGJ_FQy0bOpfLmDHQeVfXf0N9RnTPqxvmn8Qg'
          )
        });

        setSubscription(sub);
        onSubscriptionChange?.(true);
        
        // Save subscription to localStorage for now
        // In production, send this to your server
        localStorage.setItem('push-subscription', JSON.stringify(sub.toJSON()));
        
        console.log('Push subscription:', sub);
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
    }
    
    setShowPrompt(false);
    localStorage.setItem('push-prompt-seen', 'true');
  };

  const unsubscribeFromPush = async () => {
    if (subscription) {
      await subscription.unsubscribe();
      setSubscription(null);
      onSubscriptionChange?.(false);
      localStorage.removeItem('push-subscription');
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('push-prompt-seen', 'true');
  };

  // Helper function to convert VAPID key
  function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  if (!isSupported) {
    return null;
  }

  return (
    <>
      {/* Floating prompt */}
      {showPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-2xl p-4 z-50 border border-gray-100">
          <button 
            onClick={dismissPrompt}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Bell className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">เปิดการแจ้งเตือน</h3>
              <p className="text-sm text-gray-500 mt-1">
                รับการแจ้งเตือนเมื่อมีรายการที่ต้องจ่ายเร็วๆ นี้
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={subscribeToPush}
                  className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                >
                  เปิดการแจ้งเตือน
                </button>
                <button
                  onClick={dismissPrompt}
                  className="px-4 py-2 text-gray-500 text-sm hover:text-gray-700"
                >
                  ไว้ทีหลัง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings toggle (for use in settings page) */}
      {permission === 'granted' && (
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            {subscription ? (
              <Bell className="w-5 h-5 text-purple-600" />
            ) : (
              <BellOff className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <p className="font-medium text-gray-900">การแจ้งเตือน Push</p>
              <p className="text-sm text-gray-500">
                {subscription ? 'เปิดใช้งานอยู่' : 'ปิดอยู่'}
              </p>
            </div>
          </div>
          <button
            onClick={subscription ? unsubscribeFromPush : subscribeToPush}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              subscription
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-purple-600 text-white hover:bg-purple-700'
            }`}
          >
            {subscription ? 'ปิด' : 'เปิด'}
          </button>
        </div>
      )}
    </>
  );
}

// Function to send a test notification (for development)
export async function sendTestNotification() {
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Quarion Dashboard', {
      body: 'ทดสอบการแจ้งเตือน - มีรายการที่ต้องจ่ายใน 3 วัน!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'test-notification',
      requireInteraction: true
    } as NotificationOptions);
  }
}

// Function to schedule notifications for upcoming transactions
export function scheduleNotifications(transactions: Array<{
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  date: number;
}>) {
  // Store in localStorage for the service worker to check
  localStorage.setItem('scheduled-notifications', JSON.stringify(transactions));
}
