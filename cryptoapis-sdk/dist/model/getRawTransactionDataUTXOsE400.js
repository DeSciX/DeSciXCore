"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRawTransactionDataUTXOsE400 = void 0;
var GetRawTransactionDataUTXOsE400 = (function () {
    function GetRawTransactionDataUTXOsE400() {
    }
    GetRawTransactionDataUTXOsE400.getAttributeTypeMap = function () {
        return GetRawTransactionDataUTXOsE400.attributeTypeMap;
    };
    GetRawTransactionDataUTXOsE400.discriminator = undefined;
    GetRawTransactionDataUTXOsE400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return GetRawTransactionDataUTXOsE400;
}());
exports.GetRawTransactionDataUTXOsE400 = GetRawTransactionDataUTXOsE400;
//# sourceMappingURL=getRawTransactionDataUTXOsE400.js.map