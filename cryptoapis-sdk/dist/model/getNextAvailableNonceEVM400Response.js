"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNextAvailableNonceEVM400Response = void 0;
var GetNextAvailableNonceEVM400Response = (function () {
    function GetNextAvailableNonceEVM400Response() {
    }
    GetNextAvailableNonceEVM400Response.getAttributeTypeMap = function () {
        return GetNextAvailableNonceEVM400Response.attributeTypeMap;
    };
    GetNextAvailableNonceEVM400Response.discriminator = undefined;
    GetNextAvailableNonceEVM400Response.attributeTypeMap = [
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
            "type": "GetNextAvailableNonceEVME400"
        }
    ];
    return GetNextAvailableNonceEVM400Response;
}());
exports.GetNextAvailableNonceEVM400Response = GetNextAvailableNonceEVM400Response;
//# sourceMappingURL=getNextAvailableNonceEVM400Response.js.map