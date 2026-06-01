"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVMRData = void 0;
var ListTokensByAddressSyncedEVMRData = (function () {
    function ListTokensByAddressSyncedEVMRData() {
    }
    ListTokensByAddressSyncedEVMRData.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVMRData.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVMRData.discriminator = undefined;
    ListTokensByAddressSyncedEVMRData.attributeTypeMap = [
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
            "type": "Array<ListTokensByAddressSyncedEVMRI>"
        }
    ];
    return ListTokensByAddressSyncedEVMRData;
}());
exports.ListTokensByAddressSyncedEVMRData = ListTokensByAddressSyncedEVMRData;
//# sourceMappingURL=listTokensByAddressSyncedEVMRData.js.map