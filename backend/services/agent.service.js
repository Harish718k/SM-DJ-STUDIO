/**
 * agent.service.js  — FULL REPLACEMENT
 *
 * Key change: validate_and_preview_booking now:
 *   - Creates the booking with status='awaiting_payment'
 *   - Creates a Stripe PaymentIntent inline
 *   - Returns clientSecret in the tool result so the frontend can mount
 *     Stripe Elements directly in the chat panel
 *   - Does NOT fire any email
 */

const { GoogleGenerativeAI, FunctionCallingMode } = require('@google/generative-ai');
const stripe   = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking  = require('../models/Booking.model');
const { Package } = require('../models/Package.model');
const { checkAvailability } = require('../services/availability.service');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ── Tool declarations ─────────────────────────────────────────────────────────
const tools = [
  {
    functionDeclarations: [
      {
        name: 'get_packages',
        description: 'Retrieves all active DJ service packages with name, price, duration, and features. Call this when the user asks about packages, pricing, or what services are available.',
        parameters: { type: 'OBJECT', properties: {}, required: [] },
      },
      {
        name: 'check_date_availability',
        description: 'Checks whether a specific date is available for booking.',
        parameters: {
          type: 'OBJECT',
          properties: {
            date: { type: 'STRING', description: 'ISO 8601 date e.g. "2025-08-15"' },
          },
          required: ['date'],
        },
      },
      {
        name: 'validate_and_preview_booking',
        description: [
          'Creates a booking in "awaiting_payment" status and a Stripe PaymentIntent.',
          'Only call this after you have confirmed ALL required fields from the user:',
          'packageId, eventDate (ISO), startTime (HH:MM 24h), endTime (HH:MM 24h),',
          'eventType, guestCount, venue.name, venue.address, venue.city.',
          'Returns clientSecret so the frontend can collect payment.',
          'Do NOT call this speculatively.',
        ].join(' '),
        parameters: {
          type: 'OBJECT',
          properties: {
            packageId:      { type: 'STRING' },
            eventDate:      { type: 'STRING', description: 'ISO date string' },
            startTime:      { type: 'STRING', description: '24h e.g. "18:00"' },
            endTime:        { type: 'STRING', description: '24h e.g. "23:00"' },
            eventType:      { type: 'STRING', description: 'wedding|birthday|corporate|club|festival|other' },
            guestCount:     { type: 'NUMBER' },
            venueName:      { type: 'STRING' },
            venueAddress:   { type: 'STRING' },
            venueCity:      { type: 'STRING' },
            venueState:     { type: 'STRING' },
            specialRequests:{ type: 'STRING' },
          },
          required: ['packageId','eventDate','startTime','endTime','eventType','guestCount','venueName','venueAddress','venueCity'],
        },
      },
    ],
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────
async function executeTool(name, args, userId) {
  switch (name) {

    case 'get_packages': {
      const packages = await Package.find({ isActive: true }).select('-__v');
      return packages.map(p => ({
        id: p._id.toString(), name: p.name, price: p.basePrice,
        duration: p.duration, features: p.features, description: p.description,
      }));
    }

    case 'check_date_availability': {
      const available = await checkAvailability(args.date);
      return {
        date: args.date,
        available,
        message: available ? 'That date is available!' : 'Sorry, that date is already taken or blocked.',
      };
    }

    case 'validate_and_preview_booking': {
      // Re-verify availability
      const available = await checkAvailability(args.eventDate);
      if (!available) {
        return { success: false, error: 'That date just became unavailable. Please choose another date.' };
      }

      const pkg = await Package.findById(args.packageId);
      if (!pkg || !pkg.isActive) {
        return { success: false, error: 'Package not found or inactive.' };
      }

      const depositAmount = Math.round(pkg.basePrice * 0.3);

      // Create Stripe PaymentIntent FIRST — if it fails, no orphan in DB
      let paymentIntent;
      try {
        paymentIntent = await stripe.paymentIntents.create({
          amount:                    depositAmount * 100,
          currency:                  'inr',
          automatic_payment_methods: { enabled: true },
          metadata: {
            clientId:  userId.toString(),
            eventType: args.eventType,
            eventDate: new Date(args.eventDate).toISOString().split('T')[0],
          },
          description: `Deposit — DJ BookPro ${args.eventType} on ${
            new Date(args.eventDate).toISOString().split('T')[0]
          }`,
        });
      } catch (stripeErr) {
        return { success: false, error: `Payment setup failed: ${stripeErr.message}` };
      }

      // Create booking in awaiting_payment state
      const booking = await Booking.create({
        client:               userId,
        package:              args.packageId,
        eventType:            args.eventType,
        eventDate:            new Date(args.eventDate),
        startTime:            args.startTime,
        endTime:              args.endTime,
        venue: {
          name:    args.venueName,
          address: args.venueAddress,
          city:    args.venueCity,
          state:   args.venueState || '',
        },
        guestCount:           args.guestCount,
        specialRequests:      args.specialRequests || '',
        totalPrice:           pkg.basePrice,
        depositAmount,
        stripePaymentIntentId: paymentIntent.id,
        status:               'awaiting_payment',
      });

      // Attach bookingId to Stripe metadata
      await stripe.paymentIntents.update(paymentIntent.id, {
        metadata: { ...paymentIntent.metadata, bookingId: booking._id.toString() },
      });

      // No email here — email fires only after confirmBookingPayment succeeds
      return {
        success:      true,
        bookingId:    booking._id.toString(),
        clientSecret: paymentIntent.client_secret,   // ← returned to frontend
        packageName:  pkg.name,
        totalPrice:   booking.totalPrice,
        depositDue:   depositAmount,
        eventDate:    args.eventDate,
        startTime:    args.startTime,
        endTime:      args.endTime,
        eventType:    args.eventType,
        venue:        `${args.venueName}, ${args.venueCity}`,
        guestCount:   args.guestCount,
      };
    }

    default:
      return { error: `Unknown tool: ${name}` };
  }
}

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Maya, a friendly booking assistant for DJ BookPro.

Your goal is to guide users from inquiry to a confirmed booking in a natural conversation.

## Capabilities
1. **Consultation** – Answer package questions. Always call get_packages for live data.
2. **Recommendation** – Suggest a package based on guest count, event type, budget.
3. **Slot filling** – Collect: date, start time, end time, event type, guest count, venue (name + address + city), and special requests. Ask one missing piece at a time.
4. **Booking creation** – Once the user confirms ALL details, call validate_and_preview_booking.

## Rules
- NEVER handle or discuss payment processing. After calling validate_and_preview_booking, tell the user to complete payment using the card form that will appear below your message.
- NEVER guess prices — call get_packages first.
- NEVER call validate_and_preview_booking until the user has explicitly confirmed all details.
- Keep responses concise and warm.

## Tone
Warm, professional, a little playful. Like a helpful human booking agent.`;

// ── Main chat function ────────────────────────────────────────────────────────
async function chat(history, userMessage, userId) {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    systemInstruction: SYSTEM_PROMPT,
    tools,
    toolConfig: { functionCallingConfig: { mode: FunctionCallingMode.AUTO } },
  });

  const contents = [
    ...history,
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  let bookingPreview   = null;
  let reply            = '';
  let iterationCount   = 0;
  const MAX_ITERATIONS = 5;

  while (iterationCount < MAX_ITERATIONS) {
    iterationCount++;

    const result     = await model.generateContent({ contents });
    const candidate  = result.response.candidates?.[0];
    if (!candidate) break;

    const parts     = candidate.content?.parts ?? [];
    const toolCalls = parts.filter(p => p.functionCall);
    const textParts = parts.filter(p => p.text);

    if (toolCalls.length === 0) {
      reply = textParts.map(p => p.text).join('');
      contents.push({ role: 'model', parts });
      break;
    }

    contents.push({ role: 'model', parts });

    const toolResultParts = await Promise.all(
      toolCalls.map(async part => {
        const { name, args } = part.functionCall;
        const toolResult = await executeTool(name, args, userId);

        if (name === 'validate_and_preview_booking' && toolResult.success) {
          bookingPreview = toolResult;  // captured for frontend
        }

        return {
          functionResponse: {
            name,
            response: { content: toolResult },
          },
        };
      })
    );

    contents.push({ role: 'user', parts: toolResultParts });
  }

  return { reply, bookingPreview, history: contents };
}

module.exports = { chat };
