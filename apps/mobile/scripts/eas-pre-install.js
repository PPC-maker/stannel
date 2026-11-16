// Runs only on the EAS build machine (eas-build-pre-install), on its temporary copy of the repo.
// The web and backend workspaces are not needed to build the mobile app, and their native
// dependencies (e.g. sharp) fail to install on the iOS build image, so they are left out of the
// throwaway copy's workspace. The repo itself is never changed.
const fs = require('fs');
const path = require('path');

if (process.env.EAS_BUILD) {
  const file = path.join(__dirname, '..', '..', '..', 'pnpm-workspace.yaml');
  if (fs.existsSync(file)) {
    fs.writeFileSync(file, 'packages:\n  - "apps/mobile"\n  - "packages/*"\n');
    console.log('[eas-pre-install] build copy workspace limited to apps/mobile and packages/*');
  }
}
