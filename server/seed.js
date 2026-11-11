import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

import User from './models/User.js';
import Book from './models/Book.js';
import Ticket from './models/Ticket.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bookleaf';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('[Seed] Connected.');

    console.log('[Seed] Purging existing collections...');
    await User.deleteMany({});
    await Book.deleteMany({});
    await Ticket.deleteMany({});

    const dataFilePath = path.join(__dirname, 'data', 'bookleaf_sample_data.json');
    const rawData = await fs.readFile(dataFilePath, 'utf-8');
    const { authors } = JSON.parse(rawData);

    // 1. Create default admin account
    const adminPasswordHash = await bcrypt.hash('admin123', 10);
    const admin = await User.create({
      name: 'BookLeaf Admin',
      email: 'admin@bookleaf.com',
      password: adminPasswordHash,
      role: 'admin',
    });
    console.log(`[Seed] Admin created: ${admin.email}`);

    // 2. Create sample authors and their books
    const authorPasswordHash = await bcrypt.hash('author123', 10);
    let totalBooksCreated = 0;

    for (const authorData of authors) {
      const user = await User.create({
        name: authorData.name,
        email: authorData.email.toLowerCase().trim(),
        password: authorPasswordHash,
        role: 'author',
        phone: authorData.phone || '',
        city: authorData.city || '',
        author_id: authorData.author_id || '',
      });

      if (Array.isArray(authorData.books) && authorData.books.length > 0) {
        const bookDocs = authorData.books.map((b) => ({
          author: user._id,
          book_id: b.book_id || '',
          title: b.title,
          isbn: b.isbn,
          genre: b.genre,
          publication_date: b.publication_date ?? null,
          status: b.status,
          mrp: b.mrp ?? null,
          author_royalty_per_copy: b.author_royalty_per_copy ?? null,
          total_copies_sold: b.total_copies_sold ?? 0,
          total_royalty_earned: b.total_royalty_earned ?? 0,
          royalty_paid: b.royalty_paid ?? 0,
          royalty_pending: b.royalty_pending ?? 0,
          last_royalty_payout_date: b.last_royalty_payout_date ?? null,
          print_partner: b.print_partner ?? null,
          available_on: Array.isArray(b.available_on) ? b.available_on : [],
        }));

        await Book.insertMany(bookDocs);
        totalBooksCreated += bookDocs.length;
      }
    }

    console.log(`[Seed] Seeded ${authors.length} authors and ${totalBooksCreated} books.`);

    // 3. Seed realistic tickets
    console.log('[Seed] Seeding sample support tickets...');
    const priya = await User.findOne({ email: 'priya.sharma@email.com' });
    const priyaBook = await Book.findOne({ author: priya._id, title: 'Whispers of the Ganges' });

    const rohit = await User.findOne({ email: 'rohit.kapoor@email.com' });
    const rohitBook = await Book.findOne({ author: rohit._id, title: 'Code & Karma' });

    const sneha = await User.findOne({ email: 'sneha.kulkarni@email.com' });
    const snehaBook = await Book.findOne({ author: sneha._id, title: 'The Algorithm of Love' });

    const vikram = await User.findOne({ email: 'vikram.joshi@email.com' });
    const vikramBook = await Book.findOne({ author: vikram._id, title: 'The Last Monsoon' });

    const kavita = await User.findOne({ email: 'kavita.deshmukh@email.com' });
    const kavitaBook = await Book.findOne({ author: kavita._id, title: 'Raising Roots' });

    const diya = await User.findOne({ email: 'diya.chatterjee@email.com' });
    const diyaBook =
      (await Book.findOne({ author: diya._id, title: "Durga's Daughters" })) ||
      (await Book.findOne({ author: diya._id }));

    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const thirtyMinsAgo = new Date(now.getTime() - 30 * 60 * 1000);

    const sampleTickets = [
      {
        author: priya._id,
        book: priyaBook?._id,
        subject: 'Missing Q3 Royalty Transfer',
        description:
          'My book was published 4 months ago and I have not received royalties for Q3. My dashboard shows 342 copies sold and Rs 3,570 pending.',
        category: 'Royalty & Payments',
        priority: 'Critical',
        status: 'Open',
        aiStatus: 'done',
        aiDraft: `Dear Priya,\n\nThank you for reaching out regarding your royalties for "Whispers of the Ganges". I completely understand how important timely payouts are, especially after achieving 342 sales.\n\nOur records confirm that you have an unpaid royalty balance of Rs 3,570, which safely exceeds our Rs 1,000 threshold. Q3 disbursements are actively in progress through our automated NEFT batch.\n\nNext Step: I am personally following up with our accounts department to verify your bank transfer reference and ensure the funds credit to your account within 48 business hours.\n\nWarm regards,\nBookLeaf Support Team`,
        assignedTo: null,
        unreadByAdmin: true,
        unreadByAuthor: false,
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
      {
        author: rohit._id,
        book: rohitBook?._id,
        subject: 'Barcode on paperback points to wrong title',
        description:
          'A reader just told me the barcode on my paperback scans as a different poetry book. This is very urgent.',
        category: 'ISBN & Metadata Issues',
        priority: 'Critical',
        status: 'In Progress',
        aiStatus: 'done',
        aiDraft: `Dear Rohit,\n\nThank you for following up on the barcode issue for "Code & Karma".\n\nOur production lead has audited the print files and identified the barcode mapping discrepancy. Corrected files have been sent to our Delhi printing facility and new stock is being verified.\n\nNext Step: We will share the verified scan confirmation report with you by tomorrow afternoon, along with the replacement schedule.\n\nWarm regards,\nBookLeaf Support Team`,
        assignedTo: admin._id,
        unreadByAdmin: false,
        unreadByAuthor: true,
        internalNotes: [
          {
            text: 'Audited file with Repro India. Cover file had inverted ISBN barcode block. Replaced with corrected PDF v2.',
            admin: admin._id,
            createdAt: oneDayAgo,
          },
        ],
        replies: [
          {
            message:
              'Dear Rohit,\n\nThank you for bringing this barcode discrepancy to our attention immediately. Having an incorrect barcode is unacceptable and we are treating this as a critical defect.\n\nI have halted distribution of the affected batch and escalated directly to our production lead for an urgent audit.\n\nWe will update you by tomorrow with the corrected files.\n\nWarm regards,\nBookLeaf Support Team',
            sentBy: admin._id,
            from: 'admin',
            createdAt: oneDayAgo,
          },
        ],
        createdAt: twoDaysAgo,
        updatedAt: oneDayAgo,
      },
      {
        author: sneha._id,
        book: snehaBook?._id,
        subject: 'Author copies arrived with warped binding and smudged ink',
        description:
          'My order of 20 author copies arrived today. Three books have broken glue on the spine and two have ink smudges on the first chapter.',
        category: 'Printing & Quality',
        priority: 'High',
        status: 'Open',
        aiStatus: 'done',
        aiDraft: `Dear Sneha,\n\nI am very sorry to hear about the damaged author copies of "The Algorithm of Love". You put tremendous effort into your work, and receiving flawed copies is deeply disappointing.\n\nBookLeaf guarantees manufacturing quality and provides free replacement reprints for any printing or trimming defects from our Delhi printing facility.\n\nNext Step: Please reply to this ticket with 2-3 photos showing the smudged pages and spine flaws under clear lighting. Once verified, we will arrange an expedited reprint within 5-7 business days at no cost to you.\n\nWarm regards,\nBookLeaf Support Team`,
        assignedTo: null,
        unreadByAdmin: true,
        unreadByAuthor: false,
        createdAt: sixHoursAgo,
        updatedAt: sixHoursAgo,
      },
      {
        author: vikram._id,
        book: vikramBook?._id,
        subject: 'Book showing Currently Unavailable on Amazon',
        description:
          'My book is published but it is showing as "Currently Unavailable" on Amazon. Why is it out of stock?',
        category: 'Distribution & Availability',
        priority: 'High',
        status: 'Open',
        aiStatus: 'done',
        aiDraft: `Dear Vikram,\n\nThank you for alerting us. Seeing "The Last Monsoon" listed as "Currently Unavailable" on Amazon India is understandably concerning when readers are eager to order.\n\nThis is almost always due to an automated inventory synchronization lag between our central warehouse and Amazon\'s retail catalog rather than a physical stock outage.\n\nNext Step: We have triggered a manual inventory refresh with Amazon India today. The listing typically restores to active ordering status within 24 to 48 hours.\n\nWarm regards,\nBookLeaf Support Team`,
        assignedTo: null,
        unreadByAdmin: true,
        unreadByAuthor: false,
        createdAt: twoHoursAgo,
        updatedAt: twoHoursAgo,
      },
      {
        author: kavita._id,
        book: kavitaBook?._id,
        subject: 'Typesetting timeline update',
        description:
          'It has been 3 weeks and my book is still in typesetting. When will it be done?',
        category: 'Book Status & Production Updates',
        priority: 'Medium',
        status: 'Open',
        aiStatus: 'done',
        aiDraft: `Dear Kavita,\n\nThank you for following up. Waiting three weeks in typesetting without an update is frustrating, and I appreciate your patience.\n\nI checked your production log for "Raising Roots": our typesetting team completed the preliminary layout, and interior formatting is undergoing final quality proofing following our seasonal production surge.\n\nNext Step: Your formatted interior PDF proof is scheduled for final quality review by tomorrow afternoon. You will receive your proof for review by Thursday end-of-day.\n\nWarm regards,\nBookLeaf Support Team`,
        assignedTo: null,
        unreadByAdmin: true,
        unreadByAuthor: false,
        createdAt: thirtyMinsAgo,
        updatedAt: thirtyMinsAgo,
      },
      {
        author: diya._id,
        book: diyaBook?._id,
        subject: 'Update book description on Amazon',
        description:
          'Can I update the description of my book on Amazon after it is already live? I have a revised blurb ready.',
        category: 'General Inquiry',
        priority: 'Low',
        status: 'Resolved',
        aiStatus: 'done',
        aiDraft: `Dear Diya,\n\nWe have resolved the issue regarding your query for "${
          diyaBook?.title || "Durga's Daughters"
        }" at our end. Please check it out and verify if everything looks good to you.\n\nIf you have any further questions or if anything is still not right, feel free to reply directly to this ticket at any time.\n\nWarm regards,\nBookLeaf Support Team`,
        assignedTo: admin._id,
        unreadByAdmin: false,
        unreadByAuthor: false,
        replies: [
          {
            message:
              'Hi Diya,\n\nYes, absolutely! You can update your book description, author bio, or keywords at any time even though your book is already live.\n\nOur catalog team has received your revised blurb and pushed the update to Amazon India and Flipkart, where it typically reflects within 3-5 business days.\n\nWe have marked this request as resolved. If you need any further modifications, feel free to reply directly to this ticket!',
            sentBy: admin._id,
            from: 'admin',
            createdAt: oneDayAgo,
          },
          {
            message:
              'Thank you so much! The updated description looks fantastic on Amazon now.',
            sentBy: diya._id,
            from: 'author',
            createdAt: twelveHoursAgo,
          },
        ],
        createdAt: twoDaysAgo,
        updatedAt: twelveHoursAgo,
      },
    ];

    await Ticket.insertMany(sampleTickets);
    console.log(`[Seed] Seeded ${sampleTickets.length} realistic sample tickets.`);
    console.log('[Seed] Database seeding completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
