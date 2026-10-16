// Run with: node tests/check-projects.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const projects = [...html.matchAll(/class="project-trigger"[^>]*data-project="([^"]+)"/g)].map((match) => match[1]);
assert.equal(projects.length, 6, 'All six project cards need a modal target');
assert.equal(new Set(projects).size, projects.length, 'Project targets must be unique');
assert(!html.includes('<details'), 'Cards must not expand inline');
assert(html.includes('aria-labelledby="dialog-title"'), 'Modal needs an accessible title');
for (const project of projects) {
  const template = html.match(new RegExp(`<template id="project-${project}">([\\s\\S]*?)</template>`));
  assert(template, `Missing details for ${project}`);
  assert((template[1].match(/class="dialog-section"/g) || []).length >= 4,
    `Incomplete case study: ${project}`);
}
const links = [...html.matchAll(/class="project-service" href="([^"]+)" target="_blank" rel="([^"]+)"/g)];
assert.deepEqual(links.map((match) => match[1]), [
  'https://boroa.co.kr/', 'http://yeongwol-gohyangmill.co.kr/', 'http://eroom-studio.co.kr/'
], 'Only user-confirmed service URLs should be published');
for (const link of links) assert(link[2].includes('noopener'), 'External links need safe tab isolation');
assert(html.includes('프로젝트 중단'));
assert(html.includes('서비스 준비 중'));
console.log('PASS: six complete modal targets, accessible title, no inline expansion, confirmed service links and project statuses.');

const careers = [...html.matchAll(/class="career-trigger"[^>]*data-project="([^"]+)"/g)].map(match => match[1]);
assert.equal(careers.length, 8, 'Keep all company and freelance career entries');
for (const id of careers) assert(html.includes('<template id="project-' + id + '">'), 'Missing career detail: ' + id);
for (const name of ['ALUMAX', 'CNTPLUS', 'BirthdayPaper', '마곡산업단지', 'AWC', '소방안전', '예탁결제원', '중부대학교', 'S-OIL']) {
  assert(html.includes(name), 'Missing historical project: ' + name);
}
assert(!html.includes('id="research"'), 'Remove the research notes section');
assert(html.includes('DEVOPS ENGINEER') && !html.includes('Full-stack Developer'), 'Introduce the owner as a DevOps engineer');
console.log('PASS: eight career histories, legacy project details preserved; research notes removed.');

const archive = [...html.matchAll(/class="archive-trigger"[^>]*data-project="([^"]+)"/g)].map(match => match[1]);
assert.equal(archive.length, 16, 'Retain the researched project archive');
for (const id of archive) assert(html.includes('<template id="project-' + id + '">'), 'Missing archive detail: ' + id);
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(new Set(ids).size, ids.length, 'All dialog templates need unique IDs');
assert(!/class="(?:project-prompt|career-prompt|career-guide|contact-arrow)"/.test(html), 'Remove redundant navigation hints');
assert(!/[↗↓↑→]/.test(html), 'Remove decorative arrows');
assert(!/raw\.githubusercontent|[?&]token=|DATABASE PW|SFTP PW/i.test(html), 'Never copy repository credentials or authenticated download URLs');
assert(html.includes('class="code-sky" aria-hidden="true"'), 'Keep decorative sky code out of the accessibility tree');
console.log('PASS: 16 archive projects, unique templates, no navigation hints/arrows or credential references, decorative sky.');

assert.deepEqual(projects.slice(0, 2), ['doogo', 'eroom'], 'Lead with equally sized DOOGO and EROOM cards');
assert(!html.includes('citrine-crop-f70.notion.site'), 'Remove the previous research notes links');

assert(!html.includes('데브브릿지'), 'Present current work as freelance activity');
assert(html.includes('project-career-independent') && html.includes('2025 — 현재'), 'Keep the current freelance timeline');
assert(html.includes('서비스 전 과정 단독 구축 및 운영'), 'Describe EROOM sole ownership');
assert(html.includes('배포 / 서버 관리 / 유지보수 · 현재 진행 중'), 'Preserve the current EROOM operations role');

assert.equal((html.match(/class="city-building"/g) || []).length, 30, 'Animate skyline blocks individually');
assert(html.includes('skyline-far') && html.includes('skyline-near'), 'Keep both original skyline silhouettes');

assert(html.includes('class="signal-field" aria-hidden="true"'), 'Keep the ambient routes decorative');
assert.equal((html.match(/id="ambient-route-/g) || []).length, 7, 'Retain seven irregular ambient routes');

const css = fs.readFileSync(path.join(__dirname, '../assets/css/style.css'), 'utf8');
const buildingDuration = Number(css.match(/--building-duration: (\d+)ms/)[1]);
const introStart = Number(css.match(/--skyline-complete: (\d+)ms/)[1]);
const lastBuildingStart = Math.max(...[...html.matchAll(/--build-delay:(\d+)ms/g)].map(match => Number(match[1])));
assert.equal(introStart, lastBuildingStart + buildingDuration, 'Track the exact skyline completion time');
assert(css.includes('--introduction-start: 1260ms'), 'Start introduction at 1.26 seconds');
assert(css.includes('--introduction-duration: 2000ms'), 'Finish introduction at 3.26 seconds');
assert(html.includes('class="underground-code"'), 'Keep code flowing through the underground background');
assert(html.includes('class="underground-structure"'), 'Preserve the subterranean background');

const navigation = html.match(/<nav aria-label="주요 메뉴">([\s\S]*?)<\/nav>/);
assert(navigation, 'Keep the main navigation');
assert.deepEqual([...navigation[1].matchAll(/href="#([^"]+)"/g)].map(match => match[1]), ['home','work','archive','career','about','contact'], 'Expose every main section in the topbar');
