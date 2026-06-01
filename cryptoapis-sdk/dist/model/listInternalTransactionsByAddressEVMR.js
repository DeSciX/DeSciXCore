"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVMR = void 0;
var ListInternalTransactionsByAddressEVMR = (function () {
    function ListInternalTransactionsByAddressEVMR() {
    }
    ListInternalTransactionsByAddressEVMR.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVMR.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVMR.discriminator = undefined;
    ListInternalTransactionsByAddressEVMR.attributeTypeMap = [
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
            "type": "ListInternalTransactionsByAddressEVMRData"
        }
    ];
    return ListInternalTransactionsByAddressEVMR;
}());
exports.ListInternalTransactionsByAddressEVMR = ListInternalTransactionsByAddressEVMR;
//# sourceMappingURL=listInternalTransactionsByAddressEVMR.js.map