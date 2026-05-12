const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User.model');
const { Package } = require('../models/Package.model');
const dns = require('node:dns/promises')
dns.setServers(["1.1.1.1"]);

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing
  await User.deleteMany({});
  await mongoose.model('Package').deleteMany({});
    
    // 2. Try dropping the specific index (wrap in try/catch in case it's already gone)
    try {
      await mongoose.model('Package').collection.dropIndex('slug_1');
    } catch (e) {
      // Index already doesn't exist, we can ignore this
    }
  await Package.deleteMany({});

  // Create admin
  const admin = await User.create({
    name: 'DJ Admin',
    email: 'admin@djbooking.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '+1-555-0100'
  });
  console.log('✅ Admin created:', admin.email);

  // Create demo client
  const client = await User.create({
    name: 'Jane Smith',
    email: 'client@example.com',
    password: 'Client@123',
    role: 'client',
    phone: '+1-555-0200'
  });
  console.log('✅ Demo client created:', client.email);

  // Create packages
  const packages = await Package.insertMany([
    {
      name: 'Starter Package',
      description: 'Perfect for intimate gatherings and house parties',
      duration: 3,
      basePrice: 500,
      features: ['Up to 3 hours', 'Basic sound system', 'LED lighting', 'Music requests accepted', 'MC services']
    },
    {
      name: 'Gold Package',
      description: 'Ideal for birthdays, corporate events, and club nights',
      duration: 5,
      basePrice: 900,
      features: ['Up to 5 hours', 'Premium sound system', 'Dynamic LED show', 'Wireless microphone', 'Custom playlist', 'MC services', 'Fog machine']
    },
    {
      name: 'Diamond Package',
      description: 'The ultimate wedding and festival experience',
      duration: 8,
      basePrice: 1500,
      features: ['Up to 8 hours', 'Pro-grade sound system', 'Full stage lighting rig', 'Photo booth add-on', 'Custom DJ set', 'MC + entertainment host', 'Video mixing', 'Unlimited encores']
    },
    {
    name: 'Essential Mini',
    description: 'Budget-friendly mix for small cafes or quick backyard sets',
    duration: 2,
    basePrice: 300,
    features: ['Up to 2 hours', 'Compact PA system', 'Standard playlist', 'Bluetooth connectivity']
  },
  {
    name: 'Platinum Wedding',
    description: 'A premium, all-day wedding package with ceremony and reception coverage',
    duration: 10,
    basePrice: 2200,
    features: [
      'Up to 10 hours', 
      'Ceremony & Reception setup', 
      'Lavallier mics for vows', 
      'Uplighting for venue', 
      'Cold sparklers for first dance', 
      'Dedicated Event Coordinator'
    ]
  },
  {
    name: 'Festival/Rave Edition',
    description: 'High-energy electronic setup for large outdoor crowds',
    duration: 6,
    basePrice: 3500,
    features: [
      'High-output Subwoofers', 
      'Laser light show', 
      'CO2 Cannons', 
      'Stage monitors', 
      'Live VJ (Visual Jockey) sets', 
      'Professional mixing console'
    ]
  }
  ]);
  console.log(`✅ ${packages.length} packages created`);

  console.log('\n🎧 Seed complete!');
  console.log('Admin login: admin@djbooking.com / Admin@123');
  console.log('Client login: client@example.com / Client@123');
  process.exit(0);
};

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
