"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOsR = void 0;
var ListUnspentTransactionOutputsByAddressUTXOsR = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOsR() {
    }
    ListUnspentTransactionOutputsByAddressUTXOsR.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOsR.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOsR.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOsR.attributeTypeMap = [
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
            "type": "ListUnspentTransactionOutputsByAddressUTXOsRData"
        }
    ];
    return ListUnspentTransactionOutputsByAddressUTXOsR;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOsR = ListUnspentTransactionOutputsByAddressUTXOsR;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOsR.js.map