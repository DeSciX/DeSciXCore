"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByAddressSolanaR = void 0;
var ListTransactionsByAddressSolanaR = (function () {
    function ListTransactionsByAddressSolanaR() {
    }
    ListTransactionsByAddressSolanaR.getAttributeTypeMap = function () {
        return ListTransactionsByAddressSolanaR.attributeTypeMap;
    };
    ListTransactionsByAddressSolanaR.discriminator = undefined;
    ListTransactionsByAddressSolanaR.attributeTypeMap = [
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
            "type": "ListTransactionsByAddressSolanaRData"
        }
    ];
    return ListTransactionsByAddressSolanaR;
}());
exports.ListTransactionsByAddressSolanaR = ListTransactionsByAddressSolanaR;
//# sourceMappingURL=listTransactionsByAddressSolanaR.js.map