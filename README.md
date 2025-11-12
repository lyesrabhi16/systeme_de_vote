# systeme_de_vote

Un Systéme de vote (Projet Long M1 LS FI UPEC)

## HTTPS:

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

## API Client:

to generate the api client:

```bash
cd SVS-CLIENT
bun run generate-API-CLIENT
```

This will generate the API client in the `SVS-CLIENT/src/api/sdk` folder.
you can then add it any new APIs by updating the `SVS-CLIENT/src/api/client.ts` file to export them.




