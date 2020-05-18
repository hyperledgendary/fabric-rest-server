import * as sinon from 'sinon';
import FabricProxy from '../src/fabricproxy';
import { Swagger } from '../src/interfaces/swagger';

export function sampleFabricProxy(): FabricProxy {
    return new FabricProxy({aslocalhost: null, walletpath: '.', identityLabel: null, yamlCP: null});
}

export function fakeExtendsPaths(someValue): Swagger {
    const returnObj = { paths: {}, components: { schemas: {}} };
    returnObj.paths[someValue] = 'a path';
    returnObj.components.schemas[someValue] = 'a schema';

    return returnObj;
}
