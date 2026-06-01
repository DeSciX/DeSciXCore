"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress409Response = void 0;
var VerifyAddress409Response = (function () {
    function VerifyAddress409Response() {
    }
    VerifyAddress409Response.getAttributeTypeMap = function () {
        return VerifyAddress409Response.attributeTypeMap;
    };
    VerifyAddress409Response.discriminator = undefined;
    VerifyAddress409Response.attributeTypeMap = [
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
            "type": "InvalidData"
        }
    ];
    return VerifyAddress409Response;
}());
exports.VerifyAddress409Response = VerifyAddress409Response;
//# sourceMappingURL=verifyAddress409Response.js.map