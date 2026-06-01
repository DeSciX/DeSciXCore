"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVM400Response = void 0;
var ListTokensByAddressSyncedEVM400Response = (function () {
    function ListTokensByAddressSyncedEVM400Response() {
    }
    ListTokensByAddressSyncedEVM400Response.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVM400Response.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVM400Response.discriminator = undefined;
    ListTokensByAddressSyncedEVM400Response.attributeTypeMap = [
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
            "type": "ListTokensByAddressSyncedEVME400"
        }
    ];
    return ListTokensByAddressSyncedEVM400Response;
}());
exports.ListTokensByAddressSyncedEVM400Response = ListTokensByAddressSyncedEVM400Response;
//# sourceMappingURL=listTokensByAddressSyncedEVM400Response.js.map