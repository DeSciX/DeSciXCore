"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress429Response = void 0;
var VerifyAddress429Response = (function () {
    function VerifyAddress429Response() {
    }
    VerifyAddress429Response.getAttributeTypeMap = function () {
        return VerifyAddress429Response.attributeTypeMap;
    };
    VerifyAddress429Response.discriminator = undefined;
    VerifyAddress429Response.attributeTypeMap = [
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
            "type": "RequestLimitReached"
        }
    ];
    return VerifyAddress429Response;
}());
exports.VerifyAddress429Response = VerifyAddress429Response;
//# sourceMappingURL=verifyAddress429Response.js.map