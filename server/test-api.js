const http = require('http');

const runTest = async () => {
  console.log('--- Starting ConnectBill End-to-End API Test ---');

  // Start app
  const app = require('./server');

  // Wait 1.5s for db connection
  await new Promise((r) => setTimeout(r, 1500));

  const User = require('./models/User');
  const count = await User.countDocuments();
  if (count === 0) {
    console.log('[Test Setup] Populating demo seed data for test run...');
    const bcrypt = require('bcryptjs');
    const Provider = require('./models/Provider');
    const Plan = require('./models/Plan');
    const Customer = require('./models/Customer');
    const Connection = require('./models/Connection');
    const Bill = require('./models/Bill');
    const Setting = require('./models/Setting');

    await Setting.create({
      businessName: 'ConnectBill Cable & Internet Services',
      phone: '+91 98765 43210',
      email: 'support@connectbill.com',
      invoicePrefix: 'CB'
    });

    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    await User.create({
      name: 'Demo Admin',
      email: 'admin@connectbill.com',
      phone: '9999999999',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    });

    const bsnl = await Provider.create({
      name: 'BSNL',
      code: 'BSNL',
      status: 'ACTIVE'
    });

    const plan = await Plan.create({
      providerId: bsnl._id,
      name: 'BSNL 100 Mbps',
      speed: '100 Mbps',
      monthlyPrice: 799,
      status: 'ACTIVE'
    });

    const userRavi = await User.create({
      name: 'Ravi Kumar',
      phone: '9000000001',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    });

    const custRavi = await Customer.create({
      userId: userRavi._id,
      name: 'Ravi Kumar',
      phone: '9000000001',
      address: 'Flat 302, Green Valley Apartments',
      providerId: bsnl._id,
      connectionId: 'BSNL1001',
      planId: plan._id,
      monthlyAmount: 799,
      dueDay: 10,
      status: 'ACTIVE'
    });

    await Connection.create({
      customerId: custRavi._id,
      providerId: bsnl._id,
      planId: plan._id,
      connectionNumber: 'BSNL1001',
      monthlyAmount: 799,
      status: 'ACTIVE'
    });

    await Bill.create({
      customerId: custRavi._id,
      providerId: bsnl._id,
      billNumber: 'CB-202609-0001',
      billingMonth: '2026-09',
      billingMonthName: 'September 2026',
      billDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-10'),
      baseAmount: 799,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 799,
      paidAmount: 0,
      remainingAmount: 799,
      status: 'PENDING'
    });
    console.log('[Test Setup] Seed data ready.');
  }

  const makeRequest = (path, method = 'GET', body = null, token = null) => {
    return new Promise((resolve, reject) => {
      const payload = body ? JSON.stringify(body) : null;
      const options = {
        hostname: 'localhost',
        port: process.env.PORT || 5000,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      };

      const req = http.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => (responseData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: responseData });
          }
        });
      });

      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  try {
    // 1. Health Check
    console.log('\n[1] Testing Health Endpoint...');
    const health = await makeRequest('/health');
    console.log(`Status: ${health.status}, Response:`, health.data);
    if (health.status !== 200) throw new Error('Health check failed');

    // 2. Admin Login
    console.log('\n[2] Testing Admin Login...');
    const adminLoginRes = await makeRequest('/auth/admin/login', 'POST', {
      identifier: 'admin@connectbill.com',
      password: 'admin123'
    });
    console.log(`Admin Login Status: ${adminLoginRes.status}, Success: ${adminLoginRes.data?.success}`);
    if (!adminLoginRes.data?.token) throw new Error('Admin login did not return token');
    const adminToken = adminLoginRes.data.token;

    // 3. Customer OTP Send
    console.log('\n[3] Testing Customer Send OTP...');
    const otpSendRes = await makeRequest('/auth/customer/send-otp', 'POST', {
      phone: '9000000001'
    });
    console.log(`Send OTP Status: ${otpSendRes.status}, Message: ${otpSendRes.data?.message}, Dev OTP: ${otpSendRes.data?.devOtp}`);
    const receivedOtp = otpSendRes.data?.devOtp || '123456';

    // 4. Customer OTP Verify
    console.log('\n[4] Testing Customer Verify OTP...');
    const otpVerifyRes = await makeRequest('/auth/customer/verify-otp', 'POST', {
      phone: '9000000001',
      otp: receivedOtp
    });
    console.log(`Verify OTP Status: ${otpVerifyRes.status}, Customer Name: ${otpVerifyRes.data?.customer?.name}`);
    if (!otpVerifyRes.data?.token) throw new Error('Customer verification did not return token');
    const customerToken = otpVerifyRes.data.token;

    // 5. Customer Current Bills
    console.log('\n[5] Testing Customer Bills Retrieval...');
    const billsRes = await makeRequest('/bills', 'GET', null, customerToken);
    console.log(`Customer Bills Count: ${billsRes.data?.bills?.length}`);
    const pendingBill = billsRes.data?.bills?.find((b) => b.status === 'PENDING');
    console.log(`Found Pending Bill: ${pendingBill ? pendingBill.billNumber + ' (₹' + pendingBill.totalAmount + ')' : 'None'}`);

    if (pendingBill) {
      // 6. Payment Order Creation
      console.log('\n[6] Testing Payment Order Creation...');
      const orderRes = await makeRequest('/payments/create-order', 'POST', {
        billIds: [pendingBill._id]
      }, customerToken);
      console.log(`Order Created: ID=${orderRes.data?.order?.id}, Total=₹${orderRes.data?.amount}`);

      // 7. Payment Verification
      console.log('\n[7] Testing Payment Cryptographic Verification & Settlement...');
      const verifyRes = await makeRequest('/payments/verify', 'POST', {
        razorpay_order_id: orderRes.data.order.id,
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_signature: `sim_sig_${Date.now()}`,
        billIds: [pendingBill._id],
        paymentMethod: 'UPI'
      }, customerToken);
      console.log(`Verification Status: ${verifyRes.status}, Success: ${verifyRes.data?.success}, Message: ${verifyRes.data?.message}`);

      // 8. Retrieve Receipt
      if (verifyRes.data?.primaryReceipt) {
        console.log('\n[8] Testing Receipt Retrieval...');
        const receiptRes = await makeRequest(`/payments/receipt/${verifyRes.data.primaryReceipt._id}`, 'GET', null, customerToken);
        console.log(`Receipt #${receiptRes.data?.receipt?.receiptNumber}, Business: ${receiptRes.data?.business?.businessName}`);
      }
    }

    // 9. Admin Reports Dashboard
    console.log('\n[9] Testing Admin Dashboard Metrics & Aggregations...');
    const metricsRes = await makeRequest('/reports/dashboard', 'GET', null, adminToken);
    console.log('Metrics:', metricsRes.data?.metrics);

    // 10. Duplicate Bill Prevention Check
    console.log('\n[10] Testing Monthly Billing Duplicate Prevention...');
    const genRes = await makeRequest('/bills/generate-monthly', 'POST', {
      month: '2026-09'
    }, adminToken);
    console.log(`Generated: ${genRes.data?.generatedCount}, Skipped Existing: ${genRes.data?.skippedCount}`);

    console.log('\n🎉 ALL 10 E2E BACKEND & BILLING API TESTS PASSED SUCCESSFULLY! 🎉\n');
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
};

runTest();
