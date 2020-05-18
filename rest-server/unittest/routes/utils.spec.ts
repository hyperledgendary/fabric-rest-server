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
import * as UtilsImport from '../../src/routes/utils';

const UtilsRewired = rewire('../../src/routes/utils');
const utils: typeof UtilsImport & typeof UtilsRewired = UtilsRewired as any;

chai.use(sinonChai);
const expect = chai.expect;

describe('Router - utils', () => {
    describe('extendPaths', () => {

        let oldExtendRefs: (pathStart: string, component: string, json: object) => void;
        let extendRefsStub: sinon.SinonStub;

        before(() => {
            oldExtendRefs = utils.__get__('extendRefs');
        });

        beforeEach(() => {
            extendRefsStub = sinon.stub();
            utils.__set__('extendRefs', extendRefsStub);
        });

        after(() => {
            utils.__set__('extendRefs', oldExtendRefs);
        });

        it ('should update the paths key to include start passed', () => {
            const swagger = utils.extendPaths('some start', {
                paths: {
                    '/another existing path': 'another special path',
                    '/existing path': 'some special path',
                },
            });

            expect(swagger).to.deep.equal({
                paths: {
                    '/some start/another existing path': 'another special path',
                    '/some start/existing path': 'some special path',
                },
            });
        });

        it ('should replace component keys with start passed and call function to update refs', () => {
            const swagger = utils.extendPaths('some start', {
                components: {
                    schemas: {
                        'another component': 'another component\'s info',
                        'some component': 'some component\'s info',
                    },
                },
                extraField: 'some extra field',
            });

            const objectMatcher = (value) => {
                return value.hasOwnProperty('components') && !value.hasOwnProperty('extraField');
            };

            expect(swagger).to.deep.equal({
                components: {
                    schemas: {
                        'some start.another component': 'another component\'s info',
                        'some start.some component': 'some component\'s info',
                    },
                },
            });

            sinon.assert.calledTwice(extendRefsStub);
            sinon.assert.calledWithExactly(extendRefsStub, 'some start', 'another component', sinon.match(objectMatcher));
            sinon.assert.calledWithExactly(extendRefsStub, 'some start', 'some component', sinon.match(objectMatcher));
        });

        it ('should handle both paths and components', () => {
            const swagger = utils.extendPaths('some start', {
                components: {
                    schemas: {
                        'another component': 'another component\'s info',
                        'some component': 'some component\'s info',
                    },
                },
                extraField: 'some extra field',
                paths: {
                    '/another existing path': 'another special path',
                    '/existing path': 'some special path',
                },
            });

            const objectMatcher = (value) => {
                return value.hasOwnProperty('paths') && value.hasOwnProperty('components') && !value.hasOwnProperty('extraField');
            };

            expect(swagger).to.deep.equal({
                components: {
                    schemas: {
                        'some start.another component': 'another component\'s info',
                        'some start.some component': 'some component\'s info',
                    },
                },
                paths: {
                    '/some start/another existing path': 'another special path',
                    '/some start/existing path': 'some special path',
                },
            });

            sinon.assert.calledTwice(extendRefsStub);
            sinon.assert.calledWithExactly(extendRefsStub, 'some start', 'another component', sinon.match(objectMatcher));
            sinon.assert.calledWithExactly(extendRefsStub, 'some start', 'some component', sinon.match(objectMatcher));
        });
    });

    describe('extendRefs', () => {
        it ('should replace a $ref that points to a component in json with the passed start included', () => {
            const sampleJson = {
                $ref: '#/components/schemas/some component',
            };

            utils.__get__('extendRefs')('some start', 'some component', sampleJson);

            expect(sampleJson).to.deep.eq({
                $ref: '#/components/schemas/some start.some component',
            });
        });

        it ('should replace nested $refs', () => {
            const sampleJson = {
                $ref: '#/components/schemas/some component',
                anotherField: {
                    $ref: '#/components/schemas/some component',
                    downAgain: {
                        $ref: '#/components/schemas/some component',
                    },
                },
            };

            utils.__get__('extendRefs')('some start', 'some component', sampleJson);

            expect(sampleJson).to.deep.eq({
                $ref: '#/components/schemas/some start.some component',
                anotherField: {
                    $ref: '#/components/schemas/some start.some component',
                    downAgain: {
                        $ref: '#/components/schemas/some start.some component',
                    },
                },
            });
        });

        it ('should leave refs to other components alone', () => {
            const sampleJson = {
                $ref: '#/components/schemas/some component',
                anotherField: {
                    $ref: '#/components/schemas/another component',
                    downAgain: {
                        $ref: '#/components/schemas/some component',
                    },
                },
            };

            utils.__get__('extendRefs')('some start', 'some component', sampleJson);

            expect(sampleJson).to.deep.eq({
                $ref: '#/components/schemas/some start.some component',
                anotherField: {
                    $ref: '#/components/schemas/another component',
                    downAgain: {
                        $ref: '#/components/schemas/some start.some component',
                    },
                },
            });
        });
    });
});
