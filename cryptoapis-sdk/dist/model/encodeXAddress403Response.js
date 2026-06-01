"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeXAddress403Response = void 0;
var EncodeXAddress403Response = (function () {
    function EncodeXAddress403Response() {
    }
    EncodeXAddress403Response.getAttributeTypeMap = function () {
        return EncodeXAddress403Response.attributeTypeMap;
    };
    EncodeXAddress403Response.discriminator = undefined;
    EncodeXAddress403Response.attributeTypeMap = [
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
            "type": "EncodeXAddressE403"
        }
    ];
    return EncodeXAddress403Response;
}());
exports.EncodeXAddress403Response = EncodeXAddress403Response;
//# sourceMappingURL=encodeXAddress403Response.js.map