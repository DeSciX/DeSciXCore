"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRawTransactionDataUTXOsE401 = void 0;
var GetRawTransactionDataUTXOsE401 = (function () {
    function GetRawTransactionDataUTXOsE401() {
    }
    GetRawTransactionDataUTXOsE401.getAttributeTypeMap = function () {
        return GetRawTransactionDataUTXOsE401.attributeTypeMap;
    };
    GetRawTransactionDataUTXOsE401.discriminator = undefined;
    GetRawTransactionDataUTXOsE401.attributeTypeMap = [
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
    return GetRawTransactionDataUTXOsE401;
}());
exports.GetRawTransactionDataUTXOsE401 = GetRawTransactionDataUTXOsE401;
//# sourceMappingURL=getRawTransactionDataUTXOsE401.js.map