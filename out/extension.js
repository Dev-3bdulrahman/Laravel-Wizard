"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
// Import providers
const completionProvider_1 = require("./providers/completionProvider");
const definitionProvider_1 = require("./providers/definitionProvider");
const bladeProvider_1 = require("./blade/bladeProvider");
const routeProvider_1 = require("./routes/routeProvider");
const artisanCommands_1 = require("./artisan/artisanCommands");
// Utility functions
const laravelUtils_1 = require("./utils/laravelUtils");
/**
 * Activates the extension
 */
async function activate(context) {
    console.log('Laravel Wizard extension is now active!');
    // Check if we're in a Laravel project
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }
    // Find Laravel project root
    const laravelRoot = await (0, laravelUtils_1.findLaravelRoot)(workspaceFolders[0].uri.fsPath);
    if (!laravelRoot) {
        console.log('Not a Laravel project, some features may be limited');
    }
    // Register status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    statusBarItem.text = "$(wand) Laravel Wizard";
    statusBarItem.tooltip = "Laravel Wizard is active";
    statusBarItem.command = "laravelWizard.refreshIntelliSense";
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);
    // Register commands
    registerCommands(context);
    // Register providers
    if (laravelRoot) {
        registerProviders(context, laravelRoot);
    }
    // Show welcome message on first install
    const hasShownWelcome = context.globalState.get('laravelWizard.hasShownWelcome');
    if (!hasShownWelcome) {
        vscode.window.showInformationMessage('Laravel Wizard is now active! Enjoy enhanced Laravel development.');
        context.globalState.update('laravelWizard.hasShownWelcome', true);
    }
}
/**
 * Register all commands
 */
function registerCommands(context) {
    // Refresh IntelliSense
    const refreshCommand = vscode.commands.registerCommand('laravelWizard.refreshIntelliSense', () => {
        vscode.window.showInformationMessage('Laravel Wizard: Refreshing IntelliSense...');
        // Trigger a reload of the extension
        vscode.commands.executeCommand('workbench.action.reloadWindow');
    });
    // Artisan command
    const artisanCommand = vscode.commands.registerCommand('laravelWizard.artisanCommand', () => {
        vscode.window.showInputBox({
            prompt: 'Enter Artisan command',
            placeHolder: 'e.g. make:model Post -m'
        }).then(command => {
            if (command) {
                const terminal = vscode.window.createTerminal('Laravel Artisan');
                terminal.sendText(`php artisan ${command}`);
                terminal.show();
            }
        });
    });
    // Go to route
    const goToRouteCommand = vscode.commands.registerCommand('laravelWizard.goToRoute', () => {
        // Implementation will be added in routeProvider.ts
        vscode.window.showInformationMessage('Go to Route functionality coming soon!');
    });
    // Go to model
    const goToModelCommand = vscode.commands.registerCommand('laravelWizard.goToModel', () => {
        // Implementation will be added in definitionProvider.ts
        vscode.window.showInformationMessage('Go to Model functionality coming soon!');
    });
    // Go to controller
    const goToControllerCommand = vscode.commands.registerCommand('laravelWizard.goToController', () => {
        // Implementation will be added in definitionProvider.ts
        vscode.window.showInformationMessage('Go to Controller functionality coming soon!');
    });
    // Go to view
    const goToViewCommand = vscode.commands.registerCommand('laravelWizard.goToView', () => {
        // Implementation will be added in definitionProvider.ts
        vscode.window.showInformationMessage('Go to View functionality coming soon!');
    });
    // Go to migration
    const goToMigrationCommand = vscode.commands.registerCommand('laravelWizard.goToMigration', () => {
        // Implementation will be added in definitionProvider.ts
        vscode.window.showInformationMessage('Go to Migration functionality coming soon!');
    });
    context.subscriptions.push(refreshCommand, artisanCommand, goToRouteCommand, goToModelCommand, goToControllerCommand, goToViewCommand, goToMigrationCommand);
}
/**
 * Register all providers
 */
function registerProviders(context, laravelRoot) {
    // Register completion providers
    (0, completionProvider_1.registerCompletionProviders)(context, laravelRoot);
    // Register definition providers
    (0, definitionProvider_1.registerDefinitionProviders)(context, laravelRoot);
    // Register Blade support
    (0, bladeProvider_1.registerBladeSupport)(context, laravelRoot);
    // Register Route support
    (0, routeProvider_1.registerRouteSupport)(context, laravelRoot);
    // Register Artisan commands
    (0, artisanCommands_1.registerArtisanCommands)(context, laravelRoot);
}
/**
 * Deactivates the extension
 */
function deactivate() {
    console.log('Laravel Wizard extension is now deactivated!');
}
//# sourceMappingURL=extension.js.map