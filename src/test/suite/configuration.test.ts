import * as assert from 'assert';
import * as vscode from 'vscode';

suite('default Settings', function () {
    const settingsToTest = [{
        uri: 'compilerLocation',
        defaultValue: 'C:\\Program Files (x86)\\Crestron\\SIMPL\\SPlusCC.exe'
    }, {
        uri: 'enable2series',
        defaultValue: false
    }, {
        uri: 'enable3series',
        defaultValue: true
    }, {
        uri: 'enable4series',
        defaultValue: false
    }, {
        uri: 'helpLocation',
        defaultValue: 'C:\\Program Files (x86)\\Crestron\\Simpl\\Simpl+lr.chm'
    }];
    const configurationSplus = vscode.workspace.getConfiguration('splus');
    settingsToTest.forEach(function (setting) {
        test(`${setting.uri} has been added with default value ${setting.defaultValue}`, function () {
            var exists = configurationSplus.has(setting.uri);
            assert.ok(exists);
            var value = configurationSplus.get(setting.uri);
            assert.strictEqual(value, setting.defaultValue);
        });
    });
});
