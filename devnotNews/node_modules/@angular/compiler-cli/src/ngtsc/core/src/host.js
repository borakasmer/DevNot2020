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
        define("@angular/compiler-cli/src/ngtsc/core/src/host", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/diagnostics", "@angular/compiler-cli/src/ngtsc/entry_point", "@angular/compiler-cli/src/ngtsc/file_system", "@angular/compiler-cli/src/ngtsc/shims", "@angular/compiler-cli/src/ngtsc/typecheck", "@angular/compiler-cli/src/ngtsc/util/src/path", "@angular/compiler-cli/src/ngtsc/util/src/typescript"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    var ts = require("typescript");
    var diagnostics_1 = require("@angular/compiler-cli/src/ngtsc/diagnostics");
    var entry_point_1 = require("@angular/compiler-cli/src/ngtsc/entry_point");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    var shims_1 = require("@angular/compiler-cli/src/ngtsc/shims");
    var typecheck_1 = require("@angular/compiler-cli/src/ngtsc/typecheck");
    var path_1 = require("@angular/compiler-cli/src/ngtsc/util/src/path");
    var typescript_1 = require("@angular/compiler-cli/src/ngtsc/util/src/typescript");
    /**
     * Delegates all methods of `ExtendedTsCompilerHost` to a delegate, with the exception of
     * `getSourceFile` and `fileExists` which are implemented in `NgCompilerHost`.
     *
     * If a new method is added to `ts.CompilerHost` which is not delegated, a type error will be
     * generated for this class.
     */
    var DelegatingCompilerHost = /** @class */ (function () {
        function DelegatingCompilerHost(delegate) {
            this.delegate = delegate;
            // Excluded are 'getSourceFile' and 'fileExists', which are actually implemented by NgCompilerHost
            // below.
            this.createHash = this.delegateMethod('createHash');
            this.directoryExists = this.delegateMethod('directoryExists');
            this.fileNameToModuleName = this.delegateMethod('fileNameToModuleName');
            this.getCancellationToken = this.delegateMethod('getCancellationToken');
            this.getCanonicalFileName = this.delegateMethod('getCanonicalFileName');
            this.getCurrentDirectory = this.delegateMethod('getCurrentDirectory');
            this.getDefaultLibFileName = this.delegateMethod('getDefaultLibFileName');
            this.getDefaultLibLocation = this.delegateMethod('getDefaultLibLocation');
            this.getDirectories = this.delegateMethod('getDirectories');
            this.getEnvironmentVariable = this.delegateMethod('getEnvironmentVariable');
            this.getModifiedResourceFiles = this.delegateMethod('getModifiedResourceFiles');
            this.getNewLine = this.delegateMethod('getNewLine');
            this.getParsedCommandLine = this.delegateMethod('getParsedCommandLine');
            this.getSourceFileByPath = this.delegateMethod('getSourceFileByPath');
            this.readDirectory = this.delegateMethod('readDirectory');
            this.readFile = this.delegateMethod('readFile');
            this.readResource = this.delegateMethod('readResource');
            this.realpath = this.delegateMethod('realpath');
            this.resolveModuleNames = this.delegateMethod('resolveModuleNames');
            this.resolveTypeReferenceDirectives = this.delegateMethod('resolveTypeReferenceDirectives');
            this.resourceNameToFileName = this.delegateMethod('resourceNameToFileName');
            this.trace = this.delegateMethod('trace');
            this.useCaseSensitiveFileNames = this.delegateMethod('useCaseSensitiveFileNames');
            this.writeFile = this.delegateMethod('writeFile');
        }
        DelegatingCompilerHost.prototype.delegateMethod = function (name) {
            return this.delegate[name] !== undefined ? this.delegate[name].bind(this.delegate) :
                undefined;
        };
        return DelegatingCompilerHost;
    }());
    exports.DelegatingCompilerHost = DelegatingCompilerHost;
    /**
     * A wrapper around `ts.CompilerHost` (plus any extension methods from `ExtendedTsCompilerHost`).
     *
     * In order for a consumer to include Angular compilation in their TypeScript compiler, the
     * `ts.Program` must be created with a host that adds Angular-specific files (e.g. factories,
     * summaries, the template type-checking file, etc) to the compilation. `NgCompilerHost` is the
     * host implementation which supports this.
     *
     * The interface implementations here ensure that `NgCompilerHost` fully delegates to
     * `ExtendedTsCompilerHost` methods whenever present.
     */
    var NgCompilerHost = /** @class */ (function (_super) {
        tslib_1.__extends(NgCompilerHost, _super);
        function NgCompilerHost(delegate, inputFiles, rootDirs, shims, entryPoint, typeCheckFile, factoryTracker, diagnostics) {
            var _this = _super.call(this, delegate) || this;
            _this.shims = shims;
            _this.factoryTracker = null;
            _this.entryPoint = null;
            _this.factoryTracker = factoryTracker;
            _this.entryPoint = entryPoint;
            _this.typeCheckFile = typeCheckFile;
            _this.diagnostics = diagnostics;
            _this.inputFiles = inputFiles;
            _this.rootDirs = rootDirs;
            return _this;
        }
        /**
         * Create an `NgCompilerHost` from a delegate host, an array of input filenames, and the full set
         * of TypeScript and Angular compiler options.
         */
        NgCompilerHost.wrap = function (delegate, inputFiles, options) {
            // TODO(alxhub): remove the fallback to allowEmptyCodegenFiles after verifying that the rest of
            // our build tooling is no longer relying on it.
            var allowEmptyCodegenFiles = options.allowEmptyCodegenFiles || false;
            var shouldGenerateFactoryShims = options.generateNgFactoryShims !== undefined ?
                options.generateNgFactoryShims :
                allowEmptyCodegenFiles;
            var shouldGenerateSummaryShims = options.generateNgSummaryShims !== undefined ?
                options.generateNgSummaryShims :
                allowEmptyCodegenFiles;
            var rootFiles = tslib_1.__spread(inputFiles);
            var normalizedInputFiles = inputFiles.map(function (n) { return file_system_1.resolve(n); });
            var generators = [];
            var summaryGenerator = null;
            if (shouldGenerateSummaryShims) {
                // Summary generation.
                summaryGenerator = shims_1.SummaryGenerator.forRootFiles(normalizedInputFiles);
                generators.push(summaryGenerator);
            }
            var factoryTracker = null;
            if (shouldGenerateFactoryShims) {
                // Factory generation.
                var factoryGenerator = shims_1.FactoryGenerator.forRootFiles(normalizedInputFiles);
                var factoryFileMap = factoryGenerator.factoryFileMap;
                var factoryFileNames = Array.from(factoryFileMap.keys());
                rootFiles.push.apply(rootFiles, tslib_1.__spread(factoryFileNames));
                generators.push(factoryGenerator);
                factoryTracker = new shims_1.FactoryTracker(factoryGenerator);
            }
            // Done separately to preserve the order of factory files before summary files in rootFiles.
            // TODO(alxhub): validate that this is necessary.
            if (summaryGenerator !== null) {
                rootFiles.push.apply(rootFiles, tslib_1.__spread(summaryGenerator.getSummaryFileNames()));
            }
            var rootDirs = typescript_1.getRootDirs(delegate, options);
            var typeCheckFile = typecheck_1.typeCheckFilePath(rootDirs);
            generators.push(new shims_1.TypeCheckShimGenerator(typeCheckFile));
            rootFiles.push(typeCheckFile);
            var diagnostics = [];
            var entryPoint = null;
            if (options.flatModuleOutFile != null && options.flatModuleOutFile !== '') {
                entryPoint = entry_point_1.findFlatIndexEntryPoint(normalizedInputFiles);
                if (entryPoint === null) {
                    // This error message talks specifically about having a single .ts file in "files". However
                    // the actual logic is a bit more permissive. If a single file exists, that will be taken,
                    // otherwise the highest level (shortest path) "index.ts" file will be used as the flat
                    // module entry point instead. If neither of these conditions apply, the error below is
                    // given.
                    //
                    // The user is not informed about the "index.ts" option as this behavior is deprecated -
                    // an explicit entrypoint should always be specified.
                    diagnostics.push({
                        category: ts.DiagnosticCategory.Error,
                        code: diagnostics_1.ngErrorCode(diagnostics_1.ErrorCode.CONFIG_FLAT_MODULE_NO_INDEX),
                        file: undefined,
                        start: undefined,
                        length: undefined,
                        messageText: 'Angular compiler option "flatModuleOutFile" requires one and only one .ts file in the "files" field.',
                    });
                }
                else {
                    var flatModuleId = options.flatModuleId || null;
                    var flatModuleOutFile = path_1.normalizeSeparators(options.flatModuleOutFile);
                    var flatIndexGenerator = new entry_point_1.FlatIndexGenerator(entryPoint, flatModuleOutFile, flatModuleId);
                    generators.push(flatIndexGenerator);
                    rootFiles.push(flatIndexGenerator.flatIndexPath);
                }
            }
            return new NgCompilerHost(delegate, rootFiles, rootDirs, generators, entryPoint, typeCheckFile, factoryTracker, diagnostics);
        };
        NgCompilerHost.prototype.getSourceFile = function (fileName, languageVersion, onError, shouldCreateNewSourceFile) {
            var _this = this;
            for (var i = 0; i < this.shims.length; i++) {
                var generator = this.shims[i];
                // TypeScript internal paths are guaranteed to be POSIX-like absolute file paths.
                var absoluteFsPath = file_system_1.resolve(fileName);
                if (generator.recognize(absoluteFsPath)) {
                    var readFile = function (originalFile) {
                        return _this.delegate.getSourceFile(originalFile, languageVersion, onError, shouldCreateNewSourceFile) ||
                            null;
                    };
                    return generator.generate(absoluteFsPath, readFile) || undefined;
                }
            }
            return this.delegate.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
        };
        NgCompilerHost.prototype.fileExists = function (fileName) {
            // Consider the file as existing whenever
            //  1) it really does exist in the delegate host, or
            //  2) at least one of the shim generators recognizes it
            // Note that we can pass the file name as branded absolute fs path because TypeScript
            // internally only passes POSIX-like paths.
            return this.delegate.fileExists(fileName) ||
                this.shims.some(function (shim) { return shim.recognize(file_system_1.resolve(fileName)); });
        };
        Object.defineProperty(NgCompilerHost.prototype, "unifiedModulesHost", {
            get: function () {
                return this.fileNameToModuleName !== undefined ? this : null;
            },
            enumerable: true,
            configurable: true
        });
        return NgCompilerHost;
    }(DelegatingCompilerHost));
    exports.NgCompilerHost = NgCompilerHost;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9zdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL3BhY2thZ2VzL2NvbXBpbGVyLWNsaS9zcmMvbmd0c2MvY29yZS9zcmMvaG9zdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7Ozs7SUFFSCwrQkFBaUM7SUFFakMsMkVBQXlEO0lBQ3pELDJFQUE4RTtJQUM5RSwyRUFBMEQ7SUFDMUQsK0RBQXNIO0lBQ3RILHVFQUFrRDtJQUNsRCxzRUFBd0Q7SUFDeEQsa0ZBQXNEO0lBaUJ0RDs7Ozs7O09BTUc7SUFDSDtRQUVFLGdDQUFzQixRQUFnQztZQUFoQyxhQUFRLEdBQVIsUUFBUSxDQUF3QjtZQVF0RCxrR0FBa0c7WUFDbEcsU0FBUztZQUNULGVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFlBQVksQ0FBQyxDQUFDO1lBQy9DLG9CQUFlLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ3pELHlCQUFvQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsc0JBQXNCLENBQUMsQ0FBQztZQUNuRSx5QkFBb0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLHNCQUFzQixDQUFDLENBQUM7WUFDbkUseUJBQW9CLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ25FLHdCQUFtQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNqRSwwQkFBcUIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7WUFDckUsMEJBQXFCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyx1QkFBdUIsQ0FBQyxDQUFDO1lBQ3JFLG1CQUFjLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1lBQ3ZELDJCQUFzQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztZQUN2RSw2QkFBd0IsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLDBCQUEwQixDQUFDLENBQUM7WUFDM0UsZUFBVSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsWUFBWSxDQUFDLENBQUM7WUFDL0MseUJBQW9CLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1lBQ25FLHdCQUFtQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztZQUNqRSxrQkFBYSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsZUFBZSxDQUFDLENBQUM7WUFDckQsYUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLENBQUM7WUFDM0MsaUJBQVksR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ25ELGFBQVEsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1lBQzNDLHVCQUFrQixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsb0JBQW9CLENBQUMsQ0FBQztZQUMvRCxtQ0FBOEIsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7WUFDdkYsMkJBQXNCLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO1lBQ3ZFLFVBQUssR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQ3JDLDhCQUF5QixHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsMkJBQTJCLENBQUMsQ0FBQztZQUM3RSxjQUFTLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQWpDWSxDQUFDO1FBRWxELCtDQUFjLEdBQXRCLFVBQStELElBQU87WUFFcEUsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7Z0JBQ2xELFNBQVMsQ0FBQztRQUN2RCxDQUFDO1FBNEJILDZCQUFDO0lBQUQsQ0FBQyxBQXBDRCxJQW9DQztJQXBDWSx3REFBc0I7SUFzQ25DOzs7Ozs7Ozs7O09BVUc7SUFDSDtRQUFvQywwQ0FBc0I7UUFXeEQsd0JBQ0ksUUFBZ0MsRUFBRSxVQUFpQyxFQUNuRSxRQUF1QyxFQUFVLEtBQXNCLEVBQ3ZFLFVBQStCLEVBQUUsYUFBNkIsRUFDOUQsY0FBbUMsRUFBRSxXQUE0QjtZQUpyRSxZQUtFLGtCQUFNLFFBQVEsQ0FBQyxTQVFoQjtZQVhvRCxXQUFLLEdBQUwsS0FBSyxDQUFpQjtZQVZsRSxvQkFBYyxHQUF3QixJQUFJLENBQUM7WUFDM0MsZ0JBQVUsR0FBd0IsSUFBSSxDQUFDO1lBYzlDLEtBQUksQ0FBQyxjQUFjLEdBQUcsY0FBYyxDQUFDO1lBQ3JDLEtBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLEtBQUksQ0FBQyxhQUFhLEdBQUcsYUFBYSxDQUFDO1lBQ25DLEtBQUksQ0FBQyxXQUFXLEdBQUcsV0FBVyxDQUFDO1lBQy9CLEtBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1lBQzdCLEtBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDOztRQUMzQixDQUFDO1FBRUQ7OztXQUdHO1FBQ0ksbUJBQUksR0FBWCxVQUNJLFFBQXlCLEVBQUUsVUFBaUMsRUFDNUQsT0FBMEI7WUFDNUIsK0ZBQStGO1lBQy9GLGdEQUFnRDtZQUNoRCxJQUFNLHNCQUFzQixHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsSUFBSSxLQUFLLENBQUM7WUFDdkUsSUFBTSwwQkFBMEIsR0FBRyxPQUFPLENBQUMsc0JBQXNCLEtBQUssU0FBUyxDQUFDLENBQUM7Z0JBQzdFLE9BQU8sQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2dCQUNoQyxzQkFBc0IsQ0FBQztZQUUzQixJQUFNLDBCQUEwQixHQUFHLE9BQU8sQ0FBQyxzQkFBc0IsS0FBSyxTQUFTLENBQUMsQ0FBQztnQkFDN0UsT0FBTyxDQUFDLHNCQUFzQixDQUFDLENBQUM7Z0JBQ2hDLHNCQUFzQixDQUFDO1lBRTNCLElBQUksU0FBUyxvQkFBTyxVQUFVLENBQUMsQ0FBQztZQUNoQyxJQUFJLG9CQUFvQixHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsVUFBQSxDQUFDLElBQUksT0FBQSxxQkFBTyxDQUFDLENBQUMsQ0FBQyxFQUFWLENBQVUsQ0FBQyxDQUFDO1lBRTNELElBQU0sVUFBVSxHQUFvQixFQUFFLENBQUM7WUFDdkMsSUFBSSxnQkFBZ0IsR0FBMEIsSUFBSSxDQUFDO1lBRW5ELElBQUksMEJBQTBCLEVBQUU7Z0JBQzlCLHNCQUFzQjtnQkFDdEIsZ0JBQWdCLEdBQUcsd0JBQWdCLENBQUMsWUFBWSxDQUFDLG9CQUFvQixDQUFDLENBQUM7Z0JBQ3ZFLFVBQVUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzthQUNuQztZQUVELElBQUksY0FBYyxHQUF3QixJQUFJLENBQUM7WUFDL0MsSUFBSSwwQkFBMEIsRUFBRTtnQkFDOUIsc0JBQXNCO2dCQUN0QixJQUFNLGdCQUFnQixHQUFHLHdCQUFnQixDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO2dCQUM3RSxJQUFNLGNBQWMsR0FBRyxnQkFBZ0IsQ0FBQyxjQUFjLENBQUM7Z0JBRXZELElBQU0sZ0JBQWdCLEdBQUcsS0FBSyxDQUFDLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDM0QsU0FBUyxDQUFDLElBQUksT0FBZCxTQUFTLG1CQUFTLGdCQUFnQixHQUFFO2dCQUNwQyxVQUFVLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUM7Z0JBRWxDLGNBQWMsR0FBRyxJQUFJLHNCQUFjLENBQUMsZ0JBQWdCLENBQUMsQ0FBQzthQUN2RDtZQUVELDRGQUE0RjtZQUM1RixpREFBaUQ7WUFDakQsSUFBSSxnQkFBZ0IsS0FBSyxJQUFJLEVBQUU7Z0JBQzdCLFNBQVMsQ0FBQyxJQUFJLE9BQWQsU0FBUyxtQkFBUyxnQkFBZ0IsQ0FBQyxtQkFBbUIsRUFBRSxHQUFFO2FBQzNEO1lBR0QsSUFBTSxRQUFRLEdBQUcsd0JBQVcsQ0FBQyxRQUFRLEVBQUUsT0FBNkIsQ0FBQyxDQUFDO1lBRXRFLElBQU0sYUFBYSxHQUFHLDZCQUFpQixDQUFDLFFBQVEsQ0FBQyxDQUFDO1lBQ2xELFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSw4QkFBc0IsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDO1lBQzNELFNBQVMsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUM7WUFFOUIsSUFBSSxXQUFXLEdBQW9CLEVBQUUsQ0FBQztZQUV0QyxJQUFJLFVBQVUsR0FBd0IsSUFBSSxDQUFDO1lBQzNDLElBQUksT0FBTyxDQUFDLGlCQUFpQixJQUFJLElBQUksSUFBSSxPQUFPLENBQUMsaUJBQWlCLEtBQUssRUFBRSxFQUFFO2dCQUN6RSxVQUFVLEdBQUcscUNBQXVCLENBQUMsb0JBQW9CLENBQUMsQ0FBQztnQkFDM0QsSUFBSSxVQUFVLEtBQUssSUFBSSxFQUFFO29CQUN2QiwyRkFBMkY7b0JBQzNGLDBGQUEwRjtvQkFDMUYsdUZBQXVGO29CQUN2Rix1RkFBdUY7b0JBQ3ZGLFNBQVM7b0JBQ1QsRUFBRTtvQkFDRix3RkFBd0Y7b0JBQ3hGLHFEQUFxRDtvQkFDckQsV0FBVyxDQUFDLElBQUksQ0FBQzt3QkFDZixRQUFRLEVBQUUsRUFBRSxDQUFDLGtCQUFrQixDQUFDLEtBQUs7d0JBQ3JDLElBQUksRUFBRSx5QkFBVyxDQUFDLHVCQUFTLENBQUMsMkJBQTJCLENBQUM7d0JBQ3hELElBQUksRUFBRSxTQUFTO3dCQUNmLEtBQUssRUFBRSxTQUFTO3dCQUNoQixNQUFNLEVBQUUsU0FBUzt3QkFDakIsV0FBVyxFQUNQLHNHQUFzRztxQkFDM0csQ0FBQyxDQUFDO2lCQUNKO3FCQUFNO29CQUNMLElBQU0sWUFBWSxHQUFHLE9BQU8sQ0FBQyxZQUFZLElBQUksSUFBSSxDQUFDO29CQUNsRCxJQUFNLGlCQUFpQixHQUFHLDBCQUFtQixDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO29CQUN6RSxJQUFNLGtCQUFrQixHQUNwQixJQUFJLGdDQUFrQixDQUFDLFVBQVUsRUFBRSxpQkFBaUIsRUFBRSxZQUFZLENBQUMsQ0FBQztvQkFDeEUsVUFBVSxDQUFDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO29CQUNwQyxTQUFTLENBQUMsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGFBQWEsQ0FBQyxDQUFDO2lCQUNsRDthQUNGO1lBRUQsT0FBTyxJQUFJLGNBQWMsQ0FDckIsUUFBUSxFQUFFLFNBQVMsRUFBRSxRQUFRLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRSxhQUFhLEVBQUUsY0FBYyxFQUNwRixXQUFXLENBQUMsQ0FBQztRQUNuQixDQUFDO1FBRUQsc0NBQWEsR0FBYixVQUNJLFFBQWdCLEVBQUUsZUFBZ0MsRUFDbEQsT0FBK0MsRUFDL0MseUJBQTZDO1lBSGpELGlCQXFCQztZQWpCQyxLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzFDLElBQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ2hDLGlGQUFpRjtnQkFDakYsSUFBTSxjQUFjLEdBQUcscUJBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztnQkFDekMsSUFBSSxTQUFTLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxFQUFFO29CQUN2QyxJQUFNLFFBQVEsR0FBRyxVQUFDLFlBQW9CO3dCQUNwQyxPQUFPLEtBQUksQ0FBQyxRQUFRLENBQUMsYUFBYSxDQUN2QixZQUFZLEVBQUUsZUFBZSxFQUFFLE9BQU8sRUFBRSx5QkFBeUIsQ0FBQzs0QkFDekUsSUFBSSxDQUFDO29CQUNYLENBQUMsQ0FBQztvQkFFRixPQUFPLFNBQVMsQ0FBQyxRQUFRLENBQUMsY0FBYyxFQUFFLFFBQVEsQ0FBQyxJQUFJLFNBQVMsQ0FBQztpQkFDbEU7YUFDRjtZQUVELE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQzlCLFFBQVEsRUFBRSxlQUFlLEVBQUUsT0FBTyxFQUFFLHlCQUF5QixDQUFDLENBQUM7UUFDckUsQ0FBQztRQUVELG1DQUFVLEdBQVYsVUFBVyxRQUFnQjtZQUN6Qix5Q0FBeUM7WUFDekMsb0RBQW9EO1lBQ3BELHdEQUF3RDtZQUN4RCxxRkFBcUY7WUFDckYsMkNBQTJDO1lBQzNDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDO2dCQUNyQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFBLElBQUksSUFBSSxPQUFBLElBQUksQ0FBQyxTQUFTLENBQUMscUJBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFqQyxDQUFpQyxDQUFDLENBQUM7UUFDakUsQ0FBQztRQUVELHNCQUFJLDhDQUFrQjtpQkFBdEI7Z0JBQ0UsT0FBTyxJQUFJLENBQUMsb0JBQW9CLEtBQUssU0FBUyxDQUFDLENBQUMsQ0FBQyxJQUEwQixDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7WUFDckYsQ0FBQzs7O1dBQUE7UUFDSCxxQkFBQztJQUFELENBQUMsQUE1SkQsQ0FBb0Msc0JBQXNCLEdBNEp6RDtJQTVKWSx3Q0FBYyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0ICogYXMgdHMgZnJvbSAndHlwZXNjcmlwdCc7XG5cbmltcG9ydCB7RXJyb3JDb2RlLCBuZ0Vycm9yQ29kZX0gZnJvbSAnLi4vLi4vZGlhZ25vc3RpY3MnO1xuaW1wb3J0IHtGbGF0SW5kZXhHZW5lcmF0b3IsIGZpbmRGbGF0SW5kZXhFbnRyeVBvaW50fSBmcm9tICcuLi8uLi9lbnRyeV9wb2ludCc7XG5pbXBvcnQge0Fic29sdXRlRnNQYXRoLCByZXNvbHZlfSBmcm9tICcuLi8uLi9maWxlX3N5c3RlbSc7XG5pbXBvcnQge0ZhY3RvcnlHZW5lcmF0b3IsIEZhY3RvcnlUcmFja2VyLCBTaGltR2VuZXJhdG9yLCBTdW1tYXJ5R2VuZXJhdG9yLCBUeXBlQ2hlY2tTaGltR2VuZXJhdG9yfSBmcm9tICcuLi8uLi9zaGltcyc7XG5pbXBvcnQge3R5cGVDaGVja0ZpbGVQYXRofSBmcm9tICcuLi8uLi90eXBlY2hlY2snO1xuaW1wb3J0IHtub3JtYWxpemVTZXBhcmF0b3JzfSBmcm9tICcuLi8uLi91dGlsL3NyYy9wYXRoJztcbmltcG9ydCB7Z2V0Um9vdERpcnN9IGZyb20gJy4uLy4uL3V0aWwvc3JjL3R5cGVzY3JpcHQnO1xuaW1wb3J0IHtFeHRlbmRlZFRzQ29tcGlsZXJIb3N0LCBOZ0NvbXBpbGVyT3B0aW9ucywgVW5pZmllZE1vZHVsZXNIb3N0fSBmcm9tICcuLi9hcGknO1xuXG4vLyBBIHBlcnNpc3RlbnQgc291cmNlIG9mIGJ1Z3MgaW4gQ29tcGlsZXJIb3N0IGRlbGVnYXRpb24gaGFzIGJlZW4gdGhlIGFkZGl0aW9uIGJ5IFRTIG9mIG5ldyxcbi8vIG9wdGlvbmFsIG1ldGhvZHMgb24gdHMuQ29tcGlsZXJIb3N0LiBTaW5jZSB0aGVzZSBtZXRob2RzIGFyZSBvcHRpb25hbCwgaXQncyBub3QgYSB0eXBlIGVycm9yIHRoYXRcbi8vIHRoZSBkZWxlZ2F0aW5nIGhvc3QgZG9lc24ndCBpbXBsZW1lbnQgb3IgZGVsZWdhdGUgdGhlbS4gVGhpcyBjYXVzZXMgc3VidGxlIHJ1bnRpbWUgZmFpbHVyZXMuIE5vXG4vLyBtb3JlLiBUaGlzIGluZnJhc3RydWN0dXJlIGVuc3VyZXMgdGhhdCBmYWlsaW5nIHRvIGRlbGVnYXRlIGEgbWV0aG9kIGlzIGEgY29tcGlsZS10aW1lIGVycm9yLlxuXG4vKipcbiAqIFJlcHJlc2VudHMgdGhlIGBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0YCBpbnRlcmZhY2UsIHdpdGggYSB0cmFuc2Zvcm1hdGlvbiBhcHBsaWVkIHRoYXQgdHVybnMgYWxsXG4gKiBtZXRob2RzIChldmVuIG9wdGlvbmFsIG9uZXMpIGludG8gcmVxdWlyZWQgZmllbGRzICh3aGljaCBtYXkgYmUgYHVuZGVmaW5lZGAsIGlmIHRoZSBtZXRob2Qgd2FzXG4gKiBvcHRpb25hbCkuXG4gKi9cbmV4cG9ydCB0eXBlIFJlcXVpcmVkQ29tcGlsZXJIb3N0RGVsZWdhdGlvbnMgPSB7XG4gIFtNIGluIGtleW9mIFJlcXVpcmVkPEV4dGVuZGVkVHNDb21waWxlckhvc3Q+XTogRXh0ZW5kZWRUc0NvbXBpbGVySG9zdFtNXTtcbn07XG5cbi8qKlxuICogRGVsZWdhdGVzIGFsbCBtZXRob2RzIG9mIGBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0YCB0byBhIGRlbGVnYXRlLCB3aXRoIHRoZSBleGNlcHRpb24gb2ZcbiAqIGBnZXRTb3VyY2VGaWxlYCBhbmQgYGZpbGVFeGlzdHNgIHdoaWNoIGFyZSBpbXBsZW1lbnRlZCBpbiBgTmdDb21waWxlckhvc3RgLlxuICpcbiAqIElmIGEgbmV3IG1ldGhvZCBpcyBhZGRlZCB0byBgdHMuQ29tcGlsZXJIb3N0YCB3aGljaCBpcyBub3QgZGVsZWdhdGVkLCBhIHR5cGUgZXJyb3Igd2lsbCBiZVxuICogZ2VuZXJhdGVkIGZvciB0aGlzIGNsYXNzLlxuICovXG5leHBvcnQgY2xhc3MgRGVsZWdhdGluZ0NvbXBpbGVySG9zdCBpbXBsZW1lbnRzXG4gICAgT21pdDxSZXF1aXJlZENvbXBpbGVySG9zdERlbGVnYXRpb25zLCAnZ2V0U291cmNlRmlsZSd8J2ZpbGVFeGlzdHMnPiB7XG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBkZWxlZ2F0ZTogRXh0ZW5kZWRUc0NvbXBpbGVySG9zdCkge31cblxuICBwcml2YXRlIGRlbGVnYXRlTWV0aG9kPE0gZXh0ZW5kcyBrZXlvZiBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0PihuYW1lOiBNKTpcbiAgICAgIEV4dGVuZGVkVHNDb21waWxlckhvc3RbTV0ge1xuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlW25hbWVdICE9PSB1bmRlZmluZWQgPyAodGhpcy5kZWxlZ2F0ZVtuYW1lXSBhcyBhbnkpLmJpbmQodGhpcy5kZWxlZ2F0ZSkgOlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB1bmRlZmluZWQ7XG4gIH1cblxuICAvLyBFeGNsdWRlZCBhcmUgJ2dldFNvdXJjZUZpbGUnIGFuZCAnZmlsZUV4aXN0cycsIHdoaWNoIGFyZSBhY3R1YWxseSBpbXBsZW1lbnRlZCBieSBOZ0NvbXBpbGVySG9zdFxuICAvLyBiZWxvdy5cbiAgY3JlYXRlSGFzaCA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ2NyZWF0ZUhhc2gnKTtcbiAgZGlyZWN0b3J5RXhpc3RzID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgnZGlyZWN0b3J5RXhpc3RzJyk7XG4gIGZpbGVOYW1lVG9Nb2R1bGVOYW1lID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgnZmlsZU5hbWVUb01vZHVsZU5hbWUnKTtcbiAgZ2V0Q2FuY2VsbGF0aW9uVG9rZW4gPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXRDYW5jZWxsYXRpb25Ub2tlbicpO1xuICBnZXRDYW5vbmljYWxGaWxlTmFtZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ2dldENhbm9uaWNhbEZpbGVOYW1lJyk7XG4gIGdldEN1cnJlbnREaXJlY3RvcnkgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXRDdXJyZW50RGlyZWN0b3J5Jyk7XG4gIGdldERlZmF1bHRMaWJGaWxlTmFtZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ2dldERlZmF1bHRMaWJGaWxlTmFtZScpO1xuICBnZXREZWZhdWx0TGliTG9jYXRpb24gPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXREZWZhdWx0TGliTG9jYXRpb24nKTtcbiAgZ2V0RGlyZWN0b3JpZXMgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXREaXJlY3RvcmllcycpO1xuICBnZXRFbnZpcm9ubWVudFZhcmlhYmxlID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgnZ2V0RW52aXJvbm1lbnRWYXJpYWJsZScpO1xuICBnZXRNb2RpZmllZFJlc291cmNlRmlsZXMgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXRNb2RpZmllZFJlc291cmNlRmlsZXMnKTtcbiAgZ2V0TmV3TGluZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ2dldE5ld0xpbmUnKTtcbiAgZ2V0UGFyc2VkQ29tbWFuZExpbmUgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdnZXRQYXJzZWRDb21tYW5kTGluZScpO1xuICBnZXRTb3VyY2VGaWxlQnlQYXRoID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgnZ2V0U291cmNlRmlsZUJ5UGF0aCcpO1xuICByZWFkRGlyZWN0b3J5ID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgncmVhZERpcmVjdG9yeScpO1xuICByZWFkRmlsZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3JlYWRGaWxlJyk7XG4gIHJlYWRSZXNvdXJjZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3JlYWRSZXNvdXJjZScpO1xuICByZWFscGF0aCA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3JlYWxwYXRoJyk7XG4gIHJlc29sdmVNb2R1bGVOYW1lcyA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3Jlc29sdmVNb2R1bGVOYW1lcycpO1xuICByZXNvbHZlVHlwZVJlZmVyZW5jZURpcmVjdGl2ZXMgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCdyZXNvbHZlVHlwZVJlZmVyZW5jZURpcmVjdGl2ZXMnKTtcbiAgcmVzb3VyY2VOYW1lVG9GaWxlTmFtZSA9IHRoaXMuZGVsZWdhdGVNZXRob2QoJ3Jlc291cmNlTmFtZVRvRmlsZU5hbWUnKTtcbiAgdHJhY2UgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCd0cmFjZScpO1xuICB1c2VDYXNlU2Vuc2l0aXZlRmlsZU5hbWVzID0gdGhpcy5kZWxlZ2F0ZU1ldGhvZCgndXNlQ2FzZVNlbnNpdGl2ZUZpbGVOYW1lcycpO1xuICB3cml0ZUZpbGUgPSB0aGlzLmRlbGVnYXRlTWV0aG9kKCd3cml0ZUZpbGUnKTtcbn1cblxuLyoqXG4gKiBBIHdyYXBwZXIgYXJvdW5kIGB0cy5Db21waWxlckhvc3RgIChwbHVzIGFueSBleHRlbnNpb24gbWV0aG9kcyBmcm9tIGBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0YCkuXG4gKlxuICogSW4gb3JkZXIgZm9yIGEgY29uc3VtZXIgdG8gaW5jbHVkZSBBbmd1bGFyIGNvbXBpbGF0aW9uIGluIHRoZWlyIFR5cGVTY3JpcHQgY29tcGlsZXIsIHRoZVxuICogYHRzLlByb2dyYW1gIG11c3QgYmUgY3JlYXRlZCB3aXRoIGEgaG9zdCB0aGF0IGFkZHMgQW5ndWxhci1zcGVjaWZpYyBmaWxlcyAoZS5nLiBmYWN0b3JpZXMsXG4gKiBzdW1tYXJpZXMsIHRoZSB0ZW1wbGF0ZSB0eXBlLWNoZWNraW5nIGZpbGUsIGV0YykgdG8gdGhlIGNvbXBpbGF0aW9uLiBgTmdDb21waWxlckhvc3RgIGlzIHRoZVxuICogaG9zdCBpbXBsZW1lbnRhdGlvbiB3aGljaCBzdXBwb3J0cyB0aGlzLlxuICpcbiAqIFRoZSBpbnRlcmZhY2UgaW1wbGVtZW50YXRpb25zIGhlcmUgZW5zdXJlIHRoYXQgYE5nQ29tcGlsZXJIb3N0YCBmdWxseSBkZWxlZ2F0ZXMgdG9cbiAqIGBFeHRlbmRlZFRzQ29tcGlsZXJIb3N0YCBtZXRob2RzIHdoZW5ldmVyIHByZXNlbnQuXG4gKi9cbmV4cG9ydCBjbGFzcyBOZ0NvbXBpbGVySG9zdCBleHRlbmRzIERlbGVnYXRpbmdDb21waWxlckhvc3QgaW1wbGVtZW50c1xuICAgIFJlcXVpcmVkQ29tcGlsZXJIb3N0RGVsZWdhdGlvbnMsXG4gICAgRXh0ZW5kZWRUc0NvbXBpbGVySG9zdCB7XG4gIHJlYWRvbmx5IGZhY3RvcnlUcmFja2VyOiBGYWN0b3J5VHJhY2tlcnxudWxsID0gbnVsbDtcbiAgcmVhZG9ubHkgZW50cnlQb2ludDogQWJzb2x1dGVGc1BhdGh8bnVsbCA9IG51bGw7XG4gIHJlYWRvbmx5IGRpYWdub3N0aWNzOiB0cy5EaWFnbm9zdGljW107XG5cbiAgcmVhZG9ubHkgaW5wdXRGaWxlczogUmVhZG9ubHlBcnJheTxzdHJpbmc+O1xuICByZWFkb25seSByb290RGlyczogUmVhZG9ubHlBcnJheTxBYnNvbHV0ZUZzUGF0aD47XG4gIHJlYWRvbmx5IHR5cGVDaGVja0ZpbGU6IEFic29sdXRlRnNQYXRoO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgICAgZGVsZWdhdGU6IEV4dGVuZGVkVHNDb21waWxlckhvc3QsIGlucHV0RmlsZXM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPixcbiAgICAgIHJvb3REaXJzOiBSZWFkb25seUFycmF5PEFic29sdXRlRnNQYXRoPiwgcHJpdmF0ZSBzaGltczogU2hpbUdlbmVyYXRvcltdLFxuICAgICAgZW50cnlQb2ludDogQWJzb2x1dGVGc1BhdGh8bnVsbCwgdHlwZUNoZWNrRmlsZTogQWJzb2x1dGVGc1BhdGgsXG4gICAgICBmYWN0b3J5VHJhY2tlcjogRmFjdG9yeVRyYWNrZXJ8bnVsbCwgZGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXSkge1xuICAgIHN1cGVyKGRlbGVnYXRlKTtcblxuICAgIHRoaXMuZmFjdG9yeVRyYWNrZXIgPSBmYWN0b3J5VHJhY2tlcjtcbiAgICB0aGlzLmVudHJ5UG9pbnQgPSBlbnRyeVBvaW50O1xuICAgIHRoaXMudHlwZUNoZWNrRmlsZSA9IHR5cGVDaGVja0ZpbGU7XG4gICAgdGhpcy5kaWFnbm9zdGljcyA9IGRpYWdub3N0aWNzO1xuICAgIHRoaXMuaW5wdXRGaWxlcyA9IGlucHV0RmlsZXM7XG4gICAgdGhpcy5yb290RGlycyA9IHJvb3REaXJzO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBhbiBgTmdDb21waWxlckhvc3RgIGZyb20gYSBkZWxlZ2F0ZSBob3N0LCBhbiBhcnJheSBvZiBpbnB1dCBmaWxlbmFtZXMsIGFuZCB0aGUgZnVsbCBzZXRcbiAgICogb2YgVHlwZVNjcmlwdCBhbmQgQW5ndWxhciBjb21waWxlciBvcHRpb25zLlxuICAgKi9cbiAgc3RhdGljIHdyYXAoXG4gICAgICBkZWxlZ2F0ZTogdHMuQ29tcGlsZXJIb3N0LCBpbnB1dEZpbGVzOiBSZWFkb25seUFycmF5PHN0cmluZz4sXG4gICAgICBvcHRpb25zOiBOZ0NvbXBpbGVyT3B0aW9ucyk6IE5nQ29tcGlsZXJIb3N0IHtcbiAgICAvLyBUT0RPKGFseGh1Yik6IHJlbW92ZSB0aGUgZmFsbGJhY2sgdG8gYWxsb3dFbXB0eUNvZGVnZW5GaWxlcyBhZnRlciB2ZXJpZnlpbmcgdGhhdCB0aGUgcmVzdCBvZlxuICAgIC8vIG91ciBidWlsZCB0b29saW5nIGlzIG5vIGxvbmdlciByZWx5aW5nIG9uIGl0LlxuICAgIGNvbnN0IGFsbG93RW1wdHlDb2RlZ2VuRmlsZXMgPSBvcHRpb25zLmFsbG93RW1wdHlDb2RlZ2VuRmlsZXMgfHwgZmFsc2U7XG4gICAgY29uc3Qgc2hvdWxkR2VuZXJhdGVGYWN0b3J5U2hpbXMgPSBvcHRpb25zLmdlbmVyYXRlTmdGYWN0b3J5U2hpbXMgIT09IHVuZGVmaW5lZCA/XG4gICAgICAgIG9wdGlvbnMuZ2VuZXJhdGVOZ0ZhY3RvcnlTaGltcyA6XG4gICAgICAgIGFsbG93RW1wdHlDb2RlZ2VuRmlsZXM7XG5cbiAgICBjb25zdCBzaG91bGRHZW5lcmF0ZVN1bW1hcnlTaGltcyA9IG9wdGlvbnMuZ2VuZXJhdGVOZ1N1bW1hcnlTaGltcyAhPT0gdW5kZWZpbmVkID9cbiAgICAgICAgb3B0aW9ucy5nZW5lcmF0ZU5nU3VtbWFyeVNoaW1zIDpcbiAgICAgICAgYWxsb3dFbXB0eUNvZGVnZW5GaWxlcztcblxuICAgIGxldCByb290RmlsZXMgPSBbLi4uaW5wdXRGaWxlc107XG4gICAgbGV0IG5vcm1hbGl6ZWRJbnB1dEZpbGVzID0gaW5wdXRGaWxlcy5tYXAobiA9PiByZXNvbHZlKG4pKTtcblxuICAgIGNvbnN0IGdlbmVyYXRvcnM6IFNoaW1HZW5lcmF0b3JbXSA9IFtdO1xuICAgIGxldCBzdW1tYXJ5R2VuZXJhdG9yOiBTdW1tYXJ5R2VuZXJhdG9yfG51bGwgPSBudWxsO1xuXG4gICAgaWYgKHNob3VsZEdlbmVyYXRlU3VtbWFyeVNoaW1zKSB7XG4gICAgICAvLyBTdW1tYXJ5IGdlbmVyYXRpb24uXG4gICAgICBzdW1tYXJ5R2VuZXJhdG9yID0gU3VtbWFyeUdlbmVyYXRvci5mb3JSb290RmlsZXMobm9ybWFsaXplZElucHV0RmlsZXMpO1xuICAgICAgZ2VuZXJhdG9ycy5wdXNoKHN1bW1hcnlHZW5lcmF0b3IpO1xuICAgIH1cblxuICAgIGxldCBmYWN0b3J5VHJhY2tlcjogRmFjdG9yeVRyYWNrZXJ8bnVsbCA9IG51bGw7XG4gICAgaWYgKHNob3VsZEdlbmVyYXRlRmFjdG9yeVNoaW1zKSB7XG4gICAgICAvLyBGYWN0b3J5IGdlbmVyYXRpb24uXG4gICAgICBjb25zdCBmYWN0b3J5R2VuZXJhdG9yID0gRmFjdG9yeUdlbmVyYXRvci5mb3JSb290RmlsZXMobm9ybWFsaXplZElucHV0RmlsZXMpO1xuICAgICAgY29uc3QgZmFjdG9yeUZpbGVNYXAgPSBmYWN0b3J5R2VuZXJhdG9yLmZhY3RvcnlGaWxlTWFwO1xuXG4gICAgICBjb25zdCBmYWN0b3J5RmlsZU5hbWVzID0gQXJyYXkuZnJvbShmYWN0b3J5RmlsZU1hcC5rZXlzKCkpO1xuICAgICAgcm9vdEZpbGVzLnB1c2goLi4uZmFjdG9yeUZpbGVOYW1lcyk7XG4gICAgICBnZW5lcmF0b3JzLnB1c2goZmFjdG9yeUdlbmVyYXRvcik7XG5cbiAgICAgIGZhY3RvcnlUcmFja2VyID0gbmV3IEZhY3RvcnlUcmFja2VyKGZhY3RvcnlHZW5lcmF0b3IpO1xuICAgIH1cblxuICAgIC8vIERvbmUgc2VwYXJhdGVseSB0byBwcmVzZXJ2ZSB0aGUgb3JkZXIgb2YgZmFjdG9yeSBmaWxlcyBiZWZvcmUgc3VtbWFyeSBmaWxlcyBpbiByb290RmlsZXMuXG4gICAgLy8gVE9ETyhhbHhodWIpOiB2YWxpZGF0ZSB0aGF0IHRoaXMgaXMgbmVjZXNzYXJ5LlxuICAgIGlmIChzdW1tYXJ5R2VuZXJhdG9yICE9PSBudWxsKSB7XG4gICAgICByb290RmlsZXMucHVzaCguLi5zdW1tYXJ5R2VuZXJhdG9yLmdldFN1bW1hcnlGaWxlTmFtZXMoKSk7XG4gICAgfVxuXG5cbiAgICBjb25zdCByb290RGlycyA9IGdldFJvb3REaXJzKGRlbGVnYXRlLCBvcHRpb25zIGFzIHRzLkNvbXBpbGVyT3B0aW9ucyk7XG5cbiAgICBjb25zdCB0eXBlQ2hlY2tGaWxlID0gdHlwZUNoZWNrRmlsZVBhdGgocm9vdERpcnMpO1xuICAgIGdlbmVyYXRvcnMucHVzaChuZXcgVHlwZUNoZWNrU2hpbUdlbmVyYXRvcih0eXBlQ2hlY2tGaWxlKSk7XG4gICAgcm9vdEZpbGVzLnB1c2godHlwZUNoZWNrRmlsZSk7XG5cbiAgICBsZXQgZGlhZ25vc3RpY3M6IHRzLkRpYWdub3N0aWNbXSA9IFtdO1xuXG4gICAgbGV0IGVudHJ5UG9pbnQ6IEFic29sdXRlRnNQYXRofG51bGwgPSBudWxsO1xuICAgIGlmIChvcHRpb25zLmZsYXRNb2R1bGVPdXRGaWxlICE9IG51bGwgJiYgb3B0aW9ucy5mbGF0TW9kdWxlT3V0RmlsZSAhPT0gJycpIHtcbiAgICAgIGVudHJ5UG9pbnQgPSBmaW5kRmxhdEluZGV4RW50cnlQb2ludChub3JtYWxpemVkSW5wdXRGaWxlcyk7XG4gICAgICBpZiAoZW50cnlQb2ludCA9PT0gbnVsbCkge1xuICAgICAgICAvLyBUaGlzIGVycm9yIG1lc3NhZ2UgdGFsa3Mgc3BlY2lmaWNhbGx5IGFib3V0IGhhdmluZyBhIHNpbmdsZSAudHMgZmlsZSBpbiBcImZpbGVzXCIuIEhvd2V2ZXJcbiAgICAgICAgLy8gdGhlIGFjdHVhbCBsb2dpYyBpcyBhIGJpdCBtb3JlIHBlcm1pc3NpdmUuIElmIGEgc2luZ2xlIGZpbGUgZXhpc3RzLCB0aGF0IHdpbGwgYmUgdGFrZW4sXG4gICAgICAgIC8vIG90aGVyd2lzZSB0aGUgaGlnaGVzdCBsZXZlbCAoc2hvcnRlc3QgcGF0aCkgXCJpbmRleC50c1wiIGZpbGUgd2lsbCBiZSB1c2VkIGFzIHRoZSBmbGF0XG4gICAgICAgIC8vIG1vZHVsZSBlbnRyeSBwb2ludCBpbnN0ZWFkLiBJZiBuZWl0aGVyIG9mIHRoZXNlIGNvbmRpdGlvbnMgYXBwbHksIHRoZSBlcnJvciBiZWxvdyBpc1xuICAgICAgICAvLyBnaXZlbi5cbiAgICAgICAgLy9cbiAgICAgICAgLy8gVGhlIHVzZXIgaXMgbm90IGluZm9ybWVkIGFib3V0IHRoZSBcImluZGV4LnRzXCIgb3B0aW9uIGFzIHRoaXMgYmVoYXZpb3IgaXMgZGVwcmVjYXRlZCAtXG4gICAgICAgIC8vIGFuIGV4cGxpY2l0IGVudHJ5cG9pbnQgc2hvdWxkIGFsd2F5cyBiZSBzcGVjaWZpZWQuXG4gICAgICAgIGRpYWdub3N0aWNzLnB1c2goe1xuICAgICAgICAgIGNhdGVnb3J5OiB0cy5EaWFnbm9zdGljQ2F0ZWdvcnkuRXJyb3IsXG4gICAgICAgICAgY29kZTogbmdFcnJvckNvZGUoRXJyb3JDb2RlLkNPTkZJR19GTEFUX01PRFVMRV9OT19JTkRFWCksXG4gICAgICAgICAgZmlsZTogdW5kZWZpbmVkLFxuICAgICAgICAgIHN0YXJ0OiB1bmRlZmluZWQsXG4gICAgICAgICAgbGVuZ3RoOiB1bmRlZmluZWQsXG4gICAgICAgICAgbWVzc2FnZVRleHQ6XG4gICAgICAgICAgICAgICdBbmd1bGFyIGNvbXBpbGVyIG9wdGlvbiBcImZsYXRNb2R1bGVPdXRGaWxlXCIgcmVxdWlyZXMgb25lIGFuZCBvbmx5IG9uZSAudHMgZmlsZSBpbiB0aGUgXCJmaWxlc1wiIGZpZWxkLicsXG4gICAgICAgIH0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgZmxhdE1vZHVsZUlkID0gb3B0aW9ucy5mbGF0TW9kdWxlSWQgfHwgbnVsbDtcbiAgICAgICAgY29uc3QgZmxhdE1vZHVsZU91dEZpbGUgPSBub3JtYWxpemVTZXBhcmF0b3JzKG9wdGlvbnMuZmxhdE1vZHVsZU91dEZpbGUpO1xuICAgICAgICBjb25zdCBmbGF0SW5kZXhHZW5lcmF0b3IgPVxuICAgICAgICAgICAgbmV3IEZsYXRJbmRleEdlbmVyYXRvcihlbnRyeVBvaW50LCBmbGF0TW9kdWxlT3V0RmlsZSwgZmxhdE1vZHVsZUlkKTtcbiAgICAgICAgZ2VuZXJhdG9ycy5wdXNoKGZsYXRJbmRleEdlbmVyYXRvcik7XG4gICAgICAgIHJvb3RGaWxlcy5wdXNoKGZsYXRJbmRleEdlbmVyYXRvci5mbGF0SW5kZXhQYXRoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IE5nQ29tcGlsZXJIb3N0KFxuICAgICAgICBkZWxlZ2F0ZSwgcm9vdEZpbGVzLCByb290RGlycywgZ2VuZXJhdG9ycywgZW50cnlQb2ludCwgdHlwZUNoZWNrRmlsZSwgZmFjdG9yeVRyYWNrZXIsXG4gICAgICAgIGRpYWdub3N0aWNzKTtcbiAgfVxuXG4gIGdldFNvdXJjZUZpbGUoXG4gICAgICBmaWxlTmFtZTogc3RyaW5nLCBsYW5ndWFnZVZlcnNpb246IHRzLlNjcmlwdFRhcmdldCxcbiAgICAgIG9uRXJyb3I/OiAoKG1lc3NhZ2U6IHN0cmluZykgPT4gdm9pZCl8dW5kZWZpbmVkLFxuICAgICAgc2hvdWxkQ3JlYXRlTmV3U291cmNlRmlsZT86IGJvb2xlYW58dW5kZWZpbmVkKTogdHMuU291cmNlRmlsZXx1bmRlZmluZWQge1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zaGltcy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgZ2VuZXJhdG9yID0gdGhpcy5zaGltc1tpXTtcbiAgICAgIC8vIFR5cGVTY3JpcHQgaW50ZXJuYWwgcGF0aHMgYXJlIGd1YXJhbnRlZWQgdG8gYmUgUE9TSVgtbGlrZSBhYnNvbHV0ZSBmaWxlIHBhdGhzLlxuICAgICAgY29uc3QgYWJzb2x1dGVGc1BhdGggPSByZXNvbHZlKGZpbGVOYW1lKTtcbiAgICAgIGlmIChnZW5lcmF0b3IucmVjb2duaXplKGFic29sdXRlRnNQYXRoKSkge1xuICAgICAgICBjb25zdCByZWFkRmlsZSA9IChvcmlnaW5hbEZpbGU6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmdldFNvdXJjZUZpbGUoXG4gICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEZpbGUsIGxhbmd1YWdlVmVyc2lvbiwgb25FcnJvciwgc2hvdWxkQ3JlYXRlTmV3U291cmNlRmlsZSkgfHxcbiAgICAgICAgICAgICAgbnVsbDtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gZ2VuZXJhdG9yLmdlbmVyYXRlKGFic29sdXRlRnNQYXRoLCByZWFkRmlsZSkgfHwgdW5kZWZpbmVkO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmdldFNvdXJjZUZpbGUoXG4gICAgICAgIGZpbGVOYW1lLCBsYW5ndWFnZVZlcnNpb24sIG9uRXJyb3IsIHNob3VsZENyZWF0ZU5ld1NvdXJjZUZpbGUpO1xuICB9XG5cbiAgZmlsZUV4aXN0cyhmaWxlTmFtZTogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgLy8gQ29uc2lkZXIgdGhlIGZpbGUgYXMgZXhpc3Rpbmcgd2hlbmV2ZXJcbiAgICAvLyAgMSkgaXQgcmVhbGx5IGRvZXMgZXhpc3QgaW4gdGhlIGRlbGVnYXRlIGhvc3QsIG9yXG4gICAgLy8gIDIpIGF0IGxlYXN0IG9uZSBvZiB0aGUgc2hpbSBnZW5lcmF0b3JzIHJlY29nbml6ZXMgaXRcbiAgICAvLyBOb3RlIHRoYXQgd2UgY2FuIHBhc3MgdGhlIGZpbGUgbmFtZSBhcyBicmFuZGVkIGFic29sdXRlIGZzIHBhdGggYmVjYXVzZSBUeXBlU2NyaXB0XG4gICAgLy8gaW50ZXJuYWxseSBvbmx5IHBhc3NlcyBQT1NJWC1saWtlIHBhdGhzLlxuICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLmZpbGVFeGlzdHMoZmlsZU5hbWUpIHx8XG4gICAgICAgIHRoaXMuc2hpbXMuc29tZShzaGltID0+IHNoaW0ucmVjb2duaXplKHJlc29sdmUoZmlsZU5hbWUpKSk7XG4gIH1cblxuICBnZXQgdW5pZmllZE1vZHVsZXNIb3N0KCk6IFVuaWZpZWRNb2R1bGVzSG9zdHxudWxsIHtcbiAgICByZXR1cm4gdGhpcy5maWxlTmFtZVRvTW9kdWxlTmFtZSAhPT0gdW5kZWZpbmVkID8gdGhpcyBhcyBVbmlmaWVkTW9kdWxlc0hvc3QgOiBudWxsO1xuICB9XG59XG4iXX0=