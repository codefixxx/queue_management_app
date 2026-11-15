import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

async function seedManager(email: string, name: string, plainPass: string) {
  const hashedPassword = await bcrypt.hash(plainPass, 10);

  const manager = await prisma.user.upsert({
    where: { email },
    update: { name, password: hashedPassword },
    create: {
      email,
      name,
      password: hashedPassword,
      role: 'MANAGER'
    }
  });

  console.log(`👤 Seeded Manager: ${manager.email} (${name})`);

  // Remove existing queues for this manager to give a clean, pristine showcase
  const oldQueues = await prisma.queue.findMany({ where: { managerId: manager.id } });
  for (const q of oldQueues) {
    await prisma.token.deleteMany({ where: { queueId: q.id } });
  }
  await prisma.queue.deleteMany({ where: { managerId: manager.id } });

  console.log(`🧹 Rebuilding showcase queues for ${email}...`);

  const now = new Date();
  const today = (hoursAgo: number, minutesAgo: number = 0) => {
    const d = new Date(now);
    d.setHours(d.getHours() - hoursAgo, d.getMinutes() - minutesAgo);
    return d;
  };

  // 1. Queue 1: Customer Support & Inquiries
  const csQueue = await prisma.queue.create({
    data: {
      name: 'Customer Support & Inquiries',
      description: 'Account assistance, tier upgrades, and general consultations',
      prefix: 'CS',
      currentNumber: 12,
      managerId: manager.id
    }
  });

  // Completed tokens for CS (varied wait times: 8m, 14m, 18m, 22m, etc.)
  const csCompleted = [
    { num: 'CS-001', name: 'David Miller', phone: '+1-555-0101', waitMins: 18, servMins: 12, hAgo: 5 },
    { num: 'CS-002', name: 'Elena Rostova', phone: '+1-555-0102', waitMins: 15, servMins: 14, hAgo: 4 },
    { num: 'CS-003', name: 'Marcus Chen', phone: '+1-555-0103', waitMins: 12, servMins: 10, hAgo: 3 },
    { num: 'CS-004', name: 'Amina Al-Mansoor', phone: '+1-555-0104', waitMins: 20, servMins: 11, hAgo: 2 },
    { num: 'CS-005', name: 'Liam O’Connor', phone: '+1-555-0105', waitMins: 14, servMins: 15, hAgo: 1 }
  ];

  for (const c of csCompleted) {
    const createdAt = today(c.hAgo, c.waitMins + c.servMins);
    const servedAt = today(c.hAgo, c.servMins);
    const completedAt = today(c.hAgo, 0);

    await prisma.token.create({
      data: {
        tokenNumber: c.num,
        sequence: parseInt(c.num.split('-')[1]),
        customerName: c.name,
        customerPhone: c.phone,
        status: 'COMPLETED',
        position: 0,
        createdAt,
        servedAt,
        completedAt,
        servedBy: name,
        queueId: csQueue.id
      }
    });
  }

  // Cancelled token for CS
  await prisma.token.create({
    data: {
      tokenNumber: 'CS-006',
      sequence: 6,
      customerName: 'Robert Vance',
      customerPhone: '+1-555-0144',
      status: 'CANCELLED',
      position: 0,
      createdAt: today(1, 30),
      cancelledAt: today(1, 10),
      cancellationReason: 'Customer had to reschedule appointment',
      queueId: csQueue.id
    }
  });

  // Currently In Service for CS
  await prisma.token.create({
    data: {
      tokenNumber: 'CS-007',
      sequence: 7,
      customerName: 'Priya Sharma',
      customerPhone: '+1-555-0182',
      notes: 'Needs billing address modification on tier-2 account',
      status: 'IN_SERVICE',
      position: 0,
      createdAt: today(0, 25),
      servedAt: today(0, 8),
      servedBy: name,
      queueId: csQueue.id
    }
  });

  // Waiting in CS (5 waiting customers with priority flags and notes)
  const csWaiting = [
    { num: 'CS-008', name: 'James Wilson', priority: 'VIP', notes: 'Corporate client high priority inquiry', pos: 1 },
    { num: 'CS-009', name: 'Sophia Martinez', priority: 'NORMAL', notes: 'New account onboarding documentation', pos: 2 },
    { num: 'CS-010', name: 'Ethan Hunt', priority: 'NORMAL', notes: 'Multi-factor security credential reset', pos: 3 },
    { num: 'CS-011', name: 'Chloe Dubois', priority: 'NORMAL', notes: 'Invoice discrepancy reconciliation', pos: 4 },
    { num: 'CS-012', name: 'Lucas Scott', priority: 'NORMAL', notes: 'General support inquiry', pos: 5 }
  ];

  for (const w of csWaiting) {
    await prisma.token.create({
      data: {
        tokenNumber: w.num,
        sequence: parseInt(w.num.split('-')[1]),
        customerName: w.name,
        customerPhone: '+1-555-019' + w.pos,
        priority: w.priority,
        notes: w.notes,
        status: 'WAITING',
        position: w.pos,
        createdAt: today(0, 20 - w.pos * 3),
        queueId: csQueue.id
      }
    });
  }

  // 2. Queue 2: Express Billing & Payments
  const billQueue = await prisma.queue.create({
    data: {
      name: 'Express Billing & Payments',
      description: 'Quick card charges, refunds, invoice stamps, and counter receipts',
      prefix: 'EXP',
      currentNumber: 9,
      managerId: manager.id
    }
  });

  const expCompleted = [
    { num: 'EXP-001', name: 'Noah Adams', waitMins: 8, servMins: 5, hAgo: 4 },
    { num: 'EXP-002', name: 'Emma Watson', waitMins: 6, servMins: 6, hAgo: 3 },
    { num: 'EXP-003', name: 'Oliver Twist', waitMins: 10, servMins: 7, hAgo: 2 },
    { num: 'EXP-004', name: 'Grace Hopper', waitMins: 5, servMins: 6, hAgo: 1 }
  ];

  for (const ec of expCompleted) {
    await prisma.token.create({
      data: {
        tokenNumber: ec.num,
        sequence: parseInt(ec.num.split('-')[1]),
        customerName: ec.name,
        customerPhone: '+1-555-0210',
        status: 'COMPLETED',
        position: 0,
        createdAt: today(ec.hAgo, ec.waitMins + ec.servMins),
        servedAt: today(ec.hAgo, ec.servMins),
        completedAt: today(ec.hAgo, 0),
        servedBy: name,
        queueId: billQueue.id
      }
    });
  }

  // Currently In Service for Express Billing
  await prisma.token.create({
    data: {
      tokenNumber: 'EXP-005',
      sequence: 5,
      customerName: 'Benjamin Franklin',
      customerPhone: '+1-555-0215',
      notes: 'Corporate invoice payment with tax exemption check',
      status: 'IN_SERVICE',
      position: 0,
      createdAt: today(0, 16),
      servedAt: today(0, 4),
      servedBy: name,
      queueId: billQueue.id
    }
  });

  // Waiting in Express Billing
  const expWaiting = [
    { num: 'EXP-006', name: 'Zoe Saldana', priority: 'VIP', notes: 'Wire clearance verification', pos: 1 },
    { num: 'EXP-007', name: 'Daniel Craig', priority: 'NORMAL', notes: 'POS card reader refund', pos: 2 },
    { num: 'EXP-008', name: 'Natalia Ramos', priority: 'NORMAL', notes: 'Monthly receipt batch print', pos: 3 },
    { num: 'EXP-009', name: 'Liam Hemsworth', priority: 'NORMAL', notes: 'Account credit statement', pos: 4 }
  ];

  for (const ew of expWaiting) {
    await prisma.token.create({
      data: {
        tokenNumber: ew.num,
        sequence: parseInt(ew.num.split('-')[1]),
        customerName: ew.name,
        customerPhone: '+1-555-022' + ew.pos,
        priority: ew.priority,
        notes: ew.notes,
        status: 'WAITING',
        position: ew.pos,
        createdAt: today(0, 14 - ew.pos * 3),
        queueId: billQueue.id
      }
    });
  }

  // 3. Queue 3: Priority VIP & Fast-Track Desk
  const vipQueue = await prisma.queue.create({
    data: {
      name: 'Priority VIP & Fast-Track',
      description: 'Dedicated high-touch concierge desk for premium members',
      prefix: 'VIP',
      currentNumber: 6,
      managerId: manager.id
    }
  });

  const vipCompleted = [
    { num: 'VIP-001', name: 'Eleanor Roosevelt', waitMins: 3, servMins: 8, hAgo: 3 },
    { num: 'VIP-002', name: 'Winston Churchill', waitMins: 4, servMins: 12, hAgo: 1 }
  ];

  for (const vc of vipCompleted) {
    await prisma.token.create({
      data: {
        tokenNumber: vc.num,
        sequence: parseInt(vc.num.split('-')[1]),
        customerName: vc.name,
        customerPhone: '+1-555-0301',
        status: 'COMPLETED',
        position: 0,
        priority: 'VIP',
        createdAt: today(vc.hAgo, vc.waitMins + vc.servMins),
        servedAt: today(vc.hAgo, vc.servMins),
        completedAt: today(vc.hAgo, 0),
        servedBy: name,
        queueId: vipQueue.id
      }
    });
  }

  // Currently In Service for VIP
  await prisma.token.create({
    data: {
      tokenNumber: 'VIP-003',
      sequence: 3,
      customerName: 'Alexander Vance',
      customerPhone: '+1-555-0303',
      notes: 'Premium portfolio advisory and international wire authorization',
      status: 'IN_SERVICE',
      position: 0,
      priority: 'VIP',
      createdAt: today(0, 10),
      servedAt: today(0, 5),
      servedBy: name,
      queueId: vipQueue.id
    }
  });

  // Waiting in VIP
  const vipWaiting = [
    { num: 'VIP-004', name: 'Charlotte Bronte', priority: 'VIP', notes: 'Private banking review', pos: 1 },
    { num: 'VIP-005', name: 'Arthur Conan Doyle', priority: 'VIP', notes: 'Escrow account documentation', pos: 2 },
    { num: 'VIP-006', name: 'Victor Hugo', priority: 'VIP', notes: 'Foreign exchange clearance', pos: 3 }
  ];

  for (const vw of vipWaiting) {
    await prisma.token.create({
      data: {
        tokenNumber: vw.num,
        sequence: parseInt(vw.num.split('-')[1]),
        customerName: vw.name,
        customerPhone: '+1-555-030' + (vw.pos + 3),
        priority: 'VIP',
        notes: vw.notes,
        status: 'WAITING',
        position: vw.pos,
        createdAt: today(0, 8 - vw.pos * 2),
        queueId: vipQueue.id
      }
    });
  }

  console.log(`✅ Showcase queues & tokens populated for ${email}`);
}

async function main() {
  console.log('🌱 Starting database seed for showcase...');

  // Seed both the demo manager and standard manager accounts
  await seedManager('demo@queueflow.com', 'Demo Manager', 'Password123!');
  await seedManager('manager@queueflow.com', 'Sarah Jenkins', 'password123');

  console.log('🎉 Showcase seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
