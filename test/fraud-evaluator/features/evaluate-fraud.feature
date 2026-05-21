# language: es
Característica: Evaluate Fraud

  Esquema del escenario: transacción sin regla aplicable se aprueba y no envía alerta
    Dado un repositorio de fraude preparado para "<scenario>"
    Y un lote de fraude con transactionId "<transactionId>", clientId "<clientId>", amount <amount>, region "<region>", type "<type>", sequence "<sequenceNumber>"
    Cuando se procesa el lote del fraud evaluator
    Entonces el resultado para "<sequenceNumber>" queda sin reintento
    Y la decisión persistida para "<transactionId>" queda "<decision>"
    Y el número de alertas publicadas es <alertsPublished>

    Ejemplos:
      | scenario      | transactionId  | clientId | amount | region | type    | sequenceNumber | decision | alertsPublished |
      | approve-nohit | TX-FE-APP-001  | C-010    | 900    | PE-LIM | PAYMENT | FE-S-001       | APPROVE  | 0               |

  Esquema del escenario: transacción con regla REJECT se persiste y alerta al equipo de riesgo
    Dado un repositorio de fraude preparado para "<scenario>"
    Y un lote de fraude con transactionId "<transactionId>", clientId "<clientId>", amount <amount>, region "<region>", type "<type>", sequence "<sequenceNumber>"
    Cuando se procesa el lote del fraud evaluator
    Entonces el resultado para "<sequenceNumber>" queda sin reintento
    Y la decisión persistida para "<transactionId>" queda "<decision>"
    Y el número de alertas publicadas es <alertsPublished>

    Ejemplos:
      | scenario      | transactionId  | clientId | amount | region | type    | sequenceNumber | decision | alertsPublished |
      | reject-static | TX-FE-REJ-001  | C-001    | 5800   | US-MIA | PAYMENT | FE-S-REJ-001   | REJECT   | 1               |

  Esquema del escenario: transacción duplicada se descarta sin nueva alerta
    Dado un repositorio de fraude preparado para "<scenario>"
    Y un lote de fraude con transactionId "<transactionId>", clientId "<clientId>", amount <amount>, region "<region>", type "<type>", sequence "<sequenceNumber>"
    Cuando se procesa el lote del fraud evaluator
    Entonces el resultado para "<sequenceNumber>" queda sin reintento
    Y no se persiste nueva decisión para "<transactionId>"
    Y el número de alertas publicadas es <alertsPublished>

    Ejemplos:
      | scenario  | transactionId  | clientId | amount | region | type    | sequenceNumber | alertsPublished |
      | duplicate | TX-FE-DUP-001  | C-001    | 2000   | PE-LIM | PAYMENT | FE-S-DUP-001   | 0               |

  Esquema del escenario: payload inválido se descarta sin reintento
    Dado un repositorio de fraude preparado para "<scenario>"
    Y un lote de fraude inválido con transactionId "<transactionId>", clientId "<clientId>", amount <amount>, region "<region>", type "<type>", sequence "<sequenceNumber>"
    Cuando se procesa el lote del fraud evaluator
    Entonces el resultado para "<sequenceNumber>" se marca sin reintento
    Y el número de alertas publicadas es <alertsPublished>

    Ejemplos:
      | scenario      | transactionId   | clientId | amount | region | type    | sequenceNumber | alertsPublished |
      | invalid-input | TX-FE-INV-001   |          | 100    | PE-LIM | PAYMENT | FE-S-INV-001   | 0               |
