IF COL_LENGTH('dbo.transport_orders', 'reservation_expires_at') IS NULL
BEGIN
    ALTER TABLE dbo.transport_orders ADD reservation_expires_at DATETIME2 NULL;
END;

EXEC('UPDATE dbo.transport_orders
SET reservation_expires_at = DATEADD(hour, 24, COALESCE(updated_at, created_at, SYSUTCDATETIME()))
WHERE status = ''DRAFT''
  AND reservation_expires_at IS NULL
  AND EXISTS (
      SELECT 1 FROM dbo.transport_order_items i
      WHERE i.transport_order_id = dbo.transport_orders.id
        AND i.reserved_quantity > 0
  )');

CREATE INDEX idx_transport_orders_draft_reservation_expiry
    ON dbo.transport_orders(status, reservation_expires_at);
