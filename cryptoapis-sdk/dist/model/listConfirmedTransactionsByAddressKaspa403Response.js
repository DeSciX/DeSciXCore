"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspa403Response = void 0;
var ListConfirmedTransactionsByAddressKaspa403Response = (function () {
    function ListConfirmedTransactionsByAddressKaspa403Response() {
    }
    ListConfirmedTransactionsByAddressKaspa403Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspa403Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspa403Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspa403Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressKaspaE403"
        }
    ];
    return ListConfirmedTransactionsByAddressKaspa403Response;
}());
exports.ListConfirmedTransactionsByAddressKaspa403Response = ListConfirmedTransactionsByAddressKaspa403Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspa403Response.js.map