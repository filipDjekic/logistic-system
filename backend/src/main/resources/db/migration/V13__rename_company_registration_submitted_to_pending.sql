UPDATE company_registration_requests
SET status = 'PENDING'
WHERE status = 'SUBMITTED';

UPDATE activity_logs
SET description = REPLACE(description, 'SUBMITTED', 'PENDING')
WHERE entity_name = 'COMPANY_REGISTRATION_REQUEST'
  AND description LIKE '%SUBMITTED%';

UPDATE change_history
SET old_value = 'PENDING'
WHERE entity_name = 'COMPANY_REGISTRATION_REQUEST'
  AND field_name = 'status'
  AND old_value = 'SUBMITTED';

UPDATE change_history
SET new_value = 'PENDING'
WHERE entity_name = 'COMPANY_REGISTRATION_REQUEST'
  AND field_name = 'status'
  AND new_value = 'SUBMITTED';
