'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

import * as chai from 'chai';
import 'mocha';
import rewire = require('rewire');
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import FabricProxy from '../../../../src/fabricproxy';
import { ChaincodeRouter as ChaincodeRouterImport } from '../../../../src/routes/channels/chaincode';
import { ContractRouter } from '../../../../src/routes/channels/chaincode/contract';
import { fakeExtendsPaths, sampleFabricProxy } from '../../../utils';

chai.use(sinonChai);
const expect = chai.expect;

const ChaincodeRouterRewired = rewire('../../../../src/routes/channels/chaincode');
const ChaincodeRouter: typeof ChaincodeRouterImport & typeof ChaincodeRouterRewired = ChaincodeRouterRewired.ChaincodeRouter as any;

describe('Chaincode', () => {
    let fabricProxy: FabricProxy;

    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('getRoutes', () => {
        it ('should build up its router and swagger using chaincodes in the channel', async () => {
            fabricProxy = sampleFabricProxy();

            const getChannelContractsStub = sandbox.stub(fabricProxy, 'getChannelContracts').returns(['some chaincode', 'another chaincode']);
            const contractRouterGetRoutesStub = sandbox.stub(ContractRouter, 'getRoutes').onFirstCall().resolves({
                router: 'some chaincode router' as any,
                swagger: 'some chaincode swagger' as any,
            }).onSecondCall().resolves({
                router: 'another chaincode router' as any,
                swagger: 'another chaincode swagger' as any,
            });

            const utils = ChaincodeRouterRewired.__get__('utils_1'); // _1 as typescript adds suffix
            const oldExtendPaths = utils.extendPaths;

            utils.extendPaths = fakeExtendsPaths;

            const useStub = sinon.stub();

            const express = ChaincodeRouterRewired.__get__('express_1');
            const oldRouter = express.Router;

            express.Router = () => {
                return {
                    special: 'router',
                    use: useStub,
                };
            };

            const {router, swagger} = await ChaincodeRouter.getRoutes(fabricProxy, 'some channel');

            sinon.assert.calledOnce(getChannelContractsStub);
            sinon.assert.calledWithExactly(getChannelContractsStub, 'some channel');

            sinon.assert.calledTwice(contractRouterGetRoutesStub);
            sinon.assert.calledWithExactly(contractRouterGetRoutesStub, fabricProxy, 'some channel', 'some chaincode');
            sinon.assert.calledWithExactly(contractRouterGetRoutesStub, fabricProxy, 'some channel', 'another chaincode');

            sinon.assert.calledTwice(useStub);
            sinon.assert.calledWithExactly(useStub, '/some chaincode', 'some chaincode router');
            sinon.assert.calledWithExactly(useStub, '/another chaincode', 'another chaincode router');

            expect(router).to.deep.eq(express.Router());
            expect(swagger).to.deep.eq({
                components: {
                    schemas: {
                        'another chaincode': 'a schema',
                        'some chaincode': 'a schema',
                    },
                },
                paths: {
                    'another chaincode': 'a path',
                    'some chaincode': 'a path',
                },
            });

            utils.extendPaths = oldExtendPaths;
            express.Router = oldRouter;
        });
    });
});
