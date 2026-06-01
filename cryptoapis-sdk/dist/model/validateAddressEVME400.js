"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVME400 = void 0;
var ValidateAddressEVME400 = (function () {
    function ValidateAddressEVME400() {
    }
    ValidateAddressEVME400.getAttributeTypeMap = function () {
        return ValidateAddressEVME400.attributeTypeMap;
    };
    ValidateAddressEVME400.discriminator = undefined;
    ValidateAddressEVME400.attributeTypeMap = [
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
    return ValidateAddressEVME400;
}());
exports.ValidateAddressEVME400 = ValidateAddressEVME400;
//# sourceMappingURL=validateAddressEVME400.js.map