"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTransactionDetailsByTransactionHashUTXOsR = void 0;
var GetTransactionDetailsByTransactionHashUTXOsR = (function () {
    function GetTransactionDetailsByTransactionHashUTXOsR() {
    }
    GetTransactionDetailsByTransactionHashUTXOsR.getAttributeTypeMap = function () {
        return GetTransactionDetailsByTransactionHashUTXOsR.attributeTypeMap;
    };
    GetTransactionDetailsByTransactionHashUTXOsR.discriminator = undefined;
    GetTransactionDetailsByTransactionHashUTXOsR.attributeTypeMap = [
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
            "type": "GetTransactionDetailsByTransactionHashUTXOsRData"
        }
    ];
    return GetTransactionDetailsByTransactionHashUTXOsR;
}());
exports.GetTransactionDetailsByTransactionHashUTXOsR = GetTransactionDetailsByTransactionHashUTXOsR;
//# sourceMappingURL=getTransactionDetailsByTransactionHashUTXOsR.js.map