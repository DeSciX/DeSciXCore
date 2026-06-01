"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVME401 = void 0;
var ValidateAddressEVME401 = (function () {
    function ValidateAddressEVME401() {
    }
    ValidateAddressEVME401.getAttributeTypeMap = function () {
        return ValidateAddressEVME401.attributeTypeMap;
    };
    ValidateAddressEVME401.discriminator = undefined;
    ValidateAddressEVME401.attributeTypeMap = [
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
    return ValidateAddressEVME401;
}());
exports.ValidateAddressEVME401 = ValidateAddressEVME401;
//# sourceMappingURL=validateAddressEVME401.js.map