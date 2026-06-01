"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeXAddress400Response = void 0;
var EncodeXAddress400Response = (function () {
    function EncodeXAddress400Response() {
    }
    EncodeXAddress400Response.getAttributeTypeMap = function () {
        return EncodeXAddress400Response.attributeTypeMap;
    };
    EncodeXAddress400Response.discriminator = undefined;
    EncodeXAddress400Response.attributeTypeMap = [
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
            "type": "EncodeXAddressE400"
        }
    ];
    return EncodeXAddress400Response;
}());
exports.EncodeXAddress400Response = EncodeXAddress400Response;
//# sourceMappingURL=encodeXAddress400Response.js.map