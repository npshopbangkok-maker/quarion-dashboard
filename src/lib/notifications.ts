// Notification helper functions for Quarion Dashboard

// Request notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

// Send local notification
export function sendNotification(title: string, body: string, options?: {
  icon?: string;
  tag?: string;
  onClick?: () => void;
}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log('Notifications not available or not permitted');
    return;
  }

  const notification = new Notification(title, {
    body,
    icon: options?.icon || '/icons/icon-192x192.png',
    tag: options?.tag,
    badge: '/icons/icon-72x72.png',
  });

  if (options?.onClick) {
    notification.onclick = () => {
      window.focus();
      options.onClick?.();
      notification.close();
    };
  }

  return notification;
}

// Check and notify upcoming payments from Calendar
export function checkUpcomingPayments() {
  const hasPermission = Notification.permission === 'granted';
  if (!hasPermission) return;

  try {
    const stored = localStorage.getItem('scheduled-transactions');
    if (!stored) return;

    const transactions = JSON.parse(stored);
    const today = new Date();
    const todayDate = today.getDate();
    
    // Get transactions in next 3 days
    const upcoming = transactions.filter((t: { date: number; type: string }) => {
      const daysUntil = t.date - todayDate;
      return t.type === 'expense' && daysUntil >= 0 && daysUntil <= 3;
    });

    // Check what we've already notified today
    const notifiedKey = `notified-${today.toISOString().split('T')[0]}`;
    const alreadyNotified = JSON.parse(localStorage.getItem(notifiedKey) || '[]');

    upcoming.forEach((t: { id: string; title: string; amount: number; date: number }) => {
      if (alreadyNotified.includes(t.id)) return;

      const daysUntil = t.date - todayDate;
      let message = '';
      
      if (daysUntil === 0) {
        message = `💸 ถึงกำหนดวันนี้! ${t.title} - ฿${t.amount.toLocaleString()}`;
      } else if (daysUntil === 1) {
        message = `⏰ พรุ่งนี้! ${t.title} - ฿${t.amount.toLocaleString()}`;
      } else {
        message = `📅 อีก ${daysUntil} วัน: ${t.title} - ฿${t.amount.toLocaleString()}`;
      }

      sendNotification('Quarion - รายการที่ต้องจ่าย', message, {
        tag: `payment-${t.id}`,
        onClick: () => {
          window.location.href = '/calendar';
        }
      });

      // Mark as notified
      alreadyNotified.push(t.id);
      localStorage.setItem(notifiedKey, JSON.stringify(alreadyNotified));
    });
  } catch (error) {
    console.error('Error checking upcoming payments:', error);
  }
}

// Notify when income is added
export function notifyIncomeAdded(amount: number, category: string, addedBy?: string) {
  const hasPermission = Notification.permission === 'granted';
  if (!hasPermission) return;

  sendNotification(
    '💰 รายรับใหม่!',
    `เพิ่มรายรับ ฿${amount.toLocaleString()} (${category})${addedBy ? ` โดย ${addedBy}` : ''}`,
    {
      tag: 'income-added',
      onClick: () => {
        window.location.href = '/transactions';
      }
    }
  );
}

// Notify when expense is added
export function notifyExpenseAdded(amount: number, category: string, addedBy?: string) {
  const hasPermission = Notification.permission === 'granted';
  if (!hasPermission) return;

  sendNotification(
    '💸 รายจ่ายใหม่',
    `เพิ่มรายจ่าย ฿${amount.toLocaleString()} (${category})${addedBy ? ` โดย ${addedBy}` : ''}`,
    {
      tag: 'expense-added',
      onClick: () => {
        window.location.href = '/transactions';
      }
    }
  );
}

// Start checking for upcoming payments periodically
export function startPaymentReminders() {
  // Check immediately
  checkUpcomingPayments();
  
  // Then check every hour
  const interval = setInterval(checkUpcomingPayments, 60 * 60 * 1000);
  
  return () => clearInterval(interval);
}
