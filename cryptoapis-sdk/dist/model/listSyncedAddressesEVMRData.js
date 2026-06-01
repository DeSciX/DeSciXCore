"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVMRData = void 0;
var ListSyncedAddressesEVMRData = (function () {
    function ListSyncedAddressesEVMRData() {
    }
    ListSyncedAddressesEVMRData.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVMRData.attributeTypeMap;
    };
    ListSyncedAddressesEVMRData.discriminator = undefined;
    ListSyncedAddressesEVMRData.attributeTypeMap = [
        {
            "name": "limit",
            "baseName": "limit",
            "type": "number"
        },
        {
            "name": "offset",
            "baseName": "offset",
            "type": "number"
        },
        {
            "name": "total",
            "baseName": "total",
            "type": "number"
        },
        {
            "name": "items",
            "baseName": "items",
            "type": "Array<ListSyncedAddressesEVMRI>"
        }
    ];
    return ListSyncedAddressesEVMRData;
}());
exports.ListSyncedAddressesEVMRData = ListSyncedAddressesEVMRData;
//# sourceMappingURL=listSyncedAddressesEVMRData.js.map