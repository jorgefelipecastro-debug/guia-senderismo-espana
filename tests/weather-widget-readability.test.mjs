import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../app/weather-home-accessibility.css', import.meta.url), 'utf8');
const card = fs.readFileSync(new URL('../app/WeatherHomeCard.js', import.meta.url), 'utf8');

function rule(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] || '';
}

function pxValue(body, property) {
  const match = body.match(new RegExp(`${property}\\s*:\\s*(\\d+(?:\\.\\d+)?)px`));
  return match ? Number(match[1]) : null;
}

test('compact weather widget loads the accessibility override after base styles', () => {
  const base = card.indexOf("import './weather-home.css';");
  const accessibility = card.indexOf("import './weather-home-accessibility.css';");
  assert.ok(base >= 0);
  assert.ok(accessibility > base);
});

test('compact widget primary touch targets are at least 44px tall', () => {
  for (const selector of [
    '.weatherHomeSmall .weatherLocation',
    '.weatherHomeSmall .weatherRefresh',
    '.weatherHomeSmall .weatherHomeBottom',
    '.weatherHomeSmall .weatherHomeBottom button',
  ]) {
    const body = rule(selector);
    const height = pxValue(body, 'min-height') ?? pxValue(body, 'height');
    assert.ok(height >= 44, `${selector} should be at least 44px, got ${height}`);
  }
});

test('compact widget no longer uses 7-8px primary labels', () => {
  assert.ok(pxValue(rule('.weatherHomeSmall .weatherClock small'), 'font-size') >= 10);
  assert.ok(pxValue(rule('.weatherHomeSmall .weatherHomeReading p'), 'font-size') >= 11);
  assert.ok(pxValue(rule('.weatherHomeSmall .weatherHomeBottom small'), 'font-size') >= 10);
});
