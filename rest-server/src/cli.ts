'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
import debug from 'debug';
import * as yargs from 'yargs';
import Server from './server';
import Config from './server.config';

const LOG = debug('contractrest:config');

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
        // named pipe
        return val;
    }

    if (port >= 0) {
        // port number
        return port;
    }

    return false;
}

const results = yargs
    .options({
        aslocalhost: {
            default: false,
            demandOption: false,
            describe: 'Development Option ',
            type: 'boolean',
        },
        gateway: {
            alias: 'p',
            demandOption: true,
            describe: 'path to the yaml or json gateway profile',
            requiresArg: true,
            type: 'string',
        },
        identity: {
            alias: 'i',
            demandOption: true,
            describe: 'Identity of user to connect as for discovery and runtime',
        },
        localfile: {
            alias: 'f',
            default: '',
            demandOption: false,
            describe: 'read the metadata from a local file rather than contract',
        },
        outputfile: {
            alias: 'o',
            default: '',
            demandOption: false,
            describe: 'Location of the file that the metadata should be written to, will overwrite any existing file',
            requiresArg: true,
        },
        wallet: {
            alias: 'w',
            demandOption: true,
            describe: 'provide a path to wallet directory',
        },
        network: {
            alias: 'n',
            demandOption: true,
            describe: 'Network (channel) name to connect to',
        },
        contract: {
            alias: 'c',
            demandOption: true,
            describe: 'name of the contract to connect to',
        },
    })
    .help()
    .example('starter-rest-server --identity <userid> --gateway <gateway profile> ')
    .wrap(null)
    .epilogue('REST server for Smart Contracts')
    .alias('v', 'version')
    .version('pre-alpha')
    .describe('v', 'show version information')
    .env('FRS')
    .argv;

LOG(results);
// setup the config here..
let config: Config;
config = {
    fabric: {
        aslocalhost: results.aslocalhost,
        network: results.network,
        contract: results.contract,
        identityLabel: results.identity,
        walletpath: results.wallet,
        gateway: results.gateway,

    },
    localFile: results.localfile,
    outputFile: results.outputfile,
    port: normalizePort(process.env.PORT || '3000'),
};
LOG(config);
const server = new Server(config);

try {
    server.start().catch((e) => {
        LOG(e);
        throw e;
    });
} catch (error) {
    LOG(error);
    process.exit(-1);
}
