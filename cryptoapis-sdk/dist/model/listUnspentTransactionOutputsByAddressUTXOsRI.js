"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnspentTransactionOutputsByAddressUTXOsRI = void 0;
var ListUnspentTransactionOutputsByAddressUTXOsRI = (function () {
    function ListUnspentTransactionOutputsByAddressUTXOsRI() {
    }
    ListUnspentTransactionOutputsByAddressUTXOsRI.getAttributeTypeMap = function () {
        return ListUnspentTransactionOutputsByAddressUTXOsRI.attributeTypeMap;
    };
    ListUnspentTransactionOutputsByAddressUTXOsRI.discriminator = undefined;
    ListUnspentTransactionOutputsByAddressUTXOsRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "index",
            "baseName": "index",
            "type": "number"
        },
        {
            "name": "isAvailable",
            "baseName": "isAvailable",
            "type": "boolean"
        },
        {
            "name": "isConfirmed",
            "baseName": "isConfirmed",
            "type": "boolean"
        },
        {
            "name": "timestamp",
            "baseName": "timestamp",
            "type": "number"
        },
        {
            "name": "transactionId",
            "baseName": "transactionId",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListUnspentTransactionOutputsByAddressUTXOsRIValue"
        }
    ];
    return ListUnspentTransactionOutputsByAddressUTXOsRI;
}());
exports.ListUnspentTransactionOutputsByAddressUTXOsRI = ListUnspentTransactionOutputsByAddressUTXOsRI;
//# sourceMappingURL=listUnspentTransactionOutputsByAddressUTXOsRI.js.map