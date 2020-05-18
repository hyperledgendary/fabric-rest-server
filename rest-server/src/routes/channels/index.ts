import { Router as ExpressRouter } from 'express';
import FabricProxy from '../../fabricproxy';
import { Swagger } from '../../interfaces/swagger';
import { extendPaths } from '../utils';
import { ChaincodeRouter } from './chaincode';

export class ChannelRouter {
    public static async getRoutes(fabricProxy: FabricProxy): Promise<{ router: ExpressRouter, swagger: Swagger }> {
        const router = ExpressRouter();

        const swagger = {
            components: {
                schemas: {},
            },
            paths: {},
        } as Swagger;

        for (const channel of fabricProxy.getChannels()) {
            const ccRoutes = await ChaincodeRouter.getRoutes(fabricProxy, channel);

            const extendedSwagger = extendPaths(channel, ccRoutes.swagger);
            swagger.paths = Object.assign(swagger.paths, extendedSwagger.paths);
            swagger.components.schemas = Object.assign(swagger.components.schemas, extendedSwagger.components.schemas);

            router.use('/' + channel, ccRoutes.router);
        }

        return { router, swagger };
    }
}
