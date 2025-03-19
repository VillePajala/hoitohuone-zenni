/**
 * This script reminds developers to clear stored Clerk authentication state when starting the app.
 * It provides instructions for manual browser clearance to ensure a fresh authentication state.
 */

console.log('🔐 Authentication Check for Hoitohuone Zenni');
console.log('-------------------------------------------');
console.log('');
console.log('To avoid authentication loops or stale session issues:');
console.log('');
console.log('1. If experiencing login/logout issues:');
console.log('   - Open browser DevTools (F12)');
console.log('   - Go to Application tab > Storage');
console.log('   - Clear site data for localhost:3000 or 3001:');
console.log('     • Cookies');
console.log('     • Local Storage');
console.log('     • Session Storage');
console.log('     • IndexedDB');
console.log('');
console.log('2. Using Incognito/Private window can also help');
console.log('   test authentication behavior with clean state.');
console.log('');
console.log('3. For persistent login sessions:');
console.log('   Use npm run dev:auth-persist instead.');
console.log('');
console.log('✅ Admin authentication will require sign-in on first access');
console.log(''); 