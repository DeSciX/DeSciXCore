"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetNextAvailableNonceEVM401Response = void 0;
var GetNextAvailableNonceEVM401Response = (function () {
    function GetNextAvailableNonceEVM401Response() {
    }
    GetNextAvailableNonceEVM401Response.getAttributeTypeMap = function () {
        return GetNextAvailableNonceEVM401Response.attributeTypeMap;
    };
    GetNextAvailableNonceEVM401Response.discriminator = undefined;
    GetNextAvailableNonceEVM401Response.attributeTypeMap = [
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
            "type": "GetNextAvailableNonceEVME401"
        }
    ];
    return GetNextAvailableNonceEVM401Response;
}());
exports.GetNextAvailableNonceEVM401Response = GetNextAvailableNonceEVM401Response;
//# sourceMappingURL=getNextAvailableNonceEVM401Response.js.map