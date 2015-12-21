/*global sinon, suite, setup, teardown, test, DomScheduler, assert */

suite('Browser > Tabs', function() {
  'use strict';

  setup(function() {
    this.sinon = sinon.sandbox.create();
  });

  teardown(function() {
    this.sinon.restore();
  });

  test('Test', function() {
    assert.isTrue(true);
  });
});
