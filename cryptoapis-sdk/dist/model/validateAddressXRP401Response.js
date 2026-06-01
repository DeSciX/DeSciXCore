"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRP401Response = void 0;
var ValidateAddressXRP401Response = (function () {
    function ValidateAddressXRP401Response() {
    }
    ValidateAddressXRP401Response.getAttributeTypeMap = function () {
        return ValidateAddressXRP401Response.attributeTypeMap;
    };
    ValidateAddressXRP401Response.discriminator = undefined;
    ValidateAddressXRP401Response.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "error",
            "baseName": "error",
            "type": "ValidateAddressXRPE401"
        }
    ];
    return ValidateAddressXRP401Response;
}());
exports.ValidateAddressXRP401Response = ValidateAddressXRP401Response;
//# sourceMappingURL=validateAddressXRP401Response.js.map