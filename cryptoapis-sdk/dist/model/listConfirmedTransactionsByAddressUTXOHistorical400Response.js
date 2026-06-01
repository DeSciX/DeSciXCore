"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistorical400Response = void 0;
var ListConfirmedTransactionsByAddressUTXOHistorical400Response = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistorical400Response() {
    }
    ListConfirmedTransactionsByAddressUTXOHistorical400Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistorical400Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistorical400Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistorical400Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalE400"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistorical400Response;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistorical400Response = ListConfirmedTransactionsByAddressUTXOHistorical400Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistorical400Response.js.map