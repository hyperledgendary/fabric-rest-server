'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

// tslint:disable:max-line-length no-string-literal

import * as chai from 'chai';
import { Router as ExpressRouter } from 'express';
import 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import FabricProxy from '../../../../../../src/fabricproxy';
import { ContractMetadata } from '../../../../../../src/interfaces/metadata_interfaces';
import { TransactionRouter } from '../../../../../../src/routes/channels/chaincode/contract/transaction';
import { sampleFabricProxy } from '../../../../../utils';
chai.use(sinonChai);
const expect = chai.expect;

describe('Transaction', () => {
    let fabricProxy: FabricProxy;
    const sandbox: sinon.SinonSandbox = sinon.createSandbox();

    const mockTransaction = {
        name: 'some transaction',
        parameters: [{
            name: 'some param',
            schema: {
                type: 'string',
            },
        },
        {
            name: 'another param',
            schema: {
                type: 'string',
            },
        }],
        tag: [],
    };

    const basicSwagger = {
        paths: {},
    };

    beforeEach(() => {
        fabricProxy = sampleFabricProxy();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getRoutes', () => {
        it ('should return a set of routes and swagger paths for a given contracts transactions', () => {
            const myContract = {
                name: 'some contract',
                transactions: [mockTransaction],
            } as ContractMetadata;

            const addSwaggerStub = sandbox.stub(TransactionRouter, 'addSwaggerPath' as any);
            const addRouterStub = sandbox.stub(TransactionRouter, 'addRouterPath' as any);

            const {router, swagger} = TransactionRouter.getRoutes(fabricProxy, 'some channel', 'some chaincode', myContract);

            sinon.assert.callCount(addSwaggerStub, myContract.transactions.length);
            sinon.assert.calledWithExactly(addSwaggerStub.getCall(0), basicSwagger, mockTransaction, ['some channel/some chaincode']);

            sinon.assert.callCount(addRouterStub, myContract.transactions.length);
            sinon.assert.calledWithExactly(addRouterStub.getCall(0), sinon.match.func, mockTransaction, fabricProxy, 'some channel', 'some chaincode', myContract.name);

            expect(swagger).to.deep.eq(basicSwagger);
            expect(router.prototype).to.deep.eq(ExpressRouter().prototype);
        });
    });

    describe('addSwaggerPath', () => {
        it ('should update the swagger object passed with extra paths', () => {
            const processTxParametersStub = sandbox.stub(TransactionRouter, 'processTxParameters' as any).returns({a: 'body'});

            const expectedAction = {
                operationId: mockTransaction.name,
                requestBody: {a: 'body'},
                responses: {
                    200: {
                        description: 'successful operation',
                    },
                },
                tags: ['some', 'tags'],
            };

            TransactionRouter['addSwaggerPath'](basicSwagger, mockTransaction, ['some', 'tags']);

            sinon.assert.calledOnce(processTxParametersStub);
            sinon.assert.calledWithExactly(processTxParametersStub, mockTransaction.parameters);
            expect(basicSwagger.paths['/some transaction'].post).to.deep.eq(expectedAction);
        });
    });

    describe('addRouterPath', () => {

        let router: ExpressRouter;
        let routerPostStub: sinon.SinonStub;

        const mockReq = {
            body: {
                'another param': 'another param value',
                'some param': 'some param value',
            },
        };

        let mockRes: {
            json: sinon.SinonSpy;
            send: sinon.SinonSpy;
            sendStatus: sinon.SinonSpy;
            status: sinon.SinonSpy;
        };

        beforeEach(() => {
            router = ExpressRouter();
            routerPostStub = sandbox.stub(router, 'post');

            mockRes = {
                json: sinon.spy(),
                send: sinon.spy(),
                sendStatus: sinon.spy(),
                status: sinon.spy(),
            };
        });

        it ('should call the router post function', () => {
            TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some contrachannelct', 'some chaincode', 'some contract');

            sinon.assert.calledOnce(routerPostStub);
            sinon.assert.calledWithExactly(routerPostStub, '/' + mockTransaction.name, sinon.match.func, sinon.match.func);
        });

        describe('post', () => {
            let submitTransactionStub: sinon.SinonStub;
            let evaluateTransactionStub: sinon.SinonStub;

            beforeEach(() => {
                submitTransactionStub = sandbox.stub(fabricProxy, 'submitTransaction');
                evaluateTransactionStub = sandbox.stub(fabricProxy, 'evaluateTransaction');
            });

            it ('should return error 400 when missing a parameter the transaction requires', async () => {
                const mockReq2 = {
                    body: {},
                };

                TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq2, mockRes);

                sinon.assert.notCalled(evaluateTransactionStub);
                sinon.assert.notCalled(submitTransactionStub);

                sinon.assert.notCalled(mockRes.send);
                sinon.assert.notCalled(mockRes.sendStatus);
                sinon.assert.calledOnce(mockRes.status);
                sinon.assert.calledWithExactly(mockRes.status, 400);
                sinon.assert.calledOnce(mockRes.json);
                sinon.assert.calledWithExactly(mockRes.json, {
                    msg: ['Bad request. Missing parameters: some param, another param'],
                });
            });

            it ('should return status 500 and error thrown when sending the transaction', async () => {
                evaluateTransactionStub.rejects(Error('some\nmultiline\nerror'));

                TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq, mockRes);

                sinon.assert.notCalled(mockRes.send);
                sinon.assert.notCalled(mockRes.sendStatus);
                sinon.assert.calledOnce(mockRes.status);
                sinon.assert.calledWithExactly(mockRes.status, 500);
                sinon.assert.calledOnce(mockRes.json);
                sinon.assert.calledWithExactly(mockRes.json, {
                    msg: ['some', 'multiline', 'error'],
                });
            });

            it ('should return status 500 and the error when error is thrown on data retrieval that is not a syntax error', async () => {
                evaluateTransactionStub.resolves(Buffer.from('{"some": "json"}'));
                mockRes.json = sandbox.stub().onFirstCall().throws(Error('some non syntax error'));

                TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq, mockRes);

                sinon.assert.notCalled(mockRes.send);
                sinon.assert.notCalled(mockRes.sendStatus);
                sinon.assert.calledOnce(mockRes.status);
                sinon.assert.calledTwice(mockRes.json);
                sinon.assert.calledWithExactly(mockRes.json, {
                    msg: ['some non syntax error'],
                });
            });

            it ('should send no data and a 204 status if no data returned from transaction', async () => {
                evaluateTransactionStub.resolves();

                TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq, mockRes);

                sinon.assert.notCalled(mockRes.json);
                sinon.assert.notCalled(mockRes.send);
                sinon.assert.notCalled(mockRes.status);
                sinon.assert.calledOnce(mockRes.sendStatus);
                sinon.assert.calledWithExactly(mockRes.sendStatus, 204);
            });

            it ('should send the returned data as json when it is parseable', async () => {
                evaluateTransactionStub.resolves(Buffer.from('{"some": "json"}'));

                TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq, mockRes);

                sinon.assert.calledOnce(mockRes.json);
                sinon.assert.notCalled(mockRes.send);
                sinon.assert.notCalled(mockRes.sendStatus);
                sinon.assert.notCalled(mockRes.status);
                sinon.assert.calledWithExactly(mockRes.json, {some: 'json'});
            });

            it ('should send back the returned data as not JSON when it fails parsing', async () => {
                evaluateTransactionStub.resolves(Buffer.from('Hello World'));

                TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq, mockRes);

                sinon.assert.notCalled(mockRes.json);
                sinon.assert.notCalled(mockRes.sendStatus);
                sinon.assert.notCalled(mockRes.status);
                sinon.assert.calledOnce(mockRes.send);
                sinon.assert.calledWithExactly(mockRes.send, 'Hello World');
            });

            it ('should call submitTransaction when metadata tag has submitTx', async () => {
                mockTransaction.tag = ['submitTx'];

                submitTransactionStub.resolves(Buffer.from('Hello World'));

                TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq, mockRes);

                sinon.assert.notCalled(evaluateTransactionStub);
                sinon.assert.calledOnce(submitTransactionStub);
                sinon.assert.calledWithExactly(submitTransactionStub, 'some channel', 'some chaincode', 'some contract', mockTransaction.name, mockReq.body['some param'], mockReq.body['another param']);

                sinon.assert.notCalled(mockRes.json);
                sinon.assert.notCalled(mockRes.sendStatus);
                sinon.assert.notCalled(mockRes.status);
                sinon.assert.calledOnce(mockRes.send);
                sinon.assert.calledWithExactly(mockRes.send, 'Hello World');

                mockTransaction.tag = [];
            });

            it ('should call evaluateTransaction when metadata tag is empty', async () => {
                evaluateTransactionStub.resolves(Buffer.from('Hello World'));

                TransactionRouter['addRouterPath'](router, mockTransaction, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq, mockRes);

                sinon.assert.notCalled(submitTransactionStub);
                sinon.assert.calledOnce(evaluateTransactionStub);
                sinon.assert.calledWithExactly(evaluateTransactionStub, 'some channel', 'some chaincode', 'some contract', mockTransaction.name, mockReq.body['some param'], mockReq.body['another param']);

                sinon.assert.notCalled(mockRes.json);
                sinon.assert.notCalled(mockRes.sendStatus);
                sinon.assert.notCalled(mockRes.status);
                sinon.assert.calledOnce(mockRes.send);
                sinon.assert.calledWithExactly(mockRes.send, 'Hello World');
            });

            it ('should stringify non string elements for use as args', async () => {
                const mockTransaction2 = {
                    name: 'some transaction',
                    parameters: [{
                        name: 'some json param',
                        schema: {
                            type: 'object',
                        },
                    },
                    {
                        name: 'some integer param',
                        schema: {
                            type: 'integer',
                        },
                    }],
                    tag: [],
                };

                const mockReq3 = {
                    body: {
                        'some integer param': 100,
                        'some json param': {scary: 'json object'},
                    },
                };

                evaluateTransactionStub.resolves(Buffer.from('Hello World'));

                TransactionRouter['addRouterPath'](router, mockTransaction2, fabricProxy, 'some channel', 'some chaincode', 'some contract');

                await routerPostStub.getCall(0).args[2](mockReq3, mockRes);

                sinon.assert.notCalled(submitTransactionStub);
                sinon.assert.calledOnce(evaluateTransactionStub);
                sinon.assert.calledWithExactly(evaluateTransactionStub, 'some channel', 'some chaincode', 'some contract', mockTransaction.name, '{"scary":"json object"}', '100');

                sinon.assert.notCalled(mockRes.json);
                sinon.assert.notCalled(mockRes.sendStatus);
                sinon.assert.notCalled(mockRes.status);
                sinon.assert.calledOnce(mockRes.send);
                sinon.assert.calledWithExactly(mockRes.send, 'Hello World');
            });
        });
    });

    describe('processTxParameters', () => {
        it ('should generate a request body for given set of parameters', () => {
            const mockParams = [{
                name: 'some param',
                schema: {
                    type: 'string',
                },
            },
            {
                name: 'another param',
                schema: {
                    type: 'string',
                },
            }];

            const requestBody = TransactionRouter['processTxParameters'](mockParams);

            const expectedRequestBody = {
                content: {
                    'application/json': {
                        schema: {
                            properties: {},
                            type: 'object',
                        },
                    },
                },
            };

            expectedRequestBody.content['application/json'].schema.properties['some param'] = mockParams[0].schema;
            expectedRequestBody.content['application/json'].schema.properties['another param'] = mockParams[1].schema;

            expect(requestBody).to.deep.eq(expectedRequestBody);
        });
    });
});
