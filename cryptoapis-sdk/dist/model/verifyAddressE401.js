"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddressE401 = void 0;
var VerifyAddressE401 = (function () {
    function VerifyAddressE401() {
    }
    VerifyAddressE401.getAttributeTypeMap = function () {
        return VerifyAddressE401.attributeTypeMap;
    };
    VerifyAddressE401.discriminator = undefined;
    VerifyAddressE401.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return VerifyAddressE401;
}());
exports.VerifyAddressE401 = VerifyAddressE401;
//# sourceMappingURL=verifyAddressE401.js.map