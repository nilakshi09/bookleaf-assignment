// BookLeaf Publishing Knowledge Base and Policy Engine
export const knowledgeBase = {
  overview: `BookLeaf Publishing Overview:
- Self-publishing company operating in India and the US.
- Packages: Standard Free (no upfront publishing cost) and Bestseller Breakthrough (premium, paid tier with marketing and expanded distribution).
- Services: BookLeaf manages cover design, interior typesetting, ISBN assignment, printing, distribution, and royalty payouts.
- Facilities: In-house printing facility and central warehouse located in Delhi. Print partners: Repro India and Epitome Books.`,

  royalty: `Royalty & Payments Policy:
- Profit Split: 80/20 split where 80% of net profit per book goes to the author, and 20% to BookLeaf.
- Net Profit Calculation: MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping charges.
- Schedule: Royalties are calculated quarterly and disbursed within 45 days following the quarter's end.
- Threshold: Minimum payout threshold is Rs 1,000. Balances below Rs 1,000 automatically roll over into the next quarter.
- Payment Method: Direct bank transfer to the verified bank account linked in the author dashboard.
- Reporting: Authors can review detailed platform-wise sales breakdowns and royalty statements anytime in their dashboard.`,

  isbn: `ISBN & Metadata Policy:
- Imprint: Every book receives a unique ISBN assigned by BookLeaf, officially registered under BookLeaf's publisher imprint.
- Custom Imprints: If an author requests an ISBN under their own custom imprint, they must procure it independently.
- Priority Escalation: Any author-reported ISBN discrepancy (such as duplicates, wrong title linked, or incorrect barcode) is treated as a high-priority issue and escalated directly to the production lead.`,

  printing: `Printing & Quality Policy:
- Production Facility: In-house Delhi printing unit handles most print orders. Overflow and specialty formats are routed to Repro India or Epitome Books.
- Turnaround Time: Standard printing turnaround is 5-7 business days from print confirmation.
- Quality Defect Guarantee: For manufacturing flaws (misprints, broken binding, misaligned trimming, or color shifts), BookLeaf provides a free replacement reprint following verification. Authors may be requested to email photos of the physical defect.`,

  distribution: `Distribution & Availability Policy:
- Sales Channels: Active listings across Amazon India, Flipkart, Amazon US, Amazon UK, and the BookLeaf Online Store.
- Listing Timeline: New book listings typically go live across platforms within 7-10 business days after publication is finalized.
- Out of Stock / Unavailability: A listing showing "Currently Unavailable" on Amazon or Flipkart typically indicates a stock inventory synchronization glitch. BookLeaf triggers an inventory re-sync within 24-48 hours.`,

  production: `Book Status & Production Updates Policy:
- Workflow Stages: Manuscript Received -> Editing (if opted) -> Cover Design -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live.
- Notifications: Authors receive email notifications upon milestone completion at each stage.
- Common Delays: Typical delays occur during Cover Design (awaiting author feedback/approval) and Proofreading (author revision iterations).`,

  general: `General Inquiries & Metadata Updates Policy:
- Metadata Modifications: Minor metadata revisions (such as updating Amazon book descriptions, author bio, or category tags) can be requested through the support portal or emailed to the support desk.
- Platform Reflection: Approved metadata updates generally reflect on retail platforms within 3-5 business days.`,

  tone: `Tone & Communication Guidelines:
- Empathetic and Professional: Treat authors as creative publishing partners, not transactional tickets.
- Validate First: Acknowledge the author's frustration or concern before jumping to operational facts.
- Concrete Specifics: Reference actual numbers (copies sold, unpaid royalties, dates) and exact production stages rather than generic assurances.
- Direct Accountability: If an issue stems from BookLeaf (such as a delayed payout or sync error), own it honestly without corporate deflection.
- Clear Timelines: When an investigation is required, commit to an explicit timeframe (e.g. "within 48 hours").
- Actionable Next Steps: Always conclude every message with a clear next step for the author or the support team.`,

  examples: {
    'Royalty & Payments': `Author Query: "My book was published 4 months ago and I haven't received any royalty payout yet. What is going on?"
Expected Response Style:
Dear Author,
I completely understand your concern regarding your royalties, especially after four months of your book being live.
Royalties are calculated on a quarterly schedule and released within 45 days following the quarter close, provided earnings meet our Rs 1,000 threshold.
Next Step: I am personally pulling your latest retail sales report from Amazon and Flipkart with our finance team today, and I will share your exact earnings breakdown with you within 48 business hours.`,

    'ISBN & Metadata Issues': `Author Query: "The barcode on my paperback points to someone else's poetry collection!"
Expected Response Style:
Dear Author,
Thank you for bringing this to our attention immediately. Having an incorrect barcode on your physical paperback is an urgent issue, and I apologize for the distress this has caused.
Next Step: I have escalated this directly to our production lead as a priority defect. We are halting distribution of the affected batch and auditing the print files. I will update you by tomorrow with the corrected files and reprint schedule.`,

    'Printing & Quality': `Author Query: "The copies of my book arrived yesterday with warped covers and smudged text."
Expected Response Style:
Dear Author,
I am so sorry to hear about the condition of your books upon delivery. You poured immense effort into writing your work, and receiving copies that fail our quality standards is deeply disappointing.
BookLeaf guarantees replacement copies at zero cost for any printing or binding defects originating from our Delhi facility.
Next Step: Could you please reply with 2-3 photos showing the smudged text and warped binding? Once verified, we will arrange a fresh reprint delivered within 5-7 business days.`,

    'Distribution & Availability': `Author Query: "My book is showing Out of Stock on Amazon!"
Expected Response Style:
Dear Author,
Thank you for alerting us. Seeing your title marked as "Currently Unavailable" on Amazon is understandably frustrating when readers are looking to purchase.
This usually happens due to an automated catalog inventory synchronization lag between our central Delhi warehouse and Amazon's retail servers.
Next Step: We have triggered a manual inventory refresh with Amazon India today. Listings typically restore to active status within 24 to 48 hours.`,

    'Book Status & Production Updates': `Author Query: "My book has been stuck in typesetting for 3 weeks without any update."
Expected Response Style:
Dear Author,
Thank you for following up, and I apologize for the silence during your typesetting stage. Three weeks without visibility is understandably concerning.
Our typesetting team has completed the core layout and interior formatting is undergoing final quality proofing following our seasonal production surge.
Next Step: Your interior PDF proof is scheduled for final verification by tomorrow afternoon. You will receive the layout proof directly in your dashboard for your review by Thursday.`,

    'General Inquiry': `Author Query: "Can I update the description of my book on Amazon after it is already live?"
Expected Response Style:
Dear Author,
Yes, absolutely! You can update your book description, author bio, or keywords at any time even though your book is already live.
Platform updates are easily submitted directly through your author dashboard or by sharing the updated text with us right here in this ticket.
Next Step: If you have your revised description ready, simply paste it in a reply here. Our catalog team will push the update to Amazon and Flipkart, where it typically reflects within 3-5 business days.`,
  },
};

