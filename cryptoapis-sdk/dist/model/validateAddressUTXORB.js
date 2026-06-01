"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressUTXORB = void 0;
var ValidateAddressUTXORB = (function () {
    function ValidateAddressUTXORB() {
    }
    ValidateAddressUTXORB.getAttributeTypeMap = function () {
        return ValidateAddressUTXORB.attributeTypeMap;
    };
    ValidateAddressUTXORB.discriminator = undefined;
    ValidateAddressUTXORB.attributeTypeMap = [
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "ValidateAddressUTXORBData"
        }
    ];
    return ValidateAddressUTXORB;
}());
exports.ValidateAddressUTXORB = ValidateAddressUTXORB;
//# sourceMappingURL=validateAddressUTXORB.js.map