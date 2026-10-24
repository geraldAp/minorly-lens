import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { basename, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert/strict'

const root = fileURLToPath(new URL('../', import.meta.url))
const dist = join(root, 'dist')
const manifest = JSON.parse(readFileSync(join(dist, 'manifest.json'), 'utf8'))
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

// CHECK THE RELEASE VERSION AND EVERY FILE REFERENCED BY THE MANIFEST.
assert.equal(manifest.manifest_version, 3, 'Expected Manifest V3')
assert.equal(manifest.version, pkg.version, 'Package and extension versions must match')
assert.match(manifest.version, /^\d+(?:\.\d+){0,3}$/, 'Invalid extension version')
assert(manifest.version.split('.').every(part => Number(part) <= 65535), 'Version component too large')

function packagedFile(path) {
  assert.equal(typeof path, 'string', 'Manifest paths must be strings')
  const absolute = resolve(dist, path)
  assert(relative(dist, absolute) && !relative(dist, absolute).startsWith('..'), 'Path outside dist')
  return readFileSync(absolute)
}

packagedFile(manifest.action.default_popup)
assert(manifest.icons?.['128'], 'Missing required 128px store icon')

for (const icons of [manifest.icons, manifest.action.default_icon]) {
  assert(icons && typeof icons === 'object', 'Missing extension icons')

  for (const [size, path] of Object.entries(icons)) {
    const png = packagedFile(path)
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', 'Expected a PNG icon')
    assert.equal(png.subarray(12, 16).toString(), 'IHDR', 'Missing PNG dimensions')
    assert.equal(png.readUInt32BE(16), Number(size), 'Icon width does not match manifest')
    assert.equal(png.readUInt32BE(20), Number(size), 'Icon height does not match manifest')
  }
}

// COLLECT ONLY REGULAR BUILD FILES; REFUSE HIDDEN FILES, SOURCE MAPS AND SYMLINKS.
function filesIn(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    assert(!entry.name.startsWith('.'), `Unexpected hidden file: ${entry.name}`)
    const path = join(directory, entry.name)

    if (entry.isDirectory()) return filesIn(path)

    assert(entry.isFile(), `Unexpected non-file: ${path}`)
    assert(!entry.name.endsWith('.map'), `Source map in release: ${path}`)
    return relative(dist, path).replaceAll('\\', '/')
  }).sort()
}

const files = filesIn(dist)
const output = join(root, 'artifacts')
mkdirSync(output, { recursive: true })
const temporary = mkdtempSync(join(output, '.package-'))
const archive = join(output, `minorly-lens-${manifest.version}.zip`)

// CREATE A FRESH ZIP WITH MANIFEST.JSON AT ITS ROOT, THEN VERIFY ITS FILE LIST.
try {
  const staged = join(temporary, 'extension.zip')
  execFileSync('zip', ['-q', '-X', staged, ...files], { cwd: dist, stdio: 'inherit' })
  execFileSync('unzip', ['-tq', staged], { stdio: 'inherit' })
  const entries = execFileSync('unzip', ['-Z1', staged], { encoding: 'utf8' }).trim().split('\n').sort()
  assert.deepEqual(entries, files, 'Archive does not match the build')
  renameSync(staged, archive)

  const digest = createHash('sha256').update(readFileSync(archive)).digest('hex')
  writeFileSync(`${archive}.sha256`, `${digest}  ${basename(archive)}\n`)
  console.log(`Created ${relative(root, archive)} (${files.length} files)`)
  console.log(`SHA-256: ${digest}`)
} finally {
  rmSync(temporary, { recursive: true, force: true })
}
