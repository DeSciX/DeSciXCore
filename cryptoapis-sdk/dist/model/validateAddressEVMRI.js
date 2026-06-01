"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVMRI = void 0;
var ValidateAddressEVMRI = (function () {
    function ValidateAddressEVMRI() {
    }
    ValidateAddressEVMRI.getAttributeTypeMap = function () {
        return ValidateAddressEVMRI.attributeTypeMap;
    };
    ValidateAddressEVMRI.discriminator = undefined;
    ValidateAddressEVMRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "isValid",
            "baseName": "isValid",
            "type": "boolean"
        }
    ];
    return ValidateAddressEVMRI;
}());
exports.ValidateAddressEVMRI = ValidateAddressEVMRI;
//# sourceMappingURL=validateAddressEVMRI.js.map