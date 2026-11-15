import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { connectSmb, parseSmbUrl } from '../src/host/network.js'

test('parseSmbUrl keeps user and share but drops credentials from the canonical URL', () => {
  const parsed = parseSmbUrl('smb://alex@192.168.12.199/yueao/trip')
  assert.equal(parsed.host, '192.168.12.199')
  assert.equal(parsed.share, 'yueao')
  assert.equal(parsed.subPath, 'trip')
  assert.equal(parsed.username, 'alex')
  assert.equal(parsed.canonicalUrl, 'smb://192.168.12.199/yueao/trip')
  assert.equal(parsed.openUrl, 'smb://alex@192.168.12.199/yueao/trip')
})

test('parseSmbUrl rejects passwords and malformed URLs', () => {
  assert.throws(() => parseSmbUrl('smb://alex:secret@192.168.12.199/yueao'), error => error.code === 'SMB_PASSWORD_IN_URL')
  assert.throws(() => parseSmbUrl('http://192.168.12.199/yueao'), error => error.code === 'BAD_SMB_URL')
  assert.throws(() => parseSmbUrl('smb://192.168.12.199'), error => error.code === 'BAD_SMB_URL')
})

test('connectSmb reuses an already mounted volume', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'pp-smb-'))
  mkdirSync(path.join(root, 'yueao'))
  let opened = false
  try {
    const result = await connectSmb({
      rawUrl: 'smb://192.168.12.199/yueao',
      platform: { openUrl: async () => { opened = true } },
      listVolumes: async () => ['yueao'],
      mountRoot: root,
      sleep: async () => {},
    })
    assert.equal(result.mountPoint, path.join(root, 'yueao'))
    assert.equal(result.sourcePath, path.join(root, 'yueao'))
    assert.equal(opened, false)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('connectSmb opens the URL and waits for a new mount', async () => {
  const root = mkdtempSync(path.join(tmpdir(), 'pp-smb-'))
  let calls = 0
  const opened = []
  try {
    const result = await connectSmb({
      rawUrl: 'smb://alex@192.168.12.199/yueao',
      platform: { openUrl: async url => { opened.push(url) } },
      listVolumes: async () => {
        calls += 1
        if (calls === 1) return []
        mkdirSync(path.join(root, 'yueao'), { recursive: true })
        return ['yueao']
      },
      mountRoot: root,
      sleep: async () => {},
      timeoutMs: 100,
      intervalMs: 10,
    })
    assert.equal(result.share, 'yueao')
    assert.deepEqual(opened, ['smb://alex@192.168.12.199/yueao'])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('connectSmb returns MOUNT_TIMEOUT when no volume appears', async () => {
  await assert.rejects(() => connectSmb({
    rawUrl: 'smb://192.168.12.199/yueao',
    platform: { openUrl: async () => {} },
    listVolumes: async () => [],
    sleep: async () => {},
    timeoutMs: 10,
    intervalMs: 5,
  }), error => error.code === 'MOUNT_TIMEOUT')
})
