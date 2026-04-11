// Mock Notifications Data
export const mockNotifications = [
  { id: 'n1', type: 'BOOKING', title: 'Booking Approved', message: 'Your booking for Lecture Hall A1 on March 28 has been approved.', read: false, createdAt: '2026-03-27T08:00:00Z', role: 'USER' },
  { id: 'n2', type: 'TICKET', title: 'Ticket Update', message: 'Your ticket "Projector not working" has been assigned to a technician.', read: false, createdAt: '2026-03-27T07:45:00Z', role: 'USER' },
  { id: 'n3', type: 'SYSTEM', title: 'Maintenance Notice', message: 'Block B will undergo maintenance on April 1st from 6PM-10PM.', read: true, createdAt: '2026-03-26T16:00:00Z', role: 'USER' },
  { id: 'n4', type: 'BOOKING', title: 'New Booking Request', message: 'Nimali Fernando has requested the Main Auditorium on March 30.', read: false, createdAt: '2026-03-26T14:25:00Z', role: 'ADMIN' },
  { id: 'n5', type: 'TICKET', title: 'Critical Ticket Opened', message: 'AC unit leaking in Lab 01 — marked as CRITICAL priority.', read: false, createdAt: '2026-03-25T14:05:00Z', role: 'ADMIN' },
  { id: 'n6', type: 'SYSTEM', title: 'New User Registration', message: '3 new students registered today. Total users: 287.', read: true, createdAt: '2026-03-25T18:00:00Z', role: 'ADMIN' },
  { id: 'n7', type: 'TICKET', title: 'New Ticket Assigned', message: 'You have been assigned: "AC unit leaking water in Lab 01"', read: false, createdAt: '2026-03-25T14:10:00Z', role: 'TECHNICIAN' },
  { id: 'n8', type: 'TICKET', title: 'SLA Warning', message: 'Ticket "Wi-Fi issues in Block B" SLA expires in 4 hours.', read: false, createdAt: '2026-03-27T03:15:00Z', role: 'TECHNICIAN' },
  { id: 'n9', type: 'SYSTEM', title: 'Schedule Update', message: 'Your on-call shift has been updated for next week.', read: true, createdAt: '2026-03-26T09:00:00Z', role: 'TECHNICIAN' },
  { id: 'n10', type: 'BOOKING', title: 'Booking Rejected', message: 'Your booking request for Hall B2 has been rejected due to scheduling conflict.', read: true, createdAt: '2026-03-24T12:00:00Z', role: 'USER' },
  { id: 'n11', type: 'TICKET', title: 'Ticket Resolved', message: 'Your ticket "Light bulb replacement" has been resolved.', read: true, createdAt: '2026-03-23T15:00:00Z', role: 'USER' },
  { id: 'n12', type: 'TICKET', title: 'Unassigned Tickets', message: '3 tickets are currently unassigned and waiting.', read: false, createdAt: '2026-03-27T09:00:00Z', role: 'ADMIN' },
];