export const getKnowledgeForCategory = (category) => {
  let sectionKey = 'general';
  let exampleKey = 'General Inquiry';

  if (category === 'Royalty & Payments') {
    sectionKey = 'royalty';
    exampleKey = 'Royalty & Payments';
  } else if (category === 'ISBN & Metadata Issues') {
    sectionKey = 'isbn';
    exampleKey = 'ISBN & Metadata Issues';
  } else if (category === 'Printing & Quality') {
    sectionKey = 'printing';
    exampleKey = 'Printing & Quality';
  } else if (category === 'Distribution & Availability') {
    sectionKey = 'distribution';
    exampleKey = 'Distribution & Availability';
  } else if (category === 'Book Status & Production Updates') {
    sectionKey = 'production';
    exampleKey = 'Book Status & Production Updates';
  }

  const matchingSection = knowledgeBase[sectionKey] || knowledgeBase.general;
  const matchingExample = knowledgeBase.examples[exampleKey] || knowledgeBase.examples['General Inquiry'];

  return `=== COMPANY OVERVIEW ===
${knowledgeBase.overview}

=== COMMUNICATION TONE & POLICY ===
${knowledgeBase.tone}

=== CATEGORY GUIDANCE (${category}) ===
${matchingSection}

=== REFERENCE EXAMPLE RESPONSE ===
${matchingExample}`;
};

export const stageGuidance = {
  firstResponse: `STATUS IS "OPEN":
- This is the initial reply to a newly raised ticket.
- Warmly acknowledge the author's concern.
- Explain the relevant BookLeaf policy and cite specific book details (sales, royalties, ISBN, distribution platforms) if applicable.
- Clearly state what investigation or action the BookLeaf team will take and provide a definite timeline (e.g., within 24-48 business hours).`,

  followUp: `STATUS IS "IN PROGRESS":
- This ticket is actively being investigated or worked on by the BookLeaf team.
- Provide a brief progress update on what the team is doing without repeating earlier messages or restating the problem.
- State the next operational milestone and when the author will receive the next update.`,

  authorReplied: `STATUS IS "AUTHOR REPLIED":
- The author has sent a follow-up reply in this conversation.
- Directly, specifically, and empathetically address the author's latest question or clarification.
- Do not recite introductory boilerplate or repeat earlier replies.
- Give a clear, practical answer and outline immediate next steps.`,

  resolved: `STATUS IS "RESOLVED":
- The issue has been fixed and resolved at BookLeaf's end.
- You MUST explicitly include this statement or very close variation: "We have resolved the issue at our end. Please check it out and verify if everything looks good to you."
- Mention what was resolved (e.g. royalty calculation, bank details, ISBN catalog listing, reprint).
- Let the author know that if they have any further questions or if anything is still not right, they can reply directly to this ticket to reopen it at any time.`,

  closed: `STATUS IS "CLOSED":
- The ticket is officially being closed.
- You MUST explicitly include this statement or very close variation: "As you confirmed that your issue has been solved, we are closing this ticket."
- Thank the author for publishing with BookLeaf, wish them continued success, and remind them they can raise a new ticket anytime in the future if they ever need help.
- Keep it concise, warm, and final. Do not start new topics or promise future updates.`,
};

export const getStageGuidance = (ticket) => {
  if (!ticket) return stageGuidance.firstResponse;

  if (ticket.status === 'Closed') {
    return stageGuidance.closed;
  }

  if (ticket.status === 'Resolved') {
    return stageGuidance.resolved;
  }

  const replies = ticket.replies || [];
  const lastReply = replies.length > 0 ? replies[replies.length - 1] : null;

  if (lastReply && (lastReply.from === 'author' || lastReply.sentBy?.role === 'author')) {
    return stageGuidance.authorReplied;
  }

  if (ticket.status === 'In Progress' && replies.length > 0) {
    return stageGuidance.followUp;
  }

  return stageGuidance.firstResponse;
};

export default knowledgeBase;
