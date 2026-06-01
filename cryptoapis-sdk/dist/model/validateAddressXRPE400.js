"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRPE400 = void 0;
var ValidateAddressXRPE400 = (function () {
    function ValidateAddressXRPE400() {
    }
    ValidateAddressXRPE400.getAttributeTypeMap = function () {
        return ValidateAddressXRPE400.attributeTypeMap;
    };
    ValidateAddressXRPE400.discriminator = undefined;
    ValidateAddressXRPE400.attributeTypeMap = [
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
    return ValidateAddressXRPE400;
}());
exports.ValidateAddressXRPE400 = ValidateAddressXRPE400;
//# sourceMappingURL=validateAddressXRPE400.js.map