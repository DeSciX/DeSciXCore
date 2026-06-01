"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsR = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsR = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsR() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsR.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsR.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsR.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsR.attributeTypeMap = [
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
            "type": "ListUnconfirmedTransactionsByAddressUTXOsRData"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOsR;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsR = ListUnconfirmedTransactionsByAddressUTXOsR;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsR.js.map