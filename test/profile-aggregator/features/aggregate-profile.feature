# language: es
Característica: Aggregate Profile

  Esquema del escenario: primera transacción crea perfil del cliente
    Dado un lote con una transacción "<transactionId>" del cliente "<clientId>" por monto <amount> en región "<region>"
    Cuando se procesa el lote del profile aggregator
    Entonces el resultado para "<sequenceNumber>" queda sin reintento
    Y el perfil del cliente "<clientId>" queda con promedio <averageAmount>, región "<habitualRegion>" y frecuencia <frequency30d>

    Ejemplos:
      | transactionId | clientId | amount | region | sequenceNumber | averageAmount | habitualRegion | frequency30d |
      | TX-PA-001     | C-050    | 800    | PE-LIM | S-001          | 800           | PE-LIM         | 1           |

  Esquema del escenario: transacción outlier no altera el promedio pero sí cuenta en frecuencia y región
    Dado existe un perfil del cliente "<clientId>" con promedio <averageAmount> y <processedTransactions> transacciones
    Y un lote con una transacción outlier "<transactionId>" por monto <amount> en región "<region>" y sequence "<sequenceNumber>"
    Cuando se procesa el lote del profile aggregator
    Entonces el resultado para "<sequenceNumber>" queda sin reintento
    Y el promedio del cliente "<clientId>" permanece en <averageAmount>
    Y la frecuencia del cliente "<clientId>" aumenta a <frequency30d>

    Ejemplos:
      | clientId | averageAmount | processedTransactions | transactionId | amount | region | sequenceNumber | frequency30d |
      | C-001    | 1200          | 10                    | TX-PA-OUT-1   | 50000  | PE-AQP | S-OUT-001      | 11          |

  Escenario: payload inválido se descarta sin reintento
    Dado un lote con un registro inválido sin clientId
    Cuando se procesa el lote del profile aggregator
    Entonces el resultado para "S-INVALID-001" se marca sin reintento
