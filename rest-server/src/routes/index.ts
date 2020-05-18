import { Router as ExpressRouter } from 'express';
import FabricProxy from '../fabricproxy';
import { Swagger } from '../interfaces/swagger';
import { ChannelRouter } from './channels';

export class Router {
    public static async getRoutes(fabricProxy: FabricProxy): Promise<{ router: ExpressRouter, swagger: Swagger }> {
        const router = ExpressRouter();

        const channelRoutes = await ChannelRouter.getRoutes(fabricProxy);

        router.use(channelRoutes.router);

        return { router, swagger: channelRoutes.swagger };
    }
}
