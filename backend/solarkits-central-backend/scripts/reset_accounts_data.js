/**
 * SolarKits Accounts Panel - Test Data Reset Script
 *
 * Use this script to completely reset all financial balances, commission payouts,
 * wallet withdrawals, and test transactions to ₹0.00.
 *
 * Usage:
 *   node scripts/reset_accounts_data.js
 */

require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
const mongoose = require('mongoose');

async function resetAccountsData() {
  console.log('🔄 Connecting to MongoDB to reset accounts test data...');
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;

  // 1. Reset Reseller Wallets (Withdrawals & Earned Commissions to 0)
  const walletUpdate = await db.collection('reseller_wallets').updateMany({}, {
    $set: {
      total_withdrawn_paise: 0,
      total_withdrawn: 0,
      total_earned: 0,
      total_earned_paise: 0,
      available_balance: 0,
      available_balance_paise: 0,
      pending_balance_paise: 0
    }
  });
  console.log(`✅ Reseller Wallets Reset: ${walletUpdate.modifiedCount} wallets cleared to ₹0.00`);

  // 2. Clear Reseller Payout Requests (Disbursed Commission Records)
  const payoutDelete = await db.collection('reseller_payout_requests').deleteMany({});
  console.log(`✅ Reseller Payout Requests Cleared: ${payoutDelete.deletedCount} records deleted`);

  // 3. Clear Commission Ledgers
  const walletLedgerDelete = await db.collection('reseller_wallet_ledgers').deleteMany({});
  console.log(`✅ Reseller Wallet Ledgers Cleared: ${walletLedgerDelete.deletedCount} records deleted`);

  const fpoLedgerDelete = await db.collection('fpo_commission_ledgers').deleteMany({});
  console.log(`✅ FPO Commission Ledgers Cleared: ${fpoLedgerDelete.deletedCount} records deleted`);

  // 4. Clear Test ICICI Collection Logs
  const iciciDelete = await db.collection('icici_collection_logs').deleteMany({});
  console.log(`✅ ICICI Collection Logs Cleared: ${iciciDelete.deletedCount} records deleted`);

  console.log('\n🎉 ALL ACCOUNTS FINANCIAL BALANCES HAVE BEEN RESET TO ₹0.00!');
  process.exit(0);
}

resetAccountsData().catch(err => {
  console.error('❌ Reset Error:', err);
  process.exit(1);
});
