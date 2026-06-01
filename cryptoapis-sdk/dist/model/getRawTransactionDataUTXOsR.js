"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRawTransactionDataUTXOsR = void 0;
var GetRawTransactionDataUTXOsR = (function () {
    function GetRawTransactionDataUTXOsR() {
    }
    GetRawTransactionDataUTXOsR.getAttributeTypeMap = function () {
        return GetRawTransactionDataUTXOsR.attributeTypeMap;
    };
    GetRawTransactionDataUTXOsR.discriminator = undefined;
    GetRawTransactionDataUTXOsR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetRawTransactionDataUTXOsRData"
        }
    ];
    return GetRawTransactionDataUTXOsR;
}());
exports.GetRawTransactionDataUTXOsR = GetRawTransactionDataUTXOsR;
//# sourceMappingURL=getRawTransactionDataUTXOsR.js.map