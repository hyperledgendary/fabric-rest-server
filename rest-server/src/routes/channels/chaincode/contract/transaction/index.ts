import * as bodyParser from 'body-parser';
import { Request, Response, Router as ExpressRouter } from 'express';
import FabricProxy from '../../../../../fabricproxy';
import { ContractMetadata, TransactionMetadata } from '../../../../../interfaces/metadata_interfaces';
import { Swagger } from '../../../../../interfaces/swagger';

export class TransactionRouter {
    public static getRoutes(fabricProxy: FabricProxy, channel: string, chaincode: string, contract: ContractMetadata): { router: ExpressRouter, swagger: Swagger } { // tslint:disable:max-line-length
        const router = ExpressRouter();

        const swagger = {
            paths: {},
        };

        for (const transaction of contract.transactions) {
            this.addSwaggerPath(swagger, transaction, [`${channel}/${chaincode}`]);

            this.addRouterPath(router, transaction, fabricProxy, channel, chaincode, contract.name);
        }

        return { router, swagger };
    }

    private static addSwaggerPath(swagger: {paths: object }, transaction: TransactionMetadata, tags: string[]) {
        const requestBody = this.processTxParameters(transaction.parameters);

        const action = {
            operationId: transaction.name,
            requestBody,
            responses: {
                200: {
                    description: 'successful operation',
                },
            },
            tags,
        };
        swagger.paths['/' + transaction.name] = {};
        swagger.paths['/' + transaction.name].post = action;
    }

    private static addRouterPath(router: ExpressRouter, transaction: TransactionMetadata, fabricProxy: FabricProxy, channel: string, chaincode: string, contract: string) {
        const jsonParser = bodyParser.json();

        router.post('/' + transaction.name, jsonParser, async (req: Request, res: Response) => {
            const args = [];

            if (transaction.parameters) {
                const missingParams = [];

                transaction.parameters.forEach((param) => {
                    if (req.body.hasOwnProperty(param.name)) {
                        const rawData = req.body[param.name];

                        if (param.schema.type && param.schema.type === 'string') {
                            args.push(rawData);
                        } else {
                            args.push(JSON.stringify(rawData));
                        }
                    } else {
                        missingParams.push(param.name);
                    }
                });

                if (missingParams.length > 0) {
                    res.status(400);
                    res.json({
                        msg: ['Bad request. Missing parameters: ' + missingParams.join(', ')],
                    });
                    return;
                }
            }

            try {
                let data;
                if (transaction.tag && transaction.tag.includes('submitTx')) {
                    data = await fabricProxy.submitTransaction(channel, chaincode, contract, transaction.name, ...args);
                } else {
                    data = await fabricProxy.evaluateTransaction(channel, chaincode, contract, transaction.name, ...args);
                }

                if (data && data.length > 0) {
                    try {
                        const response = JSON.parse(data.toString());
                        res.json(response);
                    } catch (err) {
                        if (err instanceof SyntaxError) {
                            res.send(data.toString());
                        } else {
                            throw err;
                        }
                    }
                } else {
                    res.sendStatus(204);
                }
            } catch (error) {
                const e = {
                    msg: error.message.split('\n'),
                };
                console.log(e);
                res.status(500);
                res.json(e);
            }

        });
    }

    private static processTxParameters(parameters): object {
        if (!parameters) {
            parameters = [];
        }

        const properties = {};
        parameters.forEach((p) => {
            properties[p.name] = p.schema;
        });

        const requestBody = {
            content : {
                'application/json': {
                    schema: {
                        properties,
                        type: 'object',
                    },
                },
            },
        };
        return requestBody;
    }
}
