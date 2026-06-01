"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE401"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response = ListConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistorical401Response.js.map