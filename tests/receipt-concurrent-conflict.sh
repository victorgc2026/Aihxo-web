#!/usr/bin/env bash
set -euo pipefail
: "${PGPASSWORD:?Only run against disposable PostgreSQL}"
DB=aihxo_receipt_test
CONN=(-h localhost -U postgres -d "$DB" -v ON_ERROR_STOP=1 -At)
REQ=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa
ITEM=bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb
psql "${CONN[@]}" -c "BEGIN; SELECT receipt_test.receive_once('$REQ'::uuid,'[{\"item_id\":\"$ITEM\",\"qty\":4}]'::jsonb); SELECT pg_sleep(2); COMMIT;" >/tmp/aihxo-conflict-first.log &
FIRST=$!
sleep 0.5
set +e
psql "${CONN[@]}" -c "SELECT receipt_test.receive_once('$REQ'::uuid,'[{\"item_id\":\"$ITEM\",\"qty\":9}]'::jsonb);" >/tmp/aihxo-conflict-second.log 2>&1
STATUS=$?
set -e
wait "$FIRST"
test "$STATUS" -ne 0
grep -q 'Conflicto de recepción' /tmp/aihxo-conflict-second.log
QTY=$(psql "${CONN[@]}" -c "SELECT quantity FROM receipt_test.stock WHERE item_id='$ITEM'::uuid")
test "$QTY" = 4
echo 'PASS: simultaneous conflicting request rejected; original stock preserved'
