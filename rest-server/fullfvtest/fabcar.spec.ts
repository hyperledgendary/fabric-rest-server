'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

import * as chai from 'chai';
import 'mocha';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';

import chaiHttp = require('chai-http');

const should = chai.should();
chai.use(sinonChai);
chai.use(chaiHttp);
const expect = chai.expect;

const baseURL = 'http://localhost:3000';
// tslint:disable:no-unused-expression
describe('FabCar FV Tests', () => {

    describe('Basic operations', () => {
        it('should get back all the default cars', async () => {
            // need to make a rest call now
            // curl -X POST "http://localhost:3000/fabcarchannel/fabcarnetwork/FabCar/queryAllCars"
            //    -H  "accept: */*" -H  "Content-Type: application/json" -d "{}"
            const response = await chai.request(baseURL)
                .post('/fabcarchannel/fabcarnetwork/FabCar/queryAllCars')
                .send({});

            expect(response).to.have.status(200);
            expect(response).to.be.json;
            const body = response.body;
            body.should.deep.equal([
                {
                    Key: 'CAR0',
                    car: {
                        color: 'blue',
                        docType: 'car',
                        make: 'Toyota',
                        model: 'Prius',
                        owner: 'Tomoko',
                    },
                },
                {
                    Key: 'CAR1',
                    car: {
                        color: 'red',
                        docType: 'car',
                        make: 'Ford',
                        model: 'Mustang',
                        owner: 'Brad',
                    },
                },
                {
                    Key: 'CAR2',
                    car: {
                        color: 'green',
                        docType: 'car',
                        make: 'Hyundai',
                        model: 'Tucson',
                        owner: 'Jin Soo',
                    },
                },
                {
                    Key: 'CAR3',
                    car: {
                        color: 'yellow',
                        docType: 'car',
                        make: 'Volkswagen',
                        model: 'Passat',
                        owner: 'Max',
                    },
                },
                {
                    Key: 'CAR4',
                    car: {
                        color: 'black',
                        docType: 'car',
                        make: 'Tesla',
                        model: 'S',
                        owner: 'Adriana',
                    },
                },
                {
                    Key: 'CAR5',
                    car: {
                        color: 'purple',
                        docType: 'car',
                        make: 'Peugeot',
                        model: '205',
                        owner: 'Michel',
                    },
                },
                {
                    Key: 'CAR6',
                    car: {
                        color: 'white',
                        docType: 'car',
                        make: 'Chery',
                        model: 'S22L',
                        owner: 'Aarav',
                    },
                },
                {
                    Key: 'CAR7',
                    car: {
                        color: 'violet',
                        docType: 'car',
                        make: 'Fiat',
                        model: 'Punto',
                        owner: 'Pari',
                    },
                },
                {
                    Key: 'CAR8',
                    car: {
                        color: 'indigo',
                        docType: 'car',
                        make: 'Tata',
                        model: 'Nano',
                        owner: 'Valeria',
                    },
                },
                {
                    Key: 'CAR9',
                    car: {
                        color: 'brown',
                        docType: 'car',
                        make: 'Holden',
                        model: 'Barina',
                        owner: 'Shotaro',
                    },
                },
            ]);

        });

        it('should get a single car', async () => {
            const response = await chai.request(baseURL)
                .post('/fabcarchannel/fabcarnetwork/FabCar/queryCar')
                .send({ carNumber: 'CAR2' });
            expect(response).to.have.status(200);
            expect(response).to.be.json;
            const body = response.body;
            body.should.deep.equal({
                color: 'green',
                docType: 'car',
                make: 'Hyundai',
                model: 'Tucson',
                owner: 'Jin Soo',
            });
        });

        it('should update a single car', async () => {
            const response1 = await chai.request(baseURL)
                .post('/fabcarchannel/fabcarnetwork/FabCar/changeCarOwner')
                .send({ carNumber: 'CAR2', newOwner: 'Barny Rubble' });

            expect(response1).to.have.status(204);
            expect(response1.body).to.deep.equal({});
            const response2 = await chai.request(baseURL)
                .post('/fabcarchannel/fabcarnetwork/FabCar/queryCar')
                .send({ carNumber: 'CAR2' });

            expect(response2).to.have.status(200);
            expect(response2).to.be.json;
            const body = response2.body;
            body.should.deep.equal({
                color: 'green',
                docType: 'car',
                make: 'Hyundai',
                model: 'Tucson',
                owner: 'Barny Rubble',
            });
        });

        it('should create a single car', async () => {
            const response1 = await chai.request(baseURL)
                .post('/fabcarchannel/fabcarnetwork/FabCar/createCar')
                .send({
                    carNumber: 'CARA', color: 'grey',
                    make: 'Stone',
                    model: 'impractical', owner: 'Fred Flintsone',
                });

            expect(response1).to.have.status(204);
            expect(response1.body).to.deep.equal({});


            const response2 = await chai.request(baseURL)
                .post('/fabcarchannel/fabcarnetwork/FabCar/queryCar')
                .send({ carNumber: 'CARA' });
            expect(response2).to.have.status(200);
            expect(response2).to.be.json;
            const body = response2.body;
            body.should.deep.equal({
                color: 'grey',
                docType: 'car',
                make: 'Stone',
                model: 'impractical', owner: 'Fred Flintsone',
            });

        });

    });

});
