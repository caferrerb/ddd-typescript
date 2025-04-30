// scripts/check-changeset.js
const fs = require('fs');
const path = require('path');

const changesetDir = path.resolve(process.cwd(), '.changeset');

if (!fs.existsSync(changesetDir)) {
    console.error('❌ No .changeset/ directory found. Run: npx changeset');
    process.exit(1);
}

const files = fs.readdirSync(changesetDir).filter(f => f.endsWith('.md'));

if (files.length === 0) {
    console.error('❌ You must create a changeset before committing. Run: npx changeset');
    process.exit(1);
}

console.log('✅ Changeset found.');