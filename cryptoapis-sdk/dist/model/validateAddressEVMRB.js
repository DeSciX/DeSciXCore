"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVMRB = void 0;
var ValidateAddressEVMRB = (function () {
    function ValidateAddressEVMRB() {
    }
    ValidateAddressEVMRB.getAttributeTypeMap = function () {
        return ValidateAddressEVMRB.attributeTypeMap;
    };
    ValidateAddressEVMRB.discriminator = undefined;
    ValidateAddressEVMRB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ValidateAddressEVMRBData"
        }
    ];
    return ValidateAddressEVMRB;
}());
exports.ValidateAddressEVMRB = ValidateAddressEVMRB;
//# sourceMappingURL=validateAddressEVMRB.js.map