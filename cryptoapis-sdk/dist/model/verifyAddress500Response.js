"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress500Response = void 0;
var VerifyAddress500Response = (function () {
    function VerifyAddress500Response() {
    }
    VerifyAddress500Response.getAttributeTypeMap = function () {
        return VerifyAddress500Response.attributeTypeMap;
    };
    VerifyAddress500Response.discriminator = undefined;
    VerifyAddress500Response.attributeTypeMap = [
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
            "type": "UnexpectedServerError"
        }
    ];
    return VerifyAddress500Response;
}());
exports.VerifyAddress500Response = VerifyAddress500Response;
//# sourceMappingURL=verifyAddress500Response.js.map