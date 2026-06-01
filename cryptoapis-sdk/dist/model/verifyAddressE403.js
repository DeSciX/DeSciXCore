"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddressE403 = void 0;
var VerifyAddressE403 = (function () {
    function VerifyAddressE403() {
    }
    VerifyAddressE403.getAttributeTypeMap = function () {
        return VerifyAddressE403.attributeTypeMap;
    };
    VerifyAddressE403.discriminator = undefined;
    VerifyAddressE403.attributeTypeMap = [
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
    return VerifyAddressE403;
}());
exports.VerifyAddressE403 = VerifyAddressE403;
//# sourceMappingURL=verifyAddressE403.js.map