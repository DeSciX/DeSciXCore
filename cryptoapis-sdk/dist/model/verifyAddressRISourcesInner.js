"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddressRISourcesInner = void 0;
var VerifyAddressRISourcesInner = (function () {
    function VerifyAddressRISourcesInner() {
    }
    VerifyAddressRISourcesInner.getAttributeTypeMap = function () {
        return VerifyAddressRISourcesInner.attributeTypeMap;
    };
    VerifyAddressRISourcesInner.discriminator = undefined;
    VerifyAddressRISourcesInner.attributeTypeMap = [
        {
            "name": "categories",
            "baseName": "categories",
            "type": "Array<string>"
        },
        {
            "name": "label",
            "baseName": "label",
            "type": "string"
        },
        {
            "name": "listingTimestamp",
            "baseName": "listingTimestamp",
            "type": "number"
        },
        {
            "name": "provider",
            "baseName": "provider",
            "type": "string"
        },
        {
            "name": "sanctionPrograms",
            "baseName": "sanctionPrograms",
            "type": "Array<string>"
        }
    ];
    return VerifyAddressRISourcesInner;
}());
exports.VerifyAddressRISourcesInner = VerifyAddressRISourcesInner;
//# sourceMappingURL=verifyAddressRISourcesInner.js.map