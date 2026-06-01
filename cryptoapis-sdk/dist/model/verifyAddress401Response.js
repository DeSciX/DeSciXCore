"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress401Response = void 0;
var VerifyAddress401Response = (function () {
    function VerifyAddress401Response() {
    }
    VerifyAddress401Response.getAttributeTypeMap = function () {
        return VerifyAddress401Response.attributeTypeMap;
    };
    VerifyAddress401Response.discriminator = undefined;
    VerifyAddress401Response.attributeTypeMap = [
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
            "type": "VerifyAddressE401"
        }
    ];
    return VerifyAddress401Response;
}());
exports.VerifyAddress401Response = VerifyAddress401Response;
//# sourceMappingURL=verifyAddress401Response.js.map