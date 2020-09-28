import { Router as ExpressRouter } from 'express';
import FabricProxy from '../../../../fabricproxy';
import { ChaincodeMetadata, ComponentMetadata, Schema } from '../../../../interfaces/metadata_interfaces';
import { Swagger } from '../../../../interfaces/swagger';
import { extendPaths } from '../../../utils';
import { TransactionRouter } from './transaction';

export class ContractRouter {
    public static async getRoutes(fabricProxy: FabricProxy, channel: string, chaincode: string): Promise<{ router: ExpressRouter, swagger: Swagger }> { // tslint:disable:max-line-length
        const router = ExpressRouter();

        const chaincodeMetadata = await fabricProxy.getMetaData(channel, chaincode) as ChaincodeMetadata;

        const swagger = {
            components: this.processComponents(chaincodeMetadata.components),
            paths: {},
        };

        for (const contractName in chaincodeMetadata.contracts) {
            if (chaincodeMetadata.contracts.hasOwnProperty(contractName)) {
                const contract = chaincodeMetadata.contracts[contractName];

                const txRoutes = TransactionRouter.getRoutes(fabricProxy, channel, chaincode, contract);

                swagger.paths = Object.assign(swagger.paths, extendPaths(contractName, txRoutes.swagger).paths);

                router.use('/' + contractName, txRoutes.router);
            }
        }

        return { router, swagger };
    }

    private static processComponents(metadataComponents: ComponentMetadata): ComponentMetadata {
        const components = { schemas: { } };

        for (const s in metadataComponents.schemas) {
            if (metadataComponents.schemas.hasOwnProperty(s)) {
                const schema = metadataComponents.schemas[s] as Schema;
                const props = {};
                for (const [propName, propSchema] of Object.entries(schema.properties)) {
                    props[propName] = propSchema;
                }

                components.schemas[s] = metadataComponents.schemas[s];
                components.schemas[s].properties = props;
                delete components.schemas[s].$id;
            }
        }

        return components;
    }
}
