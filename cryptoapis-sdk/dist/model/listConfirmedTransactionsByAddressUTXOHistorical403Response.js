"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistorical403Response = void 0;
var ListConfirmedTransactionsByAddressUTXOHistorical403Response = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistorical403Response() {
    }
    ListConfirmedTransactionsByAddressUTXOHistorical403Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistorical403Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistorical403Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistorical403Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalE403"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistorical403Response;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistorical403Response = ListConfirmedTransactionsByAddressUTXOHistorical403Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistorical403Response.js.map