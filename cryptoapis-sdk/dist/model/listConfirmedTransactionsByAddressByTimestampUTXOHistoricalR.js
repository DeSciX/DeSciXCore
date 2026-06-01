"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalRData"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR = ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalR;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistoricalR.js.map