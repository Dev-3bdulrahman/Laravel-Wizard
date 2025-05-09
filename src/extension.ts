import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as glob from 'glob';
import * as minimatch from 'minimatch';

// Import providers
import { registerCompletionProviders } from './providers/completionProvider';
import { registerDefinitionProviders } from './providers/definitionProvider';
import { registerBladeSupport } from './blade/bladeProvider';
import { registerRouteSupport } from './routes/routeProvider';
import { registerArtisanCommands } from './artisan/artisanCommands';

// Utility functions
import { isLaravelProject, findLaravelRoot } from './utils/laravelUtils';

/**
 * Activates the extension
 */
export async function activate(context: vscode.ExtensionContext) {
    console.log('Laravel Wizard extension is now active!');

    // Check if we're in a Laravel project
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        return;
    }

    // Find Laravel project root
    const laravelRoot = await findLaravelRoot(workspaceFolders[0].uri.fsPath);
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
function registerCommands(context: vscode.ExtensionContext) {
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

    context.subscriptions.push(
        refreshCommand,
        artisanCommand,
        goToRouteCommand,
        goToModelCommand,
        goToControllerCommand,
        goToViewCommand,
        goToMigrationCommand
    );
}

/**
 * Register all providers
 */
function registerProviders(context: vscode.ExtensionContext, laravelRoot: string) {
    // Register completion providers
    registerCompletionProviders(context, laravelRoot);

    // Register definition providers
    registerDefinitionProviders(context, laravelRoot);

    // Register Blade support
    registerBladeSupport(context, laravelRoot);

    // Register Route support
    registerRouteSupport(context, laravelRoot);

    // Register Artisan commands
    registerArtisanCommands(context, laravelRoot);
}

/**
 * Deactivates the extension
 */
export function deactivate() {
    console.log('Laravel Wizard extension is now deactivated!');
}
