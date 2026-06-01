"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListInternalTransactionsByAddressEVMRData = void 0;
var ListInternalTransactionsByAddressEVMRData = (function () {
    function ListInternalTransactionsByAddressEVMRData() {
    }
    ListInternalTransactionsByAddressEVMRData.getAttributeTypeMap = function () {
        return ListInternalTransactionsByAddressEVMRData.attributeTypeMap;
    };
    ListInternalTransactionsByAddressEVMRData.discriminator = undefined;
    ListInternalTransactionsByAddressEVMRData.attributeTypeMap = [
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
            "type": "Array<ListInternalTransactionsByAddressEVMRI>"
        }
    ];
    return ListInternalTransactionsByAddressEVMRData;
}());
exports.ListInternalTransactionsByAddressEVMRData = ListInternalTransactionsByAddressEVMRData;
//# sourceMappingURL=listInternalTransactionsByAddressEVMRData.js.map