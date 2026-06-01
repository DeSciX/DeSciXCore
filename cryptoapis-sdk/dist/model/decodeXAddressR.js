"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeXAddressR = void 0;
var DecodeXAddressR = (function () {
    function DecodeXAddressR() {
    }
    DecodeXAddressR.getAttributeTypeMap = function () {
        return DecodeXAddressR.attributeTypeMap;
    };
    DecodeXAddressR.discriminator = undefined;
    DecodeXAddressR.attributeTypeMap = [
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
            "name": "data",
            "baseName": "data",
            "type": "DecodeXAddressRData"
        }
    ];
    return DecodeXAddressR;
}());
exports.DecodeXAddressR = DecodeXAddressR;
//# sourceMappingURL=decodeXAddressR.js.map