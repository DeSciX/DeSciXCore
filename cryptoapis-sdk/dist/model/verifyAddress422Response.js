"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress422Response = void 0;
var VerifyAddress422Response = (function () {
    function VerifyAddress422Response() {
    }
    VerifyAddress422Response.getAttributeTypeMap = function () {
        return VerifyAddress422Response.attributeTypeMap;
    };
    VerifyAddress422Response.discriminator = undefined;
    VerifyAddress422Response.attributeTypeMap = [
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
            "type": "InvalidRequestBodyStructure"
        }
    ];
    return VerifyAddress422Response;
}());
exports.VerifyAddress422Response = VerifyAddress422Response;
//# sourceMappingURL=verifyAddress422Response.js.map