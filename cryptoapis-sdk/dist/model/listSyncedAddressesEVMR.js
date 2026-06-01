"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVMR = void 0;
var ListSyncedAddressesEVMR = (function () {
    function ListSyncedAddressesEVMR() {
    }
    ListSyncedAddressesEVMR.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVMR.attributeTypeMap;
    };
    ListSyncedAddressesEVMR.discriminator = undefined;
    ListSyncedAddressesEVMR.attributeTypeMap = [
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
            "type": "ListSyncedAddressesEVMRData"
        }
    ];
    return ListSyncedAddressesEVMR;
}());
exports.ListSyncedAddressesEVMR = ListSyncedAddressesEVMR;
//# sourceMappingURL=listSyncedAddressesEVMR.js.map