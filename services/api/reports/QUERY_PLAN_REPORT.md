# Query Plan Audit

## Users list
```
Limit  (cost=8.17..8.18 rows=1 width=40) (actual time=0.069..0.070 rows=6 loops=1)
  Buffers: shared hit=5
  ->  Sort  (cost=8.17..8.18 rows=1 width=40) (actual time=0.068..0.069 rows=6 loops=1)
        Sort Key: "createdAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=5
        ->  Index Scan using "users_tenantId_username_key" on users  (cost=0.14..8.16 rows=1 width=40) (actual time=0.016..0.019 rows=6 loops=1)
              Index Cond: ("tenantId" = '2b309bea-2b02-466d-b00c-2fbaa7a42960'::text)
              Filter: ("deletedAt" IS NULL)
              Buffers: shared hit=2
Planning:
  Buffers: shared hit=210
Planning Time: 0.989 ms
Execution Time: 0.650 ms
```

## Courses list
```
Limit  (cost=8.17..8.18 rows=1 width=40) (actual time=0.040..0.041 rows=4 loops=1)
  Buffers: shared hit=2
  ->  Sort  (cost=8.17..8.18 rows=1 width=40) (actual time=0.039..0.039 rows=4 loops=1)
        Sort Key: "createdAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=2
        ->  Index Scan using "courses_tenantId_code_key" on courses  (cost=0.14..8.16 rows=1 width=40) (actual time=0.022..0.025 rows=4 loops=1)
              Index Cond: ("tenantId" = '2b309bea-2b02-466d-b00c-2fbaa7a42960'::text)
              Filter: ("deletedAt" IS NULL)
              Buffers: shared hit=2
Planning Time: 0.115 ms
Execution Time: 0.080 ms
```

## Groups list
```
Limit  (cost=8.17..8.18 rows=1 width=40) (actual time=0.030..0.031 rows=3 loops=1)
  Buffers: shared hit=2
  ->  Sort  (cost=8.17..8.18 rows=1 width=40) (actual time=0.029..0.030 rows=3 loops=1)
        Sort Key: "createdAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=2
        ->  Index Scan using "groups_tenantId_groupKey_key" on groups  (cost=0.14..8.16 rows=1 width=40) (actual time=0.018..0.020 rows=3 loops=1)
              Index Cond: ("tenantId" = '2b309bea-2b02-466d-b00c-2fbaa7a42960'::text)
              Filter: ("deletedAt" IS NULL)
              Buffers: shared hit=2
Planning Time: 0.083 ms
Execution Time: 0.053 ms
```

## Group detail
```
Index Scan using "groups_tenantId_groupKey_key" on groups  (cost=0.14..8.16 rows=1 width=753) (actual time=0.015..0.016 rows=1 loops=1)
  Index Cond: ("tenantId" = '2b309bea-2b02-466d-b00c-2fbaa7a42960'::text)
  Filter: (("deletedAt" IS NULL) AND (id = '192c5f42-4ef2-4288-935f-fa1bf3bf51c5'::text))
  Rows Removed by Filter: 2
  Buffers: shared hit=2
Planning Time: 0.052 ms
Execution Time: 0.031 ms
```

## Course enrollments
```
Limit  (cost=8.18..8.18 rows=1 width=40) (actual time=0.683..0.684 rows=0 loops=1)
  Buffers: shared read=1
  ->  Sort  (cost=8.18..8.18 rows=1 width=40) (actual time=0.682..0.683 rows=0 loops=1)
        Sort Key: "updatedAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared read=1
        ->  Index Scan using "enrollments_tenantId_courseId_status_idx" on enrollments  (cost=0.15..8.17 rows=1 width=40) (actual time=0.675..0.676 rows=0 loops=1)
              Index Cond: (("tenantId" = '2b309bea-2b02-466d-b00c-2fbaa7a42960'::text) AND ("courseId" = 'ae25b5aa-6b9c-4b63-bc3c-12d078daaf30'::text))
              Buffers: shared read=1
Planning:
  Buffers: shared hit=141
Planning Time: 0.675 ms
Execution Time: 0.707 ms
```

## Learning paths list
```
Limit  (cost=8.17..8.18 rows=1 width=40) (actual time=0.017..0.018 rows=1 loops=1)
  Buffers: shared hit=2
  ->  Sort  (cost=8.17..8.18 rows=1 width=40) (actual time=0.016..0.017 rows=1 loops=1)
        Sort Key: "createdAt" DESC
        Sort Method: quicksort  Memory: 25kB
        Buffers: shared hit=2
        ->  Index Scan using "learning_paths_tenantId_code_key" on learning_paths  (cost=0.14..8.16 rows=1 width=40) (actual time=0.009..0.009 rows=1 loops=1)
              Index Cond: ("tenantId" = '2b309bea-2b02-466d-b00c-2fbaa7a42960'::text)
              Buffers: shared hit=2
Planning:
  Buffers: shared hit=124
Planning Time: 0.657 ms
Execution Time: 0.038 ms
```

## Index Summary (tenantId presence)
- users: YES
- courses: YES
- groups: YES
- enrollments: YES
- learning_paths: YES