"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspa400Response = void 0;
var ListConfirmedTransactionsByAddressKaspa400Response = (function () {
    function ListConfirmedTransactionsByAddressKaspa400Response() {
    }
    ListConfirmedTransactionsByAddressKaspa400Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspa400Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspa400Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspa400Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressKaspaE400"
        }
    ];
    return ListConfirmedTransactionsByAddressKaspa400Response;
}());
exports.ListConfirmedTransactionsByAddressKaspa400Response = ListConfirmedTransactionsByAddressKaspa400Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspa400Response.js.map