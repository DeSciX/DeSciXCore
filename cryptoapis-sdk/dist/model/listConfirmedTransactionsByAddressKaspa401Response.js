"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspa401Response = void 0;
var ListConfirmedTransactionsByAddressKaspa401Response = (function () {
    function ListConfirmedTransactionsByAddressKaspa401Response() {
    }
    ListConfirmedTransactionsByAddressKaspa401Response.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspa401Response.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspa401Response.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspa401Response.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressKaspaE401"
        }
    ];
    return ListConfirmedTransactionsByAddressKaspa401Response;
}());
exports.ListConfirmedTransactionsByAddressKaspa401Response = ListConfirmedTransactionsByAddressKaspa401Response;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspa401Response.js.map