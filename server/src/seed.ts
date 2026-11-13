import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

async function seed() {
  console.log('🌱 Starting database seed...');

  // 1. Create or find default Manager
  const email = 'manager@queueflow.com';
  let manager = await prisma.user.findUnique({ where: { email } });

  const hashedPassword = await bcrypt.hash('password123', 10);

  if (!manager) {
    manager = await prisma.user.create({
      data: {
        email,
        name: 'Sarah Jenkins',
        password: hashedPassword,
        role: 'MANAGER'
      }
    });
    console.log(`👤 Created Manager: ${manager.email}`);
  } else {
    manager = await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, name: 'Sarah Jenkins' }
    });
    console.log(`👤 Updated Manager: ${manager.email}`);
  }

  // Clear existing queues for clean demo seed if needed
  const existingQueues = await prisma.queue.findMany({ where: { managerId: manager.id } });
  if (existingQueues.length === 0) {
    console.log('Creating sample queues and tokens...');

    // Queue 1: Customer Service & Enquiries
    const csQueue = await prisma.queue.create({
      data: {
        name: 'Customer Service & Enquiries',
        description: 'General account support, questions, and onboarding',
        prefix: 'CS',
        currentNumber: 12,
        managerId: manager.id
      }
    });

    // Queue 2: Express Billing
    const billQueue = await prisma.queue.create({
      data: {
        name: 'Express Billing & Payments',
        description: 'Quick payments, invoice clearances, and refunds',
        prefix: 'EXP',
        currentNumber: 8,
        managerId: manager.id
      }
    });

    const now = new Date();
    const today = (hoursAgo: number, minutesAgo: number = 0) => {
      const d = new Date(now);
      d.setHours(d.getHours() - hoursAgo, d.getMinutes() - minutesAgo);
      return d;
    };

    // Tokens for CS Queue
    // Completed tokens with realistic wait and service times
    const csCompleted = [
      {
        num: 'CS-001',
        name: 'David Miller',
        created: today(5, 30),
        served: today(5, 12), // 18m wait
        completed: today(5, 0) // 12m service
      },
      {
        num: 'CS-002',
        name: 'Elena Rostova',
        created: today(4, 45),
        served: today(4, 25), // 20m wait
        completed: today(4, 10) // 15m service
      },
      {
        num: 'CS-003',
        name: 'Marcus Chen',
        created: today(3, 50),
        served: today(3, 35), // 15m wait
        completed: today(3, 20) // 15m service
      },
      {
        num: 'CS-004',
        name: 'Amina Al-Mansoor',
        created: today(3, 10),
        served: today(2, 50), // 20m wait
        completed: today(2, 38) // 12m service
      },
      {
        num: 'CS-005',
        name: 'Liam O’Connor',
        created: today(2, 15),
        served: today(1, 55), // 20m wait
        completed: today(1, 40) // 15m service
      }
    ];

    for (const c of csCompleted) {
      await prisma.token.create({
        data: {
          tokenNumber: c.num,
          sequence: parseInt(c.num.split('-')[1]),
          customerName: c.name,
          customerPhone: '+1-555-0199',
          status: 'COMPLETED',
          position: 0,
          createdAt: c.created,
          servedAt: c.served,
          completedAt: c.completed,
          servedBy: 'Sarah Jenkins',
          queueId: csQueue.id
        }
      });
    }

    // Cancelled token
    await prisma.token.create({
      data: {
        tokenNumber: 'CS-006',
        sequence: 6,
        customerName: 'Robert Vance',
        customerPhone: '+1-555-0144',
        status: 'CANCELLED',
        position: 0,
        createdAt: today(2, 0),
        cancelledAt: today(1, 45),
        cancellationReason: 'Customer left premises',
        queueId: csQueue.id
      }
    });

    // Currently In Service token
    await prisma.token.create({
      data: {
        tokenNumber: 'CS-007',
        sequence: 7,
        customerName: 'Priya Sharma',
        customerPhone: '+1-555-0182',
        notes: 'Needs billing address modification on tier-2 account',
        status: 'IN_SERVICE',
        position: 0,
        createdAt: today(0, 35),
        servedAt: today(0, 10),
        servedBy: 'Sarah Jenkins',
        queueId: csQueue.id
      }
    });

    // Waiting tokens in CS Queue (positions 1, 2, 3, 4, 5)
    const csWaiting = [
      { num: 'CS-008', name: 'James Wilson', priority: 'VIP', notes: 'Corporate client inquiry', pos: 1 },
      { num: 'CS-009', name: 'Sophia Martinez', priority: 'NORMAL', notes: 'New account setup', pos: 2 },
      { num: 'CS-010', name: 'Ethan Hunt', priority: 'NORMAL', notes: 'Security badge reactivation', pos: 3 },
      { num: 'CS-011', name: 'Chloe Dubois', priority: 'NORMAL', notes: 'Invoice discrepancy', pos: 4 },
      { num: 'CS-012', name: 'Lucas Scott', priority: 'NORMAL', notes: 'General assistance', pos: 5 }
    ];

    for (const w of csWaiting) {
      await prisma.token.create({
        data: {
          tokenNumber: w.num,
          sequence: parseInt(w.num.split('-')[1]),
          customerName: w.name,
          customerPhone: '+1-555-0100',
          priority: w.priority,
          notes: w.notes,
          status: 'WAITING',
          position: w.pos,
          createdAt: today(0, 25 - w.pos * 4),
          queueId: csQueue.id
        }
      });
    }

    // Express Billing Queue tokens
    const expCompleted = [
      { num: 'EXP-001', name: 'Noah Adams', created: today(4, 0), served: today(3, 52), completed: today(3, 46) },
      { num: 'EXP-002', name: 'Emma Watson', created: today(3, 30), served: today(3, 24), completed: today(3, 18) },
      { num: 'EXP-003', name: 'Oliver Twist', created: today(2, 45), served: today(2, 40), completed: today(2, 33) },
      { num: 'EXP-004', name: 'Grace Hopper', created: today(1, 30), served: today(1, 23), completed: today(1, 15) }
    ];

    for (const ec of expCompleted) {
      await prisma.token.create({
        data: {
          tokenNumber: ec.num,
          sequence: parseInt(ec.num.split('-')[1]),
          customerName: ec.name,
          status: 'COMPLETED',
          position: 0,
          createdAt: ec.created,
          servedAt: ec.served,
          completedAt: ec.completed,
          servedBy: 'Sarah Jenkins',
          queueId: billQueue.id
        }
      });
    }

    // Waiting tokens in EXP
    const expWaiting = [
      { num: 'EXP-005', name: 'Benjamin Franklin', priority: 'VIP', pos: 1 },
      { num: 'EXP-006', name: 'Zoe Saldana', priority: 'NORMAL', pos: 2 },
      { num: 'EXP-007', name: 'Daniel Craig', priority: 'NORMAL', pos: 3 },
      { num: 'EXP-008', name: 'Natalia Ramos', priority: 'NORMAL', pos: 4 }
    ];

    for (const ew of expWaiting) {
      await prisma.token.create({
        data: {
          tokenNumber: ew.num,
          sequence: parseInt(ew.num.split('-')[1]),
          customerName: ew.name,
          status: 'WAITING',
          position: ew.pos,
          priority: ew.priority,
          createdAt: today(0, 18 - ew.pos * 3),
          queueId: billQueue.id
        }
      });
    }

    console.log('✅ Demo queues and tokens created!');
  } else {
    console.log(`ℹ️ User already has ${existingQueues.length} queues. Skipping initial mock queues.`);
  }

  console.log('🎉 Seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

