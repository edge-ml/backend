# Explorer Backend
The backend part of the edge-ml project which can be found [here](https://github.com/edge-ml).
[![Tests](https://github.com/edge-ml/backend/actions/workflows/tests.yml/badge.svg)](https://github.com/edge-ml/backend/actions/workflows/tests.yml)
[![Publish Docker image](https://github.com/edge-ml/backend/actions/workflows/publishDocker.yml/badge.svg)](https://github.com/edge-ml/backend/actions/workflows/publishDocker.yml)

A REST API for the <a href="https://github.com/edge-ml/backend">explorer backend</a>.

# Getting started
Before you get started clone *this repository* and the <a href="https://github.com/edge-ml/authentication/">authentication repository</a>
and make sure, both repositories are located in the same folder.

You can either run the application within a docker container or directly.

## Development
If you want to run the application locally, please follow the 
<a href="https://docs.mongodb.com/manual/installation/">mongoDB installation guide</a>.

Please make sure mongoDB and <a href="https://github.com/edge-ml/authentication/">Edge-ml authentication</a>
is up and running.

Then run the following commands:
                                                                     
```
npm install
npm run start
```

# Testing
After developing and **before** committing, please make sure all test are passing. MongoDB and Aura Authentication
need to be up and running.

```
npm run test
```

