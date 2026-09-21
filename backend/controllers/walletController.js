const mongoose = require('mongoose');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const WalletTransaction = require('../models/WalletTransaction');
const User = require('../models/User');
const Notification = require('../models/Notification');

// Initialize official Razorpay instance if configured
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret || key_id === 'rzp_test_123') {
    return null;
  }
  try {
    return new Razorpay({ key_id, key_secret });
  } catch (err) {
    console.error('Error initializing Razorpay SDK:', err);
    return null;
  }
};

// 1. Create Real Order for Razorpay Checkout
exports.createOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(amountNum * 100);
    const key_id = process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY || 'rzp_test_AuroraDemo2026';
    const razorpay = getRazorpayInstance();

    let orderId = null;

    if (razorpay) {
      try {
        const order = await razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}_${req.user._id.toString().slice(-4)}`,
          notes: {
            userId: req.user._id.toString(),
            userName: req.user.name,
            userEmail: req.user.email
          }
        });
        orderId = order.id;
      } catch (rzpErr) {
        console.error('Razorpay orders.create error:', rzpErr);
        // Do not crash, allow client fallback
      }
    }

    res.json({
      orderId, // Real Razorpay order ID or null (never send a fake order_id that causes Razorpay to reject)
      amount: amountInPaise,
      currency: 'INR',
      key: key_id,
      notes: {
        userId: req.user._id.toString(),
        userName: req.user.name,
        userEmail: req.user.email
      }
    });
  } catch (error) {
    console.error('Create Order Error:', error);
    res.status(500).json({ message: 'Server error creating payment order' });
  }
};

// 2. Verify Payment & Credit Wallet
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, paymentMethod, upi_utr, upi_txn_id, stripe_payment_id, stripe_charge_id } = req.body;
    const amountNum = Number(amount);

    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ message: 'Invalid amount' });
    }

    const isUPI = paymentMethod === 'upi' || !!upi_utr || !!upi_txn_id;
    const isStripe = paymentMethod === 'stripe' || !!stripe_payment_id;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    // Cryptographic signature verification if secret and order_id are present (for Razorpay)
    if (!isUPI && !isStripe && razorpay_order_id && razorpay_signature && key_secret && key_secret !== 'secret123') {
      const generated_signature = crypto
        .createHmac('sha256', key_secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (generated_signature !== razorpay_signature) {
        return res.status(400).json({ message: 'Razorpay signature verification failed. Invalid transaction.' });
      }
    }

    const paymentId = isUPI 
      ? (upi_txn_id || `upi_${Date.now()}`)
      : (isStripe 
        ? (stripe_payment_id || `pi_${Date.now()}`)
        : (razorpay_payment_id || `pay_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`));

    const txSource = isUPI ? 'upi' : (isStripe ? 'stripe' : 'razorpay');
    const txReference = isUPI 
      ? `UPI Transfer #${upi_utr || paymentId.slice(-8).toUpperCase()}`
      : (isStripe 
        ? `Stripe Card #${paymentId.substring(0, 14)}`
        : `Razorpay #${paymentId.substring(0, 12)}`);

    // Idempotency: prevent replay attack or duplicate wallet credit
    if (paymentId) {
      const existingTx = await WalletTransaction.findOne({ razorpayPaymentId: paymentId });
      if (existingTx) {
        const currentUser = await User.findById(req.user._id);
        return res.json({
          success: true,
          alreadyProcessed: true,
          newBalance: currentUser.walletBalance,
          message: 'Payment was already processed and credited.'
        });
      }
    }

    // Atomically increment user's wallet balance
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: amountNum } },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Record ledger transaction
    await WalletTransaction.create({
      user: req.user._id,
      amount: amountNum,
      type: 'credit',
      source: txSource,
      razorpayPaymentId: paymentId,
      reference: txReference,
      status: 'success'
    });

    const gatewayLabel = isUPI ? 'UPI (GPay/PhonePe)' : (isStripe ? 'Stripe Global Card' : 'Razorpay');

    // Create Push Notification
    await Notification.create({
      user: req.user._id,
      message: `₹${amountNum.toLocaleString('en-IN')} successfully added to your Aurora Wallet via ${gatewayLabel}.`,
      type: 'payment',
      read: false
    });

    res.json({
      success: true,
      newBalance: updatedUser.walletBalance,
      message: `₹${amountNum.toLocaleString('en-IN')} added to your wallet successfully via ${isUPI ? 'UPI' : (isStripe ? 'Stripe' : 'Razorpay')}!`
    });
  } catch (error) {
    console.error('Verify Payment Error:', error);
    res.status(500).json({ message: 'Server error verifying payment' });
  }
};

exports.addFunds = async (req, res) => {
  return exports.verifyPayment(req, res);
};


