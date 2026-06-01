"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNextAvailableNonceEVM403Response = void 0;
var GetNextAvailableNonceEVM403Response = (function () {
    function GetNextAvailableNonceEVM403Response() {
    }
    GetNextAvailableNonceEVM403Response.getAttributeTypeMap = function () {
        return GetNextAvailableNonceEVM403Response.attributeTypeMap;
    };
    GetNextAvailableNonceEVM403Response.discriminator = undefined;
    GetNextAvailableNonceEVM403Response.attributeTypeMap = [
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
            "type": "GetNextAvailableNonceEVME403"
        }
    ];
    return GetNextAvailableNonceEVM403Response;
}());
exports.GetNextAvailableNonceEVM403Response = GetNextAvailableNonceEVM403Response;
//# sourceMappingURL=getNextAvailableNonceEVM403Response.js.map