"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRPE401 = void 0;
var ValidateAddressXRPE401 = (function () {
    function ValidateAddressXRPE401() {
    }
    ValidateAddressXRPE401.getAttributeTypeMap = function () {
        return ValidateAddressXRPE401.attributeTypeMap;
    };
    ValidateAddressXRPE401.discriminator = undefined;
    ValidateAddressXRPE401.attributeTypeMap = [
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
    return ValidateAddressXRPE401;
}());
exports.ValidateAddressXRPE401 = ValidateAddressXRPE401;
//# sourceMappingURL=validateAddressXRPE401.js.map