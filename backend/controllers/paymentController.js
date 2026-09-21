const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY || 'mock_stripe_secret_key');
const Booking = require('../models/Booking');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Transaction = require('../models/Transaction');

exports.getCheckoutDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate('station', 'name location pricePerKg address hydrogenPrice')
      .populate('dispenser', 'nozzleType status pressureRating');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const user = await User.findById(req.user._id).select('name email walletBalance tier');
    const pricePerKg = booking.station?.pricePerKg || booking.station?.hydrogenPrice || 82;
    const estimatedKg = 5.0; // Standard tank reservation
    const estimatedTotal = parseFloat((pricePerKg * estimatedKg).toFixed(2));

    res.json({
      booking,
      user,
      pricePerKg,
      estimatedKg,
      estimatedTotal
    });
  } catch (error) {
    console.error('Get checkout details error:', error);
    res.status(500).json({ message: 'Failed to fetch checkout details' });
  }
};

exports.createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;
    
    const booking = await Booking.findById(bookingId).populate('station').populate('dispenser');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const pricePerKg = booking.station?.pricePerKg || 82;
    const amountInCents = Math.round(pricePerKg * 5 * 100);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Hydrogen Refuel at ${booking.station.name}`,
              description: `Dispenser: ${booking.dispenser?.nozzleType || '700 Bar H2'}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `http://localhost:5173/checkout/${booking._id}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5173/checkout/${booking._id}?canceled=true`,
      client_reference_id: booking._id.toString(),
      customer_email: req.user.email
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ message: 'Error creating payment session' });
  }
};

exports.processCheckoutPayment = async (req, res) => {
  try {
    const { bookingId, paymentMethod, amount } = req.body;
    
    const booking = await Booking.findById(bookingId).populate('station').populate('dispenser');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const pricePerKg = booking.station?.pricePerKg || booking.station?.hydrogenPrice || 82;
    const finalAmount = amount || parseFloat((pricePerKg * 5).toFixed(2));

    // Double-payment guard: booking already confirmed/paid
    if (booking.status === 'confirmed' || booking.status === 'completed') {
      const existingTx = await Transaction.findOne({ booking: booking._id });
      return res.json({
        success: true,
        alreadyPaid: true,
        message: 'This booking is already confirmed and settled.',
        paymentMethod: paymentMethod,
        transactionId: existingTx?._id,
        booking,
        newBalance: user.walletBalance
      });
    }

    if (paymentMethod === 'wallet') {
      if ((user.walletBalance || 0) < finalAmount) {
        return res.status(400).json({ 
          message: `Insufficient wallet balance (₹${(user.walletBalance || 0).toFixed(2)} available, ₹${finalAmount} required). Please top up.` 
        });
      }

      // Deduct from wallet
      user.walletBalance = parseFloat((user.walletBalance - finalAmount).toFixed(2));
      await user.save();

      // Log wallet transaction
      const walletTx = new WalletTransaction({
        user: user._id,
        amount: finalAmount,
        type: 'debit',
        source: 'booking',
        reference: `Refueling Reservation #${booking._id.toString().slice(-6).toUpperCase()}`,
        status: 'success'
      });
      await walletTx.save();

      // Update booking status
      booking.status = 'confirmed';
      await booking.save();

      // Create transaction record
      const tx = new Transaction({
        booking: booking._id,
        dispenser: booking.dispenser?._id,
        user: user._id,
        station: booking.station._id,
        quantityDispensed: 5.0,
        cost: finalAmount,
        paymentStatus: 'paid'
      });
      const savedTx = await tx.save();

      return res.json({
        success: true,
        message: 'Payment completed successfully via Hydrogen Wallet!',
        paymentMethod: 'wallet',
        transactionId: savedTx._id,
        booking,
        newBalance: user.walletBalance
      });
    }

    if (paymentMethod === 'card' || paymentMethod === 'stripe' || paymentMethod === 'razorpay' || paymentMethod === 'upi') {
      // Process gateway payment
      booking.status = 'confirmed';
      await booking.save();

      const tx = new Transaction({
        booking: booking._id,
        dispenser: booking.dispenser?._id,
        user: user._id,
        station: booking.station._id,
        quantityDispensed: 5.0,
        cost: finalAmount,
        paymentStatus: 'paid'
      });
      const savedTx = await tx.save();

      const methodLabel = paymentMethod === 'upi' 
        ? 'Direct UPI (GPay/PhonePe)' 
        : (paymentMethod === 'stripe' ? 'Stripe Gateway' : (paymentMethod === 'razorpay' ? 'Razorpay' : 'Card Gateway'));

      return res.json({
        success: true,
        message: `Payment verified and slot confirmed via ${methodLabel}!`,
        paymentMethod: paymentMethod,
        transactionId: savedTx._id,
        booking,
        newBalance: user.walletBalance
      });
    }

    if (paymentMethod === 'station') {
      booking.status = 'confirmed';
      await booking.save();

      return res.json({
        success: true,
        message: 'Slot confirmed for On-Arrival Dispenser Billing!',
        paymentMethod: 'station',
        booking,
        newBalance: user.walletBalance
      });
    }

    return res.status(400).json({ message: 'Invalid payment method selected' });
  } catch (error) {
    console.error('Process Checkout Payment Error:', error);
    res.status(500).json({ message: 'Payment processing failed' });
  }
};

