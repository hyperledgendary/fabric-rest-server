import { Router as ExpressRouter } from 'express';
import FabricProxy from '../../../fabricproxy';
import { Swagger } from '../../../interfaces/swagger';
import { extendPaths } from '../../utils';
import { ContractRouter } from './contract';

export class ChaincodeRouter {
    public static async getRoutes(fabricProxy: FabricProxy, channel: string): Promise<{ router: ExpressRouter, swagger: Swagger }> {
        const router = ExpressRouter();

        const swagger = {
            components: {
                schemas: {},
            },
            paths: {},
        } as Swagger;

        for (const contract of fabricProxy.getChannelContracts(channel)) {
            const contractRoutes = await ContractRouter.getRoutes(fabricProxy, channel, contract);

            const extendedSwagger = extendPaths(contract, contractRoutes.swagger);
            swagger.paths = Object.assign(swagger.paths, extendedSwagger.paths);
            swagger.components.schemas = Object.assign(swagger.components.schemas, extendedSwagger.components.schemas);

            router.use('/' + contract, contractRoutes.router);
        }

        return { router, swagger };
    }
}
