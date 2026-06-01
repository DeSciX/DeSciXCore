"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTokensTransfersByAddressEVMRData = void 0;
var ListConfirmedTokensTransfersByAddressEVMRData = (function () {
    function ListConfirmedTokensTransfersByAddressEVMRData() {
    }
    ListConfirmedTokensTransfersByAddressEVMRData.getAttributeTypeMap = function () {
        return ListConfirmedTokensTransfersByAddressEVMRData.attributeTypeMap;
    };
    ListConfirmedTokensTransfersByAddressEVMRData.discriminator = undefined;
    ListConfirmedTokensTransfersByAddressEVMRData.attributeTypeMap = [
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
            "type": "Array<ListConfirmedTokensTransfersByAddressEVMRI>"
        }
    ];
    return ListConfirmedTokensTransfersByAddressEVMRData;
}());
exports.ListConfirmedTokensTransfersByAddressEVMRData = ListConfirmedTokensTransfersByAddressEVMRData;
//# sourceMappingURL=listConfirmedTokensTransfersByAddressEVMRData.js.map