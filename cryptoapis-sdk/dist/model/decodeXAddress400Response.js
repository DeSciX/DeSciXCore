"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeXAddress400Response = void 0;
var DecodeXAddress400Response = (function () {
    function DecodeXAddress400Response() {
    }
    DecodeXAddress400Response.getAttributeTypeMap = function () {
        return DecodeXAddress400Response.attributeTypeMap;
    };
    DecodeXAddress400Response.discriminator = undefined;
    DecodeXAddress400Response.attributeTypeMap = [
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
            "type": "DecodeXAddressE400"
        }
    ];
    return DecodeXAddress400Response;
}());
exports.DecodeXAddress400Response = DecodeXAddress400Response;
//# sourceMappingURL=decodeXAddress400Response.js.map