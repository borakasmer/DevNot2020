/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/result", ["require", "exports"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    /**
     * A collection of publicly exported declarations from a module. Each declaration is evaluated
     * lazily upon request.
     */
    var ResolvedModule = /** @class */ (function () {
        function ResolvedModule(exports, evaluate) {
            this.exports = exports;
            this.evaluate = evaluate;
        }
        ResolvedModule.prototype.getExport = function (name) {
            if (!this.exports.has(name)) {
                return undefined;
            }
            return this.evaluate(this.exports.get(name));
        };
        ResolvedModule.prototype.getExports = function () {
            var _this = this;
            var map = new Map();
            this.exports.forEach(function (decl, name) { map.set(name, _this.evaluate(decl)); });
            return map;
        };
        return ResolvedModule;
    }());
    exports.ResolvedModule = ResolvedModule;
    /**
     * A value member of an enumeration.
     *
     * Contains a `Reference` to the enumeration itself, and the name of the referenced member.
     */
    var EnumValue = /** @class */ (function () {
        function EnumValue(enumRef, name, resolved) {
            this.enumRef = enumRef;
            this.name = name;
            this.resolved = resolved;
        }
        return EnumValue;
    }());
    exports.EnumValue = EnumValue;
    /**
     * An implementation of a builtin function, such as `Array.prototype.slice`.
     */
    var BuiltinFn = /** @class */ (function () {
        function BuiltinFn() {
        }
        return BuiltinFn;
    }());
    exports.BuiltinFn = BuiltinFn;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVzdWx0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9wYXJ0aWFsX2V2YWx1YXRvci9zcmMvcmVzdWx0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7O0lBb0NIOzs7T0FHRztJQUNIO1FBQ0Usd0JBQ1ksT0FBaUMsRUFDakMsUUFBOEM7WUFEOUMsWUFBTyxHQUFQLE9BQU8sQ0FBMEI7WUFDakMsYUFBUSxHQUFSLFFBQVEsQ0FBc0M7UUFBRyxDQUFDO1FBRTlELGtDQUFTLEdBQVQsVUFBVSxJQUFZO1lBQ3BCLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRTtnQkFDM0IsT0FBTyxTQUFTLENBQUM7YUFDbEI7WUFFRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFHLENBQUMsQ0FBQztRQUNqRCxDQUFDO1FBRUQsbUNBQVUsR0FBVjtZQUFBLGlCQUlDO1lBSEMsSUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQXlCLENBQUM7WUFDN0MsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBQyxJQUFJLEVBQUUsSUFBSSxJQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLEtBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQzlFLE9BQU8sR0FBRyxDQUFDO1FBQ2IsQ0FBQztRQUNILHFCQUFDO0lBQUQsQ0FBQyxBQWxCRCxJQWtCQztJQWxCWSx3Q0FBYztJQW9CM0I7Ozs7T0FJRztJQUNIO1FBQ0UsbUJBQ2EsT0FBc0MsRUFBVyxJQUFZLEVBQzdELFFBQXVCO1lBRHZCLFlBQU8sR0FBUCxPQUFPLENBQStCO1lBQVcsU0FBSSxHQUFKLElBQUksQ0FBUTtZQUM3RCxhQUFRLEdBQVIsUUFBUSxDQUFlO1FBQUcsQ0FBQztRQUMxQyxnQkFBQztJQUFELENBQUMsQUFKRCxJQUlDO0lBSlksOEJBQVM7SUFNdEI7O09BRUc7SUFDSDtRQUFBO1FBRUEsQ0FBQztRQUFELGdCQUFDO0lBQUQsQ0FBQyxBQUZELElBRUM7SUFGcUIsOEJBQVMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge1JlZmVyZW5jZX0gZnJvbSAnLi4vLi4vaW1wb3J0cyc7XG5pbXBvcnQge0RlY2xhcmF0aW9ufSBmcm9tICcuLi8uLi9yZWZsZWN0aW9uJztcblxuaW1wb3J0IHtEeW5hbWljVmFsdWV9IGZyb20gJy4vZHluYW1pYyc7XG5cblxuLyoqXG4gKiBBIHZhbHVlIHJlc3VsdGluZyBmcm9tIHN0YXRpYyByZXNvbHV0aW9uLlxuICpcbiAqIFRoaXMgY291bGQgYmUgYSBwcmltaXRpdmUsIGNvbGxlY3Rpb24gdHlwZSwgcmVmZXJlbmNlIHRvIGEgYHRzLk5vZGVgIHRoYXQgZGVjbGFyZXMgYVxuICogbm9uLXByaW1pdGl2ZSB2YWx1ZSwgb3IgYSBzcGVjaWFsIGBEeW5hbWljVmFsdWVgIHR5cGUgd2hpY2ggaW5kaWNhdGVzIHRoZSB2YWx1ZSB3YXMgbm90XG4gKiBhdmFpbGFibGUgc3RhdGljYWxseS5cbiAqL1xuZXhwb3J0IHR5cGUgUmVzb2x2ZWRWYWx1ZSA9IG51bWJlciB8IGJvb2xlYW4gfCBzdHJpbmcgfCBudWxsIHwgdW5kZWZpbmVkIHwgUmVmZXJlbmNlIHwgRW51bVZhbHVlIHxcbiAgICBSZXNvbHZlZFZhbHVlQXJyYXkgfCBSZXNvbHZlZFZhbHVlTWFwIHwgUmVzb2x2ZWRNb2R1bGUgfCBCdWlsdGluRm4gfCBEeW5hbWljVmFsdWU8dW5rbm93bj47XG5cbi8qKlxuICogQW4gYXJyYXkgb2YgYFJlc29sdmVkVmFsdWVgcy5cbiAqXG4gKiBUaGlzIGlzIGEgcmVpZmllZCB0eXBlIHRvIGFsbG93IHRoZSBjaXJjdWxhciByZWZlcmVuY2Ugb2YgYFJlc29sdmVkVmFsdWVgIC0+IGBSZXNvbHZlZFZhbHVlQXJyYXlgXG4gKiAtPiBgUmVzb2x2ZWRWYWx1ZWAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVzb2x2ZWRWYWx1ZUFycmF5IGV4dGVuZHMgQXJyYXk8UmVzb2x2ZWRWYWx1ZT4ge31cblxuLyoqXG4gKiBBIG1hcCBvZiBzdHJpbmdzIHRvIGBSZXNvbHZlZFZhbHVlYHMuXG4gKlxuICogVGhpcyBpcyBhIHJlaWZpZWQgdHlwZSB0byBhbGxvdyB0aGUgY2lyY3VsYXIgcmVmZXJlbmNlIG9mIGBSZXNvbHZlZFZhbHVlYCAtPiBgUmVzb2x2ZWRWYWx1ZU1hcGBcbiAqIC0+IGBSZXNvbHZlZFZhbHVlYC5cbiAqL1xuZXhwb3J0IGludGVyZmFjZSBSZXNvbHZlZFZhbHVlTWFwIGV4dGVuZHMgTWFwPHN0cmluZywgUmVzb2x2ZWRWYWx1ZT4ge31cblxuLyoqXG4gKiBBIGNvbGxlY3Rpb24gb2YgcHVibGljbHkgZXhwb3J0ZWQgZGVjbGFyYXRpb25zIGZyb20gYSBtb2R1bGUuIEVhY2ggZGVjbGFyYXRpb24gaXMgZXZhbHVhdGVkXG4gKiBsYXppbHkgdXBvbiByZXF1ZXN0LlxuICovXG5leHBvcnQgY2xhc3MgUmVzb2x2ZWRNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihcbiAgICAgIHByaXZhdGUgZXhwb3J0czogTWFwPHN0cmluZywgRGVjbGFyYXRpb24+LFxuICAgICAgcHJpdmF0ZSBldmFsdWF0ZTogKGRlY2w6IERlY2xhcmF0aW9uKSA9PiBSZXNvbHZlZFZhbHVlKSB7fVxuXG4gIGdldEV4cG9ydChuYW1lOiBzdHJpbmcpOiBSZXNvbHZlZFZhbHVlIHtcbiAgICBpZiAoIXRoaXMuZXhwb3J0cy5oYXMobmFtZSkpIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuZXZhbHVhdGUodGhpcy5leHBvcnRzLmdldChuYW1lKSAhKTtcbiAgfVxuXG4gIGdldEV4cG9ydHMoKTogUmVzb2x2ZWRWYWx1ZU1hcCB7XG4gICAgY29uc3QgbWFwID0gbmV3IE1hcDxzdHJpbmcsIFJlc29sdmVkVmFsdWU+KCk7XG4gICAgdGhpcy5leHBvcnRzLmZvckVhY2goKGRlY2wsIG5hbWUpID0+IHsgbWFwLnNldChuYW1lLCB0aGlzLmV2YWx1YXRlKGRlY2wpKTsgfSk7XG4gICAgcmV0dXJuIG1hcDtcbiAgfVxufVxuXG4vKipcbiAqIEEgdmFsdWUgbWVtYmVyIG9mIGFuIGVudW1lcmF0aW9uLlxuICpcbiAqIENvbnRhaW5zIGEgYFJlZmVyZW5jZWAgdG8gdGhlIGVudW1lcmF0aW9uIGl0c2VsZiwgYW5kIHRoZSBuYW1lIG9mIHRoZSByZWZlcmVuY2VkIG1lbWJlci5cbiAqL1xuZXhwb3J0IGNsYXNzIEVudW1WYWx1ZSB7XG4gIGNvbnN0cnVjdG9yKFxuICAgICAgcmVhZG9ubHkgZW51bVJlZjogUmVmZXJlbmNlPHRzLkVudW1EZWNsYXJhdGlvbj4sIHJlYWRvbmx5IG5hbWU6IHN0cmluZyxcbiAgICAgIHJlYWRvbmx5IHJlc29sdmVkOiBSZXNvbHZlZFZhbHVlKSB7fVxufVxuXG4vKipcbiAqIEFuIGltcGxlbWVudGF0aW9uIG9mIGEgYnVpbHRpbiBmdW5jdGlvbiwgc3VjaCBhcyBgQXJyYXkucHJvdG90eXBlLnNsaWNlYC5cbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJ1aWx0aW5GbiB7XG4gIGFic3RyYWN0IGV2YWx1YXRlKG5vZGU6IHRzLkNhbGxFeHByZXNzaW9uLCBhcmdzOiBSZXNvbHZlZFZhbHVlQXJyYXkpOiBSZXNvbHZlZFZhbHVlO1xufVxuIl19