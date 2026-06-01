"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMR = void 0;
var ListConfirmedTransactionsByAddressEVMR = (function () {
    function ListConfirmedTransactionsByAddressEVMR() {
    }
    ListConfirmedTransactionsByAddressEVMR.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMR.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMR.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMR.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressEVMRData"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMR;
}());
exports.ListConfirmedTransactionsByAddressEVMR = ListConfirmedTransactionsByAddressEVMR;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMR.js.map