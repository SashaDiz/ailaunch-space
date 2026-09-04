import assert from 'node:assert/strict';
import { test } from 'node:test';

// Only the pure address check is exercised here. safeFetchText() itself talks to
// DNS and the network, so it belongs in an integration test, not this file.
import { isBlockedIp } from '../lib/safe-fetch.ts';

test('blocks loopback, private and link-local IPv4', () => {
  const blocked = [
    '127.0.0.1', '127.1.2.3', // loopback
    '10.0.0.1', '172.16.0.1', '172.31.255.255', '192.168.1.1', // private
    '169.254.169.254', // cloud metadata — the address this guard exists for
    '0.0.0.0', // "this network"
    '100.64.0.1', // CGNAT
    '192.0.0.1', '198.18.0.1', // protocol assignments / benchmarking
    '224.0.0.1', '255.255.255.255', // multicast / broadcast
  ];
  for (const ip of blocked) {
    assert.equal(isBlockedIp(ip), true, `${ip} should be blocked`);
  }
});

test('allows ordinary public IPv4, including near-miss ranges', () => {
  // 172.32/192.167 sit just outside the private blocks — a sloppy check
  // would swallow them and break legitimate listings.
  for (const ip of ['1.1.1.1', '8.8.8.8', '93.184.216.34', '172.32.0.1', '192.167.1.1']) {
    assert.equal(isBlockedIp(ip), false, `${ip} should be allowed`);
  }
});

test('blocks IPv6 loopback, link-local, ULA and multicast', () => {
  for (const ip of ['::', '::1', 'fe80::1', 'fc00::1', 'fd12:3456::1', 'ff02::1']) {
    assert.equal(isBlockedIp(ip), true, `${ip} should be blocked`);
  }
});

test('blocks IPv4-mapped IPv6 wrapping a blocked address', () => {
  assert.equal(isBlockedIp('::ffff:127.0.0.1'), true);
  assert.equal(isBlockedIp('::ffff:169.254.169.254'), true);
  assert.equal(isBlockedIp('::ffff:8.8.8.8'), false);
});

test('refuses anything that is not an IP literal', () => {
  // A hostname reaches this function only after DNS resolution, so a
  // non-address here means something went wrong: fail closed.
  for (const value of ['', 'localhost', 'example.com', '999.1.1.1', '1.2.3']) {
    assert.equal(isBlockedIp(value), true, `${value} should be refused`);
  }
});
