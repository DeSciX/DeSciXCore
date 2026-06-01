"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress400Response = void 0;
var VerifyAddress400Response = (function () {
    function VerifyAddress400Response() {
    }
    VerifyAddress400Response.getAttributeTypeMap = function () {
        return VerifyAddress400Response.attributeTypeMap;
    };
    VerifyAddress400Response.discriminator = undefined;
    VerifyAddress400Response.attributeTypeMap = [
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
            "type": "VerifyAddressE400"
        }
    ];
    return VerifyAddress400Response;
}());
exports.VerifyAddress400Response = VerifyAddress400Response;
//# sourceMappingURL=verifyAddress400Response.js.map