"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecodeXAddressRI = void 0;
var DecodeXAddressRI = (function () {
    function DecodeXAddressRI() {
    }
    DecodeXAddressRI.getAttributeTypeMap = function () {
        return DecodeXAddressRI.attributeTypeMap;
    };
    DecodeXAddressRI.discriminator = undefined;
    DecodeXAddressRI.attributeTypeMap = [
        {
            "name": "addressTag",
            "baseName": "addressTag",
            "type": "number"
        },
        {
            "name": "classicAddress",
            "baseName": "classicAddress",
            "type": "string"
        }
    ];
    return DecodeXAddressRI;
}());
exports.DecodeXAddressRI = DecodeXAddressRI;
//# sourceMappingURL=decodeXAddressRI.js.map