const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = 'C:\\Users\\Esteban\\Desktop\\Skill IA';
const childRepo = path.join(rootDir, '01-Agente-Dropservice', 'dropservice-platform');
const childGitDir = path.join(childRepo, '.git');

function runSafe(cmd, cwd) {
    try {
        console.log(`Running in ${cwd || rootDir}: ${cmd}`);
        execSync(cmd, { cwd: cwd || rootDir, stdio: 'inherit' });
    } catch (e) {
        console.log(`Command failed or nothing to do: ${cmd}`);
    }
}

// 1. Delete child .git directory (Make it a Monorepo)
if (fs.existsSync(childGitDir)) {
    console.log(`Deleting nested .git directory at ${childGitDir}...`);
    fs.rmSync(childGitDir, { recursive: true, force: true });
} else {
    console.log('Nested .git directory already deleted.');
}

// 2. Clear cache of the submodule in parent repo
runSafe('git rm --cached "01-Agente-Dropservice/dropservice-platform"');
runSafe('git rm .gitmodules'); // If it existed

// 3. Set remote to the user's github repo
runSafe('git remote remove origin');
runSafe('git remote add origin https://github.com/moresteban1-dev/dropservice-platform.git');

// 4. Track all files in the root repo
runSafe('git add .');
runSafe('git commit -m "chore: migrate to monorepo strategy"');

console.log("Monorepo setup complete!");
