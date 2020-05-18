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
import FabricProxy from '../../src/fabricproxy';
import { Router as RouterImport } from '../../src/routes';
import { ChannelRouter } from '../../src/routes/channels';
import { sampleFabricProxy } from '../utils';

const RouterRewired = rewire('../../src/routes');
const Router: typeof RouterImport & typeof RouterRewired = RouterRewired.Router as any;

chai.use(sinonChai);
const expect = chai.expect;

describe('Router', () => {
    describe('getRoutes', () => {
        let fabricProxy: FabricProxy;

        let sandbox: sinon.SinonSandbox;

        beforeEach(() => {
            sandbox = sinon.createSandbox();
        });

        afterEach(() => {
            sandbox.restore();
        });

        it ('should build up its router and swagger using channel', async () => {
            fabricProxy = sampleFabricProxy();

            const channelRouterGetRoutesStub = sandbox.stub(ChannelRouter, 'getRoutes').resolves({
                router: 'some channel router' as any,
                swagger: 'some channel swagger' as any,
            });

            const useStub = sinon.stub();

            const express = RouterRewired.__get__('express_1');
            const oldRouter = express.Router;

            express.Router = () => {
                return {
                    special: 'router',
                    use: useStub,
                };
            };

            const { router, swagger } = await Router.getRoutes(fabricProxy);

            sinon.assert.calledOnce(channelRouterGetRoutesStub);
            sinon.assert.calledWithExactly(channelRouterGetRoutesStub, fabricProxy);

            sinon.assert.calledOnce(useStub);
            sinon.assert.calledWithExactly(useStub, 'some channel router');

            expect(router).to.deep.eq(express.Router());
            expect(swagger).to.deep.eq('some channel swagger');

            express.Router = oldRouter;
        });
    });
});
