"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeXAddress403Response = void 0;
var DecodeXAddress403Response = (function () {
    function DecodeXAddress403Response() {
    }
    DecodeXAddress403Response.getAttributeTypeMap = function () {
        return DecodeXAddress403Response.attributeTypeMap;
    };
    DecodeXAddress403Response.discriminator = undefined;
    DecodeXAddress403Response.attributeTypeMap = [
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
            "type": "DecodeXAddressE403"
        }
    ];
    return DecodeXAddress403Response;
}());
exports.DecodeXAddress403Response = DecodeXAddress403Response;
//# sourceMappingURL=decodeXAddress403Response.js.map