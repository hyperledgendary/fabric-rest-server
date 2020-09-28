'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

import * as express from 'express';

import debug from 'debug';
import * as swaggerUi from 'swagger-ui-express';
import FabricProxy from './fabricproxy';
import { Swagger } from './interfaces/swagger';
import Config from './server.config';
const LOG = debug('contractrest:restserver');
import { Router } from './routes';

interface ParameterMetadata {
    name: string;
    schema: object;
}

interface TransactionMetadata {
    parameters: ParameterMetadata[];
    name: string;
    tag: string[];
}

interface ContractMetadata {
    name: string;
    transactions: TransactionMetadata[];
}

interface ChaincodeMetadata {
    contracts: {[s: string]: ContractMetadata};
}

export default class StarterServer {

    /** Obtain the metadata either from the contract or from the filesystem
     *
     * @return {Object} metadata object
     */
    private swagger: any;

    private app: express.Application;

    private fabricProxy: FabricProxy;
    private config: Config;

    /**
     * Start the server based on the suplied configuration
     */
    public constructor(config: Config) {
        this.config = config;
        this.swagger = {
            openapi: '3.0.0',
        } as Swagger;
    }

    public async start() {
        // establish connection to Fabric
        LOG(`Starting the FabricProxy`);
        this.fabricProxy = new FabricProxy(this.config.fabric);
        await this.fabricProxy.setup();
        await this.fabricProxy.connectToContract();

        // create express and setup basic routing
        this.app = express();
        this.app.use((req: express.Request, res: express.Response, next: () => void) => {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
            next();
        });

        const routes = await Router.getRoutes(this.fabricProxy);
        this.swagger = Object.assign(this.swagger, routes.swagger) as Swagger;

        // route to respond with the swagger json file
        this.app.get('/swagger.json', (req: express.Request, res: express.Response) => {
            res.json(this.swagger);
        });

        // // set to use the Swagger UI on the api-docs route
        this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(this.swagger));
        this.app.use(routes.router);

        this.app.listen(this.config.port, () => {
            LOG(`Server listening on port ${this.config.port}!`);
        });
    }
}
