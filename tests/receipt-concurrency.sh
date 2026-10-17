#!/usr/bin/env bash
set -euo pipefail
: "${PGPASSWORD:?PGPASSWORD required for disposable PostgreSQL}"
DB=aihxo_receipt_test
CONN=(-h localhost -U postgres -d "$DB" -v ON_ERROR_STOP=1 -At)
REQ=88888888-8888-4888-8888-888888888888
ITEM=99999999-9999-4999-8999-999999999999
# First transaction holds the request row lock for 2 seconds after receipt.
psql "${CONN[@]}" -c "BEGIN; SELECT receipt_test.receive_once('$REQ'::uuid,'[{\"item_id\":\"$ITEM\",\"qty\":5}]'::jsonb); SELECT pg_sleep(2); COMMIT;" > /tmp/aihxo-receipt-first.log &
FIRST=$!
sleep 0.5
psql "${CONN[@]}" -c "SELECT receipt_test.receive_once('$REQ'::uuid,'[{\"item_id\":\"$ITEM\",\"qty\":5}]'::jsonb);" > /tmp/aihxo-receipt-second.log &
SECOND=$!
wait "$FIRST"
wait "$SECOND"
grep -q '"replayed": false' /tmp/aihxo-receipt-first.log
grep -q '"replayed": true' /tmp/aihxo-receipt-second.log
QTY=$(psql "${CONN[@]}" -c "SELECT quantity FROM receipt_test.stock WHERE item_id='$ITEM'::uuid")
test "$QTY" = 5
echo 'PASS: concurrent duplicate receipt serialized; stock remains 5'
