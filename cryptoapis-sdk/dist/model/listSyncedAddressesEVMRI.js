"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVMRI = void 0;
var ListSyncedAddressesEVMRI = (function () {
    function ListSyncedAddressesEVMRI() {
    }
    ListSyncedAddressesEVMRI.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVMRI.attributeTypeMap;
    };
    ListSyncedAddressesEVMRI.discriminator = undefined;
    ListSyncedAddressesEVMRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "index",
            "baseName": "index",
            "type": "number"
        }
    ];
    return ListSyncedAddressesEVMRI;
}());
exports.ListSyncedAddressesEVMRI = ListSyncedAddressesEVMRI;
//# sourceMappingURL=listSyncedAddressesEVMRI.js.map