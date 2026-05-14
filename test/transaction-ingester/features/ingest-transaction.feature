# language: es
Característica: Ingest Transaction

  Esquema del escenario: transacción válida es aceptada y publicada en Kinesis
    Dado la transacción "<transactionId>" del cliente "<clientId>" por monto <amount> en región "<region>" de tipo "<type>"
    Cuando se ingesta la transacción
    Entonces la respuesta tiene status "<status>" y transactionId "<transactionId>"
    Y Kinesis recibió un PutRecord con partitionKey "<clientId>"

    Ejemplos:
      | transactionId | clientId | amount | region  | type     | status   |
      | TX-2026-001   | C-001    | 5800   | US-MIA  | TRANSFER | ACCEPTED |

  Esquema del escenario: campo inválido en el payload es rechazado con ValidationException
    Dado un payload base con "<campo>" siendo "<valor>"
    Cuando se ingesta la transacción
    Entonces se lanza una ValidationException

    Ejemplos:
      | campo    | valor | motivo                         |
      | amount   | -100  | amount debe ser positivo       |
      | clientId |       | clientId no puede estar vacío  |
