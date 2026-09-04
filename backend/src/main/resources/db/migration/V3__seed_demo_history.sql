-- Two historical paid orders and their audit lines, mirroring the seed data
-- that shipped with the original front-end demo (store.ts SEED_ORDERS /
-- SEED_AUDIT). These have no session_id: they predate any live session.

insert into shop_order (id, session_id, mandate_id, payment_id, buyer, total_paise, status, created_at, note)
values (
  '00000000-0000-0000-0000-000000000001', null, null, 'pay_test_seed1',
  'Hotel Surya purchasing agent', 79800, 'PAID', '2026-08-24T07:12:00+05:30',
  'Breakfast for 18 rooms. Repeated from last Thursday.'
);

insert into order_line (order_id, sku, name, qty, unit_paise, gst_pct) values
  ('00000000-0000-0000-0000-000000000001', 'POH-THK-1', 'Thick poha', 4, 9500, 5),
  ('00000000-0000-0000-0000-000000000001', 'TEA-CUT-250', 'Cutting chai blend', 2, 18000, 5);

insert into shop_order (id, session_id, mandate_id, payment_id, buyer, total_paise, status, created_at, note)
values (
  '00000000-0000-0000-0000-000000000002', null, null, 'pay_test_seed2',
  'Iyer household agent', 32550, 'PAID', '2026-08-25T11:05:00+05:30',
  'The third-of-the-month atta.'
);

insert into order_line (order_id, sku, name, qty, unit_paise, gst_pct) values
  ('00000000-0000-0000-0000-000000000002', 'ATT-LOK-5', 'Lokwan atta', 1, 31000, 5);

insert into audit_event (id, at, kind, summary, money_paise, session_id) values
  ('00000000-0000-0000-0000-0000000000a1', '2026-08-24T07:12:00+05:30', 'PAYMENT_CAPTURE',
   'Captured Rs 798 for Hotel Surya purchasing agent', 79800, null),
  ('00000000-0000-0000-0000-0000000000a2', '2026-08-25T11:05:00+05:30', 'PAYMENT_CAPTURE',
   'Captured Rs 326 for Iyer household agent', 32550, null);

insert into audit_event_detail (audit_event_id, detail_key, detail_value) values
  ('00000000-0000-0000-0000-0000000000a1', 'paymentId', 'pay_test_seed1'),
  ('00000000-0000-0000-0000-0000000000a1', 'seed', 'true'),
  ('00000000-0000-0000-0000-0000000000a2', 'paymentId', 'pay_test_seed2'),
  ('00000000-0000-0000-0000-0000000000a2', 'seed', 'true');
