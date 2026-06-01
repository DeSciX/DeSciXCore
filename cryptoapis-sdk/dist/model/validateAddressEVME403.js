"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVME403 = void 0;
var ValidateAddressEVME403 = (function () {
    function ValidateAddressEVME403() {
    }
    ValidateAddressEVME403.getAttributeTypeMap = function () {
        return ValidateAddressEVME403.attributeTypeMap;
    };
    ValidateAddressEVME403.discriminator = undefined;
    ValidateAddressEVME403.attributeTypeMap = [
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
    return ValidateAddressEVME403;
}());
exports.ValidateAddressEVME403 = ValidateAddressEVME403;
//# sourceMappingURL=validateAddressEVME403.js.map