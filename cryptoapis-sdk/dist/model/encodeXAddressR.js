"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EncodeXAddressR = void 0;
var EncodeXAddressR = (function () {
    function EncodeXAddressR() {
    }
    EncodeXAddressR.getAttributeTypeMap = function () {
        return EncodeXAddressR.attributeTypeMap;
    };
    EncodeXAddressR.discriminator = undefined;
    EncodeXAddressR.attributeTypeMap = [
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
            "type": "EncodeXAddressRData"
        }
    ];
    return EncodeXAddressR;
}());
exports.EncodeXAddressR = EncodeXAddressR;
//# sourceMappingURL=encodeXAddressR.js.map