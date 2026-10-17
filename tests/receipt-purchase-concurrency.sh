#!/usr/bin/env bash
set -euo pipefail
: "${PGPASSWORD:?Run only in disposable PostgreSQL}"
CONN=(-h localhost -U postgres -d aihxo_receipt_test -v ON_ERROR_STOP=1 -At)
PURCHASE=77777777-7777-4777-8777-777777777777
ITEM=88888888-8888-4888-8888-888888888888
REQ1=99999999-9999-4999-8999-999999999991
REQ2=99999999-9999-4999-8999-999999999992
psql "${CONN[@]}" -c "INSERT INTO receipt_test.purchases(id) VALUES('$PURCHASE'); INSERT INTO receipt_test.purchase_lines(purchase_id,item_id,ordered_quantity) VALUES('$PURCHASE','$ITEM',5);"
psql "${CONN[@]}" -c "BEGIN; SELECT receipt_test.receive_purchase('$REQ1','$PURCHASE','[{\"item_id\":\"$ITEM\",\"qty\":4}]'::jsonb); SELECT pg_sleep(2); COMMIT;" >/tmp/aihxo-purchase-concurrent-first.log 2>&1 &
FIRST=$!
sleep 0.5
set +e
psql "${CONN[@]}" -c "SELECT receipt_test.receive_purchase('$REQ2','$PURCHASE','[{\"item_id\":\"$ITEM\",\"qty\":4}]'::jsonb);" >/tmp/aihxo-purchase-concurrent-second.log 2>&1
STATUS=$?
set -e
wait "$FIRST"
test "$STATUS" -ne 0
grep -q 'La recepción supera las unidades pendientes' /tmp/aihxo-purchase-concurrent-second.log
QTY=$(psql "${CONN[@]}" -c "SELECT received_quantity FROM receipt_test.purchase_lines WHERE purchase_id='$PURCHASE' AND item_id='$ITEM'")
STOCK=$(psql "${CONN[@]}" -c "SELECT quantity FROM receipt_test.stock WHERE item_id='$ITEM'")
LEDGER=$(psql "${CONN[@]}" -c "SELECT count(*) FROM receipt_test.requests WHERE request_id IN ('$REQ1','$REQ2')")
test "$QTY" = 4
test "$STOCK" = 4
test "$LEDGER" = 1
echo 'PASS: simultaneous distinct receipts cannot exceed ordered quantity'
