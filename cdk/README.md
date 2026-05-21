# fraud-shield — CDK

Infraestructura AWS del proyecto fraud-shield, definida con AWS CDK (TypeScript) en modo single-account.

---

## Índice

- [Estructura](#estructura)
- [Requisitos](#requisitos)
- [Instalación](#instalación)
- [Desarrollo en LocalStack](#desarrollo-en-localstack)
- [Despliegue en AWS](#despliegue-en-aws)
- [Comandos de referencia](#comandos-de-referencia)
- [Configuración de consumo Kinesis](#configuracion-de-consumo-kinesis)
- [Recursos desplegados](#recursos-desplegados)

---

## Estructura

```
cdk/
  bin/
    app.ts              # Entry point — single account/region
  lib/
    app.stack.ts        # Stack principal
    constructs/
      api-gateway/      # REST API v1, API Key, Usage Plan
      cloudwatch/       # Log groups por Lambda
      dynamo/           # Tablas DynamoDB
      iam/              # Roles de ejecución y permisos mínimos
      kinesis/          # Stream Kinesis
      lambda/           # Una construct por función Lambda
  common/
    constants/          # NamingConstants, ResourceConstants, InfraConstants
  docker-compose.yml    # LocalStack Pro para desarrollo local
```

---

## Requisitos

- Node.js 20+
- Docker (para LocalStack)
- `LOCALSTACK_AUTH_TOKEN` en `.env` (LocalStack Pro)

---

## Instalación

```bash
# Instalar dependencias CDK
cd cdk && npm install

# Instalar CLI global (una sola vez)
npm install -g aws-cdk aws-cdk-local
pip install awscli-local
```

---

## Desarrollo en LocalStack

> Copiar `.env.example` a `.env` y completar `LOCALSTACK_AUTH_TOKEN`.

```bash
# Levantar LocalStack (desde la raíz del proyecto)
docker compose up -d

# Bootstrap (una vez por contenedor)
cdklocal bootstrap

# Deploy
cdklocal deploy --require-approval never

# Preview de cambios
cdklocal diff

# Destruir
cdklocal destroy --force
```

### Scripts disponibles

```bash
npm run setup:local      # bootstrap + deploy
npm run deploy:local     # solo deploy
npm run diff:local       # diff
npm run destroy:local    # destruir stack
```

---

## Despliegue en AWS

```bash
# Bootstrap (una vez por cuenta/región)
cdk bootstrap aws://<ACCOUNT_ID>/<REGION>

# Preview
cdk diff

# Deploy
cdk deploy --require-approval never
```

### Scripts disponibles

```bash
npm run bootstrap         # bootstrap en AWS
npm run deploy            # deploy en AWS
npm run diff              # diff en AWS
npm run destroy           # destroy en AWS
```

---

## Comandos de referencia

### Verificar recursos en LocalStack

```bash
# API Gateway
awslocal apigateway get-rest-apis
awslocal apigateway get-stages --rest-api-id <api-id>

# Lambda
awslocal lambda list-functions --query 'Functions[*].FunctionName'
```

---

## Configuracion de consumo Kinesis

La Lambda profile-aggregator tiene event source mapping explicito en CDK:

- `startingPosition`: `TRIM_HORIZON`
- `bisectBatchOnError`: `true`
- `reportBatchItemFailures`: `true`

El resto de parametros de lote/concurrencia/reintentos usa defaults de AWS Lambda para Kinesis y se ajusta solo cuando haya necesidad operacional.

---

## Recursos desplegados

| Recurso | Nombre lógico | Nombre físico |
|---|---|---|
| Lambda Transaction Ingester | `TxIngesterFn` | `UE1FRAUDSHIELDLMB001` |
| Lambda Profile Aggregator | `ProfileAggregatorFn` | `UE1FRAUDSHIELDLMB002` |
| API Gateway REST | `HttpApi` | `UE1FRAUDSHIELDGTW001` |
| Kinesis Stream | `KinesisStream` | `UE1FRAUDSHIELDKDS001` |
| DynamoDB Profiles | `ProfileAggregatorTable` | `UE1FRAUDSHIELDDDB001` |
| IAM Role | `WorkerRole` | `UE1FRAUDSHIELDROL001` |
