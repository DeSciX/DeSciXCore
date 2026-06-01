"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressKaspaR = void 0;
var ListConfirmedTransactionsByAddressKaspaR = (function () {
    function ListConfirmedTransactionsByAddressKaspaR() {
    }
    ListConfirmedTransactionsByAddressKaspaR.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressKaspaR.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressKaspaR.discriminator = undefined;
    ListConfirmedTransactionsByAddressKaspaR.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressKaspaRData"
        }
    ];
    return ListConfirmedTransactionsByAddressKaspaR;
}());
exports.ListConfirmedTransactionsByAddressKaspaR = ListConfirmedTransactionsByAddressKaspaR;
//# sourceMappingURL=listConfirmedTransactionsByAddressKaspaR.js.map