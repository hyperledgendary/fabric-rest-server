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
import FabricProxy from '../../../src/fabricproxy';
import { ChannelRouter as ChannelRouterImport } from '../../../src/routes/channels';
import { ChaincodeRouter } from '../../../src/routes/channels/chaincode';
import { fakeExtendsPaths, sampleFabricProxy } from '../../utils';

chai.use(sinonChai);
const expect = chai.expect;

const ChannelRouterRewired = rewire('../../../src/routes/channels');
const ChannelRouter: typeof ChannelRouterImport & typeof ChannelRouterRewired = ChannelRouterRewired.ChannelRouter as any;

describe('Chaincode', () => {
    let fabricProxy: FabricProxy;

    let sandbox: sinon.SinonSandbox;

    beforeEach(() => {
        sandbox = sinon.createSandbox();
    });

    afterEach(() => {
        sandbox.restore();
    });

    it ('should build up its router and swagger using chaincodes in the channel', async () => {
        fabricProxy = sampleFabricProxy();

        const getChannelContractsStub = sandbox.stub(fabricProxy, 'getChannels').returns(['some channel', 'another channel']);
        const channelRouterGetRoutesStub = sandbox.stub(ChaincodeRouter, 'getRoutes').onFirstCall().resolves({
            router: 'some channel router' as any,
            swagger: 'some channel swagger' as any,
        }).onSecondCall().resolves({
            router: 'another channel router' as any,
            swagger: 'another channel swagger' as any,
        });

        const utils = ChannelRouterRewired.__get__('utils_1'); // _1 as typescript adds suffix
        const oldExtendPaths = utils.extendPaths;

        utils.extendPaths = fakeExtendsPaths;

        const useStub = sinon.stub();

        const express = ChannelRouterRewired.__get__('express_1');
        const oldRouter = express.Router;

        express.Router = () => {
            return {
                special: 'router',
                use: useStub,
            };
        };

        const {router, swagger} = await ChannelRouter.getRoutes(fabricProxy, 'some channel');

        sinon.assert.calledOnce(getChannelContractsStub);
        sinon.assert.calledWithExactly(getChannelContractsStub);

        sinon.assert.calledTwice(channelRouterGetRoutesStub);
        sinon.assert.calledWithExactly(channelRouterGetRoutesStub, fabricProxy, 'some channel');
        sinon.assert.calledWithExactly(channelRouterGetRoutesStub, fabricProxy, 'another channel');

        sinon.assert.calledTwice(useStub);
        sinon.assert.calledWithExactly(useStub, '/some channel', 'some channel router');
        sinon.assert.calledWithExactly(useStub, '/another channel', 'another channel router');

        expect(router).to.deep.eq(express.Router());
        expect(swagger).to.deep.eq({
            components: {
                schemas: {
                    'another channel': 'a schema',
                    'some channel': 'a schema',
                },
            },
            paths: {
                'another channel': 'a path',
                'some channel': 'a path',
            },
        });

        utils.extendPaths = oldExtendPaths;
        express.Router = oldRouter;
    });
});
