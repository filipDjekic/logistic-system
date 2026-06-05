-- CREATED transport order status had no separate business meaning from DRAFT.
-- Keep historical rows readable after removing CREATED from the application enum.
UPDATE transport_orders
SET status = 'DRAFT'
WHERE status = 'CREATED';

UPDATE change_history
SET old_value = 'DRAFT'
WHERE entity_name = 'TRANSPORT_ORDER'
  AND field_name = 'status'
  AND old_value = 'CREATED';

UPDATE change_history
SET new_value = 'DRAFT'
WHERE entity_name = 'TRANSPORT_ORDER'
  AND field_name = 'status'
  AND new_value = 'CREATED';
