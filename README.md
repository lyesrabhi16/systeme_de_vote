# systeme_de_vote

Un Systéme de vote (Projet Long M1 LS FI UPEC)

## HTTPS:

steps:

1. generate the certificats

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
