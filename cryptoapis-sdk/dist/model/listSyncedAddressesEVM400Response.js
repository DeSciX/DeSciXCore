"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesEVM400Response = void 0;
var ListSyncedAddressesEVM400Response = (function () {
    function ListSyncedAddressesEVM400Response() {
    }
    ListSyncedAddressesEVM400Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesEVM400Response.attributeTypeMap;
    };
    ListSyncedAddressesEVM400Response.discriminator = undefined;
    ListSyncedAddressesEVM400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "ListSyncedAddressesEVME400"
        }
    ];
    return ListSyncedAddressesEVM400Response;
}());
exports.ListSyncedAddressesEVM400Response = ListSyncedAddressesEVM400Response;
//# sourceMappingURL=listSyncedAddressesEVM400Response.js.map