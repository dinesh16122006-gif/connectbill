require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Provider = require('./models/Provider');
const Plan = require('./models/Plan');
const Customer = require('./models/Customer');
const Connection = require('./models/Connection');
const Bill = require('./models/Bill');
const Payment = require('./models/Payment');
const Receipt = require('./models/Receipt');
const Notification = require('./models/Notification');
const Setting = require('./models/Setting');
const SupportTicket = require('./models/SupportTicket');

const seedData = async () => {
  try {
    console.log('--- Starting ConnectBill Database Seeding ---');
    await connectDB();

    // Clear existing collections
    console.log('Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Provider.deleteMany({}),
      Plan.deleteMany({}),
      Customer.deleteMany({}),
      Connection.deleteMany({}),
      Bill.deleteMany({}),
      Payment.deleteMany({}),
      Receipt.deleteMany({}),
      Notification.deleteMany({}),
      Setting.deleteMany({}),
      SupportTicket.deleteMany({})
    ]);

    // 1. Settings
    console.log('Seeding Business Settings...');
    const settings = await Setting.create({
      businessName: 'ConnectBill Cable & Internet Services',
      businessLogo: '',
      businessAddress: 'Shop 14, City Centre Plaza, MG Road, Tech City - 560001',
      phone: '+91 98765 43210',
      email: 'support@connectbill.com',
      upiId: 'connectbill@okhdfcbank',
      invoicePrefix: 'CB',
      defaultDueDay: 10,
      lateFeeAmount: 50,
      workingHours: '9:00 AM - 8:00 PM (Monday - Saturday)'
    });

    // 2. Admin User
    console.log('Seeding Admin Account...');
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      name: 'Demo Admin',
      email: 'admin@connectbill.com',
      phone: '9999999999',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE'
    });
    console.log('Admin user created: admin@connectbill.com / admin123');

    // 3. Providers
    console.log('Seeding Providers (BSNL, RailWire, GTPL)...');
    const providers = await Provider.create([
      {
        name: 'BSNL',
        code: 'BSNL',
        description: 'Bharat Sanchar Nigam Limited Fiber & Broadband',
        iconName: 'Globe',
        color: '#0284c7',
        status: 'ACTIVE'
      },
      {
        name: 'RailWire',
        code: 'RAILWIRE',
        description: 'RailTel Corporation Retail Broadband Services',
        iconName: 'Zap',
        color: '#d97706',
        status: 'ACTIVE'
      },
      {
        name: 'GTPL',
        code: 'GTPL',
        description: 'GTPL Hathway Digital Cable & High-Speed Internet',
        iconName: 'Tv',
        color: '#7c3aed',
        status: 'ACTIVE'
      }
    ]);

    const bsnl = providers.find((p) => p.code === 'BSNL');
    const railwire = providers.find((p) => p.code === 'RAILWIRE');
    const gtpl = providers.find((p) => p.code === 'GTPL');

    // 4. Plans
    console.log('Seeding Internet & Cable Plans...');
    const plans = await Plan.create([
      // BSNL Plans
      {
        providerId: bsnl._id,
        name: 'BSNL Fiber Basic',
        speed: '60 Mbps',
        monthlyPrice: 499,
        description: 'Unlimited data up to 3300 GB, unlimited local/STD calls.',
        type: 'FIBER',
        status: 'ACTIVE'
      },
      {
        providerId: bsnl._id,
        name: 'BSNL 100 Mbps',
        speed: '100 Mbps',
        monthlyPrice: 799,
        description: 'High speed fiber with OTT bundle, 3300 GB data limit.',
        type: 'FIBER',
        status: 'ACTIVE'
      },
      {
        providerId: bsnl._id,
        name: 'BSNL Superfast 200',
        speed: '200 Mbps',
        monthlyPrice: 1099,
        description: 'Ultra-low latency connection for gaming and streaming.',
        type: 'FIBER',
        status: 'ACTIVE'
      },

      // RailWire Plans
      {
        providerId: railwire._id,
        name: 'RailWire Standard 50',
        speed: '50 Mbps',
        monthlyPrice: 499,
        description: 'Stable unlimited connection for work-from-home.',
        type: 'BROADBAND',
        status: 'ACTIVE'
      },
      {
        providerId: railwire._id,
        name: 'RailWire 100 Mbps',
        speed: '100 Mbps',
        monthlyPrice: 699,
        description: 'Popular high-speed plan with symmetric upload/download.',
        type: 'BROADBAND',
        status: 'ACTIVE'
      },
      {
        providerId: railwire._id,
        name: 'RailWire 200 Mbps',
        speed: '200 Mbps',
        monthlyPrice: 899,
        description: 'Gigabit fiber ready, dual-band Wi-Fi router included.',
        type: 'FIBER',
        status: 'ACTIVE'
      },

      // GTPL Plans
      {
        providerId: gtpl._id,
        name: 'GTPL Basic Cable',
        speed: 'Digital SD/HD',
        monthlyPrice: 350,
        description: '250+ Digital Cable TV Channels with HD quality.',
        type: 'CABLE_TV',
        status: 'ACTIVE'
      },
      {
        providerId: gtpl._id,
        name: 'GTPL Combo 50 Mbps',
        speed: '50 Mbps + Cable',
        monthlyPrice: 599,
        description: 'All-in-one cable television channels plus unlimited internet.',
        type: 'COMBO',
        status: 'ACTIVE'
      },
      {
        providerId: gtpl._id,
        name: 'GTPL Turbo Combo',
        speed: '100 Mbps + HD Cable',
        monthlyPrice: 799,
        description: 'Premium sports & movie channels + 100 Mbps broadband.',
        type: 'COMBO',
        status: 'ACTIVE'
      }
    ]);

    const planBsnl100 = plans.find((p) => p.name === 'BSNL 100 Mbps');
    const planRw100 = plans.find((p) => p.name === 'RailWire 100 Mbps');
    const planGtplCombo = plans.find((p) => p.name === 'GTPL Combo 50 Mbps');
    const planRw200 = plans.find((p) => p.name === 'RailWire 200 Mbps');

    // 5. Customers & Connections
    console.log('Seeding Customers and Connections...');

    // Customer 1: Ravi Kumar (BSNL)
    const userRavi = await User.create({
      name: 'Ravi Kumar',
      phone: '9000000001',
      email: 'ravi.kumar@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    });
    const custRavi = await Customer.create({
      userId: userRavi._id,
      name: 'Ravi Kumar',
      phone: '9000000001',
      email: 'ravi.kumar@example.com',
      address: 'Flat 302, Green Valley Apartments, 4th Cross Road',
      area: 'North Sector',
      providerId: bsnl._id,
      connectionId: 'BSNL1001',
      planId: planBsnl100._id,
      monthlyAmount: 799,
      dueDay: 10,
      joiningDate: new Date('2025-06-15'),
      status: 'ACTIVE',
      notes: 'FTTH connection installed near main lobby.'
    });
    const connRavi = await Connection.create({
      customerId: custRavi._id,
      providerId: bsnl._id,
      planId: planBsnl100._id,
      connectionNumber: 'BSNL1001',
      installationDate: new Date('2025-06-15'),
      status: 'ACTIVE',
      monthlyAmount: 799,
      ipAddress: '103.14.22.45'
    });

    // Customer 2: Kumar (RailWire)
    const userKumar = await User.create({
      name: 'Kumar',
      phone: '9000000002',
      email: 'kumar.rw@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    });
    const custKumar = await Customer.create({
      userId: userKumar._id,
      name: 'Kumar',
      phone: '9000000002',
      email: 'kumar.rw@example.com',
      address: 'House #45, 2nd Main, Railway Colony Road',
      area: 'Railway Quarter',
      providerId: railwire._id,
      connectionId: 'RW123456',
      planId: planRw100._id,
      monthlyAmount: 699,
      dueDay: 10,
      joiningDate: new Date('2025-08-01'),
      status: 'ACTIVE',
      notes: 'ONU router configured at 2.4/5GHz.'
    });
    const connKumar = await Connection.create({
      customerId: custKumar._id,
      providerId: railwire._id,
      planId: planRw100._id,
      connectionNumber: 'RW123456',
      installationDate: new Date('2025-08-01'),
      status: 'ACTIVE',
      monthlyAmount: 699,
      ipAddress: '182.72.19.110'
    });

    // Customer 3: Suresh (GTPL)
    const userSuresh = await User.create({
      name: 'Suresh',
      phone: '9000000003',
      email: 'suresh.gtpl@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    });
    const custSuresh = await Customer.create({
      userId: userSuresh._id,
      name: 'Suresh',
      phone: '9000000003',
      email: 'suresh.gtpl@example.com',
      address: '12B, Old Bazaar Cross, Market Area',
      area: 'Bazaar Ward',
      providerId: gtpl._id,
      connectionId: 'GTPL5501',
      planId: planGtplCombo._id,
      monthlyAmount: 599,
      dueDay: 15,
      joiningDate: new Date('2025-11-20'),
      status: 'ACTIVE',
      notes: 'Cable STB model HD-300 + WiFi Modem'
    });
    const connSuresh = await Connection.create({
      customerId: custSuresh._id,
      providerId: gtpl._id,
      planId: planGtplCombo._id,
      connectionNumber: 'GTPL5501',
      installationDate: new Date('2025-11-20'),
      status: 'ACTIVE',
      monthlyAmount: 599
    });

    // Customer 4: Anita Roy (RailWire 200)
    const userAnita = await User.create({
      name: 'Anita Roy',
      phone: '9000000004',
      email: 'anita.roy@example.com',
      role: 'CUSTOMER',
      status: 'ACTIVE'
    });
    const custAnita = await Customer.create({
      userId: userAnita._id,
      name: 'Anita Roy',
      phone: '9000000004',
      email: 'anita.roy@example.com',
      address: 'Plot 77, Sunrise Enclave, Lake View',
      area: 'East Sector',
      providerId: railwire._id,
      connectionId: 'RW789012',
      planId: planRw200._id,
      monthlyAmount: 899,
      dueDay: 10,
      joiningDate: new Date('2026-01-10'),
      status: 'ACTIVE'
    });
    await Connection.create({
      customerId: custAnita._id,
      providerId: railwire._id,
      planId: planRw200._id,
      connectionNumber: 'RW789012',
      installationDate: new Date('2026-01-10'),
      status: 'ACTIVE',
      monthlyAmount: 899
    });

    // 6. Bills, Payments & Receipts
    console.log('Seeding Bills, Payments, and Digital Receipts...');

    let receiptCounter = 1;
    const makeReceiptNum = () => {
      const num = `CB-REC-2026-${String(receiptCounter).padStart(5, '0')}`;
      receiptCounter++;
      return num;
    };

    // --- Ravi Kumar (BSNL): July & Aug Paid, Sep Pending ---
    // July 2026 (Paid)
    const billRaviJul = await Bill.create({
      customerId: custRavi._id,
      connectionId: connRavi._id,
      providerId: bsnl._id,
      billNumber: 'CB-202607-0001',
      billingMonth: '2026-07',
      billingMonthName: 'July 2026',
      billDate: new Date('2026-07-01'),
      dueDate: new Date('2026-07-10'),
      baseAmount: 799,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 799,
      paidAmount: 799,
      remainingAmount: 0,
      status: 'PAID'
    });
    const payRaviJul = await Payment.create({
      customerId: custRavi._id,
      billId: billRaviJul._id,
      amount: 799,
      paymentMethod: 'UPI',
      gateway: 'RAZORPAY',
      gatewayOrderId: 'order_jul_ravi_01',
      gatewayPaymentId: 'pay_jul_ravi_01',
      transactionId: 'TXN-20260705-1021',
      status: 'SUCCESS',
      paymentDate: new Date('2026-07-05'),
      notes: 'Paid via Google Pay UPI'
    });
    await Receipt.create({
      paymentId: payRaviJul._id,
      billId: billRaviJul._id,
      customerId: custRavi._id,
      receiptNumber: makeReceiptNum(),
      receiptDate: new Date('2026-07-05')
    });

    // August 2026 (Paid)
    const billRaviAug = await Bill.create({
      customerId: custRavi._id,
      connectionId: connRavi._id,
      providerId: bsnl._id,
      billNumber: 'CB-202608-0001',
      billingMonth: '2026-08',
      billingMonthName: 'August 2026',
      billDate: new Date('2026-08-01'),
      dueDate: new Date('2026-08-10'),
      baseAmount: 799,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 799,
      paidAmount: 799,
      remainingAmount: 0,
      status: 'PAID'
    });
    const payRaviAug = await Payment.create({
      customerId: custRavi._id,
      billId: billRaviAug._id,
      amount: 799,
      paymentMethod: 'UPI',
      gateway: 'RAZORPAY',
      gatewayOrderId: 'order_aug_ravi_02',
      gatewayPaymentId: 'pay_aug_ravi_02',
      transactionId: 'TXN-20260805-3042',
      status: 'SUCCESS',
      paymentDate: new Date('2026-08-05'),
      notes: 'Paid via PhonePe UPI'
    });
    await Receipt.create({
      paymentId: payRaviAug._id,
      billId: billRaviAug._id,
      customerId: custRavi._id,
      receiptNumber: makeReceiptNum(),
      receiptDate: new Date('2026-08-05')
    });

    // September 2026 (Current Bill: PENDING)
    await Bill.create({
      customerId: custRavi._id,
      connectionId: connRavi._id,
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

    // --- Kumar (RailWire): July Paid, August Overdue (₹699), September Pending (₹699) -> Total Pending ₹1,398 ---
    // July 2026 (Paid)
    const billKumarJul = await Bill.create({
      customerId: custKumar._id,
      connectionId: connKumar._id,
      providerId: railwire._id,
      billNumber: 'CB-202607-0002',
      billingMonth: '2026-07',
      billingMonthName: 'July 2026',
      billDate: new Date('2026-07-01'),
      dueDate: new Date('2026-07-10'),
      baseAmount: 699,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 699,
      paidAmount: 699,
      remainingAmount: 0,
      status: 'PAID'
    });
    const payKumarJul = await Payment.create({
      customerId: custKumar._id,
      billId: billKumarJul._id,
      amount: 699,
      paymentMethod: 'CASH',
      gateway: 'MANUAL',
      transactionId: 'MAN-20260705-5512',
      status: 'SUCCESS',
      paymentDate: new Date('2026-07-05'),
      notes: 'Collected cash at counter by operator',
      recordedBy: 'ADMIN'
    });
    await Receipt.create({
      paymentId: payKumarJul._id,
      billId: billKumarJul._id,
      customerId: custKumar._id,
      receiptNumber: makeReceiptNum(),
      receiptDate: new Date('2026-07-05')
    });

    // August 2026 (OVERDUE: ₹699)
    await Bill.create({
      customerId: custKumar._id,
      connectionId: connKumar._id,
      providerId: railwire._id,
      billNumber: 'CB-202608-0002',
      billingMonth: '2026-08',
      billingMonthName: 'August 2026',
      billDate: new Date('2026-08-01'),
      dueDate: new Date('2026-08-10'),
      baseAmount: 699,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 699,
      paidAmount: 0,
      remainingAmount: 699,
      status: 'OVERDUE'
    });

    // September 2026 (PENDING: ₹699)
    await Bill.create({
      customerId: custKumar._id,
      connectionId: connKumar._id,
      providerId: railwire._id,
      billNumber: 'CB-202609-0002',
      billingMonth: '2026-09',
      billingMonthName: 'September 2026',
      billDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-10'),
      baseAmount: 699,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 699,
      paidAmount: 0,
      remainingAmount: 699,
      status: 'PENDING'
    });

    // --- Suresh (GTPL): August Paid, September Partial (₹300 paid of ₹599) ---
    // August 2026 (Paid)
    const billSureshAug = await Bill.create({
      customerId: custSuresh._id,
      connectionId: connSuresh._id,
      providerId: gtpl._id,
      billNumber: 'CB-202608-0003',
      billingMonth: '2026-08',
      billingMonthName: 'August 2026',
      billDate: new Date('2026-08-01'),
      dueDate: new Date('2026-08-15'),
      baseAmount: 599,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 599,
      paidAmount: 599,
      remainingAmount: 0,
      status: 'PAID'
    });
    const paySureshAug = await Payment.create({
      customerId: custSuresh._id,
      billId: billSureshAug._id,
      amount: 599,
      paymentMethod: 'CASH',
      gateway: 'MANUAL',
      transactionId: 'MAN-20260812-7819',
      status: 'SUCCESS',
      paymentDate: new Date('2026-08-12'),
      notes: 'Cash payment handed to line technician',
      recordedBy: 'ADMIN'
    });
    await Receipt.create({
      paymentId: paySureshAug._id,
      billId: billSureshAug._id,
      customerId: custSuresh._id,
      receiptNumber: makeReceiptNum(),
      receiptDate: new Date('2026-08-12')
    });

    // September 2026 (PARTIAL: ₹300 paid of ₹599, remaining ₹299)
    const billSureshSep = await Bill.create({
      customerId: custSuresh._id,
      connectionId: connSuresh._id,
      providerId: gtpl._id,
      billNumber: 'CB-202609-0003',
      billingMonth: '2026-09',
      billingMonthName: 'September 2026',
      billDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-15'),
      baseAmount: 599,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 599,
      paidAmount: 300,
      remainingAmount: 299,
      status: 'PARTIAL'
    });
    const paySureshSepPartial = await Payment.create({
      customerId: custSuresh._id,
      billId: billSureshSep._id,
      amount: 300,
      paymentMethod: 'CASH',
      gateway: 'MANUAL',
      transactionId: 'MAN-20260902-1190',
      status: 'SUCCESS',
      paymentDate: new Date('2026-09-02'),
      notes: 'Partial advance cash payment recorded at counter',
      recordedBy: 'ADMIN'
    });
    await Receipt.create({
      paymentId: paySureshSepPartial._id,
      billId: billSureshSep._id,
      customerId: custSuresh._id,
      receiptNumber: makeReceiptNum(),
      receiptDate: new Date('2026-09-02')
    });

    // --- Anita Roy (Paid Sep) ---
    const billAnitaSep = await Bill.create({
      customerId: custAnita._id,
      providerId: railwire._id,
      billNumber: 'CB-202609-0004',
      billingMonth: '2026-09',
      billingMonthName: 'September 2026',
      billDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-10'),
      baseAmount: 899,
      previousPending: 0,
      lateFee: 0,
      discount: 0,
      totalAmount: 899,
      paidAmount: 899,
      remainingAmount: 0,
      status: 'PAID'
    });
    const payAnitaSep = await Payment.create({
      customerId: custAnita._id,
      billId: billAnitaSep._id,
      amount: 899,
      paymentMethod: 'ONLINE',
      gateway: 'RAZORPAY',
      gatewayOrderId: 'order_sep_anita_01',
      gatewayPaymentId: 'pay_sep_anita_01',
      transactionId: 'TXN-20260903-8821',
      status: 'SUCCESS',
      paymentDate: new Date('2026-09-03'),
      notes: 'Paid online via Razorpay NetBanking'
    });
    await Receipt.create({
      paymentId: payAnitaSep._id,
      billId: billAnitaSep._id,
      customerId: custAnita._id,
      receiptNumber: makeReceiptNum(),
      receiptDate: new Date('2026-09-03')
    });

    // 7. Notifications
    console.log('Seeding Notifications...');
    await Notification.create([
      {
        targetRole: 'ADMIN',
        title: 'New Online Payment Received',
        message: 'Anita Roy paid ₹899 for September 2026 via Razorpay Online.',
        type: 'PAYMENT',
        read: false
      },
      {
        targetRole: 'ADMIN',
        title: 'Overdue Bill Alert',
        message: 'Kumar (RW123456) has an overdue bill of ₹699 for August 2026.',
        type: 'OVERDUE',
        read: false
      },
      {
        customerId: custRavi._id,
        targetRole: 'CUSTOMER',
        title: 'September bill generated',
        message: 'Your BSNL Fiber bill of ₹799 for September 2026 is due on 10 Sep 2026.',
        type: 'BILL',
        read: false
      },
      {
        customerId: custKumar._id,
        targetRole: 'CUSTOMER',
        title: 'Payment Reminder',
        message: 'Your August bill of ₹699 is overdue. Total pending amount is ₹1,398. Please pay immediately.',
        type: 'REMINDER',
        read: false
      },
      {
        customerId: custSuresh._id,
        targetRole: 'CUSTOMER',
        title: 'Partial Payment of ₹300 Received',
        message: 'Cash payment of ₹300 recorded. Remaining balance for September is ₹299.',
        type: 'PAYMENT',
        read: true
      }
    ]);

    // 8. Sample Support Ticket
    console.log('Seeding Sample Support Ticket...');
    await SupportTicket.create({
      customerId: custRavi._id,
      name: 'Ravi Kumar',
      phone: '9000000001',
      issue: 'Intermittent Speed Fluctuations',
      message: 'Noticing slight drop in download speed during peak evening hours (8 PM - 10 PM). Please check ONT optical power.',
      status: 'OPEN'
    });

    console.log('--- Database Seeding Completed Successfully! ---');
    console.log(`Demo Credentials:
- Admin Login: admin@connectbill.com / admin123 (or phone 9999999999)
- Customer 1: Ravi Kumar (Phone: 9000000001, BSNL Fiber)
- Customer 2: Kumar (Phone: 9000000002, RailWire Broadband - RW123456)
- Customer 3: Suresh (Phone: 9000000003, GTPL Cable/Combo)
- Customer 4: Anita Roy (Phone: 9000000004, RailWire 200)
    `);

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
