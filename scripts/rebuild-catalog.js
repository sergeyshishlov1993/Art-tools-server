require('dotenv').config();

const { sequelize } = require('../src/db');
const { rebuildCatalogue } = require('../src/services/catalogRebuildService');

const CONFIRMATION = 'DELETE_AND_REBUILD_CATALOG';

async function main() {
    if (!process.argv.includes(`--confirm=${CONFIRMATION}`)) {
        throw new Error(`Destructive command. Run with --confirm=${CONFIRMATION}`);
    }

    console.log('Starting full catalogue rebuild...');
    const result = await rebuildCatalogue();
    console.log(JSON.stringify(result, null, 2));

    if (!result.success) process.exitCode = 1;
}

main()
    .catch(error => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        await sequelize.close();
    });
