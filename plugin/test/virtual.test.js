import test from 'node:test'
import assert from 'node:assert/strict'
import { computeColumns, computeRowHeight, computeVisibleRows } from '../src/client/virtual.js'

test('computeColumns uses the same min tile/gap rules as the wall', () => {
  assert.equal(computeColumns(0), 1)
  assert.equal(computeColumns(158), 1)
  assert.equal(computeColumns(326), 2)
  assert.equal(computeColumns(600), 3)
  assert.equal(computeColumns(600, 128), 4)
})

test('computeRowHeight keeps square tiles plus the row gap', () => {
  assert.ok(Math.abs(computeRowHeight(600, 3) - 203.33333333333334) < 1e-9)
  assert.equal(computeRowHeight(0, 3), 0)
})

test('computeVisibleRows includes overscan and clamps to total rows', () => {
  const base = { scrollTop: 0, wallTop: 100, rowHeight: 100, totalRows: 20, viewportHeight: 300 }
  assert.deepEqual(computeVisibleRows(base), { start: 0, end: 5 })
  assert.deepEqual(computeVisibleRows({ ...base, scrollTop: 500 }), { start: 2, end: 9 })
  assert.deepEqual(computeVisibleRows({ ...base, scrollTop: 5000 }), { start: 20, end: 20 })
  assert.deepEqual(computeVisibleRows({ ...base, totalRows: 0 }), { start: 0, end: 0 })
})
