"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE400"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response = ListConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistorical400Response.js.map