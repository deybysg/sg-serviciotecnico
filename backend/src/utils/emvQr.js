// backend/src/utils/emvQr.js
// Generador de QR en formato EMV para transferencias CVU (estándar BCRA Argentina)

/**
 * Calcula CRC-16 (CCITT) para el payload EMV
 * Polynomial: 0x1021, Init: 0xFFFF
 */
function crc16Ccitt(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Formatea un campo EMV: TAG + LENGTH + VALUE
 */
function emvField(tag, value) {
    const len = value.length.toString().padStart(2, '0');
    return tag + len + value;
}

/**
 * Genera payload EMV para QR de transferencia CVU
 * @param {string} cvu - CVU de 22 dígitos
 * @param {string} alias - Alias del CVU (opcional)
 * @param {number} amount - Monto de la transacción (opcional, si es null no se incluye)
 * @returns {string} Payload EMV listo para codificar en QR
 */
export function generateCvuQrPayload(cvu, alias = null, amount = null) {
    // Tag 00: Payload Format Indicator = "01"
    const tag00 = emvField('00', '01');

    // Tag 01: Point of Initiation Method = "12" (dynamic QR) o "11" (static)
    // Usamos "12" para QR dinámico (se regenera cada vez)
    const tag01 = emvField('01', '12');

    // Tag 26: Merchant Account Information (CVU)
    // Sub-campos:
    //   00: Application Global Unique Identifier = "AR.BCB.Wallet"
    //   01: CVU number
    //   02: Alias (opcional)
    let merchantInfo = emvField('00', 'AR.BCB.Wallet');
    merchantInfo += emvField('01', cvu);
    if (alias) {
        merchantInfo += emvField('02', alias);
    }
    const tag26 = emvField('26', merchantInfo);

    // Tag 52: Merchant Category Code = "0000" (no especificado)
    const tag52 = emvField('52', '0000');

    // Tag 53: Transaction Currency = "032" (ARS - Peso Argentino)
    const tag53 = emvField('53', '032');

    // Tag 54: Transaction Amount (opcional)
    let tag54 = '';
    if (amount !== null && amount !== undefined) {
        tag54 = emvField('54', amount.toFixed(2));
    }

    // Tag 58: Country Code = "AR"
    const tag58 = emvField('58', 'AR');

    // Tag 59: Merchant Name (nombre del comercio)
    const tag59 = emvField('59', 'SG Tecnico');

    // Tag 60: Merchant City
    const tag60 = emvField('60', 'Argentina');

    // Construir payload sin CRC
    let payload = tag00 + tag01 + tag26 + tag52 + tag53 + tag54 + tag58 + tag59 + tag60;

    // Tag 63: CRC-16 checksum
    // El CRC se calcula sobre todo el payload incluyendo "6304"
    const crcPayload = payload + '6304';
    const crc = crc16Ccitt(crcPayload);
    const tag63 = '6304' + crc;

    return payload + tag63;
}
