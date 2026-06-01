"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeXAddress401Response = void 0;
var EncodeXAddress401Response = (function () {
    function EncodeXAddress401Response() {
    }
    EncodeXAddress401Response.getAttributeTypeMap = function () {
        return EncodeXAddress401Response.attributeTypeMap;
    };
    EncodeXAddress401Response.discriminator = undefined;
    EncodeXAddress401Response.attributeTypeMap = [
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
            "type": "EncodeXAddressE401"
        }
    ];
    return EncodeXAddress401Response;
}());
exports.EncodeXAddress401Response = EncodeXAddress401Response;
//# sourceMappingURL=encodeXAddress401Response.js.map