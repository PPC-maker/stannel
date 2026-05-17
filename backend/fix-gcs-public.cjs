/**
 * One-time script to make existing profile and supplier images public in GCS.
 * Run: node fix-gcs-public.cjs
 */
const { Storage } = require('@google-cloud/storage');

const BUCKET_NAME = process.env.GCS_ASSETS_BUCKET || 'stannel-invoices';
const PREFIXES = ['profile-images/', 'supplier-images/'];

async function main() {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_NAME);

  let total = 0;
  let made = 0;
  let errors = 0;

  for (const prefix of PREFIXES) {
    console.log(`\nProcessing ${prefix}...`);
    const [files] = await bucket.getFiles({ prefix });

    for (const file of files) {
      total++;
      try {
        await file.makePublic();
        made++;
        console.log(`  ✓ ${file.name}`);
      } catch (err) {
        errors++;
        console.error(`  ✗ ${file.name}: ${err.message}`);
      }
    }
  }

  console.log(`\nDone! ${made}/${total} files made public (${errors} errors)`);
}

main().catch(console.error);
