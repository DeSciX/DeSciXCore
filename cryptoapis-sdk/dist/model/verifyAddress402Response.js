"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress402Response = void 0;
var VerifyAddress402Response = (function () {
    function VerifyAddress402Response() {
    }
    VerifyAddress402Response.getAttributeTypeMap = function () {
        return VerifyAddress402Response.attributeTypeMap;
    };
    VerifyAddress402Response.discriminator = undefined;
    VerifyAddress402Response.attributeTypeMap = [
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
            "type": "InsufficientCredits"
        }
    ];
    return VerifyAddress402Response;
}());
exports.VerifyAddress402Response = VerifyAddress402Response;
//# sourceMappingURL=verifyAddress402Response.js.map