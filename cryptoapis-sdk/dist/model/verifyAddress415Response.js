"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddress415Response = void 0;
var VerifyAddress415Response = (function () {
    function VerifyAddress415Response() {
    }
    VerifyAddress415Response.getAttributeTypeMap = function () {
        return VerifyAddress415Response.attributeTypeMap;
    };
    VerifyAddress415Response.discriminator = undefined;
    VerifyAddress415Response.attributeTypeMap = [
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
            "type": "UnsupportedMediaType"
        }
    ];
    return VerifyAddress415Response;
}());
exports.VerifyAddress415Response = VerifyAddress415Response;
//# sourceMappingURL=verifyAddress415Response.js.map