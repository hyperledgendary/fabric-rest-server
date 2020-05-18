'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

import { Wallets, Gateway, Wallet, Network, Contract } from 'fabric-network';
import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import FabricConfig from './fabricproxy.config';

import debug from 'debug';
const LOG = debug('contractrest:fabricproxy');


export default class FabricProxy {

    public wallet: Wallet;
    public config: FabricConfig;

    private connectionProfile: any;

    private gateway: Gateway | undefined;
    private network: Network | undefined;
    private contract: Contract | undefined;

    constructor(config: FabricConfig) {
        this.config = config;
    }

    public async setup() {
        this.wallet = await Wallets.newFileSystemWallet(this.config.walletpath);
        // load the profile from either json or yaml
        this.readGatewayProfile();
    }

    public getChannels(): string[] {
        return [this.config.network];
    }

    public getChannelContracts(name: string): string[] {
        return [this.config.contract];
    }

    public async connectToContract() {

        // A gateway defines the peers used to access Fabric networks
        this.gateway = new Gateway();

        // Main try/catch block
        try {

            // define the identity to use
            const identityLabel = this.config.identityLabel;

            LOG(`Read the connection profile`);
            // Set connection options; use 'admin' identity from application wallet
            const connectionOptions = {
                discovery: { enabled: true, asLocalhost: this.config.aslocalhost },
                identity: identityLabel,
                wallet: this.wallet,
            };

            LOG('Connecting to Gateway');
            // Connect to gateway using application specified parameters
            await this.gateway.connect(this.connectionProfile, connectionOptions);
            this.network = await this.gateway.getNetwork(this.config.network);
            this.contract = await this.network.getContract(this.config.contract);

        } catch (error) {
            LOG(`Error processing connection. ${error}`);
            LOG(error.stack);
            throw error;
        }
    }

    public async getMetaData(channelName: string, contractName: string): Promise<object> {
        try {
            const response = await this.evaluateTransaction(channelName, contractName, 'org.hyperledger.fabric', 'GetMetadata');

            return JSON.parse(response.toString());
        } catch (error) {
            LOG(`Error getting metadata. ${error}`);
            LOG(error.stack);
            throw error;
        }
    }

    public async evaluateTransaction(channelName: string, contractName: string, namespace: string, functionName: string, ...args: string[]): Promise<Buffer> {
        try {
            return await this.contract.evaluateTransaction(`${namespace}:${functionName}`, ...args);
        } catch (error) {
            LOG(`Error evaluating transaction. ${error}`);
            LOG(error.stack);
            throw error;
        }
    }

    public async submitTransaction(channelName: string, contractName: string, namespace: string, functionName: string, ...args: string[]): Promise<Buffer> {
        try {
            return await this.contract.submitTransaction(`${namespace}:${functionName}`, ...args);
        } catch (error) {
            LOG(`Error submitting transaction. ${error}`);
            LOG(error.stack);
            throw error;
        }
    }

    private readGatewayProfile() {
        LOG('Parsing connection profile');
        try {
            let filename = path.resolve(this.config.gateway);
            if (!fs.existsSync(filename)){
                throw new Error(`Gateway profile does not exist ${this.config.gateway}`);
            }

            let jsonRegex = /jso?n/i;
            let yamlRegex = /ya?ml/i;
            let extension = path.extname(filename);
            if (jsonRegex.test(extension)){
                this.connectionProfile = JSON.parse(fs.readFileSync(filename,'utf8'));
            } else if (yamlRegex.test(extension)){
                this.connectionProfile = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
            } else {
                throw new Error (`Unclear what format the gateway profile is in ${filename}`)
            }

        } catch (error) {
            LOG(`Error parsing connection profile. ${error}`);
            LOG(error.stack);
            throw error;
        }
    }





}
