"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress403Response = void 0;
var VerifyAddress403Response = (function () {
    function VerifyAddress403Response() {
    }
    VerifyAddress403Response.getAttributeTypeMap = function () {
        return VerifyAddress403Response.attributeTypeMap;
    };
    VerifyAddress403Response.discriminator = undefined;
    VerifyAddress403Response.attributeTypeMap = [
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
            "type": "VerifyAddressE403"
        }
    ];
    return VerifyAddress403Response;
}());
exports.VerifyAddress403Response = VerifyAddress403Response;
//# sourceMappingURL=verifyAddress403Response.js.map