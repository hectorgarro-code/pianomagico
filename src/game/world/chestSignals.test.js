import test from 'node:test';
import assert from 'node:assert/strict';
import { createLessonBadge } from './chestSignals.js';

test('lesson badges fit the title, remain translucent and expand only nearby', () => {
  const fills = [], text = [];
  const context = {
    measureText: value => ({ width: value.length * 19 }),
    beginPath() {}, roundRect() {}, stroke() {},
    fill() { fills.push(this.fillStyle); },
    fillText(value) { text.push(value); },
  };
  const original = globalThis.document;
  globalThis.document = { createElement: () => ({ width: 0, height: 0, getContext: () => context }) };
  let badge;
  try {
    badge = createLessonBadge({ song: { title: 'Bajando la Escalera', sequence: ['C4', 'D4'] } });
    badge.update('COMPLETED', false);
    const compactHeight = badge.sprite.scale.y;
    assert.equal(badge.sprite.scale.x, 3);
    assert.ok(compactHeight < .5);
    assert.equal(fills[0], 'rgba(12,34,39,.32)');
    assert.ok(text.some(value => value.includes('Bajando la Escalera')));
    badge.update('AVAILABLE', true);
    assert.ok(badge.sprite.scale.y > compactHeight);
    assert.ok(text.includes('E - Abrir'));
    const count = fills.length;
    badge.update('AVAILABLE', true);
    assert.equal(fills.length, count);
    assert.equal(badge.sprite.material.depthWrite, false);
  } finally {
    badge?.dispose();
    if (original === undefined) delete globalThis.document;
    else globalThis.document = original;
  }
});

test('secret rewards and objects without lessons do not create title badges', () => {
  assert.equal(createLessonBadge({}), null);
  assert.equal(createLessonBadge({ type: 'SECRET_REWARD', song: {} }), null);
});
