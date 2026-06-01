"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsR = void 0;
var ListConfirmedTransactionsByAddressUTXOsR = (function () {
    function ListConfirmedTransactionsByAddressUTXOsR() {
    }
    ListConfirmedTransactionsByAddressUTXOsR.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsR.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsR.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsR.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOsRData"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOsR;
}());
exports.ListConfirmedTransactionsByAddressUTXOsR = ListConfirmedTransactionsByAddressUTXOsR;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsR.js.map