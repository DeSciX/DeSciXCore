"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListSyncedAddresses401Response = void 0;
var ListSyncedAddresses401Response = (function () {
    function ListSyncedAddresses401Response() {
    }
    ListSyncedAddresses401Response.getAttributeTypeMap = function () {
        return ListSyncedAddresses401Response.attributeTypeMap;
    };
    ListSyncedAddresses401Response.discriminator = undefined;
    ListSyncedAddresses401Response.attributeTypeMap = [
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
            "type": "ListSyncedAddressesE401"
        }
    ];
    return ListSyncedAddresses401Response;
}());
exports.ListSyncedAddresses401Response = ListSyncedAddresses401Response;
//# sourceMappingURL=listSyncedAddresses401Response.js.map