"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddressesXRP401Response = void 0;
var ListSyncedAddressesXRP401Response = (function () {
    function ListSyncedAddressesXRP401Response() {
    }
    ListSyncedAddressesXRP401Response.getAttributeTypeMap = function () {
        return ListSyncedAddressesXRP401Response.attributeTypeMap;
    };
    ListSyncedAddressesXRP401Response.discriminator = undefined;
    ListSyncedAddressesXRP401Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesXRPE401"
        }
    ];
    return ListSyncedAddressesXRP401Response;
}());
exports.ListSyncedAddressesXRP401Response = ListSyncedAddressesXRP401Response;
//# sourceMappingURL=listSyncedAddressesXRP401Response.js.map