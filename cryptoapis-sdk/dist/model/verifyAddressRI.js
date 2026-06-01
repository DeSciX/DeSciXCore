"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddressRI = void 0;
var VerifyAddressRI = (function () {
    function VerifyAddressRI() {
    }
    VerifyAddressRI.getAttributeTypeMap = function () {
        return VerifyAddressRI.attributeTypeMap;
    };
    VerifyAddressRI.discriminator = undefined;
    VerifyAddressRI.attributeTypeMap = [
        {
            "name": "blockchain",
            "baseName": "blockchain",
            "type": "string"
        },
        {
            "name": "categories",
            "baseName": "categories",
            "type": "Array<string>"
        },
        {
            "name": "isFlagged",
            "baseName": "isFlagged",
            "type": "boolean"
        },
        {
            "name": "severity",
            "baseName": "severity",
            "type": "object"
        },
        {
            "name": "sources",
            "baseName": "sources",
            "type": "Array<VerifyAddressRISourcesInner>"
        }
    ];
    return VerifyAddressRI;
}());
exports.VerifyAddressRI = VerifyAddressRI;
//# sourceMappingURL=verifyAddressRI.js.map