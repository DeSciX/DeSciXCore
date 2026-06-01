"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalR = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalR = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalR() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalR.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalR.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalR.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalR.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalRData"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistoricalR;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalR = ListConfirmedTransactionsByAddressUTXOHistoricalR;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalR.js.map