"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response = void 0;
var ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response = (function () {
    function ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response() {
    }
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressByTimestampUTXOHistoricalE403"
        }
    ];
    return ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response;
}());
exports.ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response = ListConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressByTimestampUTXOHistorical403Response.js.map