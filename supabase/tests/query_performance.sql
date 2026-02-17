-- ============================================================================
-- Query Performance Testing Suite
-- ============================================================================
-- Purpose: Verify index usage and measure query performance
-- Usage: Run in Supabase SQL Editor to validate optimizations
-- ============================================================================

\echo '========================================='
\echo 'Foodie V3 Performance Testing'
\echo '========================================='
\echo ''

-- Test 1: Verify indexes exist
\echo '1. Checking index creation...'
\echo ''

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

\echo ''
\echo '---'
\echo ''

-- Test 2: Featured experiences query (should use idx_experiences_featured_status)
\echo '2. Testing featured experiences query...'
\echo 'Expected: Index Scan using idx_experiences_featured_status'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, name, slug, image_url, created_at
FROM experiences
WHERE is_featured = true AND status = 'published'
ORDER BY created_at DESC
LIMIT 16;

\echo ''
\echo '---'
\echo ''

-- Test 3: Active menus query (should use idx_menus_status_exp)
\echo '3. Testing active menus query...'
\echo 'Expected: Index Scan using idx_menus_status_exp'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, name, base_price, price_per_person
FROM menus
WHERE status = 'active'
  AND experience_id = (SELECT id FROM experiences LIMIT 1)
ORDER BY base_price ASC;

\echo ''
\echo '---'
\echo ''

-- Test 4: Booking revenue query (should use idx_bookings_status_created)
\echo '4. Testing booking revenue query...'
\echo 'Expected: Index Scan using idx_bookings_status_created'
\echo ''

EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT total_price
FROM bookings
WHERE status = 'completed'
ORDER BY created_at DESC;

\echo ''
\echo '---'
\echo ''

-- Test 5: Recent bookings query (should use idx_bookings_created_desc)
\echo '5. Testing recent bookings query...'
\echo 'Expected: Index Scan using idx_bookings_created_desc'
\echo ''

EXPLAIN (ANALYZE, BUFFERS)
SELECT id, total_price, status, date_time
FROM bookings
ORDER BY created_at DESC
LIMIT 5;

\echo ''
\echo '---'
\echo ''

-- Test 6: Menu price aggregation function
\echo '6. Testing get_experience_min_price function...'
\echo ''

SELECT 
  id,
  name,
  get_experience_min_price(id) as min_price
FROM experiences
WHERE is_featured = true
LIMIT 5;

\echo ''
\echo '---'
\echo ''

-- Test 7: Materialized view
\echo '7. Testing experience_min_prices materialized view...'
\echo ''

SELECT 
  e.id,
  e.name,
  p.min_price,
  p.active_menu_count
FROM experiences e
LEFT JOIN experience_min_prices p ON e.id = p.experience_id
WHERE e.is_featured = true
LIMIT 5;

\echo ''
\echo '---'
\echo ''

-- Test 8: Query performance comparison
\echo '8. Performance comparison (run multiple times for accuracy)...'
\echo ''

-- Baseline: Old query (no indexes)
SET enable_indexscan = OFF;
SET enable_bitmapscan = OFF;

\timing on

SELECT id, name FROM experiences 
WHERE is_featured = true AND status = 'published' 
ORDER BY created_at DESC LIMIT 16;

\timing off

\echo ''
\echo 'Now with indexes...'
\echo ''

SET enable_indexscan = ON;
SET enable_bitmapscan = ON;

\timing on

SELECT id, name FROM experiences 
WHERE is_featured = true AND status = 'published' 
ORDER BY created_at DESC LIMIT 16;

\timing off

\echo ''
\echo '========================================='
\echo 'Performance Testing Complete'
\echo '========================================='
\echo ''
\echo 'Check results above for:'
\echo '  - All indexes should show "Index Scan" not "Seq Scan"'
\echo '  - Execution time should be < 5ms for all queries'
\echo '  - Buffers shared hit >> shared read (data in cache)'
\echo ''