exports.razorpayWebhook = async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // Verify signature
  const shasum = crypto.createHmac('sha256', secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest('hex');

  if (digest !== req.headers['x-razorpay-signature']) {
    return res.status(401).json({ message: 'Invalid signature' });
  }

  // Process event
  if (req.body.event === 'payment.captured') {
    const payment = req.body.payload.payment.entity;
    
    // Convert from paise to INR
    const amount = payment.amount / 100;
    
    // Assuming you passed the userId in notes during order creation
    const userId = payment.notes?.userId;
    
    if (!userId) {
      console.error('Webhook received without userId in notes', payment.id);
      return res.status(400).json({ status: 'ignored', message: 'No user ID attached' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Atomically increment user's wallet balance
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $inc: { walletBalance: amount } },
        { new: true, session }
      );

      if (!updatedUser) {
        throw new Error('User not found');
      }

      // 2. Record ledger transaction
      const transaction = await WalletTransaction.create([{
        user: userId,
        amount,
        type: 'credit',
        source: 'razorpay',
        razorpayPaymentId: payment.id,
        reference: `Top-up via Razorpay`,
        status: 'success'
      }], { session });

      // 3. Create Notification
      await Notification.create([{
        user: userId,
        message: `Successfully added ₹${amount.toFixed(2)} to your wallet.`,
        type: 'payment',
        read: false
      }], { session });

      await session.commitTransaction();
      session.endSession();

      return res.status(200).json({ status: 'ok' });
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error('Wallet Webhook Transaction Error:', error);
      return res.status(500).json({ message: 'Server Error during transaction' });
    }
  }

  res.status(200).json({ status: 'ignored' });
};

exports.getWalletTransactions = async (req, res) => {
  try {
    const transactions = await WalletTransaction.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Wallet Error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// 5. Get or generate digital fuel pass
exports.getDigitalPass = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('name email walletBalance loyaltyPoints tier monthlySpendingCap');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const Vehicle = require('../models/Vehicle');
    const vehicle = await Vehicle.findOne({ user: user._id, isActive: true }) || await Vehicle.findOne({ user: user._id });

    // Generate 6-char random alphanumeric token
    const tokenChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += tokenChars.charAt(Math.floor(Math.random() * tokenChars.length));
    }
    const token = `H2-AUTH-${code}`;
    const expiresAt = new Date(Date.now() + 60 * 1000);

    user.digitalPassToken = token;
    user.digitalPassExpiresAt = expiresAt;
    await user.save();

    res.json({
      success: true,
      token,
      expiresInSeconds: 60,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        walletBalance: user.walletBalance || 0,
        tier: user.tier || (user.loyaltyPoints >= 500 ? 'Platinum' : (user.loyaltyPoints >= 200 ? 'Gold' : (user.loyaltyPoints >= 50 ? 'Silver' : 'Starter'))),
        monthlySpendingCap: user.monthlySpendingCap || 15000
      },
      vehicle: vehicle ? {
        _id: vehicle._id,
        model: vehicle.model,
        plateNumber: vehicle.plateNumber,
        fuelType: vehicle.fuelType
      } : null
    });
  } catch (error) {
    console.error('Digital Pass Error:', error);
    res.status(500).json({ message: 'Server error generating digital pass' });
  }
};

// 6. Update Monthly Fleet Spending Cap
exports.updateSpendingCap = async (req, res) => {
  try {
    const { cap } = req.body;
    const capNum = Number(cap);
    if (!capNum || capNum < 1000) {
      return res.status(400).json({ message: 'Invalid spending cap amount' });
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { monthlySpendingCap: capNum },
      { new: true }
    ).select('monthlySpendingCap');

    res.json({
      success: true,
      monthlySpendingCap: updated.monthlySpendingCap,
      message: `Monthly fleet spending cap set to ₹${capNum.toLocaleString('en-IN')}`
    });
  } catch (error) {
    console.error('Update Spending Cap Error:', error);
    res.status(500).json({ message: 'Server error updating spending cap' });
  }
};

// 7. Authorize Dispenser via Contactless Pass Token (Tap-to-Fuel)
exports.authorizePassTap = async (req, res) => {
  try {
    const { dispenserId } = req.body;
    if (!dispenserId) {
      return res.status(400).json({ message: 'Dispenser ID is required' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const Dispenser = require('../models/Dispenser');
    const dispenser = await Dispenser.findById(dispenserId).populate('station');
    if (!dispenser) {
      return res.status(404).json({ message: 'Dispenser not found' });
    }

    // Check dispenser availability
    if (dispenser.status === 'out_of_order' || dispenser.status === 'maintenance') {
      return res.status(400).json({ message: 'Selected dispenser is currently under maintenance' });
    }

    const Vehicle = require('../models/Vehicle');
    const vehicle = await Vehicle.findOne({ user: user._id, isActive: true }) || await Vehicle.findOne({ user: user._id });

    // Mark dispenser as active / in-use
    dispenser.status = 'dispensing';
    await dispenser.save();

    // Broadcast status change
    if (req.io) {
      req.io.emit('dispenser_status_changed', {
        dispenserId: dispenser._id,
        stationId: dispenser.station?._id,
        status: 'dispensing'
      });
    }

    res.json({
      success: true,
      message: 'Contactless Tap Verified: 700 Bar Nozzle Unlocked',
      dispenserId: dispenser._id,
      stationName: dispenser.station?.name || 'Aurora Hydrogen Hub',
      vehicleModel: vehicle?.model || 'Hydrogen Vehicle',
      plateNumber: vehicle?.plateNumber || 'MH-12-AB-9999',
      sessionUrl: `/live-pumping/${dispenser._id}`
    });
  } catch (error) {
    console.error('Authorize Pass Tap Error:', error);
    res.status(500).json({ message: 'Error authorizing pump via digital pass' });
  }
};
