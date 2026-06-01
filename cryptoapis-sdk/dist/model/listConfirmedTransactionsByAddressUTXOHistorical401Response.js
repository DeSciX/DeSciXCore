"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistorical401Response = void 0;
var ListConfirmedTransactionsByAddressUTXOHistorical401Response = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistorical401Response() {
    }
    ListConfirmedTransactionsByAddressUTXOHistorical401Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistorical401Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistorical401Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistorical401Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalE401"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistorical401Response;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistorical401Response = ListConfirmedTransactionsByAddressUTXOHistorical401Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistorical401Response.js.map