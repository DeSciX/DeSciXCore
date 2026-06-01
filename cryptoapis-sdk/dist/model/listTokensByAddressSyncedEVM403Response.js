"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTokensByAddressSyncedEVM403Response = void 0;
var ListTokensByAddressSyncedEVM403Response = (function () {
    function ListTokensByAddressSyncedEVM403Response() {
    }
    ListTokensByAddressSyncedEVM403Response.getAttributeTypeMap = function () {
        return ListTokensByAddressSyncedEVM403Response.attributeTypeMap;
    };
    ListTokensByAddressSyncedEVM403Response.discriminator = undefined;
    ListTokensByAddressSyncedEVM403Response.attributeTypeMap = [
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
            "type": "ListTokensByAddressSyncedEVME403"
        }
    ];
    return ListTokensByAddressSyncedEVM403Response;
}());
exports.ListTokensByAddressSyncedEVM403Response = ListTokensByAddressSyncedEVM403Response;
//# sourceMappingURL=listTokensByAddressSyncedEVM403Response.js.map