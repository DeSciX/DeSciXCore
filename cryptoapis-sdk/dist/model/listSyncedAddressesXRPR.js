"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRPR = void 0;
var ListSyncedAddressesXRPR = (function () {
    function ListSyncedAddressesXRPR() {
    }
    ListSyncedAddressesXRPR.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRPR.attributeTypeMap;
    };
    ListSyncedAddressesXRPR.discriminator = undefined;
    ListSyncedAddressesXRPR.attributeTypeMap = [
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
            "type": "ListSyncedAddressesXRPRData"
        }
    ];
    return ListSyncedAddressesXRPR;
}());
exports.ListSyncedAddressesXRPR = ListSyncedAddressesXRPR;
//# sourceMappingURL=listSyncedAddressesXRPR.js.map