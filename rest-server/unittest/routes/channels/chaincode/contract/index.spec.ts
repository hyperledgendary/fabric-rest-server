'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

// tslint:disable:max-line-length no-string-literal

import * as chai from 'chai';
import 'mocha';
import rewire = require('rewire');
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import FabricProxy from '../../../../../src/fabricproxy';
import { ContractRouter as ContractRouterImport } from '../../../../../src/routes/channels/chaincode/contract';
import { TransactionRouter } from '../../../../../src/routes/channels/chaincode/contract/transaction';
import { fakeExtendsPaths, sampleFabricProxy } from '../../../../utils';

chai.use(sinonChai);
const expect = chai.expect;

const ContractRouterRewired = rewire('../../../../../src/routes/channels/chaincode/contract');
const ContractRouter: typeof ContractRouterImport & typeof ContractRouterRewired = ContractRouterRewired.ContractRouter as any;

describe('Contract', () => {
    let fabricProxy: FabricProxy;

    const sampleChaincodeMetadata = {
        components: {
            schemas: {
                Duck: {
                    $id: 'Duck',
                    additionalProperties: false,
                    properties: [
                        {
                            name: 'id',
                            schema: {
                                type: 'string',
                            },
                        },
                        {
                            name: 'name',
                            schema: {
                                type: 'string',
                            },
                        },
                    ],
                    type: 'object',
                },
                Flock: {
                    $id: 'Flock',
                    additionalProperties: false,
                    properties: [
                        {
                            name: 'id',
                            schema: {
                                type: 'string',
                            },
                        },
                        {
                            name: 'consistsOf',
                            schema: {
                                items: {
                                    $ref: '#/components/schemas/Duck',
                                },
                                type: 'array',
                            },
                        },
                    ],
                    type: 'object',
                },
            },
        },
        contracts: {
            TestContract: {
                contractInstance: {
                    default: true,
                    name: 'TestContract',
                },
                info: {
                    title: 'TestContract',
                    version: '1.0.0',
                },
                name: 'TestContract',
                transactions: [
                    {
                        name: 'createDuck',
                        parameters: [
                            {
                                description: '',
                                name: 'id',
                                schema: {
                                    type: 'string',
                                },
                            },
                            {
                                description: '',
                                name: 'name',
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        tag: [
                            'submitTx',
                        ],
                    },
                    {
                        name: 'getDuck',
                        parameters: [
                            {
                                description: '',
                                name: 'id',
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        returns: [
                            {
                                name: 'success',
                                schema: {
                                    $ref: '#/components/schemas/Duck',
                                },
                            },
                        ],
                        tag: [],
                    },
                    {
                        name: 'getDucks',
                        parameters: [
                            {
                                description: '',
                                name: 'ids',
                                schema: {
                                    items: {
                                        $ref: '#/components/schemas/Duck',
                                    },
                                    type: 'array',
                                },
                            },
                        ],
                        returns: [
                            {
                                name: 'success',
                                schema: {
                                    items: {
                                        $ref: '#/components/schemas/Duck',
                                    },
                                    type: 'array',
                                },
                            },
                        ],
                        tag: [],
                    },
                    {
                        name: 'createFlock',
                        parameters: [
                            {
                                description: '',
                                name: 'id',
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        tag: [
                            'submitTx',
                        ],
                    },
                    {
                        name: 'getFlock',
                        parameters: [
                            {
                                description: '',
                                name: 'id',
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        returns: [
                            {
                                name: 'success',
                                schema: {
                                    $ref: '#/components/schemas/Flock',
                                },
                            },
                        ],
                        tag: [],
                    },
                    {
                        name: 'addToFlock',
                        parameters: [
                            {
                                description: '',
                                name: 'flockId',
                                schema: {
                                    type: 'string',
                                },
                            },
                            {
                                description: '',
                                name: 'duckId',
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        returns: [
                            {
                                name: 'success',
                                schema: {
                                    type: 'string',
                                },
                            },
                        ],
                        tag: [
                            'submitTx',
                        ],
                    },
                ],
            },
            'org.hyperledger.fabric': {
                contractInstance: {
                    name: 'org.hyperledger.fabric',
                },
                info: {
                    title: 'org.hyperledger.fabric',
                    version: '1.0.0',
                },
                name: 'org.hyperledger.fabric',
                transactions: [
                    {
                        name: 'GetMetadata',
                    },
                ],
            },
        },
        info: {
            title: 'ts_chaincode',
            version: '0.0.3',
        },
    };

    const sampleSwaggerComponent = {
        schemas: {
            Duck: {
                additionalProperties: false,
                properties: {
                    id: {
                        type: 'string',
                    },
                    name: {
                        type: 'string',
                    },
                },
                type: 'object',
            },
            Flock: {
                additionalProperties: false,
                properties: {
                    consistsOf: {
                        items: {
                            $ref: '#/components/schemas/Duck',
                        },
                        type: 'array',
                    },
                    id: {
                        type: 'string',
                    },
                },
                type: 'object',
            },
        },
    };

    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getRoutes', () => {
        it('should build up its router and swagger using contracts in the chaincode', async () => {
            fabricProxy = sampleFabricProxy();

            sandbox.stub(fabricProxy, 'getMetaData').resolves(sampleChaincodeMetadata);

            const processComponentsStub = sandbox.stub(ContractRouter, 'processComponents' as any).returns(sampleSwaggerComponent);
            const transactionRouterGetRoutesStub = sandbox.stub(TransactionRouter, 'getRoutes').onFirstCall().returns({
                router: 'some TestContract router' as any,
                swagger: 'some TestContract swagger' as any,
            }).onSecondCall().returns({
                router: 'some org.hyperledger.fabric router' as any,
                swagger: 'some org.hyperledger.fabric swagger' as any,
            });

            const utils = ContractRouterRewired.__get__('utils_1'); // _1 as typescript adds suffix
            const oldExtendPaths = utils.extendPaths;

            utils.extendPaths = fakeExtendsPaths;

            const useStub = sinon.stub();

            const express = ContractRouterRewired.__get__('express_1');
            const oldRouter = express.Router;

            express.Router = () => {
                return {
                    special: 'router',
                    use: useStub,
                };
            };

            const {router, swagger} = await ContractRouter.getRoutes(fabricProxy, 'some channel', 'some chaincode');

            sinon.assert.calledOnce(processComponentsStub);
            sinon.assert.calledWithExactly(processComponentsStub, sampleChaincodeMetadata.components);

            sinon.assert.calledTwice(transactionRouterGetRoutesStub);
            sinon.assert.calledWithExactly(transactionRouterGetRoutesStub, fabricProxy, 'some channel', 'some chaincode', sampleChaincodeMetadata.contracts.TestContract);
            sinon.assert.calledWithExactly(transactionRouterGetRoutesStub, fabricProxy, 'some channel', 'some chaincode', sampleChaincodeMetadata.contracts['org.hyperledger.fabric']);

            sinon.assert.calledTwice(useStub);
            sinon.assert.calledWithExactly(useStub, '/TestContract', 'some TestContract router');
            sinon.assert.calledWithExactly(useStub, '/org.hyperledger.fabric', 'some org.hyperledger.fabric router');

            expect(router).to.deep.eq(express.Router());
            expect(swagger).to.deep.eq({
                components: sampleSwaggerComponent,
                paths: {
                    TestContract: 'a path',
                    'org.hyperledger.fabric': 'a path',
                },
            });

            utils.extendPaths = oldExtendPaths;
            express.Router = oldRouter;
        });
    });

    describe('processComponents', () => {

        it ('should format passed components into the swagger format, making the array and object', () => {
            expect(ContractRouter['processComponents'](sampleChaincodeMetadata.components)).to.deep.eq(sampleSwaggerComponent);
        });
    });
});
