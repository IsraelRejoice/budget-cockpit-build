// Native-only extras. On the web this file does nothing and costs almost nothing.
// Inside the Android/iOS app it turns the app's own data into on-device
// notifications, so alerts arrive even when the app is closed:
//   1. loan repayment dates (the day before, and on the day, at 9:00)
//   2. the daily "log your expenses" reminder (skipped on days you already logged)
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();
let busy = false, last = 0;

async function plugin() {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  return LocalNotifications;
}

// Stable numeric ids so a reschedule replaces rather than duplicates.
function idFor(text) {
  let h = 7;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) % 2000000000;
  return h + 1000;
}
function at(dateStr, hour, minute = 0) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, hour, minute, 0);
}
function ymd(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

window.__nativeSync = async function (snapshot) {
  if (!isNative || busy || Date.now() - last < 4000) return;
  busy = true; last = Date.now();
  try {
    const LN = await plugin();
    let perm = await LN.checkPermissions();
    if (perm.display === 'prompt' || perm.display === 'prompt-with-rationale') perm = await LN.requestPermissions();
    if (perm.display !== 'granted') return;

    const pending = await LN.getPending();
    if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications });

    const now = new Date();
    const list = [];

    (snapshot.loans || []).forEach((l) => {
      if (!l.due || l.owed <= 0) return;
      const day = at(l.due, 9), eve = new Date(day.getTime() - 86400000);
      if (eve > now) list.push({ id: idFor('eve' + l.id), title: 'Loan repayment due tomorrow', body: l.who + ' promised to repay ' + l.owedText, schedule: { at: eve, allowWhileIdle: true } });
      if (day > now) list.push({ id: idFor('day' + l.id), title: 'Loan repayment due today', body: l.who + ' promised to repay ' + l.owedText, schedule: { at: day, allowWhileIdle: true } });
    });

    if (snapshot.reminder && snapshot.reminder.enabled) {
      const [hh, mm] = String(snapshot.reminder.time || '20:00').split(':').map(Number);
      for (let i = 0; i < 7; i++) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i, hh, mm || 0, 0);
        if (d <= now) continue;
        if (ymd(d) === ymd(now) && snapshot.reminder.loggedToday) continue;
        list.push({ id: idFor('rem' + ymd(d)), title: 'Budget Cockpit', body: "Haven't logged anything today yet.", schedule: { at: d, allowWhileIdle: true } });
      }
    }
    if (list.length) await LN.schedule({ notifications: list.slice(0, 60) });
  } catch (e) {
    console.warn('[native] notification sync failed', e);
  } finally {
    busy = false;
  }
};
