# systeme_de_vote

Un Systéme de vote (Projet Long M1 LS FI UPEC)

## HTTPS

steps:

1. generate the certificates

```bash
make generate-certs
```

2. run the server containers

```bash
docker compose up -d
```

for more details, please refer to the [SVS-SERVER/README.md](SVS-SERVER/README.md) file.

Note:
To use HTTPS for local development, the [ca.crt](SVS-SERVER/certs/ca.crt) must be trusted by your browser or by the system as a certificate authority.

## API Client

to generate the api client:

```bash
cd SVS-CLIENT
bun run generate-API-CLIENT
```

This will generate the API client in the `SVS-CLIENT/src/api/sdk` folder.
you can then add it any new APIs by updating the `SVS-CLIENT/src/api/client.ts` file to export them.

## Setup redis

to setup redis, configure the [redis.conf](SVS-SERVER/config/redis/redis.conf) file with the desired settings and the [users.acl](SVS-SERVER/config/redis/users.acl) file with the desired user access control as well as the redis connection info in [compose.env](SVS-SERVER/compose.env), then run the redis container using docker compose:
```bash
 docker compose up -d svs-redis
```

This will start the redis server with the specified configuration.

## Setup backend dev environment

download and install pipenv:
```bash
 pip install pipenv
```

then, navigate to the SVS-SERVER folder and install the dependencies:
```bash
 cd SVS-SERVER pipenv install --dev
```

This will create a virtual environment and install all the dependencies specified in the Pipfile.

## Seed db
to seed the database with initial data, run the following command from the SVS-SERVER folder:

```bash
pipenv shell
make seed-db
```
This will run the seed script located in [app/db/seed.py](SVS-SERVER/app/db/seed.py) which will populate the database with some initial data for testing and development purposes.
