"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressEVMRData = void 0;
var ListConfirmedTransactionsByAddressEVMRData = (function () {
    function ListConfirmedTransactionsByAddressEVMRData() {
    }
    ListConfirmedTransactionsByAddressEVMRData.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressEVMRData.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressEVMRData.discriminator = undefined;
    ListConfirmedTransactionsByAddressEVMRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "startingAfter",
            "baseName": "startingAfter",
            "type": "string"
        },
        {
            "name": "hasMore",
            "baseName": "hasMore",
            "type": "boolean"
        },
        {
            "name": "nextStartingAfter",
            "baseName": "nextStartingAfter",
            "type": "string"
        },
        {
            "name": "sortingOrder",
            "baseName": "sortingOrder",
            "type": "string"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListConfirmedTransactionsByAddressEVMRI>"
        }
    ];
    return ListConfirmedTransactionsByAddressEVMRData;
}());
exports.ListConfirmedTransactionsByAddressEVMRData = ListConfirmedTransactionsByAddressEVMRData;
//# sourceMappingURL=listConfirmedTransactionsByAddressEVMRData.js.map