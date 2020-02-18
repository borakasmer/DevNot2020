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
        define("@angular/compiler-cli/src/ngtsc/typecheck/src/oob", ["require", "exports", "typescript", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/typecheck/src/diagnostics"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var ts = require("typescript");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var diagnostics_2 = require("@angular/compiler-cli/src/ngtsc/typecheck/src/diagnostics");
    var OutOfBandDiagnosticRecorderImpl = /** @class */ (function () {
        function OutOfBandDiagnosticRecorderImpl(resolver) {
            this.resolver = resolver;
            this._diagnostics = [];
        }
        Object.defineProperty(OutOfBandDiagnosticRecorderImpl.prototype, "diagnostics", {
            get: function () { return this._diagnostics; },
            enumerable: true,
            configurable: true
        });
        OutOfBandDiagnosticRecorderImpl.prototype.missingReferenceTarget = function (templateId, ref) {
            var mapping = this.resolver.getSourceMapping(templateId);
            var value = ref.value.trim();
            var errorMsg = "No directive found with exportAs '" + value + "'.";
            this._diagnostics.push(diagnostics_2.makeTemplateDiagnostic(mapping, ref.valueSpan || ref.sourceSpan, ts.DiagnosticCategory.Error, diagnostics_1.ngErrorCode(diagnostics_1.ErrorCode.MISSING_REFERENCE_TARGET), errorMsg));
        };
        OutOfBandDiagnosticRecorderImpl.prototype.missingPipe = function (templateId, ast) {
            var mapping = this.resolver.getSourceMapping(templateId);
            var errorMsg = "No pipe found with name '" + ast.name + "'.";
            var sourceSpan = this.resolver.toParseSourceSpan(templateId, ast.nameSpan);
            if (sourceSpan === null) {
                throw new Error("Assertion failure: no SourceLocation found for usage of pipe '" + ast.name + "'.");
            }
            this._diagnostics.push(diagnostics_2.makeTemplateDiagnostic(mapping, sourceSpan, ts.DiagnosticCategory.Error, diagnostics_1.ngErrorCode(diagnostics_1.ErrorCode.MISSING_PIPE), errorMsg));
        };
        OutOfBandDiagnosticRecorderImpl.prototype.illegalAssignmentToTemplateVar = function (templateId, assignment, target) {
            var mapping = this.resolver.getSourceMapping(templateId);
            var errorMsg = "Cannot use variable '" + assignment.name + "' as the left-hand side of an assignment expression. Template variables are read-only.";
            var sourceSpan = this.resolver.toParseSourceSpan(templateId, assignment.sourceSpan);
            if (sourceSpan === null) {
                throw new Error("Assertion failure: no SourceLocation found for property binding.");
            }
            this._diagnostics.push(diagnostics_2.makeTemplateDiagnostic(mapping, sourceSpan, ts.DiagnosticCategory.Error, diagnostics_1.ngErrorCode(diagnostics_1.ErrorCode.WRITE_TO_READ_ONLY_VARIABLE), errorMsg, {
                text: "The variable " + assignment.name + " is declared here.",
                span: target.valueSpan || target.sourceSpan,
            }));
        };
        return OutOfBandDiagnosticRecorderImpl;
    }());
    exports.OutOfBandDiagnosticRecorderImpl = OutOfBandDiagnosticRecorderImpl;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib29iLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy90eXBlY2hlY2svc3JjL29vYi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUdILCtCQUFpQztJQUVqQywyRUFBeUQ7SUFHekQseUZBQTZFO0lBd0M3RTtRQUdFLHlDQUFvQixRQUFnQztZQUFoQyxhQUFRLEdBQVIsUUFBUSxDQUF3QjtZQUY1QyxpQkFBWSxHQUFvQixFQUFFLENBQUM7UUFFWSxDQUFDO1FBRXhELHNCQUFJLHdEQUFXO2lCQUFmLGNBQWtELE9BQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7OztXQUFBO1FBRTdFLGdFQUFzQixHQUF0QixVQUF1QixVQUFzQixFQUFFLEdBQXFCO1lBQ2xFLElBQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0QsSUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUUvQixJQUFNLFFBQVEsR0FBRyx1Q0FBcUMsS0FBSyxPQUFJLENBQUM7WUFDaEUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsb0NBQXNCLENBQ3pDLE9BQU8sRUFBRSxHQUFHLENBQUMsU0FBUyxJQUFJLEdBQUcsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFDckUseUJBQVcsQ0FBQyx1QkFBUyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQztRQUNsRSxDQUFDO1FBRUQscURBQVcsR0FBWCxVQUFZLFVBQXNCLEVBQUUsR0FBZ0I7WUFDbEQsSUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLFFBQVEsQ0FBQyxnQkFBZ0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMzRCxJQUFNLFFBQVEsR0FBRyw4QkFBNEIsR0FBRyxDQUFDLElBQUksT0FBSSxDQUFDO1lBRTFELElBQU0sVUFBVSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsaUJBQWlCLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUM3RSxJQUFJLFVBQVUsS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZCLE1BQU0sSUFBSSxLQUFLLENBQ1gsbUVBQWlFLEdBQUcsQ0FBQyxJQUFJLE9BQUksQ0FBQyxDQUFDO2FBQ3BGO1lBQ0QsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsb0NBQXNCLENBQ3pDLE9BQU8sRUFBRSxVQUFVLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSx5QkFBVyxDQUFDLHVCQUFTLENBQUMsWUFBWSxDQUFDLEVBQ3JGLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDakIsQ0FBQztRQUVELHdFQUE4QixHQUE5QixVQUNJLFVBQXNCLEVBQUUsVUFBeUIsRUFBRSxNQUF1QjtZQUM1RSxJQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNELElBQU0sUUFBUSxHQUNWLDBCQUF3QixVQUFVLENBQUMsSUFBSSwyRkFBd0YsQ0FBQztZQUVwSSxJQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLGlCQUFpQixDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDdEYsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO2dCQUN2QixNQUFNLElBQUksS0FBSyxDQUFDLGtFQUFrRSxDQUFDLENBQUM7YUFDckY7WUFDRCxJQUFJLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxvQ0FBc0IsQ0FDekMsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsa0JBQWtCLENBQUMsS0FBSyxFQUNoRCx5QkFBVyxDQUFDLHVCQUFTLENBQUMsMkJBQTJCLENBQUMsRUFBRSxRQUFRLEVBQUU7Z0JBQzVELElBQUksRUFBRSxrQkFBZ0IsVUFBVSxDQUFDLElBQUksdUJBQW9CO2dCQUN6RCxJQUFJLEVBQUUsTUFBTSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsVUFBVTthQUM1QyxDQUFDLENBQUMsQ0FBQztRQUNWLENBQUM7UUFDSCxzQ0FBQztJQUFELENBQUMsQUFoREQsSUFnREM7SUFoRFksMEVBQStCIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBAbGljZW5zZVxuICogQ29weXJpZ2h0IEdvb2dsZSBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG4gKlxuICogVXNlIG9mIHRoaXMgc291cmNlIGNvZGUgaXMgZ292ZXJuZWQgYnkgYW4gTUlULXN0eWxlIGxpY2Vuc2UgdGhhdCBjYW4gYmVcbiAqIGZvdW5kIGluIHRoZSBMSUNFTlNFIGZpbGUgYXQgaHR0cHM6Ly9hbmd1bGFyLmlvL2xpY2Vuc2VcbiAqL1xuXG5pbXBvcnQge0JpbmRpbmdQaXBlLCBQcm9wZXJ0eVdyaXRlLCBUbXBsQXN0UmVmZXJlbmNlLCBUbXBsQXN0VmFyaWFibGV9IGZyb20gJ0Bhbmd1bGFyL2NvbXBpbGVyJztcbmltcG9ydCAqIGFzIHRzIGZyb20gJ3R5cGVzY3JpcHQnO1xuXG5pbXBvcnQge0Vycm9yQ29kZSwgbmdFcnJvckNvZGV9IGZyb20gJy4uLy4uL2RpYWdub3N0aWNzJztcblxuaW1wb3J0IHtUZW1wbGF0ZUlkfSBmcm9tICcuL2FwaSc7XG5pbXBvcnQge1RlbXBsYXRlU291cmNlUmVzb2x2ZXIsIG1ha2VUZW1wbGF0ZURpYWdub3N0aWN9IGZyb20gJy4vZGlhZ25vc3RpY3MnO1xuXG5cblxuLyoqXG4gKiBDb2xsZWN0cyBgdHMuRGlhZ25vc3RpY2BzIG9uIHByb2JsZW1zIHdoaWNoIG9jY3VyIGluIHRoZSB0ZW1wbGF0ZSB3aGljaCBhcmVuJ3QgZGlyZWN0bHkgc291cmNlZFxuICogZnJvbSBUeXBlIENoZWNrIEJsb2Nrcy5cbiAqXG4gKiBEdXJpbmcgdGhlIGNyZWF0aW9uIG9mIGEgVHlwZSBDaGVjayBCbG9jaywgdGhlIHRlbXBsYXRlIGlzIHRyYXZlcnNlZCBhbmQgdGhlXG4gKiBgT3V0T2ZCYW5kRGlhZ25vc3RpY1JlY29yZGVyYCBpcyBjYWxsZWQgdG8gcmVjb3JkIGNhc2VzIHdoZW4gYSBjb3JyZWN0IGludGVycHJldGF0aW9uIGZvciB0aGVcbiAqIHRlbXBsYXRlIGNhbm5vdCBiZSBmb3VuZC4gVGhlc2Ugb3BlcmF0aW9ucyBjcmVhdGUgYHRzLkRpYWdub3N0aWNgcyB3aGljaCBhcmUgc3RvcmVkIGJ5IHRoZVxuICogcmVjb3JkZXIgZm9yIGxhdGVyIGRpc3BsYXkuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgT3V0T2ZCYW5kRGlhZ25vc3RpY1JlY29yZGVyIHtcbiAgcmVhZG9ubHkgZGlhZ25vc3RpY3M6IFJlYWRvbmx5QXJyYXk8dHMuRGlhZ25vc3RpYz47XG5cbiAgLyoqXG4gICAqIFJlcG9ydHMgYSBgI3JlZj1cInRhcmdldFwiYCBleHByZXNzaW9uIGluIHRoZSB0ZW1wbGF0ZSBmb3Igd2hpY2ggYSB0YXJnZXQgZGlyZWN0aXZlIGNvdWxkIG5vdCBiZVxuICAgKiBmb3VuZC5cbiAgICpcbiAgICogQHBhcmFtIHRlbXBsYXRlSWQgdGhlIHRlbXBsYXRlIHR5cGUtY2hlY2tpbmcgSUQgb2YgdGhlIHRlbXBsYXRlIHdoaWNoIGNvbnRhaW5zIHRoZSBicm9rZW5cbiAgICogcmVmZXJlbmNlLlxuICAgKiBAcGFyYW0gcmVmIHRoZSBgVG1wbEFzdFJlZmVyZW5jZWAgd2hpY2ggY291bGQgbm90IGJlIG1hdGNoZWQgdG8gYSBkaXJlY3RpdmUuXG4gICAqL1xuICBtaXNzaW5nUmVmZXJlbmNlVGFyZ2V0KHRlbXBsYXRlSWQ6IFRlbXBsYXRlSWQsIHJlZjogVG1wbEFzdFJlZmVyZW5jZSk6IHZvaWQ7XG5cbiAgLyoqXG4gICAqIFJlcG9ydHMgdXNhZ2Ugb2YgYSBgfCBwaXBlYCBleHByZXNzaW9uIGluIHRoZSB0ZW1wbGF0ZSBmb3Igd2hpY2ggdGhlIG5hbWVkIHBpcGUgY291bGQgbm90IGJlXG4gICAqIGZvdW5kLlxuICAgKlxuICAgKiBAcGFyYW0gdGVtcGxhdGVJZCB0aGUgdGVtcGxhdGUgdHlwZS1jaGVja2luZyBJRCBvZiB0aGUgdGVtcGxhdGUgd2hpY2ggY29udGFpbnMgdGhlIHVua25vd25cbiAgICogcGlwZS5cbiAgICogQHBhcmFtIGFzdCB0aGUgYEJpbmRpbmdQaXBlYCBpbnZvY2F0aW9uIG9mIHRoZSBwaXBlIHdoaWNoIGNvdWxkIG5vdCBiZSBmb3VuZC5cbiAgICovXG4gIG1pc3NpbmdQaXBlKHRlbXBsYXRlSWQ6IFRlbXBsYXRlSWQsIGFzdDogQmluZGluZ1BpcGUpOiB2b2lkO1xuXG4gIGlsbGVnYWxBc3NpZ25tZW50VG9UZW1wbGF0ZVZhcihcbiAgICAgIHRlbXBsYXRlSWQ6IFRlbXBsYXRlSWQsIGFzc2lnbm1lbnQ6IFByb3BlcnR5V3JpdGUsIHRhcmdldDogVG1wbEFzdFZhcmlhYmxlKTogdm9pZDtcbn1cblxuZXhwb3J0IGNsYXNzIE91dE9mQmFuZERpYWdub3N0aWNSZWNvcmRlckltcGwgaW1wbGVtZW50cyBPdXRPZkJhbmREaWFnbm9zdGljUmVjb3JkZXIge1xuICBwcml2YXRlIF9kaWFnbm9zdGljczogdHMuRGlhZ25vc3RpY1tdID0gW107XG5cbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZXNvbHZlcjogVGVtcGxhdGVTb3VyY2VSZXNvbHZlcikge31cblxuICBnZXQgZGlhZ25vc3RpY3MoKTogUmVhZG9ubHlBcnJheTx0cy5EaWFnbm9zdGljPiB7IHJldHVybiB0aGlzLl9kaWFnbm9zdGljczsgfVxuXG4gIG1pc3NpbmdSZWZlcmVuY2VUYXJnZXQodGVtcGxhdGVJZDogVGVtcGxhdGVJZCwgcmVmOiBUbXBsQXN0UmVmZXJlbmNlKTogdm9pZCB7XG4gICAgY29uc3QgbWFwcGluZyA9IHRoaXMucmVzb2x2ZXIuZ2V0U291cmNlTWFwcGluZyh0ZW1wbGF0ZUlkKTtcbiAgICBjb25zdCB2YWx1ZSA9IHJlZi52YWx1ZS50cmltKCk7XG5cbiAgICBjb25zdCBlcnJvck1zZyA9IGBObyBkaXJlY3RpdmUgZm91bmQgd2l0aCBleHBvcnRBcyAnJHt2YWx1ZX0nLmA7XG4gICAgdGhpcy5fZGlhZ25vc3RpY3MucHVzaChtYWtlVGVtcGxhdGVEaWFnbm9zdGljKFxuICAgICAgICBtYXBwaW5nLCByZWYudmFsdWVTcGFuIHx8IHJlZi5zb3VyY2VTcGFuLCB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICAgIG5nRXJyb3JDb2RlKEVycm9yQ29kZS5NSVNTSU5HX1JFRkVSRU5DRV9UQVJHRVQpLCBlcnJvck1zZykpO1xuICB9XG5cbiAgbWlzc2luZ1BpcGUodGVtcGxhdGVJZDogVGVtcGxhdGVJZCwgYXN0OiBCaW5kaW5nUGlwZSk6IHZvaWQge1xuICAgIGNvbnN0IG1hcHBpbmcgPSB0aGlzLnJlc29sdmVyLmdldFNvdXJjZU1hcHBpbmcodGVtcGxhdGVJZCk7XG4gICAgY29uc3QgZXJyb3JNc2cgPSBgTm8gcGlwZSBmb3VuZCB3aXRoIG5hbWUgJyR7YXN0Lm5hbWV9Jy5gO1xuXG4gICAgY29uc3Qgc291cmNlU3BhbiA9IHRoaXMucmVzb2x2ZXIudG9QYXJzZVNvdXJjZVNwYW4odGVtcGxhdGVJZCwgYXN0Lm5hbWVTcGFuKTtcbiAgICBpZiAoc291cmNlU3BhbiA9PT0gbnVsbCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBBc3NlcnRpb24gZmFpbHVyZTogbm8gU291cmNlTG9jYXRpb24gZm91bmQgZm9yIHVzYWdlIG9mIHBpcGUgJyR7YXN0Lm5hbWV9Jy5gKTtcbiAgICB9XG4gICAgdGhpcy5fZGlhZ25vc3RpY3MucHVzaChtYWtlVGVtcGxhdGVEaWFnbm9zdGljKFxuICAgICAgICBtYXBwaW5nLCBzb3VyY2VTcGFuLCB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsIG5nRXJyb3JDb2RlKEVycm9yQ29kZS5NSVNTSU5HX1BJUEUpLFxuICAgICAgICBlcnJvck1zZykpO1xuICB9XG5cbiAgaWxsZWdhbEFzc2lnbm1lbnRUb1RlbXBsYXRlVmFyKFxuICAgICAgdGVtcGxhdGVJZDogVGVtcGxhdGVJZCwgYXNzaWdubWVudDogUHJvcGVydHlXcml0ZSwgdGFyZ2V0OiBUbXBsQXN0VmFyaWFibGUpOiB2b2lkIHtcbiAgICBjb25zdCBtYXBwaW5nID0gdGhpcy5yZXNvbHZlci5nZXRTb3VyY2VNYXBwaW5nKHRlbXBsYXRlSWQpO1xuICAgIGNvbnN0IGVycm9yTXNnID1cbiAgICAgICAgYENhbm5vdCB1c2UgdmFyaWFibGUgJyR7YXNzaWdubWVudC5uYW1lfScgYXMgdGhlIGxlZnQtaGFuZCBzaWRlIG9mIGFuIGFzc2lnbm1lbnQgZXhwcmVzc2lvbi4gVGVtcGxhdGUgdmFyaWFibGVzIGFyZSByZWFkLW9ubHkuYDtcblxuICAgIGNvbnN0IHNvdXJjZVNwYW4gPSB0aGlzLnJlc29sdmVyLnRvUGFyc2VTb3VyY2VTcGFuKHRlbXBsYXRlSWQsIGFzc2lnbm1lbnQuc291cmNlU3Bhbik7XG4gICAgaWYgKHNvdXJjZVNwYW4gPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgQXNzZXJ0aW9uIGZhaWx1cmU6IG5vIFNvdXJjZUxvY2F0aW9uIGZvdW5kIGZvciBwcm9wZXJ0eSBiaW5kaW5nLmApO1xuICAgIH1cbiAgICB0aGlzLl9kaWFnbm9zdGljcy5wdXNoKG1ha2VUZW1wbGF0ZURpYWdub3N0aWMoXG4gICAgICAgIG1hcHBpbmcsIHNvdXJjZVNwYW4sIHRzLkRpYWdub3N0aWNDYXRlZ29yeS5FcnJvcixcbiAgICAgICAgbmdFcnJvckNvZGUoRXJyb3JDb2RlLldSSVRFX1RPX1JFQURfT05MWV9WQVJJQUJMRSksIGVycm9yTXNnLCB7XG4gICAgICAgICAgdGV4dDogYFRoZSB2YXJpYWJsZSAke2Fzc2lnbm1lbnQubmFtZX0gaXMgZGVjbGFyZWQgaGVyZS5gLFxuICAgICAgICAgIHNwYW46IHRhcmdldC52YWx1ZVNwYW4gfHwgdGFyZ2V0LnNvdXJjZVNwYW4sXG4gICAgICAgIH0pKTtcbiAgfVxufVxuIl19