"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRP400Response = void 0;
var ValidateAddressXRP400Response = (function () {
    function ValidateAddressXRP400Response() {
    }
    ValidateAddressXRP400Response.getAttributeTypeMap = function () {
        return ValidateAddressXRP400Response.attributeTypeMap;
    };
    ValidateAddressXRP400Response.discriminator = undefined;
    ValidateAddressXRP400Response.attributeTypeMap = [
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
            "type": "ValidateAddressXRPE400"
        }
    ];
    return ValidateAddressXRP400Response;
}());
exports.ValidateAddressXRP400Response = ValidateAddressXRP400Response;
//# sourceMappingURL=validateAddressXRP400Response.js.map