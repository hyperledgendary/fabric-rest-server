# Fabric REST Server

How to [start using the Starter Server](./starter-rest-server/index.md)


# Use cases
Three use-cases identified

- Starter Server
    - Hackathons, quick rest server up and working
    - Something simple, perhaps with basic authentication, eg based on token given on server startup that needs supplying on all REST requests
    - Will connect to running network, or using static metadata create REST API
    - Swagger UI
    - Access to metadata for debugging
- Production REST Support
    - Run a dockerized image based on static metadata
    - Should be ammenable to being scalled within a environment such as K8S
- 'Craft-your-own'
    - Previous experience has shown a 'one-size-fits-all' does not work or at least struggles with the edge cases
    - Provide the essential building blocks in NPM module that permit a 'craft-your-own-server' for such cases