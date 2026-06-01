"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRPE403 = void 0;
var ValidateAddressXRPE403 = (function () {
    function ValidateAddressXRPE403() {
    }
    ValidateAddressXRPE403.getAttributeTypeMap = function () {
        return ValidateAddressXRPE403.attributeTypeMap;
    };
    ValidateAddressXRPE403.discriminator = undefined;
    ValidateAddressXRPE403.attributeTypeMap = [
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
    return ValidateAddressXRPE403;
}());
exports.ValidateAddressXRPE403 = ValidateAddressXRPE403;
//# sourceMappingURL=validateAddressXRPE403.js.map