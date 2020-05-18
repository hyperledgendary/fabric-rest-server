# Starter Server

## Running the prototype

This is based on a standard Express.js application, with inbuilt Swagger UI support. It pulls down the metadata from the contract, and constructs the OpenAPI document
and a rest server based upon it. 

Change to the `starter-rest-server` direcory, `npm install` and then `npm run build && npm start`.  the start script is running.

```
node dist/cli.js --identity User1@org1.example.com --wallet ./_idwallet --connection /home/matthew/fabric-application-examples/infrastructure/basic-network/network.yaml --network mychannel --contract tradenet"
```